# Kong API Onboarding Automation Platform

An enterprise web-based self-service platform that automates Kong API onboarding from Swagger/OpenAPI submission through deterministic structural validation, Stoplight Spectral linting, automated Node.js fixers, plugin configuration, Kong decK configuration generation, 5-point final validation, and GitOps push.

---

## 🌟 Key Features

1. **Deterministic OpenAPI Validation**:
   - Validates syntax, OpenAPI 3.0+ structure, schema constraints, and `$ref` pointer resolution before any onboarding step.
   - Immediate feedback with line/path markers on blocking validation errors.

2. **Kong Exposure Classification**:
   - **Internal Kong**: Recommended for intra-cluster services, corporate microservices, and private meshes (auto-recommends Key Auth, Correlation ID).
   - **External Kong**: Hardened perimeter gateway policy (auto-recommends Key Auth, Rate Limiting, Correlation ID, CORS, IP Restriction).

3. **Stoplight Spectral Linting & Central Ruleset**:
   - Uses `@stoplight/spectral-cli` and `rules/spectral.yaml`.
   - Lints operation descriptions, operation IDs, tags, response descriptions, servers, and corporate API metadata.

4. **Deterministic Node.js Auto-Fixers**:
   - Deterministic Fixer Registry:
     - `operation-description`: Generates human-readable descriptions based on path structure and HTTP verbs.
     - `operation-operationId`: Produces unique camelCase operation IDs.
     - `operation-tags`: Extracts logical resource groupings into tags.
     - `api-description`: Populates standard API info summary.
     - `response-description`: Injects standard RFC HTTP response descriptions (200, 201, 400, 404, 500, etc.).
     - `api-contact`: Adds platform engineering contact information.
   - **Re-Lint Verification**: Immediately re-executes Spectral after fix application to verify zero blocking errors remain.

5. **Plugin Catalog & Policy Recommendations**:
   - **Frequently Used**: Authentication, Rate Limiting, Correlation ID, CORS, ACL, Request/Response Transformers, IP Restriction.
   - **Dynamic Schema-Driven Forms**: Loads plugin schemas from `schemas/plugins/` to render typed inputs, validations, and default values.
   - **Searchable Plugin Catalog**: Explore and add plugins directly from the web interface.

6. **Kong decK Declarative Configuration Generator**:
   - Generates decK 3.0 compliant monolithic configuration (`kong/deck.yaml`) with `_format_version: "3.0"`, service definitions, routing paths, and attached plugins.
   - Also outputs modular repository structure:
     - `kong/services/<api>.yaml`
     - `kong/routes/<api>.yaml`
     - `kong/plugins/<api>.yaml`
   - **decK Diff Preview**: Visualizes planned creation/modification of services, routes, and plugins.

7. **Multi-Environment Target URLs**:
   - Automatically parses and validates target URLs for:
     - `develop`
     - `SIT`
     - `UAT`
     - `replica`
     - `production`

8. **5-Point Final Validation Gate**:
   - Pre-commit pipeline checking OpenAPI correctness, Spectral lint results, Kong decK configuration syntax, plugin configuration schema adherence, and environment coverage.

9. **GitOps Integration & Branching**:
   - Automatically creates onboarding feature branch (`feature/<api-slug>-onboarding`).
   - Commits generated Kong decK files and corrected OpenAPI specifications.
   - Prepares Pull Request ready for peer review.

10. **Section 22 Immutable Audit Trail**:
    - Archives JSON audit records recording API name, version, exposure type, plugins configured, issues detected vs auto-fixed, and Git status.

11. **Section 23 Assistive AI Guidance**:
    - Interactive panels providing clear explanations for Spectral rules and architectural rationale for gateway policies.

---

## 📁 Repository Structure

```text
├── backend/
│   ├── src/
│   │   ├── api/             # REST routes & AI explanations
│   │   ├── audit/           # Audit trail persistence
│   │   ├── environments/    # Environment URL detection
│   │   ├── fixers/          # Deterministic Node.js auto-fixers
│   │   ├── git/             # GitOps branch & commit management
│   │   ├── kong/            # Kong decK generator & diff preview
│   │   ├── lint/            # Spectral CLI runner & formatter
│   │   ├── plugins/         # Plugin service & policy engine
│   │   ├── validation/      # Deterministic OpenAPI parser & validator
│   │   ├── workflow/        # 14-step state machine
│   │   └── server.js        # Express backend server
│   └── package.json
│
├── frontend/                # Vite + React + Tailwind Web Dashboard
│   ├── src/
│   │   ├── components/
│   │   │   ├── steps/       # Step 1 to Step 7 wizard views
│   │   │   ├── Header.jsx
│   │   │   ├── WorkflowStepper.jsx
│   │   │   ├── AuditTrailModal.jsx
│   │   │   └── AiAssistantModal.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
│
├── rules/
│   └── spectral.yaml        # Central Stoplight Spectral governance ruleset
├── schemas/plugins/         # Typed plugin configuration schemas
│   ├── rate-limiting.json
│   ├── correlation-id.json
│   ├── key-auth.json
│   ├── cors.json
│   ├── acl.json
│   ├── openid-connect.json
│   ├── ip-restriction.json
│   ├── request-transformer.json
│   └── response-transformer.json
├── templates/               # Internal and external policy defaults
│   ├── internal/policy.json
│   └── external/policy.json
├── specs/                   # Sample OpenAPI specifications for testing
│   ├── customer-api.yaml
│   └── invalid-customer-api.yaml
└── package.json
```

---

## 🚀 Quick Start

### 1. Start the Platform

Run from the root directory:

```bash
# Start the unified backend (serves both API and the built React frontend)
npm start
```

Access the dashboard at:
👉 **`http://localhost:5000`**

### 2. Run in Development Mode (Optional)

If developing the frontend and backend simultaneously:

```bash
# In terminal 1:
npm run dev:backend

# In terminal 2:
npm run dev:frontend
```
The Vite development server will run on `http://localhost:3000` with active hot-reload and proxy to `http://localhost:5000`.

---

## 🧪 Testing the Guided Workflow

1. Open `http://localhost:5000` in your web browser.
2. Click **"Load Customer API (Sample)"** to load a realistic OpenAPI 3.0 specification with 5 environments.
3. Click **"Validate Swagger / OpenAPI"** (passes deterministic structural validation).
4. Choose **Internal** or **External** Kong exposure.
5. In Step 3, view the 12 Spectral rule violations caught by `rules/spectral.yaml`.
6. Click **"Apply Node.js Automatic Fixes"** — watch deterministic fixers resolve all violations with zero human error and re-lint cleanly.
7. In Step 4, view recommended vs optional plugins, customize rate limits or correlation headers, or add new plugins from the catalog.
8. In Step 5, inspect the generated Kong decK 3.0 YAML and decK diff preview.
9. In Step 6, run the **5-Point Final Validation Pipeline** (all checkpoints pass green).
10. In Step 7, select repository and environment, then click **"Commit & Push to Git"** to create your onboarding branch and review the audit trail record!
