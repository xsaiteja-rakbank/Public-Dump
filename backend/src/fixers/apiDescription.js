/**
 * Deterministic fixer for missing API info description.
 */
export function fixApiDescription(doc) {
  const changes = [];
  if (!doc.info) {
    doc.info = { title: 'Kong Service API', version: 'v1' };
  }

  if (!doc.info.description || !doc.info.description.trim()) {
    const title = doc.info.title || 'API Gateway Service';
    const desc = `${title} - Standard OpenAPI specification managed via Kong API Platform.`;
    doc.info.description = desc;

    changes.push({
      rule: 'api-description',
      path: 'info.description',
      change: `Added API description: "${desc}"`,
      automatic: true
    });
  }

  return changes;
}
