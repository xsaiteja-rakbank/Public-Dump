/**
 * Deterministic fixer for missing operation tags.
 */
export function fixTags(doc) {
  const changes = [];
  if (!doc.paths || typeof doc.paths !== 'object') return changes;

  const methods = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head'];

  for (const [pathKey, pathItem] of Object.entries(doc.paths)) {
    if (!pathItem || typeof pathItem !== 'object') continue;

    for (const method of methods) {
      const op = pathItem[method];
      if (!op || typeof op !== 'object') continue;

      if (!op.tags || !Array.isArray(op.tags) || op.tags.length === 0) {
        const tag = generateDeterministicTag(pathKey);
        op.tags = [tag];

        // Also add to global tags if not present
        if (!doc.tags) doc.tags = [];
        if (!doc.tags.some(t => t.name === tag)) {
          doc.tags.push({ name: tag, description: `Operations related to ${tag}` });
        }

        changes.push({
          rule: 'operation-tags',
          path: `${pathKey} ${method.toUpperCase()}`,
          change: `Assigned tag: "${tag}"`,
          automatic: true
        });
      }
    }
  }

  return changes;
}

function generateDeterministicTag(pathKey) {
  const segments = pathKey.split('/').filter(Boolean);
  // Ignore prefixes like 'api', 'v1', 'v2'
  const resource = segments.find(s => !s.startsWith('{') && !/^v\d+$/i.test(s) && s.toLowerCase() !== 'api') || segments[0] || 'default';
  return resource.toLowerCase();
}
