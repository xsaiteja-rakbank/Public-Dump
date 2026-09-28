import { execFile } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';
import yaml from 'js-yaml';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to spectral CLI index script
const SPECTRAL_BIN = path.resolve(__dirname, '../../node_modules/@stoplight/spectral-cli/dist/index.js');
const DEFAULT_RULESET = path.resolve(__dirname, '../../../rules/spectral.yaml');

/**
 * Runs Spectral linting on an OpenAPI document or file path.
 * @param {string|object} input - OpenAPI YAML/JSON string or JS object
 * @param {string} [rulesetPath] - Optional custom ruleset path
 * @returns {Promise<{ issues: Array, summary: Object, passed: boolean }>}
 */
export async function runSpectral(input, rulesetPath = DEFAULT_RULESET) {
  let tempFilePath = null;
  let targetPath = null;

  try {
    if (typeof input === 'string' && (input.endsWith('.yaml') || input.endsWith('.yml') || input.endsWith('.json'))) {
      targetPath = path.resolve(input);
    } else {
      // Create temporary file for Spectral
      const content = typeof input === 'string' ? input : yaml.dump(input);
      const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'kong-lint-'));
      tempFilePath = path.join(tempDir, 'spec.yaml');
      await fs.writeFile(tempFilePath, content, 'utf8');
      targetPath = tempFilePath;
    }

    const resolvedRuleset = path.resolve(rulesetPath);

    const issues = await new Promise((resolve) => {
      execFile(
        process.execPath,
        [SPECTRAL_BIN, 'lint', targetPath, '--ruleset', resolvedRuleset, '--format', 'json'],
        { maxBuffer: 10 * 1024 * 1024 },
        (error, stdout, stderr) => {
          // Spectral exits with code 1 if issues are found, which Node considers an error
          if (stdout && stdout.trim()) {
            try {
              // Extract JSON array from output in case Spectral appends extra text
              const jsonMatch = stdout.match(/\[[\s\S]*\]/);
              if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return resolve(Array.isArray(parsed) ? parsed : []);
              }
            } catch (parseErr) {
              console.error('Failed to parse spectral JSON output:', parseErr, stdout);
            }
          }
          if (error && !stdout) {
            console.error('Spectral execution error:', error, stderr);
          }
          resolve([]);
        }
      );
    });

    // Severity mapping: 0 = Error, 1 = Warn, 2 = Info, 3 = Hint
    const severityLabels = { 0: 'error', 1: 'warn', 2: 'info', 3: 'hint' };

    const formattedIssues = issues.map((issue, index) => {
      const severityStr = severityLabels[issue.severity] || 'warn';
      const pathStr = Array.isArray(issue.path) ? issue.path.join('.') : (issue.path || '');
      return {
        id: `lint-${index + 1}`,
        code: issue.code,
        message: issue.message,
        path: issue.path,
        pathString: pathStr,
        severity: severityStr,
        severityCode: issue.severity,
        range: issue.range,
        isBlocking: issue.severity === 0 // 0 is error
      };
    });

    const errorsCount = formattedIssues.filter(i => i.severityCode === 0).length;
    const warningsCount = formattedIssues.filter(i => i.severityCode === 1).length;
    const infosCount = formattedIssues.filter(i => i.severityCode >= 2).length;

    return {
      issues: formattedIssues,
      summary: {
        total: formattedIssues.length,
        errors: errorsCount,
        warnings: warningsCount,
        infos: infosCount,
        blocking: errorsCount
      },
      passed: errorsCount === 0
    };
  } finally {
    if (tempFilePath) {
      try {
        await fs.unlink(tempFilePath);
        await fs.rmdir(path.dirname(tempFilePath));
      } catch (cleanupErr) {
        // Ignore temporary cleanup errors
      }
    }
  }
}
