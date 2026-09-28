import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AUDIT_DIR = path.resolve(__dirname, '../../../audit');
const AUDIT_FILE = path.join(AUDIT_DIR, 'audit-trail.json');

export class AuditService {
  async init() {
    try {
      await fs.mkdir(AUDIT_DIR, { recursive: true });
      try {
        await fs.access(AUDIT_FILE);
      } catch {
        await fs.writeFile(AUDIT_FILE, JSON.stringify([], null, 2), 'utf8');
      }
    } catch (err) {
      console.error('Failed to initialize audit directory:', err);
    }
  }

  async recordOnboarding(data) {
    await this.init();

    const record = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      apiName: data.apiName || 'Unknown API',
      apiVersion: data.apiVersion || 'v1',
      kongType: data.kongType || data.kongExposure || 'internal',
      selectedPlugins: data.selectedPlugins || [],
      targetEnvironment: data.targetEnvironment || 'develop',
      repository: data.repository || 'default-kong-repo',
      targetBranch: data.targetBranch || 'develop',
      featureBranch: data.featureBranch || `feature/${(data.apiName || 'api').toLowerCase()}-onboarding`,
      lintIssuesFound: data.lintIssuesFound || 0,
      lintIssuesAutoFixed: data.lintIssuesAutoFixed || 0,
      finalLintStatus: data.finalLintStatus || 'PASSED',
      gitPushStatus: data.gitPushStatus || 'SUCCESS',
      metadata: data.metadata || {}
    };

    try {
      const existing = await this.getAllRecords();
      existing.unshift(record);
      await fs.writeFile(AUDIT_FILE, JSON.stringify(existing, null, 2), 'utf8');
    } catch (err) {
      console.error('Failed to append audit record:', err);
    }

    return record;
  }

  async getAllRecords() {
    await this.init();
    try {
      const raw = await fs.readFile(AUDIT_FILE, 'utf8');
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }
}

export const auditService = new AuditService();
