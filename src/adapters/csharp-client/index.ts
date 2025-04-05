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
  schema: ParsedFirestoreSchema,
  outputConfig: OutputTarget,
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
  let modelTemplate: string;
  try {
    const modelTemplatePath = path.join(__dirname, 'templates', 'model.ejs');
    modelTemplate = await fs.readFile(modelTemplatePath, 'utf-8');
    console.log(`Loaded model template from: ${modelTemplatePath}`);
  } catch (error: any) {
    console.error('Error loading C# model template:', error);
    throw error;
  }

  // --- Generate Model Files ---
  for (const collectionName in schema.collections) {
    const collectionSchema = schema.collections[collectionName];
    // Access the fields defined for the collection
    const fields = collectionSchema.fields || {};

    // Derive Model Name (e.g., 'users' -> 'UserData')
    const singularName = singularize(collectionName);
    const modelName = `${toPascalCase(singularName)}Data`;
    const modelFileName = `${modelName}.cs`;
    const modelFilePath = path.join(outputConfig.outputDir, modelFileName);

    const templateData = {
      namespace: targetNamespace,
      collectionName: collectionName,
      modelName: modelName,
      properties: fields, // Pass the fields object to the template
      // Add other necessary data for the template here
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
      throw error; // Re-throw to stop generation
    }
  }

  // --- TODO: Add generation for other file types (collection refs, query builders, etc.) ---

  console.log('C# client code generation (models only) complete.');
}