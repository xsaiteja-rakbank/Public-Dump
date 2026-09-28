export const WORKFLOW_STATES = [
  'UPLOADED',
  'VALIDATED',
  'CLASSIFIED',
  'LINTED',
  'AUTO_FIXED',
  'LINT_PASSED',
  'PLUGINS_SELECTED',
  'CONFIGURED',
  'FINAL_VALIDATION',
  'GIT_SELECTED',
  'BRANCH_CREATED',
  'COMMITTED',
  'PUSHED',
  'PR_CREATED'
];

export class WorkflowStateMachine {
  constructor(sessionId) {
    this.sessionId = sessionId || `sess-${Date.now()}`;
    this.currentState = 'UPLOADED';
    this.history = [{ state: 'UPLOADED', timestamp: new Date().toISOString() }];
    this.context = {
      specOriginal: null,
      specParsed: null,
      specFixed: null,
      apiStats: null,
      kongExposure: null,
      initialLintResults: null,
      fixerChanges: [],
      fixedLintResults: null,
      selectedPlugins: [],
      pluginConfigs: {},
      kongConfig: null,
      kongModularFiles: null,
      targetEnvironment: null,
      targetBranch: null,
      repository: null,
      featureBranch: null,
      gitPushStatus: null,
      prDetails: null,
      auditRecord: null
    };
  }

  canTransitionTo(nextState) {
    return WORKFLOW_STATES.includes(nextState);
  }

  transitionTo(nextState) {
    if (!WORKFLOW_STATES.includes(nextState)) {
      throw new Error(`Invalid workflow state: ${nextState}`);
    }

    this.currentState = nextState;
    this.history.push({ state: nextState, timestamp: new Date().toISOString() });
    return this.currentState;
  }

  updateContext(updates = {}) {
    this.context = {
      ...this.context,
      ...updates
    };
  }

  getStatus() {
    return {
      sessionId: this.sessionId,
      currentState: this.currentState,
      progressPercentage: Math.round(((WORKFLOW_STATES.indexOf(this.currentState) + 1) / WORKFLOW_STATES.length) * 100),
      history: this.history,
      context: {
        apiName: this.context.apiStats?.title || null,
        apiVersion: this.context.apiStats?.version || null,
        kongExposure: this.context.kongExposure,
        selectedPlugins: this.context.selectedPlugins,
        targetEnvironment: this.context.targetEnvironment,
        targetBranch: this.context.targetBranch,
        repository: this.context.repository,
        featureBranch: this.context.featureBranch
      }
    };
  }
}

// In-memory session manager for ongoing onboardings
export const activeWorkflows = new Map();

export function getOrCreateWorkflow(sessionId) {
  if (!sessionId) {
    const wf = new WorkflowStateMachine();
    activeWorkflows.set(wf.sessionId, wf);
    return wf;
  }
  if (!activeWorkflows.has(sessionId)) {
    const wf = new WorkflowStateMachine(sessionId);
    activeWorkflows.set(sessionId, wf);
    return wf;
  }
  return activeWorkflows.get(sessionId);
}
