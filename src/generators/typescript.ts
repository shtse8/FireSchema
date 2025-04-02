import fs from 'fs';
import path from 'path';
import ejs from 'ejs';
import { Timestamp, GeoPoint, DocumentReference, DocumentData, WhereFilterOp } from 'firebase/firestore'; // Import Firestore types
import { FirestoreODMConfig, OutputTarget, TypeScriptOptions } from '../types/config';
import { ParsedFirestoreSchema, ParsedCollectionDefinition, ParsedFieldDefinition, FieldType } from '../types/schema';
import { capitalizeFirstLetter, camelToPascalCase } from '../utils/naming';
// Runtime Imports (adjust path as needed for monorepo structure)
import { BaseCollectionRef, CollectionSchema, FieldSchema } from '@shtse8/fireschema-runtime'; // Assuming runtime is linked/built
import { BaseQueryBuilder } from '@shtse8/fireschema-runtime';
import { BaseUpdateBuilder } from '@shtse8/fireschema-runtime';

interface TemplateStrings {
    model: string;
    collectionRef: string;
    queryBuilder: string;
    updateBuilder: string;
}

/**
 * Generates TypeScript ODM code based on the provided schema and configuration.
 *
 * @param target The specific output target configuration for TypeScript.
 * @param schema The parsed Firestore schema definition.
 * @param config The global configuration object.
 */
export async function generateTypeScript(target: OutputTarget, schema: ParsedFirestoreSchema, config: FirestoreODMConfig): Promise<void> {
  console.log(`Generating TypeScript code into ${target.outputDir}...`);
  const options = target.options as TypeScriptOptions || {}; // Add default options if needed

  // Load templates
  const modelTemplatePath = path.resolve(__dirname, '../../templates/typescript/model.ejs');
  const collectionRefTemplatePath = path.resolve(__dirname, '../../templates/typescript/collectionRef.ejs');
  const queryBuilderTemplatePath = path.resolve(__dirname, '../../templates/typescript/queryBuilder.ejs');
  const coreTemplatePath = path.resolve(__dirname, '../../templates/typescript/core.ejs');
  const updateBuilderTemplatePath = path.resolve(__dirname, '../../templates/typescript/updateBuilder.ejs');

  // Pre-load all templates
  if (!fs.existsSync(modelTemplatePath)) {
    throw new Error(`TypeScript model template not found at: ${modelTemplatePath}`);
  }
  if (!fs.existsSync(collectionRefTemplatePath)) {
    throw new Error(`TypeScript collectionRef template not found at: ${collectionRefTemplatePath}`);
  }
  if (!fs.existsSync(queryBuilderTemplatePath)) {
    throw new Error(`TypeScript queryBuilder template not found at: ${queryBuilderTemplatePath}`);
  }
  if (!fs.existsSync(coreTemplatePath)) {
    throw new Error(`TypeScript core template not found at: ${coreTemplatePath}`);
  }
  if (!fs.existsSync(updateBuilderTemplatePath)) {
    throw new Error(`TypeScript updateBuilder template not found at: ${updateBuilderTemplatePath}`);
  }

  const templates: TemplateStrings = {
      model: fs.readFileSync(modelTemplatePath, 'utf-8'),
      collectionRef: fs.readFileSync(collectionRefTemplatePath, 'utf-8'),
      queryBuilder: fs.readFileSync(queryBuilderTemplatePath, 'utf-8'),
      updateBuilder: fs.readFileSync(updateBuilderTemplatePath, 'utf-8'),
  };
  const coreTemplate = fs.readFileSync(coreTemplatePath, 'utf-8'); // Core is separate

  // Generate files for each collection
  for (const collectionId in schema.collections) {
    const collection = schema.collections[collectionId];
    await generateFilesForCollection(collection, target.outputDir, options, templates);
  }

  // --- Generate Core Runtime File (Placeholder - COMMENTED OUT FOR RUNTIME REFACTOR) ---
  /*
  if (options.generateCore !== false) { // Default to true
    try {
        // Core template might not need specific data for now
        const renderedCore = ejs.render(coreTemplate, {});
        const coreFileName = `core.ts`; // Naming convention
        const coreFilePath = path.join(target.outputDir, coreFileName);
        await fs.promises.writeFile(coreFilePath, renderedCore);
        console.log(`  ✓ Generated core runtime library: ${coreFilePath}`);
    } catch (error: any) {
        console.error(`  ✗ Error generating core runtime library: ${error.message}`);
    }
  }
  */

  // --- Generate package.json (Optional) ---
  if (target.package) {
    try {
        // Define the full desired package.json structure, including test setup
        const packageJsonContent = {
            name: target.package.name,
            version: target.package.version || '0.1.0',
            description: target.package.description || `Generated Firestore ODM for ${target.package.name}`,
            "type": "module", // Add type: module
            "main": "./dist/index.js", // Add main entry point
            "types": "./dist/index.d.ts", // Add types entry point
            scripts: {
              "clean": "npx rimraf dist", // Add clean script
              "build": "bun run clean && tsc -b", // Add build script
              "test": "jest" // Keep existing test script (or change to bun test if preferred)
            },
            peerDependencies: {
                "firebase": "^9.0.0 || ^10.0.0 || ^11.0.0", // Keep updated range
                "@fireschema/ts-runtime": "^0.1.0"
            },
            devDependencies: { // Ensure devDependencies section exists
              "@types/jest": "^29.5.14", // Use versions consistent with previous setup
              "firebase": "^10.12.4",
              "jest": "^29.7.0",
              "ts-jest": "^29.3.1",
              "typescript": "^5.0.0"
            }
        };
        // Always overwrite with the full desired content, including test setup
        const packageJsonPath = path.join(target.outputDir, 'package.json');
        await fs.promises.writeFile(packageJsonPath, JSON.stringify(packageJsonContent, null, 2));
        console.log(`  ✓ Generated/Updated package.json: ${packageJsonPath}`);
    } catch (error: any) {
        console.error(`  ✗ Error generating package.json: ${error.message}`);
    }
  }

  console.log(`TypeScript generation finished for ${target.outputDir}.`);
}


/**
 * Generates the necessary files for a single collection and recursively calls itself for subcollections.
 *
 * @param collection The parsed definition of the collection.
 * @param outputBaseDir The base directory for the current language output.
 * @param options TypeScript generation options.
 * @param templates Pre-loaded template strings.
 * @param parentPath Optional path prefix for subcollections (e.g., 'users/{userId}').
 */
async function generateFilesForCollection(
    collection: ParsedCollectionDefinition,
    outputBaseDir: string,
    options: TypeScriptOptions,
    templates: TemplateStrings,
    parentPath: string = '' // Base path for top-level collections
): Promise<void> {
    const collectionId = collection.collectionId;
    const modelName = camelToPascalCase(collectionId);
    // Determine output directory for this specific collection (potentially nested)
    const currentOutputDir = parentPath ? path.join(outputBaseDir, parentPath) : outputBaseDir;
    // Ensure nested directory exists (needed before writing files)
    if (parentPath) {
        await fs.promises.mkdir(currentOutputDir, { recursive: true });
    }

    console.log(`  Generating files for collection: ${parentPath ? parentPath + '/' : ''}${collectionId}`);

    // Prepare data objects for templates
    const commonData = {
        modelName: modelName,
        collection: collection,
        options: options,
        getTypeScriptType: getTypeScriptType,
        capitalizeFirstLetter: capitalizeFirstLetter,
        camelToPascalCase: camelToPascalCase, // Pass helper to templates
        // Add parentPath or other context if needed by templates
        isSubcollection: !!parentPath,
    };
    const queryBuilderData = { ...commonData, getQueryInfoForField: getQueryInfoForField };
    const updateBuilderData = { ...commonData }; // Might need specific helpers later

    const collectionRefData = {
        ...commonData,
        parentPath: parentPath, // Pass the full collection definition for schema access
    };

    // Generate Model File
    try {
        const renderedModel = ejs.render(templates.model, commonData);
        const modelFileName = `${collectionId}.types.ts`;
        const modelFilePath = path.join(currentOutputDir, modelFileName);
        await fs.promises.writeFile(modelFilePath, renderedModel);
        console.log(`    ✓ Generated model: ${modelFilePath}`);
    } catch (error: any) {
        console.error(`    ✗ Error generating model for collection "${collectionId}": ${error.message}`);
    }

    // Generate Collection Reference File
    try {
        // TODO: Pass subcollection info to collectionRefData if needed by template
        const renderedCollectionRef = ejs.render(templates.collectionRef, collectionRefData);
        const collectionRefFileName = `${collectionId}.collection.ts`;
        const collectionRefFilePath = path.join(currentOutputDir, collectionRefFileName);
        await fs.promises.writeFile(collectionRefFilePath, renderedCollectionRef);
        console.log(`    ✓ Generated collection reference: ${collectionRefFilePath}`);
    } catch (error: any) {
        console.error(`    ✗ Error generating collection reference for collection "${collectionId}": ${error.message}`);
    }

    // Generate Query Builder File
    try {
        const renderedQueryBuilder = ejs.render(templates.queryBuilder, queryBuilderData);
        const queryBuilderFileName = `${collectionId}.query.ts`;
        const queryBuilderFilePath = path.join(currentOutputDir, queryBuilderFileName);
        await fs.promises.writeFile(queryBuilderFilePath, renderedQueryBuilder);
        console.log(`    ✓ Generated query builder: ${queryBuilderFilePath}`);
    } catch (error: any) {
        console.error(`    ✗ Error generating query builder for collection "${collectionId}": ${error.message}`);
    }

    // Generate Update Builder File
    try {
        const renderedUpdateBuilder = ejs.render(templates.updateBuilder, updateBuilderData);
        const updateBuilderFileName = `${collectionId}.update.ts`;
        const updateBuilderFilePath = path.join(currentOutputDir, updateBuilderFileName);
        await fs.promises.writeFile(updateBuilderFilePath, renderedUpdateBuilder);
        console.log(`    ✓ Generated update builder: ${updateBuilderFilePath}`);
    } catch (error: any) {
        console.error(`    ✗ Error generating update builder for collection "${collectionId}": ${error.message}`);
    }

    // --- Generate Subcollection Files (Recursive Call) ---
    if (collection.subcollections) {
        for (const subcollectionId in collection.subcollections) {
            const subcollection = collection.subcollections[subcollectionId];
            // Construct the path for the subcollection output
            const subcollectionParentPath = parentPath
                ? `${parentPath}/${collectionId}/{${collectionId}Id}` // Nested subcollection path
                : `${collectionId}/{${collectionId}Id}`; // Top-level subcollection path
            // Recursively generate files for the subcollection
            await generateFilesForCollection(subcollection, outputBaseDir, options, templates, subcollectionParentPath);
        }
    }
}

/**
 * Helper function to determine the TypeScript type string for a given field definition.
 * Passed to EJS templates.
 */
function getTypeScriptType(field: ParsedFieldDefinition, options: TypeScriptOptions): string {
  switch (field.type) {
    case 'string':
      return 'string';
    case 'number':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'timestamp':
      // Handle dateTimeType option from config
      return options.dateTimeType === 'Date' ? 'Date' : 'Timestamp';
    case 'geopoint':
      return 'GeoPoint'; // from 'firebase/firestore'
    case 'reference':
      // Generate DocumentReference<ModelData> or DocumentReference<DocumentData>
      const referencedModelName = field.referenceTo ? `${camelToPascalCase(field.referenceTo)}Data` : null;
      // We assume the referenced type 'ModelData' will be generated and available for import.
      // If referenceTo is missing (schema validation should prevent this), fallback to DocumentData.
      return `DocumentReference<${referencedModelName || 'DocumentData'}>`;
    case 'array':
      if (!field.items) return 'any[]'; // Should be caught by validation
      // TODO: Handle nested arrays?
      return `${getTypeScriptType(field.items, options)}[]`;
    case 'map':
       if (!field.properties) return 'Record<string, any>'; // Should be caught by validation
       // Generate an inline type for simple maps or reference a generated interface for complex ones?
       const properties = Object.entries(field.properties)
         .map(([key, propDef]) => `${key}${propDef.required ? '' : '?'}: ${getTypeScriptType(propDef, options)}`)
         .join('; ');
       return `{ ${properties} }`;
    default:
      // Should not happen if schema validation is correct
      console.warn(`Unknown field type encountered: ${field.type}. Defaulting to 'any'.`);
      return 'any';
  }
}

/**
 * Returns an array of valid query operator details (operator and expected value type) for a given field.
 */
function getQueryInfoForField(field: ParsedFieldDefinition, options: TypeScriptOptions): Array<{ op: WhereFilterOp, valueType: string }> {
    const valueType = getTypeScriptType(field, options);
    let validOps: WhereFilterOp[];

    // Based on Firestore documentation for valid query operators per type
    switch (field.type) {
        case 'string':
        case 'number':
        case 'boolean':
        case 'timestamp':
        case 'geopoint': // GeoPoint queries are complex (geoqueries), not simple operators
        case 'reference':
            validOps = ['==', '!=', '<', '<=', '>', '>=', 'in', 'not-in'];
            break;
        case 'array':
            // Firestore allows 'array-contains', 'array-contains-any', 'in', 'not-in' for arrays.
            // Note: 'in'/'not-in' check if the *entire* array field is one of the values provided.
            validOps = ['array-contains', 'array-contains-any', 'in', 'not-in'];
            break;
        case 'map':
            // Direct querying on maps uses dot notation in field paths, handled by 'where' string arg.
            // Equality checks are possible. Inequality/range on maps isn't standard.
            validOps = ['==', '!=', 'in', 'not-in']; // Limited ops for direct map equality
            break;
        default:
            validOps = []; // Should not happen
    }

    // Determine the specific value type required for each valid operator
    const queryInfos: Array<{ op: WhereFilterOp, valueType: string }> = [];

    for (const op of validOps) {
        let specificValueType = valueType;
 // Default to the field's base type

        if (op === 'in' || op === 'not-in') {
            specificValueType = `${valueType}[]`;
        } else if (field.type === 'array') {
            const itemType = field.items ? getTypeScriptType(field.items, options) : 'any';
            if (op === 'array-contains') {
                specificValueType = itemType;
            } else if (op === 'array-contains-any') {
                specificValueType = `${itemType}[]`;
            }
            // 'in'/'not-in' for arrays check against the whole array, so valueType[] is correct from above
        }


        queryInfos.push({ op: op, valueType: specificValueType });
    }

    return queryInfos;
}