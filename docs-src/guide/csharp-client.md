# C# Client Guide (`Google.Cloud.Firestore`)

This guide provides a comprehensive overview of using FireSchema with the `csharp-client` target, designed for .NET applications (like ASP.NET Core, MAUI, Blazor, or Unity via .NET Standard 2.1) using the `Google.Cloud.Firestore` SDK.

[[toc]]

## Overview & Setup

### Target Audience

Use this target if you are building:

-   ASP.NET Core web applications or APIs.
-   MAUI cross-platform applications.
-   Blazor applications (Server or WebAssembly).
-   Unity games (targeting .NET Standard 2.1 or later).
-   Other .NET applications (Console, WPF, etc.) interacting with Firestore.

### Prerequisites

-   Completion of the [Installation](./installation.md) guide (CLI tool installed).
-   An existing C# project targeting a compatible .NET version (e.g., .NET 6, 7, 8 or .NET Standard 2.1+).
-   The `Google.Cloud.Firestore` package installed: `dotnet add package Google.Cloud.Firestore`
-   The `FireSchema.CS.Runtime` package installed: `dotnet add package FireSchema.CS.Runtime`
-   Initialized `FirestoreDb` instance from the `Google.Cloud.Firestore` SDK:

```csharp
// Example _setup.cs (or similar init file / dependency injection setup)
using Google.Cloud.Firestore;
using System;

public static class FirestoreConfig
{
    private static FirestoreDb _firestoreDbInstance;

    public static FirestoreDb GetFirestoreDb(string projectId)
    {
        if (_firestoreDbInstance == null)
        {
            // Ensure GOOGLE_APPLICATION_CREDENTIALS environment variable is set
            // or run on GCP/Firebase environment for automatic authentication.
            _firestoreDbInstance = FirestoreDb.Create(projectId);

            // Optional: Connect to Firestore Emulator if using
            // Environment.SetEnvironmentVariable("FIRESTORE_EMULATOR_HOST", "127.0.0.1:8080");
            // Note: Emulator detection is often automatic if the env var is set *before* Create()
        }
        return _firestoreDbInstance;
    }
}

// Usage elsewhere (e.g., in a service constructor):
// FirestoreDb firestore = FirestoreConfig.GetFirestoreDb("your-gcp-project-id");
```

### SDK & Runtime

-   **Supported SDK:** `Google.Cloud.Firestore`
-   **Runtime Package:** `FireSchema.CS.Runtime` (NuGet)

### Configuration (`fireschema.config.json`)

Ensure your configuration file specifies the `csharp-client` target:

```json
{
  "schema": "./firestore.schema.json",
  "outputs": [
    {
      "target": "csharp-client",
      "outputDir": "./Generated/Firestore", // Example output directory
      "options": {
        // No specific options for C# currently
      }
    }
  ]
}
```

### Generation

Run the generator: `npx fireschema generate`

This creates files like `UsersCollection.cs`, `UsersData.cs`, etc., within the specified output directory, organized by collection name.

---

## Core Concepts Explained

FireSchema generates several key C# classes to streamline Firestore interactions:

-   **`{CollectionName}Data.cs`**: Contains the main data model class (e.g., `UsersData`). This class represents the structure of your Firestore documents, including properties for all fields defined in your schema. It often includes nested classes or enums if defined. Crucially, it has a `[FirestoreData]` attribute required by the `Google.Cloud.Firestore` SDK for automatic mapping. It also includes an `Id` property marked with `[FirestoreDocumentId]` which is populated by the SDK upon retrieval but **not** stored within the document data itself.
-   **`{CollectionName}AddData.cs`**: Contains a class (e.g., `UsersAddData`) specifically designed for creating *new* documents using the `AddAsync` method. This class typically omits fields that have default values handled by Firestore (like server timestamps) or fields that shouldn't be set on creation (like the `Id`). This promotes type safety during document creation.
-   **`{CollectionName}Collection.cs`**: The primary interaction point (e.g., `UsersCollection`). It inherits from `FireSchema.CS.Runtime.BaseCollectionRef<YourDataType>` and provides:
    -   Type-safe CRUD methods (`GetAsync`, `AddAsync`, `SetAsync`, `UpdateAsync`, `DeleteAsync`).
    -   A `.Query()` method returning a type-safe `{CollectionName}QueryBuilder`.
    -   Methods to access defined subcollections (e.g., `Posts(string documentId)`).
    -   Access to the underlying `CollectionReference` and `FirestoreDataConverter`.
-   **`{CollectionName}QueryBuilder.cs`**: Inherits from `FireSchema.CS.Runtime.BaseQueryBuilder`. Provides type-safe methods for filtering (`Where[FieldName]`), ordering (`OrderBy[FieldName]`), limiting (`Limit`, `LimitToLast`), and pagination (`StartAt`, `EndBefore`, etc.) based on your schema fields.
-   **`{CollectionName}UpdateBuilder.cs`**: Inherits from `FireSchema.CS.Runtime.BaseUpdateBuilder`. Accessed via `collection.UpdateAsync(id)`, it provides type-safe methods for atomic updates (`Set[FieldName]`, `Increment[FieldName]`, `Set[FieldName]ToServerTimestamp`, `DeleteField`, etc.). You must call `.CommitAsync()` to execute the update.

---

## CRUD Operations

Basic Create, Read, Update, and Delete operations using the generated `Collection` class.

*(Setup assumed from above)*
```csharp
using Google.Cloud.Firestore;
using YourProject.Generated.Firestore; // Adjust namespace
using YourProject.Generated.Firestore.Users; // Adjust namespace
using System;
using System.Threading.Tasks;

// Assume firestoreDb is an initialized FirestoreDb instance
var usersCollection = new UsersCollection(firestoreDb);
```

### Create (AddAsync)

Use `AddAsync()` for new documents where Firestore generates the ID. Requires the `{CollectionName}AddData` type. The runtime automatically handles setting server timestamps if configured in the schema for `createdAt` or `updatedAt` fields (though explicit setting via UpdateBuilder is also possible).

```csharp
async Task<DocumentReference?> CreateUserAsync(string displayName, string email)
{
    // Use the AddData type, providing only necessary fields for creation
    var newUser = new UsersAddData
    {
        DisplayName = displayName,
        Email = email,
        IsActive = true, // Assuming default values or required fields
        // createdAt/updatedAt often handled by Firestore or triggers, so omitted here
    };
    try
    {
        // AddAsync returns the DocumentReference of the newly created document
        DocumentReference docRef = await usersCollection.AddAsync(newUser);
        Console.WriteLine($"User added with ID: {docRef.Id}");
        return docRef;
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error adding user: {ex.Message}");
        return null;
    }
}
// var newUserRef = await CreateUserAsync("Alice CSharp", "alice.cs@example.com");
```

### Create or Overwrite (SetAsync)

Use `SetAsync()` when you want to specify the document ID. This will *overwrite* the document if it exists or create it if it doesn't. Requires the full `{CollectionName}Data` type unless merging.

```csharp
async Task CreateOrReplaceUserAsync(string userId, UsersData data)
{
    try
    {
        // SetAsync requires the full data model
        await usersCollection.SetAsync(userId, data);
        Console.WriteLine($"Document {userId} set/replaced.");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error setting document {userId}: {ex.Message}");
    }
}

var bobData = new UsersData
{
    // Note: The 'Id' property in UsersData is for reading,
    // it's not part of the data written to Firestore.
    // The ID is provided as the first argument to SetAsync.
    DisplayName = "Bob CSharp",
    Email = "bob.cs@example.com",
    IsActive = true,
    Age = 42,
    CreatedAt = Timestamp.GetCurrentTimestamp(), // Must provide all non-nullable fields
    UpdatedAt = Timestamp.GetCurrentTimestamp()
};
// await CreateOrReplaceUserAsync("bob-cs-123", bobData);

// Set with Merge (Upsert)
// Use SetOptions.MergeAll to only update the fields provided.
async Task UpsertUserPartialAsync(string userId, UsersData partialData)
{
   try
    {
        // Pass SetOptions.MergeAll to merge data
        await usersCollection.SetAsync(userId, partialData, SetOptions.MergeAll);
        Console.WriteLine($"Document {userId} upserted (merged).");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error upserting document {userId}: {ex.Message}");
    }
}
// Example: Only update display name and add age
var charliePartial = new UsersData { DisplayName = "Charlie CSharp", Age = 28 };
// await UpsertUserPartialAsync("charlie-cs-456", charliePartial);
```

### Read (GetAsync)

Use `GetAsync()` to retrieve a single document by ID. Returns a `DocumentSnapshot<YourDataType>?`. Access the typed data via the `.Data` property after checking `.Exists`.

```csharp
async Task<UsersData?> GetUserAsync(string userId)
{
    try
    {
        // GetAsync returns a typed DocumentSnapshot or null if fetch fails
        DocumentSnapshot<UsersData>? userSnap = await usersCollection.GetAsync(userId);

        if (userSnap != null && userSnap.Exists)
        {
            UsersData userData = userSnap.Data; // Access the typed data
            // The Id property is automatically populated from the snapshot's ID
            Console.WriteLine($"User found: ID={userData.Id}, Name={userData.DisplayName}");
            return userData;
        }
        else
        {
            Console.WriteLine($"User {userId} not found or fetch failed.");
            return null;
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error getting user {userId}: {ex.Message}");
        return null;
    }
}
// var user = await GetUserAsync("alice-cs-abc");
```

### Update (UpdateAsync)

Use `UpdateAsync(id)` to get a type-safe `{CollectionName}UpdateBuilder`. Chain generated methods (e.g., `Set[FieldName]`, `Increment[FieldName]`) and finally call `.CommitAsync()` to execute the atomic update.

```csharp
async Task UpdateUserLoginAsync(string userId)
{
    try
    {
        await usersCollection.UpdateAsync(userId)
          .IncrementLoginCount(1) // Generated method assuming 'LoginCount' field
          .SetLastLogin(Timestamp.GetCurrentTimestamp()) // Generated method for 'LastLogin' field
          .CommitAsync(); // Executes the update
        Console.WriteLine($"Updated login info for {userId}.");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error updating user {userId}: {ex.Message}");
    }
}
// await UpdateUserLoginAsync("bob-cs-123");
```
*(See [Advanced Updates](#advanced-updates) below for more complex scenarios)*

### Delete (DeleteAsync)

Use `DeleteAsync()` to remove a document by ID. Returns `Task`.

```csharp
async Task DeleteUserAsync(string userId)
{
    try
    {
        await usersCollection.DeleteAsync(userId);
        Console.WriteLine($"User {userId} deleted successfully.");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error deleting user {userId}: {ex.Message}");
    }
}
// await DeleteUserAsync("charlie-cs-456");
```

---

## Querying Data

Build and execute type-safe queries using the generated `{CollectionName}QueryBuilder`. Access it via `collection.Query()`.

*(Setup assumed from above)*
```csharp
using Google.Cloud.Firestore; // For FilterOperator, QueryDirection, etc.
using System.Collections.Generic;
```

### Filtering (`Where[FieldName]`)

Use generated methods corresponding to your schema fields. They accept a `FilterOperator` (e.g., `EqualTo`, `GreaterThan`, `ArrayContains`) and the value to compare against.

```csharp
// Find active users older than 30
var activeUserQuery = usersCollection.Query()
  .WhereIsActive(FilterOperator.EqualTo, true)   // Generated from 'IsActive' field
  .WhereAge(FilterOperator.GreaterThan, 30); // Generated from 'Age' field

// Find users with a specific tag
var taggedUserQuery = usersCollection.Query()
    .WhereTags(FilterOperator.ArrayContains, "beta-tester"); // For array fields
```

### Ordering (`OrderBy[FieldName]`)

Sort results using generated methods. Specify `QueryDirection.Ascending` or `QueryDirection.Descending`. Remember that composite indexes might be required in Firestore for complex ordering combined with filters.

```csharp
// Order by city ascending, then display name descending
var orderedQuery = usersCollection.Query()
  .OrderByAddress_City(QueryDirection.Ascending) // Assuming nested 'Address.City' field
  .OrderByDisplayName(QueryDirection.Descending);
```

### Limiting (`Limit`, `LimitToLast`)

Restrict the number of documents returned.

```csharp
var limitQuery = usersCollection.Query().OrderByDisplayName().Limit(10);
var lastFiveQuery = usersCollection.Query().OrderByCreatedAt().LimitToLast(5);
```

### Pagination (`StartAt`, `StartAfter`, `EndBefore`, `EndAt`)

Use cursor methods for pagination. These methods typically require either a `DocumentSnapshot` (obtained from a previous query's results) or the specific field values corresponding to the `OrderBy` clauses.

```csharp
DocumentSnapshot<UsersData>? lastDocSnapshot = null; // Keep track of the last doc from the previous page

async Task<List<UsersData>> LoadNextUserPageAsync()
{
    var queryBuilder = usersCollection.Query()
        .OrderByDisplayName() // Must order for consistent pagination
        .Limit(20);

    if (lastDocSnapshot != null)
    {
        // Start query after the last document snapshot
        queryBuilder = queryBuilder.StartAfter(lastDocSnapshot);
    }

    // Execute the query using GetSnapshotAsync to get the snapshot needed for the next page
    QuerySnapshot querySnapshot = await queryBuilder.GetSnapshotAsync();

    if (querySnapshot.Documents.Any())
    {
        // Store the last document of this page for the *next* query
        lastDocSnapshot = querySnapshot.Documents.Last() as DocumentSnapshot<UsersData>;
    }
    else
    {
        lastDocSnapshot = null; // Reached the end
    }

    // Convert the results to typed data
    List<UsersData> users = querySnapshot.Documents
                                .Select(doc => doc.ConvertTo<UsersData>())
                                .ToList();
    Console.WriteLine($"Loaded {users.Count} users.");
    return users;
}
// List<UsersData> firstPage = await LoadNextUserPageAsync();
// List<UsersData> secondPage = await LoadNextUserPageAsync();
```

### Executing Queries (`GetDataAsync`, `GetSnapshotAsync`)

-   **`GetDataAsync()`**: The simplest way to execute. Returns `Task<IReadOnlyList<DocumentSnapshot<YourDataType>>>`. Automatically converts documents using the converter. You usually access the `.Data` property on each snapshot.
-   **`GetSnapshotAsync()`**: Returns the raw `Task<QuerySnapshot>`. Useful when you need the `QuerySnapshot` object itself (e.g., for pagination cursors, checking `.IsEmpty`, accessing `.Count`). You'll typically iterate through `snapshot.Documents` and call `.ConvertTo<YourDataType>()` on each document snapshot.

```csharp
// Using GetDataAsync (Simpler for just getting data)
IReadOnlyList<DocumentSnapshot<UsersData>> activeUserDocs = await activeUserQuery.GetDataAsync();
foreach (var docSnap in activeUserDocs)
{
    UsersData user = docSnap.Data;
    Console.WriteLine($"- {user.DisplayName} (Age: {user.Age})");
}

// Using GetSnapshotAsync (Needed for pagination, provides more info)
QuerySnapshot snapshot = await orderedQuery.Limit(5).GetSnapshotAsync();
if (!snapshot.IsEmpty)
{
    Console.WriteLine($"Snapshot has {snapshot.Count} documents.");
    foreach (DocumentSnapshot docSnap in snapshot.Documents)
    {
        UsersData user = docSnap.ConvertTo<UsersData>(); // Manual conversion
        Console.WriteLine($"- ID: {docSnap.Id}, Name: {user.DisplayName}");
    }
}
```

---

## Realtime Updates (Streaming with ListenAsync)

The `Google.Cloud.Firestore` SDK provides the `ListenAsync` method on `DocumentReference` and `Query` objects to receive realtime updates. You can use the generated `Collection` and `QueryBuilder` to get the correctly typed references/queries to listen to.

*(Setup assumed from above)*
```csharp
using System;
using System.Threading;
using System.Threading.Tasks;
using Google.Cloud.Firestore;
```

### Streaming a Single Document

Get the typed `DocumentReference` using `collection.DocRef(id)` and then call `ListenAsync`.

```csharp
async Task ListenToUserAsync(string userId, CancellationToken cancellationToken = default)
{
    DocumentReference userDocRef = usersCollection.DocRef(userId); // Get typed reference

    Console.WriteLine($"Listening to user {userId}...");

    // ListenAsync takes a callback that receives QuerySnapshots
    // For a single document, the snapshot will contain 0 or 1 document.
    FirestoreChangeListener listener = userDocRef.ListenAsync(snapshot =>
    {
        if (snapshot.Exists)
        {
            try
            {
                UsersData userData = snapshot.ConvertTo<UsersData>(); // Convert to typed data
                Console.WriteLine($"[Realtime Update] User {userId}: Name={userData.DisplayName}, Age={userData.Age}");
                // --- Update your application state/UI here ---
            }
            catch (Exception ex) { Console.WriteLine($"Error converting snapshot: {ex.Message}"); }
        }
        else
        {
            Console.WriteLine($"[Realtime Update] User {userId} deleted.");
            // --- Handle deletion in your application state/UI ---
        }
    }, cancellationToken);

    // Keep the listener running (in a real app, manage its lifecycle)
    // await Task.Delay(Timeout.Infinite, cancellationToken); // Example: Keep alive indefinitely
    // listener.StopAsync(); // Call this to stop listening
}

// Example usage:
// var cts = new CancellationTokenSource();
// await ListenToUserAsync("bob-cs-123", cts.Token);
// // Later, to stop: cts.Cancel();
```

### Streaming Query Results

Get the typed `Query` object from the `QueryBuilder`'s `.Query` property and call `ListenAsync`.

```csharp
async Task ListenToActiveUsersAsync(CancellationToken cancellationToken = default)
{
    // Build the typed query
    var queryBuilder = usersCollection.Query()
        .WhereIsActive(FilterOperator.EqualTo, true)
        .OrderByDisplayName();

    Query firestoreQuery = queryBuilder.Query; // Get the underlying Firestore Query object

    Console.WriteLine("Listening to active users...");

    FirestoreChangeListener listener = firestoreQuery.ListenAsync(querySnapshot =>
    {
        Console.WriteLine($"[Realtime Update] Received snapshot with {querySnapshot.Count} active users.");

        // Process changes (more efficient than processing the whole list every time)
        foreach (DocumentChange change in querySnapshot.Changes)
        {
            try
            {
                UsersData userData = change.Document.ConvertTo<UsersData>();
                switch (change.ChangeType)
                {
                    case DocumentChange.Type.Added:
                        Console.WriteLine($"  + Added: {userData.DisplayName} (ID: {change.Document.Id})");
                        // --- Add to your application state/UI list ---
                        break;
                    case DocumentChange.Type.Modified:
                        Console.WriteLine($"  * Modified: {userData.DisplayName} (ID: {change.Document.Id})");
                        // --- Update in your application state/UI list ---
                        break;
                    case DocumentChange.Type.Removed:
                        Console.WriteLine($"  - Removed: {userData.DisplayName} (ID: {change.Document.Id})");
                        // --- Remove from your application state/UI list ---
                        break;
                }
            }
             catch (Exception ex) { Console.WriteLine($"Error converting change document: {ex.Message}"); }
        }
         Console.WriteLine("--- End of changes ---");

    }, cancellationToken);

    // Keep the listener running
    // await Task.Delay(Timeout.Infinite, cancellationToken);
    // listener.StopAsync();
}

// Example usage:
// var cts = new CancellationTokenSource();
// await ListenToActiveUsersAsync(cts.Token);
// // Later, to stop: cts.Cancel();
```

---

## Working with Subcollections

If your schema defines subcollections (e.g., a `posts` subcollection under `users`), FireSchema generates:

1.  A method on the parent collection class (e.g., `usersCollection.Posts(userId)`) that returns a typed reference to the subcollection.
2.  Separate generated classes for the subcollection (e.g., `PostsCollection`, `PostsData`, `PostsAddData`, `PostsQueryBuilder`, `PostsUpdateBuilder`).

*(Setup assumed from above)*
```csharp
// Assuming Posts collection is defined under Users in schema.json
// Adjust namespaces as needed
using YourProject.Generated.Firestore.Users.Posts;
```

```csharp
string userId = "alice-cs-abc"; // ID of the parent user document

// 1. Get a reference to the subcollection
PostsCollection userPostsCollection = usersCollection.Posts(userId);

// 2. Use the subcollection reference just like a top-level collection
async Task ManagePostsAsync()
{
    // Add a new post to Alice's posts subcollection
    var newPost = new PostsAddData { Title = "My First C# Post", Content = "Hello from FireSchema!" };
    DocumentReference postRef = await userPostsCollection.AddAsync(newPost);
    Console.WriteLine($"Added post {postRef.Id} for user {userId}");

    // Get the post
    var fetchedPostSnap = await userPostsCollection.GetAsync(postRef.Id);
    if (fetchedPostSnap != null && fetchedPostSnap.Exists)
    {
        Console.WriteLine($"Fetched Post Title: {fetchedPostSnap.Data.Title}");
    }

    // Query posts for that user
    var recentPosts = await userPostsCollection.Query()
        .OrderByCreatedAt(QueryDirection.Descending)
        .Limit(5)
        .GetDataAsync();
    Console.WriteLine($"Found {recentPosts.Count} recent posts for user {userId}");

    // Update a post
    await userPostsCollection.UpdateAsync(postRef.Id)
        .SetIsPublished(true)
        .CommitAsync();
    Console.WriteLine($"Published post {postRef.Id}");
}

// await ManagePostsAsync();

// Access nested subcollections by chaining (if defined)
// e.g., CommentsCollection commentsCollection = usersCollection.Posts(userId).Comments(postId);
```

---

## Advanced Updates

The generated `{CollectionName}UpdateBuilder` provides type-safe methods for common atomic operations.

*(Setup assumed from above)*
```csharp
using Google.Cloud.Firestore; // For FieldValue
```

### Generated Helpers

These methods directly correspond to Firestore atomic operations:

```csharp
string userId = "bob-cs-123";
await usersCollection.UpdateAsync(userId)
    // Set a specific field
    .SetDisplayName("Robert CSharp")
    // Increment a numeric field
    .IncrementAge(1)
    // Set a field to the server's timestamp
    .SetLastLoginToServerTimestamp() // Assumes LastLogin field exists
    // Add elements to an array (ensures uniqueness)
    .AddRoles(new List<string> { "editor" }) // Assumes Roles is List<string>
    // Remove elements from an array
    .RemoveTags(new List<string> { "preview" }) // Assumes Tags is List<string>
    // Delete a specific field
    .DeleteProfilePictureUrl() // Assumes ProfilePictureUrl field exists
    .CommitAsync(); // Don't forget to commit!
```

### Using Raw FieldValue Operations

For operations not covered by generated helpers (e.g., updating nested map fields, complex array manipulations not covered by Union/Remove), you need to bypass the `UpdateBuilder` and use the standard `DocumentReference.UpdateAsync` method with a dictionary or anonymous type containing `FieldValue` objects.

```csharp
// Get the raw DocumentReference
DocumentReference userDocRef = usersCollection.DocRef(userId);

// Example: Update nested fields and use standard FieldValue operations
var updates = new Dictionary<string, object>
{
    // Update a nested field using FieldPath
    { new FieldPath("settings", "theme"), "dark" },
    // Increment a nested field
    { new FieldPath("stats", "visits"), FieldValue.Increment(1) },
    // Add elements using standard FieldValue
    { "permissions", FieldValue.ArrayUnion("read", "write") },
    // Remove elements using standard FieldValue
    { "oldPermissions", FieldValue.ArrayRemove("legacy") },
    // Delete a field using standard FieldValue
    { "temporaryData", FieldValue.Delete }
};

await userDocRef.UpdateAsync(updates);

// Alternatively using an anonymous type (less flexible for dynamic keys)
// await userDocRef.UpdateAsync(new {
//     Settings = new { Theme = "dark" }, // Overwrites entire Settings map! Be careful.
//     Stats = new { Visits = FieldValue.Increment(1) }, // Overwrites entire Stats map!
//     Permissions = FieldValue.ArrayUnion("read", "write")
// });
// Using Dictionary<string, object> with FieldPath is generally safer for nested updates.
```

### Combining Updates

You cannot mix generated `UpdateBuilder` methods and raw `FieldValue` operations within the *same* update call. You must either:

1.  Perform two separate updates (one using the builder, one using raw `UpdateAsync`). This is **not atomic**.
2.  Perform the entire update using raw `UpdateAsync` with a dictionary if you need operations not covered by the builder.

---

## Transactions & Batched Writes

Use the standard `FirestoreDb.RunTransactionAsync` and `FirestoreDb.StartBatch` methods. You can leverage the generated `Collection` classes to get typed `DocumentReference`s and use the generated `FirestoreDataConverter` for reading/writing typed data within the transaction or batch.

*(Setup assumed from above)*
```csharp
using Google.Cloud.Firestore;
using System.Threading.Tasks;
// Assume ProductsCollection exists
using YourProject.Generated.Firestore.Products;

var productsCollection = new ProductsCollection(firestoreDb);
```

### Transactions (`RunTransactionAsync`)

Transactions are useful for read-modify-write operations that need to be atomic.

```csharp
string userId = "alice-cs-abc";
string productId = "product-xyz";
int purchaseQuantity = 1;

try
{
    // RunTransactionAsync takes a callback that receives a Transaction object
    await firestoreDb.RunTransactionAsync(async transaction =>
    {
        // 1. Get typed references
        DocumentReference userRef = usersCollection.DocRef(userId);
        DocumentReference productRef = productsCollection.DocRef(productId);

        // 2. Read documents within the transaction
        DocumentSnapshot<UsersData> userSnap = await transaction.GetSnapshotAsync(userRef);
        DocumentSnapshot<ProductsData> productSnap = await transaction.GetSnapshotAsync(productRef);

        if (!userSnap.Exists) { throw new Exception($"User {userId} not found."); }
        if (!productSnap.Exists) { throw new Exception($"Product {productId} not found."); }

        // Access typed data (converter is implicitly used by GetSnapshotAsync)
        UsersData userData = userSnap.Data;
        ProductsData productData = productSnap.Data;

        // 3. Perform logic
        if (productData.Stock < purchaseQuantity)
        {
            throw new Exception($"Insufficient stock for product {productId}.");
        }
        double cost = productData.Price * purchaseQuantity;
        if (userData.Balance < cost) // Assuming Balance field on UsersData
        {
            throw new Exception($"Insufficient balance for user {userId}.");
        }

        // 4. Stage writes within the transaction
        transaction.Update(userRef, new Dictionary<string, object> {
            { nameof(UsersData.Balance), FieldValue.Increment(-cost) }
        });
        transaction.Update(productRef, new Dictionary<string, object> {
            { nameof(ProductsData.Stock), FieldValue.Increment(-purchaseQuantity) }
        });

        // The transaction automatically commits if the callback completes without exceptions.
        // If an exception occurs, the transaction is rolled back.
    });
    Console.WriteLine("Transaction completed successfully.");
}
catch (Exception ex)
{
    Console.WriteLine($"Transaction failed: {ex.Message}");
}
```

### Batched Writes (`StartBatch`)

Batches are useful for making multiple writes atomically without needing reads within the operation.

```csharp
string userId = "bob-cs-123";
string orderId = Guid.NewGuid().ToString(); // Generate a new ID

// 1. Start a batch
WriteBatch batch = firestoreDb.StartBatch();

// 2. Get typed references
DocumentReference userRef = usersCollection.DocRef(userId);
DocumentReference orderRef = firestoreDb.Collection("orders").Document(orderId); // Example: Using raw ref for a different collection

// 3. Stage writes in the batch

// Update using a dictionary
batch.Update(userRef, new Dictionary<string, object> {
    { nameof(UsersData.LastOrderPlacedAt), FieldValue.ServerTimestamp },
    { nameof(UsersData.OrderCount), FieldValue.Increment(1) } // Assuming OrderCount field
});

// Set a new document (can use generated AddData type with converter if needed, or anonymous/dictionary)
var newOrderData = new { Item = "Widget", Quantity = 5, UserId = userId, Status = "Pending" };
batch.Set(orderRef, newOrderData);

// Delete an old document
DocumentReference oldLogRef = firestoreDb.Collection("logs").Document("old-log-abc");
batch.Delete(oldLogRef);

// 4. Commit the batch
try
{
    await batch.CommitAsync();
    Console.WriteLine("Batch committed successfully.");
}
catch (Exception ex)
{
    Console.WriteLine($"Batch commit failed: {ex.Message}");
}
```

---

## Testing Strategy

-   **Unit Tests:** Mock the generated `Collection`, `QueryBuilder`, and `UpdateBuilder` classes (or their interfaces/base classes if suitable) using a mocking framework like Moq or NSubstitute. This allows you to test your application logic that *uses* the generated code without actually hitting Firestore. Test the logic within your services or view models.
-   **Integration Tests:** Use the **Firestore Emulator**.
    -   Set the `FIRESTORE_EMULATOR_HOST` environment variable (e.g., `127.0.0.1:8080`) before creating your `FirestoreDb` instance in your test setup.
    -   Use a testing framework like xUnit or NUnit.
    -   Instantiate your generated `Collection` classes using the emulator-connected `FirestoreDb`.
    -   Write tests that perform real Firestore operations (Add, Get, Query, Update, Delete, Listen) against the emulator and assert the results. Clear emulator data between test runs or test classes.
    -   This is the most reliable way to ensure your code interacts correctly with Firestore and the generated ODM layer. The `FireSchema.CS.Runtime.Tests` project within the runtime library's repository uses this approach extensively.