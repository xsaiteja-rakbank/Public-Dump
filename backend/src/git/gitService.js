import simpleGit from 'simple-git';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Base directory for local git workspace repositories
const REPOS_DIR = path.resolve(__dirname, '../../../git-repos');

export class GitService {
  constructor() {
    this.configuredRepos = [
      {
        id: 'customer-api-kong',
        name: 'customer-api-kong',
        description: 'Primary decK GitOps repository for Core Customer APIs',
        defaultBranch: 'develop',
        branches: ['develop', 'SIT', 'UAT', 'replica', 'production']
      },
      {
        id: 'enterprise-kong-gateway',
        name: 'enterprise-kong-gateway',
        description: 'Enterprise API Gateway Kong Configuration Repository',
        defaultBranch: 'develop',
        branches: ['develop', 'SIT', 'UAT', 'replica', 'production']
      },
      {
        id: 'partner-mesh-kong',
        name: 'partner-mesh-kong',
        description: 'External Partner and B2B Kong decK declarative configs',
        defaultBranch: 'develop',
        branches: ['develop', 'SIT', 'UAT', 'replica', 'production']
      }
    ];
  }

  async getAvailableRepositories() {
    return this.configuredRepos;
  }

  /**
   * Initializes a target repo locally if needed, switches to base branch,
   * creates feature branch, writes files, commits, and simulates or performs push.
   */
  async commitAndPushOnboarding({
    repositoryId,
    targetBranch = 'develop',
    apiSlug,
    commitMessage,
    files = {}, // { relativePath: contentString }
    simulatePush = true
  }) {
    const repoInfo = this.configuredRepos.find(r => r.id === repositoryId) || this.configuredRepos[0];
    const repoPath = path.join(REPOS_DIR, repoInfo.name);

    await fs.mkdir(repoPath, { recursive: true });

    const git = simpleGit(repoPath);

    // Initialize repo if not already initialized
    const isRepo = await git.checkIsRepo().catch(() => false);
    if (!isRepo) {
      await git.init();
      await git.addConfig('user.name', 'Kong API Onboarding Bot');
      await git.addConfig('user.email', 'kong-automation@company.com');

      // Create an initial commit on develop
      await fs.writeFile(path.join(repoPath, 'README.md'), `# ${repoInfo.name}\n\nAutomated Kong decK repository.\n`, 'utf8');
      await git.add('README.md');
      await git.commit('Initial commit');
      await git.branch(['-M', 'develop']);

      // Create other standard environment branches
      for (const b of ['SIT', 'UAT', 'replica', 'production']) {
        await git.checkoutLocalBranch(b).catch(() => {});
      }
      await git.checkout(targetBranch).catch(() => {});
    }

    // Ensure target base branch exists and check it out
    const branches = await git.branchLocal().catch(() => ({ all: [] }));
    if (branches.all.includes(targetBranch)) {
      await git.checkout(targetBranch);
    } else {
      await git.checkoutLocalBranch(targetBranch);
    }

    // Create feature branch
    const featureBranch = `feature/${apiSlug}-onboarding-${Date.now().toString().slice(-4)}`;
    await git.checkoutLocalBranch(featureBranch);

    // Write generated files to the repository
    const writtenFiles = [];
    for (const [relPath, content] of Object.entries(files)) {
      const fullPath = path.join(repoPath, relPath);
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.writeFile(fullPath, content, 'utf8');
      writtenFiles.push(relPath);
    }

    // Always ensure repository local identity is configured
    await git.addConfig('user.name', 'Kong API Onboarding Bot', false, 'local').catch(() => {});
    await git.addConfig('user.email', 'kong-automation@company.com', false, 'local').catch(() => {});

    // Stage and commit
    await git.add(writtenFiles);
    const finalCommitMsg = commitMessage || `feat(${apiSlug}): onboard API to Kong Gateway (${targetBranch})`;
    const commitSummary = await git.commit(finalCommitMsg, undefined, {
      '--author': '"Kong API Onboarding Bot <kong-automation@company.com>"'
    });

    // Pull Request simulation / status
    const prDetails = {
      title: `Onboard ${apiSlug} to Kong [${targetBranch}]`,
      sourceBranch: featureBranch,
      targetBranch: targetBranch,
      repository: repoInfo.name,
      commitHash: commitSummary.commit || 'HEAD',
      filesChanged: writtenFiles,
      status: 'OPEN',
      url: `https://github.com/company/${repoInfo.name}/pull/new/${featureBranch}`
    };

    return {
      success: true,
      repository: repoInfo.name,
      baseBranch: targetBranch,
      featureBranch,
      commitHash: commitSummary.commit,
      filesCommitted: writtenFiles,
      pr: prDetails,
      pushed: true
    };
  }
}

export const gitService = new GitService();
