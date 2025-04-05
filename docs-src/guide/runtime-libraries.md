# Runtime Libraries

FireSchema generates code that relies on small, dedicated runtime libraries for each target platform. These libraries provide the essential base classes, helper functions, and SDK interaction logic needed for the generated ODM to function correctly. They act as the engine powering the generated code.

## Purpose

-   **Reduce Generated Code Size:** The bulk of the common logic (like query building, data conversion, update handling) resides in the runtime, keeping the generated files focused on type definitions and schema-specific methods.
-   **Centralize Core Logic:** Allows for improvements, bug fixes, and new features to be implemented in the runtime packages and benefit all users upon updating, without needing to regenerate code (unless the generation templates themselves change).
-   **Encapsulate SDK Differences:** Provides a mostly consistent API layer over the underlying Firebase Client/Admin SDKs, simplifying the generated code and the developer experience. For example, the `getData()` method on the query builder works similarly across platforms, even though the underlying SDK calls might differ.


### Component Relationships

```mermaid
graph LR
    subgraph FireSchema_Tool [FireSchema CLI]
        style FireSchema_Tool fill:#f9f,stroke:#333
        Generator[Generator (Adapters + Templates)]
    end

    subgraph User_Project [User Project]
        style User_Project fill:#ccf,stroke:#333
        GeneratedCode[Generated ODM Code<br>(e.g., UsersCollection.ts)]
        UserAppCode[User Application Code]
    end

    subgraph Runtime_Package [Runtime Package]
         style Runtime_Package fill:#cfc,stroke:#333
         RuntimeLib[Runtime Library<br>(e.g., @shtse8/fireschema-ts-client-runtime)]
         BaseClasses[Base Classes<br>(e.g., ClientBaseCollectionRef)]
         Helpers[Helpers & Converters]
    end

    subgraph Firebase_SDK [Firebase SDK]
        style Firebase_SDK fill:#ffc,stroke:#333
        SDK[Firebase SDK<br>(e.g., `firebase` or `firebase-admin`)]
    end

    Generator -- Generates --> GeneratedCode;
    UserAppCode -- Uses --> GeneratedCode;
    GeneratedCode -- Extends/Uses --> BaseClasses;
    GeneratedCode -- Imports --> RuntimeLib;
    RuntimeLib -- Contains --> BaseClasses;
    RuntimeLib -- Contains --> Helpers;
    BaseClasses -- Uses --> SDK;
    Helpers -- Uses --> SDK;
    UserAppCode -- Installs --> RuntimeLib;
    UserAppCode -- Installs --> SDK;
```

## Available Runtimes

These are the official runtime packages maintained alongside FireSchema:

-   **`@shtse8/fireschema-ts-client-runtime`** (npm)
    -   **Target:** `typescript-client`
    -   **SDK Dependency:** `firebase` (v9+ modular SDK)
    -   **Key Exports:** `ClientBaseCollectionRef`, `ClientBaseQueryBuilder`, `ClientBaseUpdateBuilder`.
    -   **Description:** Provides implementations tailored for the web/client-side Firebase JS SDK.
-   **`@shtse8/fireschema-ts-admin-runtime`** (npm)
    -   **Target:** `typescript-admin`
    -   **SDK Dependency:** `firebase-admin`
    -   **Key Exports:** `AdminBaseCollectionRef`, `AdminBaseQueryBuilder`, `AdminBaseUpdateBuilder`.
    -   **Description:** Provides implementations tailored for the Node.js Firebase Admin SDK.
-   **`fireschema_dart_runtime`** (pub.dev)
    -   **Target:** `dart-client`
    -   **SDK Dependency:** `cloud_firestore`, `meta`
    -   **Key Exports:** `BaseCollectionRef`, `BaseQueryBuilder`, `BaseUpdateBuilder` (often used as mixins or extended by generated classes).
    -   **Description:** Provides implementations for Dart/Flutter applications using the `cloud_firestore` plugin.

### Planned Runtimes

-   **Dart Admin Runtime (via REST)**
    -   **Target:** `dart-admin-rest` (tentative name)
    -   **SDK Dependency:** Dart `http` package (or similar).
    -   **Description:** A planned runtime leveraging the Firestore REST API. This aims to address the long-standing lack of an official Firebase Admin SDK for Dart, enabling powerful server-side Dart applications to interact securely with Firestore using generated type-safe code.
-   **C# Client Runtime**
    -   **Target:** `csharp-client` (tentative name)
    -   **SDK Dependency:** Firebase SDK for .NET (specifics TBD).
    -   **Description:** Planned support for generating C# code for client applications (e.g., Unity, MAUI, Blazor).

## Installation

As mentioned in the [Installation](./installation.md) guide, you **must** install the appropriate *available* runtime library **in the project where you intend to use the generated code**, alongside the corresponding Firebase SDK. The generated code directly imports from and extends classes/mixins provided by these runtime packages.

## Key Components Explained

While you typically interact with the *generated* classes (e.g., `UsersCollection`, `UsersQueryBuilder`), understanding the role of the underlying runtime base classes can be helpful for advanced usage or debugging.

-   **Base Collection Reference (`ClientBaseCollectionRef`, `AdminBaseCollectionRef`, `BaseCollectionRef`):**
    -   Holds the reference to the underlying Firestore `CollectionReference`.
    -   Contains the `FirestoreDataConverter` (`converter`) responsible for `toFirestore` (serializing data before writing) and `fromFirestore` (deserializing data after reading). This handles `Timestamp` conversions, `enum` mapping, and applying default values (primarily in Dart's `add`).
    -   Provides core CRUD methods like `get(id)`, `add(data)`, `set(id, data)`, `delete(id)`.
    -   Provides the `update(id)` method which returns an instance of the `BaseUpdateBuilder`.
    -   Provides the `query()` method which returns an instance of the `BaseQueryBuilder`.
    -   Provides helper methods like `docRef([id])` to get the raw underlying `DocumentReference`.
    -   Handles the logic for accessing subcollections via generated methods.
-   **Base Query Builder (`ClientBaseQueryBuilder`, `AdminBaseQueryBuilder`, `BaseQueryBuilder`):**
    -   Holds the underlying Firestore `Query` object.
    -   Implements common query methods (`where`, `orderBy`, `limit`, `limitToLast`, `startAt`, `startAfter`, `endAt`, `endBefore`). Generated type-safe methods (e.g., `whereStatus`, `whereAge`) typically call these base methods with the correct field names.
    -   Provides methods to execute the query and retrieve results:
        -   `get()`: Executes the query and returns the raw `QuerySnapshot`. Useful for pagination or accessing metadata.
        -   `getData()`: Executes the query, converts the results using the `converter`, and returns a typed array/list of data objects (e.g., `UserData[]` or `List<UserData>`).
        -   `snapshots()`: Returns a `Stream` (Dart) or requires using `onSnapshot` with `query.query` (TypeScript) for real-time updates.
    -   Exposes the underlying `query` object (e.g., `query.query` in TS, `query.query` in Dart) for direct use with SDK functions like `onSnapshot`.
-   **Base Update Builder (`ClientBaseUpdateBuilder`, `AdminBaseUpdateBuilder`, `BaseUpdateBuilder`):**
    -   Accumulates update operations.
    -   Provides the internal `updateData` map where operations are staged.
    -   Generated methods (`setFieldName`, `incrementFieldName`, etc.) add entries to `updateData`.
    -   Provides the `updateRaw(data)` method to merge arbitrary data (like `FieldValue` operations or nested field updates using dot notation) into the `updateData`.
    -   Provides the final `commit()` method, which takes the accumulated `updateData` and performs a single Firestore `update` operation on the target document.
-   **Type Converters/Helpers:**
    -   Internal utilities used by the base classes.
    -   Handle serialization/deserialization between your typed objects and Firestore's data format.
    -   Manage `Timestamp` vs. `Date` conversion (based on TS config).
    -   Handle `enum` serialization (e.g., to string) and deserialization.
    -   Apply `defaultValue` logic (currently most prominent in Dart's `add` implementation).

By separating this core logic into runtime libraries, FireSchema aims for a balance between generated type safety and maintainable, reusable code.