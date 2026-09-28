import express from 'express';
import multer from 'multer';
import yaml from 'js-yaml';
import { validateOpenApi } from '../validation/openapiValidator.js';
import { runSpectral } from '../lint/spectralRunner.js';
import { applyDeterministicFixes, FIXER_REGISTRY } from '../fixers/fixerRegistry.js';
import { pluginService } from '../plugins/pluginService.js';
import { extractAndValidateEnvironments } from '../environments/environmentService.js';
import { generateKongConfiguration, validateKongConfig } from '../kong/kongConfigGenerator.js';
import { gitService } from '../git/gitService.js';
import { deckService } from '../kong/deckService.js';
import { auditService } from '../audit/auditService.js';
import { getOrCreateWorkflow } from '../workflow/workflowStateMachine.js';
import { explainLintIssue, explainPluginRecommendation } from './aiAssistant.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const router = express.Router();

/**
 * Step 1: Upload and initial OpenAPI validation
 */
router.post('/upload', upload.single('specFile'), async (req, res) => {
  try {
    let content = '';
    let fileName = 'spec.yaml';
    let isYaml = true;

    if (req.file) {
      content = req.file.buffer.toString('utf8');
      fileName = req.file.originalname;
    } else if (req.body.content) {
      content = req.body.content;
      fileName = req.body.fileName || 'spec.yaml';
    } else {
      return res.status(400).json({ error: 'No file or content provided.' });
    }

    if (!fileName.toLowerCase().endsWith('.yaml')) {
      return res.status(400).json({
        success: false,
        valid: false,
        message: 'Invalid file format. Only .yaml files are allowed for upload.',
        errors: [{ type: 'FILE_TYPE_ERROR', message: `File "${fileName}" rejected. Only .yaml files are permitted.` }]
      });
    }

    const validationResult = await validateOpenApi(content, true);

    if (!validationResult.valid) {
      return res.status(422).json({
        success: false,
        valid: false,
        errors: validationResult.errors,
        message: 'Swagger / OpenAPI Validation Failed. Blocking issues must be resolved before proceeding.'
      });
    }

    const workflow = getOrCreateWorkflow(req.body.sessionId);
    const envReport = extractAndValidateEnvironments(validationResult.stats.servers);

    workflow.updateContext({
      specOriginal: content,
      specParsed: validationResult.document,
      specFixed: validationResult.document,
      apiStats: validationResult.stats,
      environments: envReport,
      fileName,
      isYaml
    });

    workflow.transitionTo('VALIDATED');

    res.json({
      success: true,
      valid: true,
      sessionId: workflow.sessionId,
      stats: validationResult.stats,
      environments: envReport,
      currentState: workflow.currentState
    });
  } catch (err) {
    console.error('Upload handler error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Step 2: Classify Kong exposure (Internal / External)
 */
router.post('/classify', (req, res) => {
  try {
    const { sessionId, kongExposure } = req.body;
    if (!kongExposure || !['internal', 'external'].includes(kongExposure.toLowerCase())) {
      return res.status(400).json({ error: 'Valid kongExposure (internal or external) is required.' });
    }

    const workflow = getOrCreateWorkflow(sessionId);
    workflow.updateContext({ kongExposure: kongExposure.toLowerCase() });
    workflow.transitionTo('CLASSIFIED');

    const policy = pluginService.getPolicyRecommendation(kongExposure);

    res.json({
      success: true,
      sessionId: workflow.sessionId,
      kongExposure: workflow.context.kongExposure,
      policy,
      currentState: workflow.currentState
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * Step 3: Run Spectral Linting
 */
router.post('/lint', async (req, res) => {
  try {
    const { sessionId } = req.body;
    const workflow = getOrCreateWorkflow(sessionId);

    const targetDoc = workflow.context.specFixed || workflow.context.specParsed;
    if (!targetDoc) {
      return res.status(400).json({ error: 'No validated OpenAPI document found for this session.' });
    }

    const lintResult = await runSpectral(targetDoc);
    workflow.updateContext({ initialLintResults: lintResult });
    workflow.transitionTo('LINTED');

    res.json({
      success: true,
      sessionId: workflow.sessionId,
      results: lintResult,
      currentState: workflow.currentState
    });
  } catch (err) {
    console.error('Lint error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Step 4 & 5: Apply Deterministic Fixes and Re-Lint
 */
router.post('/autofix', async (req, res) => {
  try {
    const { sessionId, selectedRules } = req.body;
    const workflow = getOrCreateWorkflow(sessionId);

    const baseDoc = workflow.context.specParsed;
    if (!baseDoc) {
      return res.status(400).json({ error: 'No specification found to fix.' });
    }

    // Apply deterministic fixers
    const { fixedDoc, changes, fixedCount } = applyDeterministicFixes(baseDoc, selectedRules);

    // Re-run Spectral on the fixed document
    const reLintResult = await runSpectral(fixedDoc);

    workflow.updateContext({
      specFixed: fixedDoc,
      fixerChanges: changes,
      fixedLintResults: reLintResult
    });

    workflow.transitionTo('AUTO_FIXED');

    // If no blocking errors remain, transition to LINT_PASSED
    if (reLintResult.passed) {
      workflow.transitionTo('LINT_PASSED');
    }

    res.json({
      success: true,
      fixedCount,
      changes,
      reLintResult,
      specFixedYaml: yaml.dump(fixedDoc),
      currentState: workflow.currentState
    });
  } catch (err) {
    console.error('Autofix error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Step 6: Plugins Catalog & Recommendations
 */
router.get('/plugins', (req, res) => {
  const { exposure = 'internal' } = req.query;
  const policy = pluginService.getPolicyRecommendation(exposure);
  const frequentlyUsed = pluginService.getFrequentlyUsedPlugins();
  const allPlugins = pluginService.getAllPlugins();

  res.json({
    policy,
    frequentlyUsed,
    allPlugins
  });
});

/**
 * Step 7: Save selected plugins & configurations
 */
router.post('/plugins/configure', (req, res) => {
  try {
    const { sessionId, plugins } = req.body; // array of { name, enabled, config }
    if (!Array.isArray(plugins)) {
      return res.status(400).json({ error: 'Plugins array is required.' });
    }

    const workflow = getOrCreateWorkflow(sessionId);

    // Validate each plugin against its schema
    const validationErrors = [];
    const sanitizedPlugins = [];

    for (const p of plugins) {
      const result = pluginService.validatePluginConfig(p.name, p.config || {});
      if (!result.valid) {
        validationErrors.push(...result.errors);
      }
      sanitizedPlugins.push({
        name: p.name,
        enabled: p.enabled !== false,
        config: result.sanitized
      });
    }

    if (validationErrors.length > 0) {
      return res.status(422).json({
        success: false,
        errors: validationErrors,
        message: 'Some plugin configurations failed validation.'
      });
    }

    workflow.updateContext({
      selectedPlugins: sanitizedPlugins
    });

    workflow.transitionTo('PLUGINS_SELECTED');
    workflow.transitionTo('CONFIGURED');

    res.json({
      success: true,
      plugins: sanitizedPlugins,
      currentState: workflow.currentState
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * Step 8: Generate Kong Configuration
 */
router.post('/kong/generate', (req, res) => {
  try {
    const { sessionId, targetEnvironment = 'develop' } = req.body;
    const workflow = getOrCreateWorkflow(sessionId);

    const doc = workflow.context.specFixed || workflow.context.specParsed;
    if (!doc) {
      return res.status(400).json({ error: 'No specification in session.' });
    }

    // Determine target URL for the selected environment
    const envs = workflow.context.environments?.environments || [];
    const matchedEnv = envs.find(e => e.key === targetEnvironment);
    const targetUrl = matchedEnv?.url || doc.servers?.[0]?.url;

    // Collect paths and methods
    const paths = Object.keys(doc.paths || {});
    const methods = new Set();
    for (const pObj of Object.values(doc.paths || {})) {
      if (typeof pObj === 'object') {
        Object.keys(pObj).forEach(m => {
          if (['get', 'post', 'put', 'delete', 'patch'].includes(m.toLowerCase())) {
            methods.add(m.toUpperCase());
          }
        });
      }
    }

    const kongConfig = generateKongConfiguration({
      apiName: doc.info?.title || 'API Service',
      apiVersion: doc.info?.version || 'v1',
      targetUrl,
      paths,
      methods: Array.from(methods),
      plugins: workflow.context.selectedPlugins || [],
      kongExposure: workflow.context.kongExposure || 'internal'
    });

    const diff = deckService.generateDiff(kongConfig.deckConfig);

    workflow.updateContext({
      kongConfig: kongConfig.deckConfig,
      kongYaml: kongConfig.yamlContent,
      kongModularFiles: kongConfig.modularFiles,
      targetEnvironment
    });

    res.json({
      success: true,
      deckConfig: kongConfig.deckConfig,
      yamlContent: kongConfig.yamlContent,
      modularFiles: kongConfig.modularFiles,
      diff
    });
  } catch (err) {
    console.error('Generate Kong error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Step 9: Final Validation Pipeline
 */
router.post('/validate/final', async (req, res) => {
  try {
    const { sessionId } = req.body;
    const workflow = getOrCreateWorkflow(sessionId);

    const doc = workflow.context.specFixed || workflow.context.specParsed;
    const kongConfig = workflow.context.kongConfig;

    if (!doc || !kongConfig) {
      return res.status(400).json({ error: 'Incomplete session state for final validation.' });
    }

    // 1. OpenAPI validation
    const openapiCheck = await validateOpenApi(doc, false);

    // 2. Spectral linting
    const spectralCheck = await runSpectral(doc);

    // 3. Kong config validation
    const kongCheck = validateKongConfig(kongConfig);

    // 4. decK structure check
    const deckCheck = await deckService.validateDeckConfig(kongConfig);

    // 5. Environment check
    const envCheck = extractAndValidateEnvironments(doc.servers || []);

    const allPassed =
      openapiCheck.valid &&
      spectralCheck.passed &&
      kongCheck.valid &&
      deckCheck.valid;

    if (allPassed) {
      workflow.transitionTo('FINAL_VALIDATION');
    }

    res.json({
      success: allPassed,
      allPassed,
      pipeline: {
        openapi: { passed: openapiCheck.valid, errors: openapiCheck.errors },
        spectral: { passed: spectralCheck.passed, issues: spectralCheck.issues, summary: spectralCheck.summary },
        kongConfig: { passed: kongCheck.valid, errors: kongCheck.errors },
        deck: { passed: deckCheck.valid, errors: deckCheck.errors },
        environments: { passed: envCheck.allConfigured, missing: envCheck.missingEnvironments }
      },
      currentState: workflow.currentState
    });
  } catch (err) {
    console.error('Final validation error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Step 10 & 11: Git Repositories and Branch Commit/Push
 */
router.get('/git/repositories', async (req, res) => {
  const repos = await gitService.getAvailableRepositories();
  res.json({ repositories: repos });
});

router.post('/git/push', async (req, res) => {
  try {
    const { sessionId, repositoryId, targetEnvironment, targetBranch } = req.body;
    const workflow = getOrCreateWorkflow(sessionId);

    workflow.transitionTo('GIT_SELECTED');

    const apiSlug = (workflow.context.apiStats?.title || 'api').toLowerCase().replace(/\s+/g, '-');
    const filesToCommit = {
      ...(workflow.context.kongModularFiles || {}),
      [`specs/${apiSlug}.yaml`]: yaml.dump(workflow.context.specFixed || workflow.context.specParsed)
    };

    workflow.transitionTo('BRANCH_CREATED');

    const pushResult = await gitService.commitAndPushOnboarding({
      repositoryId: repositoryId || 'customer-api-kong',
      targetBranch: targetBranch || targetEnvironment || 'develop',
      apiSlug,
      files: filesToCommit
    });

    workflow.transitionTo('COMMITTED');
    workflow.transitionTo('PUSHED');
    workflow.transitionTo('PR_CREATED');

    // Create Audit Record
    const auditRecord = await auditService.recordOnboarding({
      apiName: workflow.context.apiStats?.title,
      apiVersion: workflow.context.apiStats?.version,
      kongType: workflow.context.kongExposure,
      selectedPlugins: (workflow.context.selectedPlugins || []).map(p => p.name),
      targetEnvironment: targetEnvironment || 'develop',
      repository: pushResult.repository,
      targetBranch: pushResult.baseBranch,
      featureBranch: pushResult.featureBranch,
      lintIssuesFound: workflow.context.initialLintResults?.issues?.length || 0,
      lintIssuesAutoFixed: workflow.context.fixerChanges?.length || 0,
      finalLintStatus: 'PASSED',
      gitPushStatus: 'SUCCESS'
    });

    workflow.updateContext({
      gitPushStatus: 'SUCCESS',
      featureBranch: pushResult.featureBranch,
      prDetails: pushResult.pr,
      auditRecord
    });

    res.json({
      success: true,
      pushResult,
      auditRecord,
      currentState: workflow.currentState
    });
  } catch (err) {
    console.error('Git push error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Workflow State and Audit Records
 */
router.get('/workflow/status/:sessionId', (req, res) => {
  const workflow = getOrCreateWorkflow(req.params.sessionId);
  res.json(workflow.getStatus());
});

router.get('/audit/records', async (req, res) => {
  const records = await auditService.getAllRecords();
  res.json({ records });
});

/**
 * AI Assistant Explanations
 */
router.get('/ai/explain-lint', (req, res) => {
  const { rule } = req.query;
  res.json(explainLintIssue(rule));
});

router.get('/ai/explain-plugin', (req, res) => {
  const { plugin, exposure = 'internal' } = req.query;
  res.json(explainPluginRecommendation(plugin, exposure));
});

export default router;
