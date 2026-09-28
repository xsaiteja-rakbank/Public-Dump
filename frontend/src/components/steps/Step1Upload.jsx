import React, { useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertTriangle, ArrowRight, Loader2, Play } from 'lucide-react';

const SAMPLE_CUSTOMER_API = `openapi: 3.0.3
info:
  title: Customer API
  version: v1
  description: Customer management API for retail and enterprise accounts.
  contact:
    name: API Platform Team
    email: api-platform@company.com

servers:
  - url: https://api-dev.company.com/customer
    description: develop
  - url: https://api-sit.company.com/customer
    description: SIT
  - url: https://api-uat.company.com/customer
    description: UAT
  - url: https://api-replica.company.com/customer
    description: replica
  - url: https://api.company.com/customer
    description: production

paths:
  /customers:
    get:
      summary: List all customers
      responses:
        '200':
          description: A list of customers
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Customer'
    post:
      summary: Create a new customer
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CustomerInput'
      responses:
        '201':
          description: Customer created successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Customer'
        '400':
          description: Invalid request payload
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'

  /customers/{id}:
    get:
      parameters:
        - name: id
          in: path
          required: true
          description: The customer unique identifier
          schema:
            type: string
      responses:
        '200':
          description: Customer found
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Customer'
        '404':
          description: Customer not found
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
    delete:
      parameters:
        - name: id
          in: path
          required: true
          description: The customer unique identifier
          schema:
            type: string
      responses:
        '204':
          description: Customer deleted successfully

components:
  schemas:
    Customer:
      type: object
      required: [id, name, email]
      properties:
        id: { type: string, example: "cust_123" }
        name: { type: string, example: "Acme Corp" }
        email: { type: string, example: "info@acme.com" }
    CustomerInput:
      type: object
      required: [name, email]
      properties:
        name: { type: string, example: "Acme Corp" }
        email: { type: string, example: "info@acme.com" }
    ErrorResponse:
      type: object
      required: [code, message]
      properties:
        code: { type: string }
        message: { type: string }
`;

const SAMPLE_INVALID_API = `openapi: 3.0.3
info:
  title: Broken API
  version: v1
paths:
  /customer/{id}:
    get:
      summary: Broken missing parameter definition
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/NonExistentModel'
`;

export default function Step1Upload({ onComplete, initialData }) {
  const [specText, setSpecText] = useState(initialData?.specOriginal || '');
  const [fileName, setFileName] = useState(initialData?.fileName || 'customer-api.yaml');
  const [loading, setLoading] = useState(false);
  const [errorResult, setErrorResult] = useState(null);
  const [stats, setStats] = useState(initialData?.stats || null);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.yaml')) {
      setErrorResult({
        message: 'Invalid file format. Only .yaml files are allowed for upload.',
        errors: [{ type: 'FILE_TYPE_ERROR', message: `File "${file.name}" rejected. Only .yaml files are permitted.` }]
      });
      setStats(null);
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      setSpecText(content);
      validateSpec(content, file.name);
    };
    reader.readAsText(file);
  };

  const loadPreset = (presetText, name) => {
    setFileName(name);
    setSpecText(presetText);
    validateSpec(presetText, name);
  };

  const validateSpec = async (contentToValidate = specText, fName = fileName) => {
    if (!contentToValidate.trim()) return;

    if (!fName.toLowerCase().endsWith('.yaml')) {
      setErrorResult({
        message: 'Invalid file format. Only .yaml files are allowed for upload.',
        errors: [{ type: 'FILE_TYPE_ERROR', message: `File "${fName}" rejected. Only .yaml files are permitted.` }]
      });
      setStats(null);
      return;
    }

    setLoading(true);
    setErrorResult(null);
    setStats(null);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: contentToValidate,
          fileName: fName,
          isYaml: true
        })
      });

      const data = await res.json();
      if (!res.ok || !data.valid) {
        setErrorResult(data);
      } else {
        setStats(data.stats);
        if (onComplete) {
          onComplete(data);
        }
      }
    } catch (err) {
      setErrorResult({
        message: 'Could not connect to backend validation server.',
        errors: [{ type: 'NETWORK_ERROR', message: err.message }]
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Presets */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <span>1. API Specification Submission</span>
          </h2>
          <p className="text-sm text-slate-400">
            Upload your OpenAPI 3.0 specification (.yaml only) for deterministic structural validation.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => loadPreset(SAMPLE_CUSTOMER_API, 'customer-api.yaml')}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600/10 text-blue-400 border border-blue-500/30 hover:bg-blue-600/20 transition"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Load Customer API (.yaml)</span>
          </button>
          <button
            onClick={() => loadPreset(SAMPLE_INVALID_API, 'broken-api.yaml')}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition"
          >
            <span>Test Broken Spec (.yaml)</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Upload & Editor Area */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative border-2 border-dashed border-slate-700 hover:border-blue-500/50 rounded-2xl p-6 text-center transition bg-slate-900/40">
            <input
              type="file"
              accept=".yaml"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <UploadCloud className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-slate-200">
                Drag and drop your OpenAPI specification or <span className="text-blue-400">browse file</span>
              </p>
              <p className="text-xs text-blue-400 font-medium">Supports .yaml only (max 10MB)</p>
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl overflow-hidden">
            <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400 flex items-center space-x-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                <span>{fileName}</span>
              </span>
              <span className="text-[11px] text-slate-500">Editable YAML (.yaml)</span>
            </div>
            <textarea
              value={specText}
              onChange={(e) => setSpecText(e.target.value)}
              placeholder="Paste OpenAPI YAML or JSON specification here..."
              rows={12}
              className="w-full bg-transparent p-4 font-mono text-xs text-slate-300 focus:outline-none resize-y"
            />
          </div>

          <button
            onClick={() => validateSpec()}
            disabled={loading || !specText.trim()}
            className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center justify-center space-x-2 shadow-lg shadow-blue-600/20 disabled:opacity-50 transition"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Running Swagger Validation...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Validate Swagger / OpenAPI</span>
              </>
            )}
          </button>
        </div>

        {/* Validation Feedback & Spec Summary */}
        <div className="lg:col-span-5 space-y-4">
          {errorResult && (
            <div className="bg-red-950/30 border border-red-800/60 rounded-xl p-5 space-y-3">
              <div className="flex items-center space-x-2 text-red-400 font-bold text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>Swagger Validation Failed</span>
              </div>
              <p className="text-xs text-red-300">{errorResult.message}</p>

              <div className="space-y-2 mt-2">
                {errorResult.errors?.map((err, idx) => (
                  <div key={idx} className="bg-red-900/30 border border-red-800/40 rounded-lg p-3 text-xs">
                    <span className="font-mono text-red-300 font-semibold block mb-1">
                      {err.type || 'VALIDATION_ERROR'}
                    </span>
                    <pre className="text-[11px] text-red-200/90 whitespace-pre-wrap font-mono">
                      {err.message}
                    </pre>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-slate-400 italic">
                Do not proceed to Kong onboarding until blocking validation issues are resolved.
              </p>
            </div>
          )}

          {stats && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2 text-emerald-400 font-semibold text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>OpenAPI Validated Successfully</span>
                </div>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {stats.openapiVersion}
                </span>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-850">
                  <span className="text-[11px] text-slate-400 block">API Name</span>
                  <span className="text-sm font-bold text-white">{stats.title}</span>
                </div>
                <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-850">
                  <span className="text-[11px] text-slate-400 block">API Version</span>
                  <span className="text-sm font-bold text-white">{stats.version}</span>
                </div>
                <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-850">
                  <span className="text-[11px] text-slate-400 block">Paths</span>
                  <span className="text-sm font-bold text-white">{stats.pathsCount}</span>
                </div>
                <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-850">
                  <span className="text-[11px] text-slate-400 block">Operations</span>
                  <span className="text-sm font-bold text-white">{stats.operationsCount}</span>
                </div>
              </div>

              {/* Operations Breakdown */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-300 block">Detected Endpoints</span>
                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                  {stats.operations?.map((op, i) => (
                    <div key={i} className="flex items-center space-x-2 text-xs p-2 rounded bg-slate-950/50 border border-slate-850 font-mono">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        op.method === 'GET' ? 'bg-blue-500/20 text-blue-400' :
                        op.method === 'POST' ? 'bg-emerald-500/20 text-emerald-400' :
                        op.method === 'DELETE' ? 'bg-red-500/20 text-red-400' :
                        'bg-amber-500/20 text-amber-400'
                      }`}>
                        {op.method}
                      </span>
                      <span className="text-slate-200 truncate">{op.path}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Servers Breakdown */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800">
                <span className="text-xs font-semibold text-slate-300 block">Target Environments ({stats.servers?.length || 0})</span>
                <div className="space-y-1">
                  {stats.servers?.map((s, idx) => (
                    <div key={idx} className="text-[11px] font-mono text-slate-400 truncate flex items-center justify-between">
                      <span className="text-slate-300 font-semibold">{s.description || 'server'}:</span>
                      <span className="text-blue-400 truncate ml-2">{s.url}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
