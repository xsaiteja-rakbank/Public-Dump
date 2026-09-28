/**
 * Deterministic fixer for missing response descriptions.
 */
export function fixResponseDescription(doc) {
  const changes = [];
  if (!doc.paths || typeof doc.paths !== 'object') return changes;

  const defaultDescriptions = {
    '200': 'Successful operation',
    '201': 'Resource created successfully',
    '202': 'Request accepted for asynchronous processing',
    '204': 'No content returned',
    '400': 'Bad request - invalid parameters or body',
    '401': 'Unauthorized - authentication credentials missing or invalid',
    '403': 'Forbidden - insufficient permissions',
    '404': 'Resource not found',
    '409': 'Conflict - resource state prevents action',
    '422': 'Unprocessable entity - validation failed',
    '429': 'Too many requests - rate limit exceeded',
    '500': 'Internal server error',
    '502': 'Bad gateway',
    '503': 'Service unavailable',
    'default': 'Default error response'
  };

  const methods = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head'];

  for (const [pathKey, pathItem] of Object.entries(doc.paths)) {
    if (!pathItem || typeof pathItem !== 'object') continue;

    for (const method of methods) {
      const op = pathItem[method];
      if (!op || typeof op !== 'object' || !op.responses || typeof op.responses !== 'object') continue;

      for (const [status, resp] of Object.entries(op.responses)) {
        if (!resp || typeof resp !== 'object') continue;

        if (!resp.description || !resp.description.trim()) {
          const desc = defaultDescriptions[status] || `Response description for HTTP ${status}`;
          resp.description = desc;

          changes.push({
            rule: 'response-description',
            path: `${pathKey} ${method.toUpperCase()} [${status}]`,
            change: `Added response description for HTTP ${status}: "${desc}"`,
            automatic: true
          });
        }
      }
    }
  }

  return changes;
}
