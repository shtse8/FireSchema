import{_ as o,c as t,o as r,ag as n}from"./chunks/framework.Yj-QZn9W.js";const g=JSON.parse('{"title":"Introduction","description":"","frontmatter":{},"headers":[],"relativePath":"guide/introduction.md","filePath":"guide/introduction.md"}'),i={name:"guide/introduction.md"};function a(s,e,c,d,l,u){return r(),t("div",null,e[0]||(e[0]=[n('<h1 id="introduction" tabindex="-1">Introduction <a class="header-anchor" href="#introduction" aria-label="Permalink to &quot;Introduction&quot;">​</a></h1><p>Welcome to FireSchema! 🔥📄</p><p>FireSchema is a command-line tool designed to streamline your Firestore development workflow by generating <strong>strongly-typed</strong> Object Document Mapper (ODM) code directly from your <strong>JSON Schema</strong> definition. It acts as a bridge between your defined data structure and your application code, enhancing type safety and developer productivity.</p><h2 id="the-problem" tabindex="-1">The Problem <a class="header-anchor" href="#the-problem" aria-label="Permalink to &quot;The Problem&quot;">​</a></h2><p>Working directly with Firestore SDKs often involves dealing with raw <code>DocumentData</code> or <code>Map&lt;String, dynamic&gt;</code>. This schemaless approach, while flexible, can lead to:</p><ul><li><strong>Runtime Errors:</strong> Typos in field names or incorrect data types are only caught at runtime.</li><li><strong>Inconsistent Data:</strong> Maintaining consistent data structures across different platforms (e.g., a web frontend using TypeScript and a mobile app using Dart) becomes manual and error-prone.</li><li><strong>Boilerplate Code:</strong> Writing repetitive code for data conversion (<code>fromJson</code>/<code>toJson</code>) and basic CRUD operations.</li><li><strong>Lack of Autocompletion:</strong> IDEs cannot provide accurate suggestions for field names or query structures without a defined schema.</li></ul><h2 id="the-solution-schema-first-firestore-development" tabindex="-1">The Solution: Schema-First Firestore Development <a class="header-anchor" href="#the-solution-schema-first-firestore-development" aria-label="Permalink to &quot;The Solution: Schema-First Firestore Development&quot;">​</a></h2><p>FireSchema promotes a <strong>schema-first</strong> approach:</p><ol><li><strong>Centralize Your Schema:</strong> Define your Firestore collections, fields, types, relationships, and even basic validation rules using the well-established <strong>JSON Schema</strong> standard in a <code>firestore.schema.json</code> file. This file becomes the single source of truth for your data structure.</li><li><strong>Configure Your Targets:</strong> Specify which languages and SDKs you need code for (e.g., TypeScript Client, TypeScript Admin, Dart Client) and where the output should go in a <code>fireschema.config.json</code> file.</li><li><strong>Generate Type-Safe Code:</strong> Run the <code>fireschema generate</code> command. FireSchema parses your schema and configuration, then generates tailored ODM code for each specified target.</li><li><strong>Develop with Confidence:</strong> Use the generated components in your application code, benefiting from compile-time checks, intelligent autocompletion, and significantly reduced boilerplate.</li></ol><h2 id="core-generated-components" tabindex="-1">Core Generated Components <a class="header-anchor" href="#core-generated-components" aria-label="Permalink to &quot;Core Generated Components&quot;">​</a></h2><p>For each collection defined in your schema, FireSchema typically generates:</p><ul><li><strong>Typed Models/Interfaces:</strong> Language-specific classes or interfaces representing your document data (e.g., <code>User</code>, <code>Product</code>).</li><li><strong>Typed Collection References:</strong> Classes providing type-safe access to a specific Firestore collection (e.g., <code>UsersCollection</code>), including methods for <code>add</code>, <code>set</code>, <code>get</code>, <code>delete</code>.</li><li><strong>Type-Safe Query Builders:</strong> Classes allowing you to build complex Firestore queries with compile-time checks for field names and operators (e.g., <code>UsersQueryBuilder</code>).</li><li><strong>Type-Safe Update Builders:</strong> Classes for constructing atomic update operations (e.g., <code>set</code>, <code>increment</code>, <code>arrayUnion</code>) with type safety (e.g., <code>UsersUpdateBuilder</code>).</li></ul><h2 id="key-benefits" tabindex="-1">Key Benefits <a class="header-anchor" href="#key-benefits" aria-label="Permalink to &quot;Key Benefits&quot;">​</a></h2><ul><li>✅ <strong>Improved Type Safety:</strong> Catch data structure errors during development, not in production.</li><li>🚀 <strong>Enhanced Developer Experience:</strong> Leverage IDE autocompletion and reduce manual type casting.</li><li>🔄 <strong>Cross-Platform Consistency:</strong> Ensure data models align across different codebases (TS/Dart).</li><li>⚡ <strong>Faster Development:</strong> Automate the creation and maintenance of data access code.</li><li>📄 <strong>Living Documentation:</strong> Your JSON Schema serves as clear documentation for your database structure.</li></ul><h2 id="supported-targets" tabindex="-1">Supported Targets <a class="header-anchor" href="#supported-targets" aria-label="Permalink to &quot;Supported Targets&quot;">​</a></h2><p>Currently, FireSchema supports generating code for:</p><ul><li><strong>TypeScript (Client SDK - <code>firebase</code> v9+)</strong></li><li><strong>TypeScript (Admin SDK - <code>firebase-admin</code>)</strong></li><li><strong>Dart (Client SDK - <code>cloud_firestore</code>)</strong></li></ul><p>Future planned targets include support for a Dart Admin SDK (likely leveraging the Firestore REST API) and a C# Client SDK.</p><p>Ready to simplify your Firestore workflow? Head over to the <a href="./installation.html">Installation</a> guide!</p>',19)]))}const m=o(i,[["render",a]]);export{g as __pageData,m as default};
