---
# https://vitepress.dev/reference/default-theme-home-page
layout: home
hero:
  name: "FireSchema"
  text: "Strongly-Typed Firestore ODM"
  tagline: Generate type-safe code for TypeScript, Dart & C# from your Firestore schema. Boost productivity and prevent runtime errors. # Updated tagline
  image:
    # Optional: Add a logo or relevant image
    # src: /logo.png
    # alt: FireSchema Logo
  actions:
    - theme: brand
      text: Get Started
      link: /guide/introduction
    - theme: alt
      text: View on GitHub
      link: https://github.com/shtse8/firestore-odm # Replace with actual repo link
features:
  - title: 🔥 Schema-Driven Generation
    details: Define your Firestore structure once using JSON Schema and generate consistent code for multiple platforms.
  - title: 🔒 Type Safety First
    details: Catch Firestore data errors at compile time, not runtime. Provides strongly-typed models, query builders, and update builders.
  - title: 🎯 Multi-Target Support
    details: Generate code specifically tailored for TypeScript (Client & Admin SDKs), Dart (Client SDK), and C# (Client SDK). # Updated description
  - title: ⚙️ Independent Runtimes
    details: Lightweight, target-specific runtime libraries provide base functionality without bloating your generated code.
  - title: 🚀 Boost Productivity
    details: Automate boilerplate code generation, letting you focus on building features faster. Includes helpers for CRUD, queries, and atomic operations.
  - title: 🧩 Extensible Adapters
    details: The core generator uses an adapter pattern, making it potentially extensible to support other languages or targets in the future.
---

<!-- You can add more markdown content below the frontmatter if needed -->

## Feature Status & Roadmap

FireSchema aims to provide a robust, type-safe interface for Firestore across multiple platforms. Here's a snapshot of current support and future plans:

| Target Platform         | Status      | Supported SDK¹                 | Test Coverage²                     | Key Features / Notes                                                                                                                               |
| :---------------------- | :---------- | :----------------------------- | :--------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------- |
| **TypeScript (Client)** | ✅ Supported | `firebase` v9+ (Modular)       | Unit & Integration (Emulator)    | Ideal for Web Apps (React, Vue, etc.) & Node.js clients. Full CRUD, Querying, Streaming, Subcollections, Transactions/Batches.                       |
| **TypeScript (Admin)**  | ✅ Supported | `firebase-admin` (Node.js)     | Unit & Integration (Emulator)    | Ideal for Backends (Node.js, Cloud Functions). Full CRUD, Querying, Subcollections, Transactions/Batches. **No Streaming.**                           |
| **Dart (Client)**       | ✅ Supported | `cloud_firestore` (Flutter)    | Unit (Fake) & Integration (Emulator) | Ideal for Flutter Apps & Dart clients. Full CRUD, Querying, Streaming, Subcollections, Transactions/Batches. Includes `serverTimestamp` handling on `add`. |
| **Dart (Admin/Server)** | ⏳ Planned   | Firestore REST API             | N/A                                | Target: `dart-admin-rest` (tentative). **Addresses lack of official Dart Admin SDK**, enabling type-safe backend Dart Firestore access.             |
| **C# (Client)**         | ✅ Supported | `Google.Cloud.Firestore`       | Unit & Integration (Emulator)    | Target: `csharp-client`. For .NET applications (ASP.NET Core, MAUI, Blazor, Unity via .NET Standard 2.1). Full CRUD, Querying, Updates.             |

**Core Features (Supported across all current runtimes):**

-   JSON Schema Definition (`timestamp`, `geopoint`, `reference`, `$ref`, basic validation)
-   Configuration File (`fireschema.config.json`)
-   Code Generation CLI (`fireschema generate`)
-   Type-Safe Data Models (`Data`, `AddData`, Nested Types, Enums)
-   Type-Safe Collection References with CRUD (`get`, `add`, `set`, `delete`)
-   Type-Safe Query Builders (`where[Field]`, `orderBy`, `limit`, Cursors, `in`, `array-contains`, etc.)
-   Type-Safe Update Builders (`set[Field]`, `increment[Field]`, `serverTimestamp`, `updateRaw` for `FieldValue`)
-   Subcollection Accessors

**Notes:**

1.  You must install the specified Firebase SDK alongside the corresponding FireSchema runtime package in your project.
2.  Test coverage indicates that automated tests exist for core runtime functionality. See individual runtime guides for more specifics.

For detailed usage, please refer to the specific guides for each runtime target. See the [Roadmap](./guide/roadmap.md) page for more details on planned features.
