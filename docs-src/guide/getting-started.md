# Getting Started

This guide will walk you through installing FireSchema and generating your first
set of typed Firestore code.

## Prerequisites

- Node.js (LTS version recommended) and npm (or Bun, Yarn, pnpm).
- For TypeScript targets: An existing TypeScript project with the relevant
  Firebase SDK (`firebase` for client, `firebase-admin` for admin) installed.
- For Dart targets: An existing Dart/Flutter project with the `cloud_firestore`
  package installed.

## Installation

FireSchema consists of two main parts:

1. **The CLI Tool (`@shtse8/fireschema`):** This is the command-line application
   you run to generate code based on your schema and configuration. You
   typically install this once, either globally or as a dev dependency in your
   main project/monorepo root.
2. **Runtime Libraries (`@shtse8/fireschema-ts-*-runtime`,
   `fireschema_dart_runtime`):** These are small packages containing base
   classes and helpers that the _generated code_ depends on. You install the
   appropriate runtime library in the specific project where you intend to
   **use** the generated code (e.g., your frontend app, backend service, or
   Flutter app).

### Step 1: Install FireSchema CLI

Choose one of the following methods:

```bash
# Install globally (recommended for easy access from anywhere)
npm install -g @shtse8/fireschema

# --- OR ---

# Install as a dev dependency in your project's root
npm install --save-dev @shtse8/fireschema
# (or yarn add --dev @shtse8/fireschema, pnpm add -D @shtse8/fireschema)
```

### Step 2: Install Runtime Library/Libraries

Install the necessary runtime library **in the project where the generated code
will live**:

**For TypeScript (Client SDK):**

```bash
# In your frontend/web project directory:
npm install @shtse8/fireschema-ts-client-runtime

# Ensure you also have the Firebase JS SDK (v9+):
npm install firebase
```

**For TypeScript (Admin SDK):**

```bash
# In your backend/Node.js project directory:
npm install @shtse8/fireschema-ts-admin-runtime

# Ensure you also have the Firebase Admin SDK:
npm install firebase-admin
```

**For Dart/Flutter (Client SDK):**

```bash
# In your Dart/Flutter project directory:
dart pub add fireschema_dart_runtime
# Or for Flutter:
# flutter pub add fireschema_dart_runtime

# Ensure you also have cloud_firestore:
dart pub add cloud_firestore
# Or for Flutter:
# flutter pub add cloud_firestore
```

## Basic Workflow

1. **Define Your Schema:** Create a `firestore.schema.json` file. This is where
   you define your Firestore collections, their fields, data types, and
   relationships using the JSON Schema standard.
   - See the [Schema Definition](./schema-definition.md) guide for details.
   - _Example:_ `examples/firestore.schema.json` in the FireSchema repository.

2. **Configure Generation:** Create a `fireschema.config.json` file. This tells
   the FireSchema CLI where to find your schema file and what code to generate
   (target language/SDK and output directory).
   - See the [Configuration](./configuration.md) guide for details.
   - _Example:_ `examples/fireschema.config.json` in the FireSchema repository.

3. **Generate Code:** Run the `fireschema generate` command from your terminal.
   It's usually best to run this from the root of your project where the config
   file is located.

   ```bash
   # If using the default config name (fireschema.config.json)
   # and fireschema is installed as a dev dependency:
   npx fireschema generate

   # --- OR ---

   # If fireschema is installed globally:
   fireschema generate

   # --- OR ---

   # Specifying a config file path (works with npx or global):
   npx fireschema generate -c ./path/to/your/config.json
   # fireschema generate -c ./path/to/your/config.json
   ```

4. **Use Generated Code:** Import and utilize the newly generated classes
   (models, collection references, query builders, update builders) in your
   TypeScript or Dart project. These classes provide the type safety and
   autocompletion benefits.
   - Check out the [Usage Examples](./usage-examples.md) guide.

You're now set up! The next steps are to dive deeper into defining your
[Schema Definition](./schema-definition.md) and understanding the
[Configuration](./configuration.md) options.
