---
"@shtse8/fireschema": patch
"@shtse8/fireschema-ts-client-runtime": patch
"@shtse8/fireschema-ts-admin-runtime": patch
"fireschema_dart_runtime": patch
---

fix: Resolve CI build and publish issues

- Fix failing tests by correcting mocks and test logic.
- Update GitHub Actions workflow to use correct test command, emulator project ID, and flags (`--forceExit`, `--runInBand`, `--detectOpenHandles`).
- Add `process.exit(0)` to integration test `afterAll` blocks as CI workaround.
- Fix dead links in documentation build.
- Add missing dev dependencies for Dart runtime package.
- Exclude generated Dart test code from analysis (`analysis_options.yaml`).
- Setup Changesets for versioning and publishing.