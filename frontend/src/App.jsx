import React, { useState } from 'react';
import Header from './components/Header';
import WorkflowStepper from './components/WorkflowStepper';
import Step1Upload from './components/steps/Step1Upload';
import Step2Exposure from './components/steps/Step2Exposure';
import Step3LintAndFix from './components/steps/Step3LintAndFix';
import Step4Plugins from './components/steps/Step4Plugins';
import Step5KongConfig from './components/steps/Step5KongConfig';
import Step6FinalValidation from './components/steps/Step6FinalValidation';
import Step7GitPush from './components/steps/Step7GitPush';
import AuditTrailModal from './components/AuditTrailModal';
import AiAssistantModal from './components/AiAssistantModal';

export default function App() {
  const [currentStep, setCurrentStep] = useState(1);
  const [maxCompletedStep, setMaxCompletedStep] = useState(0);

  // Workflow Session Context
  const [sessionId, setSessionId] = useState(`sess-${Date.now()}`);
  const [uploadedData, setUploadedData] = useState(null);
  const [kongExposure, setKongExposure] = useState('internal');
  const [policyData, setPolicyData] = useState(null);
  const [lintData, setLintData] = useState(null);
  const [configuredPlugins, setConfiguredPlugins] = useState([]);
  const [kongConfigData, setKongConfigData] = useState(null);
  const [finalValidationData, setFinalValidationData] = useState(null);

  // Modals
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiRule, setAiRule] = useState(null);
  const [aiPlugin, setAiPlugin] = useState(null);

  // Step 1: Upload Complete
  const handleUploadComplete = (data) => {
    setUploadedData(data);
    setSessionId(data.sessionId || sessionId);
    setMaxCompletedStep(Math.max(maxCompletedStep, 1));
    setCurrentStep(2);
  };

  // Step 2: Exposure Complete
  const handleExposureComplete = (exposure, policy) => {
    setKongExposure(exposure);
    setPolicyData(policy);
    setMaxCompletedStep(Math.max(maxCompletedStep, 2));
    setCurrentStep(3);
  };

  // Step 3: Lint & Fix Complete
  const handleLintComplete = (data) => {
    setLintData(data);
    setMaxCompletedStep(Math.max(maxCompletedStep, 3));
    setCurrentStep(4);
  };

  // Step 4: Plugins Complete
  const handlePluginsComplete = (plugins) => {
    setConfiguredPlugins(plugins);
    setMaxCompletedStep(Math.max(maxCompletedStep, 4));
    setCurrentStep(5);
  };

  // Step 5: Kong Config Complete
  const handleKongConfigComplete = (config) => {
    setKongConfigData(config);
    setMaxCompletedStep(Math.max(maxCompletedStep, 5));
    setCurrentStep(6);
  };

  // Step 6: Final Validation Complete
  const handleFinalValidationComplete = (validation) => {
    setFinalValidationData(validation);
    setMaxCompletedStep(Math.max(maxCompletedStep, 6));
    setCurrentStep(7);
  };

  // Open AI modal with rule
  const handleOpenAiWithRule = (rule) => {
    setAiRule(rule);
    setAiPlugin(null);
    setAiModalOpen(true);
  };

  // Open AI modal with plugin
  const handleOpenAiWithPlugin = (plugin) => {
    setAiPlugin(plugin);
    setAiRule(null);
    setAiModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col selection:bg-blue-600 selection:text-white">
      <Header
        onOpenAudit={() => setAuditModalOpen(true)}
        onOpenAi={() => {
          setAiRule('operation-description');
          setAiModalOpen(true);
        }}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        <WorkflowStepper
          currentStep={currentStep}
          setStep={setCurrentStep}
          maxCompletedStep={maxCompletedStep}
        />

        {/* Step Views */}
        <div className="transition-all duration-300">
          {currentStep === 1 && (
            <Step1Upload
              onComplete={handleUploadComplete}
              initialData={uploadedData}
            />
          )}

          {currentStep === 2 && (
            <Step2Exposure
              sessionId={sessionId}
              initialExposure={kongExposure}
              onSelectExposure={handleExposureComplete}
            />
          )}

          {currentStep === 3 && (
            <Step3LintAndFix
              sessionId={sessionId}
              onComplete={handleLintComplete}
              initialLint={lintData}
              onOpenAiWithRule={handleOpenAiWithRule}
            />
          )}

          {currentStep === 4 && (
            <Step4Plugins
              sessionId={sessionId}
              kongExposure={kongExposure}
              onComplete={handlePluginsComplete}
              initialPlugins={configuredPlugins}
              onOpenAiWithPlugin={handleOpenAiWithPlugin}
            />
          )}

          {currentStep === 5 && (
            <Step5KongConfig
              sessionId={sessionId}
              environments={uploadedData?.environments}
              onComplete={handleKongConfigComplete}
              initialConfig={kongConfigData}
            />
          )}

          {currentStep === 6 && (
            <Step6FinalValidation
              sessionId={sessionId}
              onComplete={handleFinalValidationComplete}
            />
          )}

          {currentStep === 7 && (
            <Step7GitPush
              sessionId={sessionId}
              apiName={uploadedData?.stats?.title || 'Customer API'}
              onSuccess={() => setMaxCompletedStep(7)}
            />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/60 py-4 px-6 text-center text-xs text-slate-500">
        Kong API Onboarding Automation Platform • Deterministic Automation Engine • decK 3.0 Declarative GitOps
      </footer>

      {/* Modals */}
      <AuditTrailModal
        isOpen={auditModalOpen}
        onClose={() => setAuditModalOpen(false)}
      />

      <AiAssistantModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        initialRule={aiRule}
        initialPlugin={aiPlugin}
      />
    </div>
  );
}
