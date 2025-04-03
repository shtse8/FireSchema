# Roadmap & Future Plans

This page outlines the planned future development directions for FireSchema.

## Planned Runtimes & Targets

-   **Dart Admin Runtime (via REST)**
    -   **Target:** `dart-admin-rest` (tentative name)
    -   **Description:** Generate Dart code suitable for server-side environments (like Dart Frog, Shelf, or Cloud Functions for Firebase written in Dart) by interacting with the Firestore REST API.
    -   **Motivation:** Addresses the lack of an official Firebase Admin SDK for Dart, enabling type-safe Firestore access from Dart backends. This leverages Dart's strengths on the server while providing crucial database interaction capabilities.
    -   **Status:** Planned.

-   **C# Client Runtime**
    -   **Target:** `csharp-client` (tentative name)
    -   **Description:** Generate C# code compatible with the Firebase SDK for .NET, suitable for client applications (e.g., Unity, MAUI, Blazor).
    -   **Status:** Planned.

## Potential Generator Enhancements

-   **More Advanced Schema Validation:** Improved generation of runtime checks or assertions based on more JSON Schema validation keywords (e.g., `pattern`, `minItems`, `uniqueItems`).
-   **Improved Error Reporting:** More specific error messages during code generation if schema or configuration issues are detected.
-   **Plugin System:** Potentially allow users to create custom adapters or modify template generation through a plugin architecture (longer-term idea).
-   **Support for External `$ref`s:** Explore options for resolving `$ref`s pointing to external schema files, possibly via configuration or preprocessing steps.

## Community Contributions

Contributions are welcome! If you are interested in adding support for a new language target or enhancing the generator, please refer to the project's contribution guidelines on GitHub (link needed) or open an issue to discuss your ideas.