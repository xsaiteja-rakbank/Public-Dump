/**
 * Deterministic fixer for missing operationId.
 */
export function fixOperationId(doc) {
  const changes = [];
  if (!doc.paths || typeof doc.paths !== 'object') return changes;

  const existingIds = new Set();

  // First pass: collect all existing operationIds
  const methods = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head'];
  for (const pathItem of Object.values(doc.paths)) {
    if (!pathItem || typeof pathItem !== 'object') continue;
    for (const m of methods) {
      if (pathItem[m]?.operationId) {
        existingIds.add(pathItem[m].operationId);
      }
    }
  }

  // Second pass: generate deterministic operationIds for missing ones
  for (const [pathKey, pathItem] of Object.entries(doc.paths)) {
    if (!pathItem || typeof pathItem !== 'object') continue;

    for (const method of methods) {
      const op = pathItem[method];
      if (!op || typeof op !== 'object') continue;

      if (!op.operationId || !op.operationId.trim()) {
        const baseId = generateDeterministicOperationId(method, pathKey);
        let uniqueId = baseId;
        let counter = 1;
        while (existingIds.has(uniqueId)) {
          counter++;
          uniqueId = `${baseId}${counter}`;
        }

        existingIds.add(uniqueId);
        op.operationId = uniqueId;

        changes.push({
          rule: 'operation-operationId',
          path: `${pathKey} ${method.toUpperCase()}`,
          change: `Generated operationId: "${uniqueId}"`,
          automatic: true
        });
      }
    }
  }

  return changes;
}

function generateDeterministicOperationId(method, pathKey) {
  const segments = pathKey.split('/').filter(Boolean);
  const parts = [];

  // Prefix by method action
  const actionMap = {
    get: 'get',
    post: 'create',
    put: 'update',
    patch: 'patch',
    delete: 'delete',
    options: 'options',
    head: 'head'
  };

  parts.push(actionMap[method.toLowerCase()] || method.toLowerCase());

  for (const seg of segments) {
    if (seg.startsWith('{') && seg.endsWith('}')) {
      const cleanParam = seg.slice(1, -1);
      parts.push(`By${capitalize(cleanParam)}`);
    } else {
      parts.push(capitalize(seg.replace(/[^a-zA-Z0-9]/g, '')));
    }
  }

  return parts[0] + parts.slice(1).map(p => capitalize(p)).join('');
}

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}
