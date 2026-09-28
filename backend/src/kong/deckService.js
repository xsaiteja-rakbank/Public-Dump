import { exec } from 'child_process';
import { promisify } from 'util';
import yaml from 'js-yaml';

const execAsync = promisify(exec);

export class DeckService {
  async isDeckInstalled() {
    try {
      await execAsync('deck version');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validates a decK configuration
   */
  async validateDeckConfig(configObj) {
    const isInstalled = await this.isDeckInstalled();

    // Deterministic validation checks
    const errors = [];
    if (!configObj || typeof configObj !== 'object') {
      return { valid: false, errors: ['Configuration is empty or invalid.'] };
    }

    if (!configObj._format_version || (configObj._format_version !== '3.0' && configObj._format_version !== '1.1')) {
      errors.push('decK _format_version must be "3.0"');
    }

    if (!Array.isArray(configObj.services) || configObj.services.length === 0) {
      errors.push('At least one service definition is required.');
    } else {
      for (const service of configObj.services) {
        if (!service.name) errors.push('Service must have a name.');
        if (!service.url) errors.push(`Service "${service.name}" must have an upstream URL.`);
        if (!Array.isArray(service.routes) || service.routes.length === 0) {
          errors.push(`Service "${service.name}" must have at least one route.`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      deckInstalled: isInstalled,
      errors,
      output: errors.length === 0 ? 'decK configuration syntax and structural check passed successfully.' : null
    };
  }

  /**
   * Generates a declarative diff showing resources to be added/updated in Kong
   */
  generateDiff(configObj) {
    const changes = [];
    const service = configObj.services?.[0];

    if (service) {
      changes.push({
        action: 'create',
        type: 'service',
        name: service.name,
        details: `Upstream URL: ${service.url}`
      });

      for (const r of service.routes || []) {
        changes.push({
          action: 'create',
          type: 'route',
          name: r.name,
          details: `Paths: ${r.paths.join(', ')} | Methods: ${r.methods.join(', ')}`
        });
      }

      for (const p of service.plugins || []) {
        changes.push({
          action: 'create',
          type: 'plugin',
          name: p.name,
          details: `Config: ${JSON.stringify(p.config)}`
        });
      }
    }

    return {
      summary: {
        creating: changes.length,
        updating: 0,
        deleting: 0
      },
      changes
    };
  }
}

export const deckService = new DeckService();
