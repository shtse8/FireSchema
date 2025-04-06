<!-- Version: 1.14 | Last Updated: 2025-04-06 | Updated By: Cline -->
# Technical Context: FireSchema (Separate Repos + Submodules)

**Core Generator Tool (`@shtse8/fireschema`):**

- **Language:** TypeScript
- **Runtime:** Node.js
- **Key Libraries:** `commander`, `ajv`, `ejs`
- **Compilation:** TS to JS (`dist/`).
- **Repository Structure:** Main repo contains CLI, docs, examples. Runtimes are Git submodules in `packages/`.
- **Core Logic:** `cli.ts`, `configLoader.ts`, `schemaLoader.ts`, `generator.ts` (Executor), `adapters/*` (Adapters load own templates).

**Schema Definition:**

- **Format:** JSON Schema (Draft 7 recommended).
- **Validation:** Against `src/schema-definition.json` using `ajv`.

**Configuration (`fireschema.config.json`):**

- **Format:** JSON.
- **Structure:** `schema`, `outputs` array (`target`, `outputDir`, `package?`, `options?`).
- **Targets:** `'typescript-client'`, `'typescript-admin'`, `'dart-client'`, `'csharp-client'`.

**Runtime Libraries (Separate Repositories & Submodules):**

- **Purpose:** Reusable base classes, types, SDK logic. Installed by end-user.
- **TypeScript Runtime (Independent Packages):**
  - **`@shtse8/fireschema-ts-client-runtime`:** Uses `firebase` SDK. For `typescript-client` adapter. npm package.
  - **`@shtse8/fireschema-ts-admin-runtime`:** Uses `firebase-admin` SDK. For `typescript-admin` adapter. npm package.
- **Dart Runtime (`fireschema_dart_runtime`):** Uses `cloud_firestore`. For `dart-client` adapter. pub package.
- **C# Runtime (`FireSchema.CS.Runtime`):**
  - **Location:** `packages/fireschema-csharp-runtime` (Submodule linking to `fireschema-csharp-runtime` repo)
  - **Purpose:** Uses `Google.Cloud.Firestore` SDK. Contains base classes (`BaseCollectionRef`, `BaseQueryBuilder`, `BaseUpdateBuilder`), converter (`FirestoreDataConverter`), interface (`IFirestoreDocument`), attribute (`FirestoreDocumentIdAttribute`).
  - **Target Framework:** `net8.0` (LTS, compatible with CI)
  - **Version:** `0.1.1`
  - **Used by:** `csharp-client` adapter.
  - **Published:** NuGet package (v0.1.1 tagged for release via CI).
  - **Dependencies:** `Google.Cloud.Firestore`.

**Generated Code Targets (Examples):**

1.  **Target: `'typescript-client'`** (Adapter: `typescript-client`, Runtime: `@shtse8/fireschema-ts-client-runtime`, SDK: `firebase`)
2.  **Target: `'typescript-admin'`** (Adapter: `typescript-admin`, Runtime: `@shtse8/fireschema-ts-admin-runtime`, SDK: `firebase-admin`)
3.  **Target: `'dart-client'`** (Adapter: `dart-client`, Runtime: `fireschema_dart_runtime`, SDK: `cloud_firestore`)
4.  **Target: `'csharp-client'`** (Adapter: `csharp-client`, Runtime: `FireSchema.CS.Runtime`, SDK: `Google.Cloud.Firestore`)

**Development Environment:**

- **Primary Tooling:** Bun (`bun`) in main repo. Runtimes use respective ecosystem tools.
- **User Compatibility:** Standard Node.js/Dart/Flutter/.NET environments.

**Testing Strategy:**

- **Core Tool:** Snapshot Tests (`src/__tests__/generator.test.ts`).
- **Runtime Packages:** Unit & Integration Tests **within each runtime repo**.
- **Adapters:** Primarily tested via core tool's Snapshot Tests.
- **C# Integration Tests:** Require Firestore emulator (started via `gcloud beta emulators firestore start` in CI, using `setup-gcloud` action).

**Documentation:**

- **Framework:** VitePress (`docs-src/`). Build output `docs/`.\\n

**Publishing & CI/CD:**

- **Automation:** GitHub Actions.
- **Main Repo:** Builds/tests CLI & docs, deploys docs. **No package publishing.**
- **Runtime Repos:** Separate workflows trigger on tags **in that repo** to build, test, publish **only that package**.
- **C# CI (`dotnet-ci-cd.yml`):** Uses `ubuntu-latest`, `actions/setup-dotnet@v4` (with `dotnet-version: '8.0.x'`), `google-github-actions/setup-gcloud@v2` (to install `beta`, `cloud-firestore-emulator`), starts emulator. Runs steps: `dotnet restore <proj>`, `dotnet build <proj> --no-restore -o ./build_output`, `dotnet pack <proj> --no-build`, `dotnet test --no-build`, and pushes NuGet on tag (e.g., `v0.1.1`).
