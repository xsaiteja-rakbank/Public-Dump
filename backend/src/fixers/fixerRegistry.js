import { fixOperationDescription } from './operationDescription.js';
import { fixOperationId } from './operationId.js';
import { fixTags } from './tags.js';
import { fixApiDescription } from './apiDescription.js';
import { fixResponseDescription } from './responseDescription.js';
import { fixContact } from './contact.js';

export const FIXER_REGISTRY = [
  {
    rule: 'operation-description',
    name: 'Operation Description Fixer',
    description: 'Generates meaningful operation descriptions based on path structure and HTTP verb.',
    fn: fixOperationDescription
  },
  {
    rule: 'operation-operationId',
    name: 'Operation ID Fixer',
    description: 'Generates unique, deterministic camelCase operationIds.',
    fn: fixOperationId
  },
  {
    rule: 'operation-tags',
    name: 'Operation Tags Fixer',
    description: 'Categorizes operations with standard tags inferred from path segments.',
    fn: fixTags
  },
  {
    rule: 'api-description',
    name: 'API Description Fixer',
    description: 'Adds standard info.description if missing.',
    fn: fixApiDescription
  },
  {
    rule: 'response-description',
    name: 'Response Description Fixer',
    description: 'Populates standard RFC-compliant HTTP status response descriptions.',
    fn: fixResponseDescription
  },
  {
    rule: 'api-contact',
    name: 'API Contact Fixer',
    description: 'Adds default platform contact details to API info block.',
    fn: fixContact
  }
];

/**
 * Runs all or selected deterministic fixers on the OpenAPI document.
 * Returns cloned modified document, list of changes, and stats.
 */
export function applyDeterministicFixes(doc, selectedRules = null) {
  // Deep clone to avoid in-place side effects before confirmation
  const clonedDoc = JSON.parse(JSON.stringify(doc));
  const allChanges = [];

  for (const fixer of FIXER_REGISTRY) {
    if (!selectedRules || selectedRules.includes(fixer.rule)) {
      const changes = fixer.fn(clonedDoc);
      if (changes && changes.length > 0) {
        allChanges.push(...changes);
      }
    }
  }

  return {
    fixedDoc: clonedDoc,
    changes: allChanges,
    fixedCount: allChanges.length
  };
}
