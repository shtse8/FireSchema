---
# https://vitepress.dev/reference/default-theme-home-page
layout: home
hero:
  name: "FireSchema"
  text: "Strongly-Typed Firestore ODM"
  tagline: Generate type-safe code for TypeScript & Dart from your Firestore schema. Boost productivity and prevent runtime errors.
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
    details: Generate code specifically tailored for TypeScript (Client & Admin SDKs) and Dart (Client SDK).
  - title: ⚙️ Independent Runtimes
    details: Lightweight, target-specific runtime libraries provide base functionality without bloating your generated code.
  - title: 🚀 Boost Productivity
    details: Automate boilerplate code generation, letting you focus on building features faster. Includes helpers for CRUD, queries, and atomic operations.
  - title: 🧩 Extensible Adapters
    details: The core generator uses an adapter pattern, making it potentially extensible to support other languages or targets in the future.
---

<!-- You can add more markdown content below the frontmatter if needed -->
