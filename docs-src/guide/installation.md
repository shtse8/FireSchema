# Installation

This guide covers how to install the FireSchema CLI tool and the necessary runtime libraries for your project.

## Prerequisites

-   Node.js (LTS version recommended) and npm (or Bun, Yarn, pnpm) for running the CLI tool.
-   For TypeScript targets: An existing TypeScript project with the relevant Firebase SDK (`firebase` for client, `firebase-admin` for admin) installed.
-   For Dart targets: An existing Dart/Flutter project with the `cloud_firestore` package installed.

## Installation Steps

FireSchema consists of two main parts that need installation:

1.  **The CLI Tool (`@shtse8/fireschema`):** This is the command-line application you run to generate code. Install this once, either globally or as a dev dependency.
2.  **Runtime Libraries (`@shtse8/fireschema-ts-*-runtime`, `fireschema_dart_runtime`):** These are packages containing base classes/helpers that the *generated code* depends on. Install the appropriate runtime library **in the specific project where you will use the generated code**.

### Step 1: Install FireSchema CLI

Choose one of the following methods:

```bash
# Install globally (recommended for easy access from anywhere)
npm install -g @shtse8/fireschema

# --- OR ---

# Install as a dev dependency in your project's root
npm install --save-dev @shtse8/fireschema
# (or yarn add --dev @shtse8/fireschema, pnpm add -D @shtse8/fireschema, bun add -d @shtse8/fireschema)
```

### Step 2: Install Runtime Library/Libraries

Install the necessary runtime library **in the project where the generated code will live**:

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

With the CLI and the appropriate runtime(s) installed, you are ready to define your schema, configure outputs, and generate code. Proceed to the [Schema Definition](./schema-definition.md) and [Configuration](./configuration.md) guides.