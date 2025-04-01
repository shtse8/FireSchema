import fs from 'fs';
import path from 'path';
import ejs from 'ejs';
import { WhereFilterOp } from 'firebase/firestore'; // Use TS type for reference
import { FirestoreODMConfig, OutputTarget, DartOptions } from '../types/config';
import { ParsedFirestoreSchema, ParsedCollectionDefinition, ParsedFieldDefinition, FieldType } from '../types/schema';
import { capitalizeFirstLetter, camelToPascalCase, toSnakeCase } from '../utils/naming';

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
  if (!fs.existsSync(modelTemplatePath)) {
    throw new Error(`Dart model template not found at: ${modelTemplatePath}`);
  }
  if (!fs.existsSync(collectionRefTemplatePath)) {
    throw new Error(`Dart collectionRef template not found at: ${collectionRefTemplatePath}`);
  }
  if (!fs.existsSync(queryBuilderTemplatePath)) {
    throw new Error(`Dart queryBuilder template not found at: ${queryBuilderTemplatePath}`);
  }
  if (!fs.existsSync(coreTemplatePath)) {
    throw new Error(`Dart core template not found at: ${coreTemplatePath}`);
  }
  if (!fs.existsSync(updateBuilderTemplatePath)) {
    throw new Error(`Dart updateBuilder template not found at: ${updateBuilderTemplatePath}`);
  }

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
    await generateFilesForDartCollection(collection, target.outputDir, options, templates);
  }

  // --- Generate Core Runtime File ---
  if (options.generateCore !== false) { // Default to true
    try {
        const renderedCore = ejs.render(coreTemplate, {});
        const coreFileName = `firestore_odm_core.dart`; // Naming convention
        const coreFilePath = path.join(target.outputDir, coreFileName);
        await fs.promises.writeFile(coreFilePath, renderedCore);
        console.log(`  ✓ Generated core runtime library: ${coreFilePath}`);
    } catch (error: any) {
        console.error(`  ✗ Error generating core runtime library: ${error.message}`);
    }
  }

  // --- Generate pubspec.yaml (Optional) ---
  if (target.package) {
    console.log(`  - Placeholder: Generate pubspec.yaml`);
    // TODO: Create pubspec.yaml content based on target.package info
  }

  console.log(`Dart generation finished for ${target.outputDir}.`);
}


/**
 * Generates the necessary Dart files for a single collection and recursively calls itself for subcollections.
 *
 * @param collection The parsed definition of the collection.
 * @param outputBaseDir The base directory for the current language output.
 * @param options Dart generation options.
 * @param templates Pre-loaded Dart template strings.
 * @param parentPath Optional path prefix for subcollections (e.g., 'users'). Used for directory structure.
 */
async function generateFilesForDartCollection(
    collection: ParsedCollectionDefinition,
    outputBaseDir: string,
    options: DartOptions,
    templates: DartTemplateStrings,
    parentPath: string = '' // Base path for top-level collections
): Promise<void> {
    const collectionId = collection.collectionId;
    const modelName = camelToPascalCase(collectionId);
    const fileNameBase = toSnakeCase(collectionId);
    // Determine output directory for this specific collection (potentially nested)
    const currentOutputDir = parentPath ? path.join(outputBaseDir, parentPath) : outputBaseDir;
    // Ensure nested directory exists
    if (parentPath) {
        // Create directory if it doesn't exist, handling potential race conditions safely
        try {
            await fs.promises.mkdir(currentOutputDir, { recursive: true });
        } catch (err: any) {
            // Ignore error if directory already exists, re-throw otherwise
            if (err.code !== 'EEXIST') {
                throw err;
            }
        }
    }


    console.log(`  Generating Dart files for collection: ${parentPath ? parentPath + '/' : ''}${collectionId}`);

    // Prepare data objects for templates
    const commonData = {
        modelName: modelName,
        collection: collection,
        options: options,
        getDartType: getDartType,
        capitalizeFirstLetter: capitalizeFirstLetter,
        camelToPascalCase: camelToPascalCase,
        toSnakeCase: toSnakeCase,
        parentPath: parentPath, // Pass parentPath for context if needed by templates
        isSubcollection: !!parentPath,
    };
    const queryBuilderData = { ...commonData, getDartQueryInfoForField: getDartQueryInfoForField };
    const updateBuilderData = { ...commonData };
    const collectionRefData = { ...commonData }; // Pass parentPath here too

    // Generate Model File
    try {
        const renderedModel = ejs.render(templates.model, commonData);
        const modelFileName = `${fileNameBase}_data.dart`;
        const modelFilePath = path.join(currentOutputDir, modelFileName);
        await fs.promises.writeFile(modelFilePath, renderedModel);
        console.log(`    ✓ Generated model: ${modelFilePath}`);
    } catch (error: any) {
        console.error(`    ✗ Error generating model for collection "${collectionId}": ${error.message}`);
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
    }

    // --- Generate Subcollection Files (Recursive Call) ---
    if (collection.subcollections) {
        for (const subcollectionId in collection.subcollections) {
            const subcollection = collection.subcollections[subcollectionId];
            // Construct the path for the subcollection output (Dart uses simple nesting based on parent collection ID)
            const subcollectionParentPath = parentPath
                ? `${parentPath}/${collectionId}` // Nested subcollection path
                : `${collectionId}`; // Top-level subcollection path
            await generateFilesForDartCollection(subcollection, outputBaseDir, options, templates, subcollectionParentPath);
        }
    }
}

/**
 * Helper function to determine the Dart type string for a given field definition.
 */
function getDartType(field: ParsedFieldDefinition, options: DartOptions): string {
    // TODO: Add option for DateTime vs Timestamp
    switch (field.type) {
      case 'string': return 'String';
      case 'number': return 'num'; // Or double/int based on further schema info?
      case 'boolean': return 'bool';
      case 'timestamp': return 'Timestamp'; // from cloud_firestore
      case 'geopoint': return 'GeoPoint'; // from cloud_firestore
      case 'reference':
        const refModelName = field.referenceTo ? camelToPascalCase(field.referenceTo) + 'Data' : 'DocumentSnapshot';
        // Assuming the target model class (e.g., UserData) exists and is imported.
        // DocumentReference itself isn't generic in the same way in Dart firestore client.
        // We type the CollectionReference and Query, but DocumentReference often remains dynamic.
        // For stronger typing, one might use `DocumentReference<Map<String, dynamic>>` or a custom wrapper.
        // Let's return a reasonable type for now.
        return `DocumentReference<Map<String, dynamic>>`; // Or DocumentReference?
      case 'array':
        if (!field.items) return 'List<dynamic>';
        return `List<${getDartType(field.items, options)}>`;
      case 'map':
        if (!field.properties) return 'Map<String, dynamic>';
        // TODO: Generate typed map class if possible/desired
        return 'Map<String, dynamic>';
      default: return 'dynamic';
    }
}

// Map Firestore query operators to Dart query method parameter names
const dartQueryOpMap: { [key in WhereFilterOp]?: string } = {
    '==': 'isEqualTo',
    '!=': 'isNotEqualTo',
    '<': 'isLessThan',
    '<=': 'isLessThanOrEqualTo',
    '>': 'isGreaterThan',
    '>=': 'isGreaterThanOrEqualTo',
    'array-contains': 'arrayContains',
    'array-contains-any': 'arrayContainsAny',
    'in': 'whereIn',
    'not-in': 'whereNotIn',
};

/**
 * Returns an array of valid Dart query parameter details for a given field.
 */
function getDartQueryInfoForField(field: ParsedFieldDefinition, options: DartOptions): Array<{ paramName: string, valueType: string }> {
    const valueType = getDartType(field, options);
    let validOps: WhereFilterOp[];

    // Determine valid Firestore operators based on field type
    switch (field.type) {
        case 'string':
        case 'number':
        case 'boolean':
        case 'timestamp':
        case 'geopoint':
        case 'reference':
            validOps = ['==', '!=', '<', '<=', '>', '>=', 'in', 'not-in'];
            break;
        case 'array':
            validOps = ['array-contains', 'array-contains-any', 'in', 'not-in'];
            break;
        case 'map':
            validOps = ['==', '!=', 'in', 'not-in']; // Limited ops for direct map equality
            break;
        default:
            validOps = [];
    }

    const queryInfos: Array<{ paramName: string, valueType: string }> = [];

    for (const op of validOps) {
        const paramName = dartQueryOpMap[op];
        if (!paramName) continue; // Skip if no corresponding Dart parameter

        let specificValueType = valueType; // Default type

        // Adjust type based on operator for Dart
        if (paramName === 'arrayContains') {
             specificValueType = field.items ? getDartType(field.items, options) : 'dynamic';
        } else if (paramName === 'arrayContainsAny' || paramName === 'whereIn' || paramName === 'whereNotIn') {
             const itemType = field.items ? getDartType(field.items, options) : 'dynamic';
             // whereIn/notIn on array fields compares the whole array
             specificValueType = field.type === 'array' ? `List<${valueType}>` : `List<${itemType}>`;
        }
        // For non-array fields, whereIn/notIn expect List<FieldType>
        else if (field.type !== 'array' && (paramName === 'whereIn' || paramName === 'whereNotIn')) {
             specificValueType = `List<${valueType}>`;
        }

        // Ensure nullability matches field definition for non-list types
        const isNullable = !field.required && !specificValueType.startsWith('List<');
        queryInfos.push({ paramName: paramName, valueType: `${specificValueType}${isNullable ? '?' : ''}` });
    }

    return queryInfos;
}