import yaml from 'js-yaml';

export function generateKongConfiguration({
  apiName,
  apiVersion = 'v1',
  targetUrl,
  paths = [],
  methods = ['GET', 'POST'],
  plugins = [],
  kongExposure = 'internal',
  tags = []
}) {
  const serviceSlug = slugify(apiName);
  const routeSlug = `${serviceSlug}-route`;

  // Standardize paths
  const cleanPaths = paths.length > 0
    ? Array.from(new Set(paths.map(p => {
        // Kong route path prefixes usually start with /
        const base = p.split('{')[0];
        const trimmed = base.replace(/\/+$/, '');
        return trimmed || '/';
      })))
    : [`/${serviceSlug}`];

  // Kong plugins array
  const kongPlugins = plugins.map(p => ({
    name: p.name,
    enabled: p.enabled !== false,
    config: p.config || {}
  }));

  const standardTags = [
    `onboarding-platform`,
    `api:${serviceSlug}`,
    `version:${apiVersion}`,
    `exposure:${kongExposure}`,
    ...tags
  ];

  // Construct standard decK format configuration
  const deckConfig = {
    _format_version: '3.0',
    _info: {
      select_tags: [`api:${serviceSlug}`]
    },
    services: [
      {
        name: `${serviceSlug}-service`,
        url: targetUrl || `https://${serviceSlug}.${kongExposure === 'external' ? 'public.api' : 'internal'}`,
        tags: standardTags,
        routes: [
          {
            name: routeSlug,
            paths: cleanPaths,
            methods: methods.length > 0 ? methods : ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
            strip_path: false,
            preserve_host: true,
            tags: standardTags
          }
        ],
        plugins: kongPlugins
      }
    ]
  };

  // Also prepare modular breakdown files for repository structure
  const serviceYaml = yaml.dump({
    services: [
      {
        name: `${serviceSlug}-service`,
        url: targetUrl || `https://${serviceSlug}.${kongExposure === 'external' ? 'public.api' : 'internal'}`,
        tags: standardTags
      }
    ]
  });

  const routeYaml = yaml.dump({
    routes: [
      {
        name: routeSlug,
        service: `${serviceSlug}-service`,
        paths: cleanPaths,
        methods: methods.length > 0 ? methods : ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        strip_path: false,
        preserve_host: true,
        tags: standardTags
      }
    ]
  });

  const pluginsYaml = yaml.dump({
    plugins: kongPlugins.map(p => ({
      ...p,
      service: `${serviceSlug}-service`
    }))
  });

  const monolithicYaml = yaml.dump(deckConfig, { indent: 2, noArrayIndent: false });

  return {
    deckConfig,
    yamlContent: monolithicYaml,
    modularFiles: {
      [`kong/services/${serviceSlug}.yaml`]: serviceYaml,
      [`kong/routes/${serviceSlug}.yaml`]: routeYaml,
      [`kong/plugins/${serviceSlug}.yaml`]: pluginsYaml,
      [`kong/deck.yaml`]: monolithicYaml
    }
  };
}

/**
 * Validate basic Kong structure
 */
export function validateKongConfig(deckConfig) {
  const errors = [];
  if (!deckConfig || typeof deckConfig !== 'object') {
    return { valid: false, errors: ['Invalid Kong configuration payload.'] };
  }

  if (deckConfig._format_version !== '3.0' && deckConfig._format_version !== '1.1') {
    errors.push('Kong decK format version must be "3.0".');
  }

  if (!Array.isArray(deckConfig.services) || deckConfig.services.length === 0) {
    errors.push('Kong configuration must specify at least one service.');
  } else {
    for (const s of deckConfig.services) {
      if (!s.name) errors.push('Service is missing "name".');
      if (!s.url) errors.push(`Service "${s.name || 'unnamed'}" is missing "url".`);
      if (!Array.isArray(s.routes) || s.routes.length === 0) {
        errors.push(`Service "${s.name}" must contain at least one route.`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

function slugify(text) {
  return (text || 'api')
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}
