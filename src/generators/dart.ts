import fs from 'fs';
import path from 'path';
import ejs from 'ejs';
import { WhereFilterOp } from 'firebase/firestore'; // Use TS type for reference
import { FirestoreODMConfig, OutputTarget, DartOptions } from '../types/config';
import { ParsedFirestoreSchema, ParsedCollectionDefinition, ParsedFieldDefinition } from '../types/schema'; // Removed FieldType
import { capitalizeFirstLetter, camelToPascalCase, toSnakeCase } from '../utils/naming';
// Dart Runtime Imports (Placeholders - adjust paths/names as needed)
// import 'package:fireschema_dart_runtime/src/base_collection_ref.dart';
// import 'package:fireschema_dart_runtime/src/base_query_builder.dart';
// import 'package:fireschema_dart_runtime/src/base_update_builder.dart';

/**
 * Interface for pre-loaded Dart template strings.
 */
interface DartTemplateStrings {
    model: string;
    collectionRef: string;
    queryBuilder: string;
    updateBuilder: string;
}

/**
 * Generates Dart ODM code based on the provided schema and configuration.
 *
 * @param target The specific output target configuration for Dart.
 * @param schema The parsed Firestore schema definition.
 * @param config The global configuration object.
 */
export async function generateDart(target: OutputTarget, schema: ParsedFirestoreSchema, config: FirestoreODMConfig): Promise<void> {
  console.log(`Generating Dart code into ${target.outputDir}...`);
  const options = target.options as DartOptions || {}; // Add default options if needed

  // Load templates
  const modelTemplatePath = path.resolve(__dirname, '../../templates/dart/model.dart.ejs');
  const collectionRefTemplatePath = path.resolve(__dirname, '../../templates/dart/collectionRef.dart.ejs');
  const queryBuilderTemplatePath = path.resolve(__dirname, '../../templates/dart/queryBuilder.dart.ejs');
  const coreTemplatePath = path.resolve(__dirname, '../../templates/dart/core.dart.ejs');
  const updateBuilderTemplatePath = path.resolve(__dirname, '../../templates/dart/updateBuilder.dart.ejs');

  // Pre-load all templates
  if (!fs.existsSync(modelTemplatePath)) throw new Error(`Dart model template not found at: ${modelTemplatePath}`);
  if (!fs.existsSync(collectionRefTemplatePath)) throw new Error(`Dart collectionRef template not found at: ${collectionRefTemplatePath}`);
  if (!fs.existsSync(queryBuilderTemplatePath)) throw new Error(`Dart queryBuilder template not found at: ${queryBuilderTemplatePath}`);
  if (!fs.existsSync(coreTemplatePath)) throw new Error(`Dart core template not found at: ${coreTemplatePath}`);
  if (!fs.existsSync(updateBuilderTemplatePath)) throw new Error(`Dart updateBuilder template not found at: ${updateBuilderTemplatePath}`);

  // Explicitly set encoding when reading templates
  const templates: DartTemplateStrings = {
      model: fs.readFileSync(modelTemplatePath, 'utf-8'),
      collectionRef: fs.readFileSync(collectionRefTemplatePath, 'utf-8'),
      queryBuilder: fs.readFileSync(queryBuilderTemplatePath, 'utf-8'),
      updateBuilder: fs.readFileSync(updateBuilderTemplatePath, 'utf-8'),
  };
  const coreTemplate = fs.readFileSync(coreTemplatePath, 'utf-8'); // Core is separate

  // Generate files for each top-level collection
  for (const collectionId in schema.collections) {
    const collection = schema.collections[collectionId];
    // Pass templates object, not individual strings
    await generateFilesForDartCollection(collection, target.outputDir, options, templates);
  }

  // --- Generate Core Runtime File (COMMENTED OUT FOR RUNTIME REFACTOR) ---
  /* ... */

  // --- Generate pubspec.yaml (Optional) ---
  if (target.package) {
    try {
        const runtimePackageDir = path.resolve(process.cwd(), 'packages/fireschema_dart_runtime');
        const relativeRuntimePath = path.relative(target.outputDir, runtimePackageDir).replace(/\\/g, '/');

        const pubspecContent = `
name: ${target.package.name}
description: ${target.package.description || `Generated Firestore ODM for ${target.package.name}`}
version: ${target.package.version || '0.1.0'}
publish_to: none

environment:
  sdk: '>=2.17.0 <4.0.0'
  # flutter: '>=1.17.0' # Uncomment if needed

dependencies:
  # flutter: # Uncomment if needed
  #   sdk: flutter
  cloud_firestore: ^4.0.0 # Adjust version as needed
  fireschema_dart_runtime:
    path: ${relativeRuntimePath}
  # meta: ^1.8.0 # Add if using @required or similar annotations

dev_dependencies:
  # flutter_test: # Uncomment if needed
  #   sdk: flutter
  flutter_lints: ^2.0.0 # Example linter

# For information on the generic Dart part of this file, see
# https://dart.dev/tools/pub/pubspec
`.trimStart();

        const pubspecPath = path.join(target.outputDir, 'pubspec.yaml');
        await fs.promises.writeFile(pubspecPath, pubspecContent);
        console.log(`  ✓ Generated pubspec.yaml: ${pubspecPath}`);
    } catch (error: any) {
        console.error(`  ✗ Error generating pubspec.yaml: ${error.message}`);
        throw error;
    }
  }

  console.log(`Dart generation finished for ${target.outputDir}.`);
}


/**
 * Generates the necessary Dart files for a single collection and recursively calls itself for subcollections.
 */
async function generateFilesForDartCollection(
    collection: ParsedCollectionDefinition,
    outputBaseDir: string,
    options: DartOptions,
    templates: DartTemplateStrings, // Accept templates object
    parentPath: string = ''
): Promise<void> {
    const collectionId = collection.collectionId;
    const modelName = camelToPascalCase(collectionId);
    const fileNameBase = toSnakeCase(collectionId);
    const currentOutputDir = parentPath ? path.join(outputBaseDir, parentPath) : outputBaseDir;

    if (parentPath) {
        try {
            await fs.promises.mkdir(currentOutputDir, { recursive: true });
        } catch (err: any) {
            if (err.code !== 'EEXIST') throw err;
        }
    }

    console.log(`  Generating Dart files for collection: ${parentPath ? parentPath + '/' : ''}${collectionId}`);

    // Prepare data objects for templates
    const commonData = {
        modelName: modelName,
        fileNameBase: fileNameBase,
        collection: collection,
        options: options,
        // Pass helper functions needed by templates
        getDartType: (field: ParsedFieldDefinition) => getDartType(field, options), // Pass options
        capitalizeFirstLetter: capitalizeFirstLetter,
        camelToPascalCase: camelToPascalCase,
        toSnakeCase: toSnakeCase,
        parentPath: parentPath,
        isSubcollection: !!parentPath,
    };
    // Pass getDartQueryInfoForField helper
    const queryBuilderData = {
        ...commonData,
        getDartQueryInfoForField: (field: ParsedFieldDefinition) => getDartQueryInfoForField(field, options) // Pass options
    };
    const updateBuilderData = { ...commonData };
    const collectionRefData = { ...commonData };

    // Generate Model File
    try {
        // Pass the pre-read template string and data
        const renderedModel = ejs.render(templates.model, commonData);
        const modelFileName = `${fileNameBase}_data.dart`;
        const modelFilePath = path.join(currentOutputDir, modelFileName);
        await fs.promises.writeFile(modelFilePath, renderedModel);
        console.log(`    ✓ Generated model: ${modelFilePath}`);
    } catch (error: any) {
        console.error(`    ✗ Error generating model for collection "${collectionId}": ${error.message}`);
        throw error;
    }

    // Generate Collection Reference File
    try {
        const renderedCollectionRef = ejs.render(templates.collectionRef, collectionRefData);
        const collectionRefFileName = `${fileNameBase}_collection.dart`;
        const collectionRefFilePath = path.join(currentOutputDir, collectionRefFileName);
        await fs.promises.writeFile(collectionRefFilePath, renderedCollectionRef);
        console.log(`    ✓ Generated collection reference: ${collectionRefFilePath}`);
    } catch (error: any) {
        console.error(`    ✗ Error generating collection reference for collection "${collectionId}": ${error.message}`);
        throw error;
    }

    // Generate Query Builder File
    try {
        const renderedQueryBuilder = ejs.render(templates.queryBuilder, queryBuilderData);
        const queryBuilderFileName = `${fileNameBase}_query.dart`;
        const queryBuilderFilePath = path.join(currentOutputDir, queryBuilderFileName);
        await fs.promises.writeFile(queryBuilderFilePath, renderedQueryBuilder);
        console.log(`    ✓ Generated query builder: ${queryBuilderFilePath}`);
    } catch (error: any) {
        console.error(`    ✗ Error generating query builder for collection "${collectionId}": ${error.message}`);
        throw error;
    }

    // Generate Update Builder File
    try {
        const renderedUpdateBuilder = ejs.render(templates.updateBuilder, updateBuilderData);
        const updateBuilderFileName = `${fileNameBase}_update.dart`;
        const updateBuilderFilePath = path.join(currentOutputDir, updateBuilderFileName);
        await fs.promises.writeFile(updateBuilderFilePath, renderedUpdateBuilder);
        console.log(`    ✓ Generated update builder: ${updateBuilderFilePath}`);
    } catch (error: any) {
        console.error(`    ✗ Error generating update builder for collection "${collectionId}": ${error.message}`);
        throw error;
    }

    // --- Generate Subcollection Files (Recursive Call) ---
    if (collection.subcollections) {
        for (const subcollectionId in collection.subcollections) {
            const subcollection = collection.subcollections[subcollectionId];
            const subcollectionParentPath = parentPath
                ? `${parentPath}/${collectionId}`
                : `${collectionId}`;
            // Pass templates object down
            await generateFilesForDartCollection(subcollection, outputBaseDir, options, templates, subcollectionParentPath);
        }
    }
}

/**
 * Helper function to determine the Dart type string for a given field definition.
 */
function getDartType(field: ParsedFieldDefinition, options: DartOptions): string {
    const safeOptions = options || {};
    switch (field.type) {
      case 'string': return 'String';
      case 'number': return 'num';
      case 'boolean': return 'bool';
      case 'timestamp': return 'Timestamp';
      case 'geopoint': return 'GeoPoint';
      case 'reference':
        // const refModelName = field.referenceTo ? camelToPascalCase(field.referenceTo) + 'Data' : 'DocumentSnapshot';
        return `DocumentReference<Map<String, dynamic>>`;
      case 'array':
        if (!field.items) return 'List<dynamic>';
        return `List<${getDartType(field.items, safeOptions)}>`; // Pass safeOptions
      case 'map':
        if (!field.properties) return 'Map<String, dynamic>';
        // TODO: Generate typed map class
        return 'Map<String, dynamic>';
      default: return 'dynamic';
    }
}

// Map Firestore query operators to Dart query method parameter names
const dartQueryOpMap: { [key in WhereFilterOp]?: string } = {
    '==': 'isEqualTo', '!=': 'isNotEqualTo',
    '<': 'isLessThan', '<=': 'isLessThanOrEqualTo',
    '>': 'isGreaterThan', '>=': 'isGreaterThanOrEqualTo',
    'array-contains': 'arrayContains', 'array-contains-any': 'arrayContainsAny',
    'in': 'whereIn', 'not-in': 'whereNotIn',
};

/**
 * Returns an array of valid Dart query parameter details for a given field.
 */
function getDartQueryInfoForField(field: ParsedFieldDefinition, options: DartOptions): Array<{ paramName: string, valueType: string }> {
    const safeOptions = options || {};
    const valueType = getDartType(field, safeOptions); // Pass safeOptions
    let validOps: WhereFilterOp[];

    switch (field.type) {
        case 'string': case 'number': case 'boolean': case 'timestamp':
        case 'geopoint': case 'reference':
            validOps = ['==', '!=', '<', '<=', '>', '>=', 'in', 'not-in'];
            break;
        case 'array':
            validOps = ['array-contains', 'array-contains-any', 'in', 'not-in'];
            break;
        case 'map':
            validOps = ['==', '!=', 'in', 'not-in'];
            break;
        default: validOps = [];
    }

    const queryInfos: Array<{ paramName: string, valueType: string }> = [];
    for (const op of validOps) {
        const paramName = dartQueryOpMap[op];
        if (!paramName) continue;

        let specificValueType = valueType;
        if (paramName === 'arrayContains') {
             specificValueType = field.items ? getDartType(field.items, safeOptions) : 'dynamic'; // Pass safeOptions
        } else if (paramName === 'arrayContainsAny' || paramName === 'whereIn' || paramName === 'whereNotIn') {
             const itemType = field.items ? getDartType(field.items, safeOptions) : 'dynamic'; // Pass safeOptions
             specificValueType = field.type === 'array' ? `List<${valueType}>` : `List<${itemType}>`;
        } else if (field.type !== 'array' && (paramName === 'whereIn' || paramName === 'whereNotIn')) {
             specificValueType = `List<${valueType}>`;
        }

        const isNullable = !field.required && !specificValueType.startsWith('List<');
        queryInfos.push({ paramName: paramName, valueType: `${specificValueType}${isNullable ? '?' : ''}` });
    }
    return queryInfos;
}