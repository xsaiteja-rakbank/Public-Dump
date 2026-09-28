/**
 * Assistive intelligence module providing deterministic and guided explanations
 * for Spectral rules, Kong configurations, and plugin recommendations.
 */

const RULE_EXPLANATIONS = {
  'operation-description': {
    title: 'Missing Operation Description',
    explanation: 'Every API endpoint should have a clear, human-readable description so consumers understand its exact business capability and side effects.',
    remediation: 'Provide a concise 1-2 sentence description explaining what data is returned or mutated.'
  },
  'operation-operationId': {
    title: 'Missing Operation ID',
    explanation: 'Client SDK generators, API gateways, and monitoring dashboards use operationId as the programmatic function name to invoke the endpoint.',
    remediation: 'Use camelCase verb-noun naming like "getCustomers", "createCustomer", or "getCustomerById".'
  },
  'operation-tags': {
    title: 'Missing Operation Tag',
    explanation: 'Tags group related endpoints logically in developer portals (Swagger UI, Kong Developer Portal, Redoc).',
    remediation: 'Group by resource domain, e.g. "customers", "orders", or "billing".'
  },
  'response-description': {
    title: 'Missing HTTP Response Description',
    explanation: 'Each HTTP status code must define what state it signifies to downstream consumers.',
    remediation: 'State the condition that triggers this response (e.g. "404: Customer with the specified ID was not found").'
  },
  'api-description': {
    title: 'Missing API Description',
    explanation: 'The top-level info.description provides context about the service scope, ownership, and SLA.',
    remediation: 'Add an informative summary of this microservice in the info block.'
  }
};

const PLUGIN_EXPLANATIONS = {
  'key-auth': 'Provides standard API key authentication. Fast, zero-overhead, and ideal for authenticating machine-to-machine traffic.',
  'rate-limiting': 'Protects upstream microservices from traffic spikes, denial-of-service, and resource exhaustion by capping requests per minute/hour.',
  'correlation-id': 'Essential for distributed microservice tracing. Injects a unique trace ID into requests that traverses Kong and upstream microservices.',
  'cors': 'Allows client-side web browsers (e.g. Single Page Apps) to consume this API from designated domains while blocking unauthorized origins.',
  'acl': 'Enforces role-based or consumer-group-based access control, allowing only authorized client groups to invoke protected routes.',
  'openid-connect': 'Enterprise grade token verification (JWT, OAuth2/OIDC) integrating with identity providers like Okta, Keycloak, or Azure AD.',
  'ip-restriction': 'Hardens access by permitting traffic only from trusted VPN, CIDR, or corporate IP blocks.'
};

export function explainLintIssue(ruleCode) {
  return RULE_EXPLANATIONS[ruleCode] || {
    title: `Spectral Rule: ${ruleCode}`,
    explanation: 'This rule ensures OpenAPI compliance and organization API governance standards.',
    remediation: 'Review the Spectral ruleset definition in rules/spectral.yaml.'
  };
}

export function explainPluginRecommendation(pluginName, exposureType) {
  const explanation = PLUGIN_EXPLANATIONS[pluginName] || 'Enterprise gateway policy plugin.';
  const context = exposureType === 'external'
    ? 'For External exposure, this plugin provides vital perimeter defense and traffic governance.'
    : 'For Internal exposure, this plugin standardizes observability and service identity.';

  return {
    plugin: pluginName,
    explanation,
    context
  };
}
