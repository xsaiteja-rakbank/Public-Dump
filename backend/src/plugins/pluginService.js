import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SCHEMAS_DIR = path.resolve(__dirname, '../../../schemas/plugins');
const TEMPLATES_DIR = path.resolve(__dirname, '../../../templates');

export class PluginService {
  constructor() {
    this.schemas = new Map();
    this.policies = new Map();
  }

  async initialize() {
    await this.loadSchemas();
    await this.loadPolicies();
  }

  async loadSchemas() {
    try {
      const files = await fs.readdir(SCHEMAS_DIR);
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(SCHEMAS_DIR, file);
          const raw = await fs.readFile(filePath, 'utf8');
          const schema = JSON.parse(raw);
          this.schemas.set(schema.name, schema);
        }
      }
    } catch (err) {
      console.error('Failed to load plugin schemas:', err);
    }
  }

  async loadPolicies() {
    try {
      const internalPath = path.join(TEMPLATES_DIR, 'internal', 'policy.json');
      const externalPath = path.join(TEMPLATES_DIR, 'external', 'policy.json');

      const [internalRaw, externalRaw] = await Promise.all([
        fs.readFile(internalPath, 'utf8'),
        fs.readFile(externalPath, 'utf8')
      ]);

      this.policies.set('internal', JSON.parse(internalRaw));
      this.policies.set('external', JSON.parse(externalRaw));
    } catch (err) {
      console.error('Failed to load exposure policies:', err);
    }
  }

  getAllPlugins() {
    return Array.from(this.schemas.values());
  }

  getFrequentlyUsedPlugins() {
    return Array.from(this.schemas.values()).filter(p => p.frequentlyUsed);
  }

  getPluginSchema(name) {
    return this.schemas.get(name) || null;
  }

  getPolicyRecommendation(exposureType = 'internal') {
    const key = exposureType.toLowerCase() === 'external' ? 'external' : 'internal';
    const policy = this.policies.get(key);

    if (!policy) {
      return {
        exposure: key,
        recommended: ['correlation-id', 'key-auth'],
        optional: ['rate-limiting', 'cors'],
        defaults: {}
      };
    }

    return {
      exposure: policy.exposure,
      name: policy.name,
      description: policy.description,
      recommended: policy.recommendedPlugins || [],
      optional: policy.optionalPlugins || [],
      defaults: policy.defaults || {}
    };
  }

  validatePluginConfig(pluginName, config) {
    const schema = this.schemas.get(pluginName);
    if (!schema) {
      return { valid: true, sanitized: config, warnings: [`Custom schema not found for plugin "${pluginName}". Accepted as generic config.`] };
    }

    const errors = [];
    const sanitized = {};

    for (const field of schema.fields || []) {
      const val = config[field.name];

      if (field.required && (val === undefined || val === null || val === '')) {
        errors.push(`Field "${field.label || field.name}" is required for plugin ${schema.displayName || pluginName}.`);
        continue;
      }

      if (val === undefined || val === null) {
        if (field.default !== undefined) {
          sanitized[field.name] = field.default;
        }
        continue;
      }

      // Type coercions
      if (field.type === 'number') {
        const num = Number(val);
        if (isNaN(num)) {
          errors.push(`Field "${field.label || field.name}" must be a number.`);
        } else {
          sanitized[field.name] = num;
        }
      } else if (field.type === 'boolean') {
        sanitized[field.name] = Boolean(val);
      } else if (field.type === 'array') {
        if (Array.isArray(val)) {
          sanitized[field.name] = val;
        } else if (typeof val === 'string') {
          sanitized[field.name] = val.split(',').map(s => s.trim()).filter(Boolean);
        } else {
          sanitized[field.name] = [val];
        }
      } else {
        sanitized[field.name] = val;
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      sanitized
    };
  }
}

export const pluginService = new PluginService();
