/**
 * Deterministic fixer for missing API contact information.
 */
export function fixContact(doc) {
  const changes = [];
  if (!doc.info) {
    doc.info = { title: 'Kong Service API', version: 'v1' };
  }

  if (!doc.info.contact || typeof doc.info.contact !== 'object' || (!doc.info.contact.email && !doc.info.contact.name)) {
    doc.info.contact = {
      name: 'API Platform Team',
      email: 'api-platform@company.com'
    };

    changes.push({
      rule: 'api-contact',
      path: 'info.contact',
      change: 'Added API Platform contact information (name & email)',
      automatic: true
    });
  }

  return changes;
}
