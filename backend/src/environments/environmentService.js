export const STANDARD_ENVIRONMENTS = [
  { key: 'develop', label: 'DEVELOP', aliases: ['dev', 'develop', 'development', 'staging-dev'] },
  { key: 'SIT', label: 'SIT', aliases: ['sit', 'system-integration-test', 'integration'] },
  { key: 'UAT', label: 'UAT', aliases: ['uat', 'user-acceptance-test', 'staging', 'stage'] },
  { key: 'replica', label: 'REPLICA', aliases: ['replica', 'pre-prod', 'preprod', 'canary'] },
  { key: 'production', label: 'PRODUCTION', aliases: ['production', 'prod', 'live'] }
];

export function extractAndValidateEnvironments(servers = []) {
  const detected = {};
  const unmapped = [];

  for (const s of servers) {
    const url = typeof s === 'string' ? s : s.url;
    const desc = (typeof s === 'object' ? (s.description || '') : '').toLowerCase();
    const urlLower = url.toLowerCase();

    let matchedEnvKey = null;

    for (const env of STANDARD_ENVIRONMENTS) {
      if (
        env.aliases.some(alias => desc.includes(alias)) ||
        env.aliases.some(alias => urlLower.includes(`-${alias}.`) || urlLower.includes(`.${alias}.`))
      ) {
        matchedEnvKey = env.key;
        break;
      }
    }

    // Special fallback for prod (often has no prefix e.g. api.company.com)
    if (!matchedEnvKey && (urlLower.includes('api.company.com') || desc === 'production' || desc === 'prod')) {
      matchedEnvKey = 'production';
    }

    if (matchedEnvKey) {
      detected[matchedEnvKey] = {
        url,
        description: s.description || matchedEnvKey,
        isConfigured: true
      };
    } else {
      unmapped.push({ url, description: s.description || 'Custom Server' });
    }
  }

  // Construct environment breakdown
  const environmentReport = STANDARD_ENVIRONMENTS.map(env => {
    const match = detected[env.key];
    return {
      key: env.key,
      label: env.label,
      url: match ? match.url : null,
      description: match ? match.description : null,
      present: Boolean(match)
    };
  });

  const missingEnvironments = environmentReport.filter(e => !e.present).map(e => e.label);

  return {
    environments: environmentReport,
    unmapped,
    allConfigured: missingEnvironments.length === 0,
    missingEnvironments
  };
}
