/**
 * Deterministic fixer for missing operation descriptions.
 */
export function fixOperationDescription(doc) {
  const changes = [];
  if (!doc.paths || typeof doc.paths !== 'object') return changes;

  const methods = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head'];

  for (const [pathKey, pathItem] of Object.entries(doc.paths)) {
    if (!pathItem || typeof pathItem !== 'object') continue;

    for (const method of methods) {
      const op = pathItem[method];
      if (!op || typeof op !== 'object') continue;

      if (!op.description || !op.description.trim()) {
        let desc = '';
        if (op.summary && op.summary.trim()) {
          desc = op.summary.trim();
        } else {
          desc = generateDeterministicDescription(method, pathKey);
        }

        op.description = desc;
        changes.push({
          rule: 'operation-description',
          path: `${pathKey} ${method.toUpperCase()}`,
          change: `Added operation description: "${desc}"`,
          automatic: true
        });
      }
    }
  }

  return changes;
}

function generateDeterministicDescription(method, pathKey) {
  // Normalize segments: /customers/{id} -> ['customers', '{id}']
  const segments = pathKey.split('/').filter(Boolean);
  const resource = segments.find(s => !s.startsWith('{')) || 'resource';
  const param = segments.find(s => s.startsWith('{')) ? segments.find(s => s.startsWith('{')).replace(/[{}]/g, '') : null;

  const singular = resource.endsWith('s') && resource.length > 2 ? resource.slice(0, -1) : resource;

  switch (method.toLowerCase()) {
    case 'get':
      return param ? `Retrieve ${singular} by ${param}.` : `List all ${resource}.`;
    case 'post':
      return `Create a new ${singular}.`;
    case 'put':
      return param ? `Update ${singular} by ${param}.` : `Update ${resource}.`;
    case 'patch':
      return param ? `Partially update ${singular} by ${param}.` : `Partially update ${resource}.`;
    case 'delete':
      return param ? `Delete ${singular} by ${param}.` : `Delete ${resource}.`;
    case 'options':
      return `Retrieve supported HTTP methods for ${resource}.`;
    case 'head':
      return `Check existence of ${singular}.`;
    default:
      return `${method.toUpperCase()} operation for ${pathKey}`;
  }
}
