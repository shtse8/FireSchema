import path from 'path';
import fs from 'fs/promises';
import ejs from 'ejs';
import { ParsedFirestoreSchema } from '../../types/schema';
import { OutputTarget } from '../../types/config';
// import { format } from 'prettier'; // TODO: Consider adding C# formatting later if needed

// Placeholder for C# specific options if needed in the future
interface CSharpClientOptions {
  namespace?: string;
  // Add other C# specific options here
}

// Simple helper for PascalCase conversion
function toPascalCase(str: string): string {
    if (!str) return '';
    // Handle potential separators like '-' or '_'
    return str.replace(/[-_](\w)/g, (_, c) => c.toUpperCase())
              .replace(/^./, (c) => c.toUpperCase());
}

// Simple singularization (very basic, might need improvement)
function singularize(name: string): string {
    if (name.endsWith('ies')) {
        return name.substring(0, name.length - 3) + 'y';
    }
    if (name.endsWith('s') && !name.endsWith('ss')) { // Avoid changing 'address' to 'addres'
        return name.substring(0, name.length - 1);
    }
    return name;
}

/**
 * Generates C# client-side code based on the provided schema and configuration.
 *
 * @param schema The parsed Firestore schema.
 * @param outputConfig The specific output configuration for this target.
 * @param globalConfig The global configuration object (optional).
 */
export async function generate(
  // Correct parameter order to match the call in generator.ts
  outputConfig: OutputTarget,
  schema: ParsedFirestoreSchema,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  globalConfig?: any, // Keep signature consistent, even if not used initially
): Promise<void> {
  console.log(`Generating C# client code for ${outputConfig.outputDir}...`);

  const options = outputConfig.options as CSharpClientOptions;
  const targetNamespace = options.namespace || 'Generated.Firestore'; // Default namespace

  // --- Ensure output directory exists ---
  try {
    await fs.mkdir(outputConfig.outputDir, { recursive: true });
  } catch (error: any) {
    console.error(`Error creating output directory ${outputConfig.outputDir}:`, error);
    throw error; // Re-throw to stop generation
  }

  // --- Load Templates ---
  let modelTemplate: string, collectionRefTemplate: string, queryBuilderTemplate: string, updateBuilderTemplate: string;
  try {
    const modelTemplatePath = path.join(__dirname, 'templates', 'model.ejs');
    const collectionRefTemplatePath = path.join(__dirname, 'templates', 'collectionRef.ejs');
    const queryBuilderTemplatePath = path.join(__dirname, 'templates', 'queryBuilder.ejs');
    const updateBuilderTemplatePath = path.join(__dirname, 'templates', 'updateBuilder.ejs'); // Load new template
    [modelTemplate, collectionRefTemplate, queryBuilderTemplate, updateBuilderTemplate] = await Promise.all([
        fs.readFile(modelTemplatePath, 'utf-8'),
        fs.readFile(collectionRefTemplatePath, 'utf-8'),
        fs.readFile(queryBuilderTemplatePath, 'utf-8'),
        fs.readFile(updateBuilderTemplatePath, 'utf-8') // Read new template
    ]);
    console.log(`Loaded templates: model, collectionRef, queryBuilder, updateBuilder`);
  } catch (error: any) {
    console.error('Error loading C# templates:', error);
    throw error;
  }

  // --- Generate Files per Collection ---
  for (const collectionName in schema.collections) {
    const collectionSchema = schema.collections[collectionName];
    // Access the fields defined for the collection
    const fields = collectionSchema.fields || {};
    const subcollections = collectionSchema.subcollections || {};
    const collectionPath = collectionName; // Assuming root collection path is just the name for now

    // Derive Model Name (e.g., 'users' -> 'UserData')
    const singularName = singularize(collectionName);
    const modelName = `${toPascalCase(singularName)}Data`;
    const modelFileName = `${modelName}.cs`;
    const modelFilePath = path.join(outputConfig.outputDir, modelFileName);

    const templateData = {
      namespace: targetNamespace,
      collectionName: collectionName,
      modelName: modelName,
      properties: fields,
      // No subcollection data needed for model template
    };

    console.log(`Rendering model for ${collectionName} -> ${modelFileName}`);
    let generatedCode: string;
    try {
      generatedCode = ejs.render(modelTemplate, templateData);
    } catch (error: any) {
      console.error(`Error rendering EJS template for ${modelName}:`, error);
      throw new Error(`EJS rendering failed for ${modelName}: ${error.message}`);
    }

    // TODO: Add C# formatting step later if possible and necessary
    // For now, write the raw generated code

    try {
      await fs.writeFile(modelFilePath, generatedCode, 'utf-8');
      console.log(`Successfully wrote model file: ${modelFilePath}`);
    } catch (error: any) {
      console.error(`Error writing model file ${modelFilePath}:`, error);
      throw error; // Re-throw to stop generation for this model
    }

    // --- Generate CollectionRef File ---
    const collectionPascalName = toPascalCase(collectionName);
    const collectionRefName = `${collectionPascalName}CollectionRef`;
    const collectionRefFileName = `${collectionRefName}.cs`;
    const collectionRefFilePath = path.join(outputConfig.outputDir, collectionRefFileName);

    const collectionRefData = {
        namespace: targetNamespace,
        collectionName: collectionName,
        collectionPath: collectionPath, // Pass the determined path
        modelName: modelName,
        subcollections: subcollections, // Pass subcollection definitions
    };

    console.log(`Rendering collectionRef for ${collectionName} -> ${collectionRefFileName}`);
    let generatedCollectionRefCode: string;
    try {
        generatedCollectionRefCode = ejs.render(collectionRefTemplate, collectionRefData);
    } catch (error: any) {
        console.error(`Error rendering EJS template for ${collectionRefName}:`, error);
        throw new Error(`EJS rendering failed for ${collectionRefName}: ${error.message}`);
    }

    try {
        await fs.writeFile(collectionRefFilePath, generatedCollectionRefCode, 'utf-8');
        console.log(`Successfully wrote collectionRef file: ${collectionRefFilePath}`);
    } catch (error: any) {
        console.error(`Error writing collectionRef file ${collectionRefFilePath}:`, error);
        throw error; // Re-throw to stop generation for this collection ref
    }

    // --- Generate QueryBuilder File ---
    const queryBuilderName = `${collectionPascalName}QueryBuilder`;
    const queryBuilderFileName = `${queryBuilderName}.cs`;
    const queryBuilderFilePath = path.join(outputConfig.outputDir, queryBuilderFileName);

    const queryBuilderData = {
        namespace: targetNamespace,
        collectionName: collectionName,
        modelName: modelName,
        properties: fields, // Pass fields for generating typed Where/OrderBy methods
    };

    console.log(`Rendering queryBuilder for ${collectionName} -> ${queryBuilderFileName}`);
    let generatedQueryBuilderCode: string;
    try {
        generatedQueryBuilderCode = ejs.render(queryBuilderTemplate, queryBuilderData);
    } catch (error: any) {
        console.error(`Error rendering EJS template for ${queryBuilderName}:`, error);
        throw new Error(`EJS rendering failed for ${queryBuilderName}: ${error.message}`);
    }

    try {
        await fs.writeFile(queryBuilderFilePath, generatedQueryBuilderCode, 'utf-8');
        console.log(`Successfully wrote queryBuilder file: ${queryBuilderFilePath}`);
    } catch (error: any) {
        console.error(`Error writing queryBuilder file ${queryBuilderFilePath}:`, error);
        throw error; // Re-throw to stop generation for this query builder
    }

    // --- Generate UpdateBuilder File ---
    const updateBuilderName = `${collectionPascalName}UpdateBuilder`;
    const updateBuilderFileName = `${updateBuilderName}.cs`;
    const updateBuilderFilePath = path.join(outputConfig.outputDir, updateBuilderFileName);

    const updateBuilderData = {
        namespace: targetNamespace,
        collectionName: collectionName,
        modelName: modelName,
        properties: fields, // Pass fields for generating typed Set methods etc.
    };

    console.log(`Rendering updateBuilder for ${collectionName} -> ${updateBuilderFileName}`);
    let generatedUpdateBuilderCode: string;
    try {
        generatedUpdateBuilderCode = ejs.render(updateBuilderTemplate, updateBuilderData);
    } catch (error: any) {
        console.error(`Error rendering EJS template for ${updateBuilderName}:`, error);
        throw new Error(`EJS rendering failed for ${updateBuilderName}: ${error.message}`);
    }

    try {
        await fs.writeFile(updateBuilderFilePath, generatedUpdateBuilderCode, 'utf-8');
        console.log(`Successfully wrote updateBuilder file: ${updateBuilderFilePath}`);
    } catch (error: any) {
        console.error(`Error writing updateBuilder file ${updateBuilderFilePath}:`, error);
        throw error; // Re-throw to stop generation for this update builder
    }


  } // End loop through collections

  // --- TODO: Add generation for other file types if needed ---

  console.log('C# client code generation (models, collectionRefs, queryBuilders, updateBuilders) complete.');
}