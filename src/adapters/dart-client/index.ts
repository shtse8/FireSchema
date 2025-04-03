import fs from 'fs';
import path from 'path';
import ejs from 'ejs';
import type { WhereFilterOp } from 'firebase/firestore'; // Use TS type for reference
import { FirestoreODMConfig, OutputTarget } from '../../types/config'; // Adjusted import path
import { ParsedFirestoreSchema, ParsedCollectionDefinition, ParsedFieldDefinition } from '../../types/schema'; // Adjusted import path
import { capitalizeFirstLetter, camelToPascalCase, toSnakeCase } from '../../utils/naming'; // Adjusted import path

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
 * Generates Dart Client ODM code.
 */
export async function generate(target: OutputTarget, schema: ParsedFirestoreSchema, config: FirestoreODMConfig): Promise<void> {
  console.log(` -> Running Dart Client Adapter...`);
  const options = target.options || {};

  // --- Target Validation (Adapter Specific) ---
  if (target.target !== 'dart-client') {
      console.warn(`Dart adapter received unsupported target "${target.target}". Skipping.`);
      return;
  }

  // Load templates relative to project root
  const templateDir = path.resolve(__dirname, '../../../templates/dart'); // Use __dirname
  const modelTemplatePath = path.join(templateDir, 'model.dart.ejs');
  const collectionRefTemplatePath = path.join(templateDir, 'collectionRef.dart.ejs');
  const queryBuilderTemplatePath = path.join(templateDir, 'queryBuilder.dart.ejs');
  const updateBuilderTemplatePath = path.join(templateDir, 'updateBuilder.dart.ejs');

  // Pre-load templates
  if (!fs.existsSync(modelTemplatePath)) throw new Error(`Dart Adapter: Model template not found at: ${modelTemplatePath}`);
  if (!fs.existsSync(collectionRefTemplatePath)) throw new Error(`Dart Adapter: CollectionRef template not found at: ${collectionRefTemplatePath}`);
  if (!fs.existsSync(queryBuilderTemplatePath)) throw new Error(`Dart Adapter: QueryBuilder template not found at: ${queryBuilderTemplatePath}`);
  if (!fs.existsSync(updateBuilderTemplatePath)) throw new Error(`Dart Adapter: UpdateBuilder template not found at: ${updateBuilderTemplatePath}`);

  const templates: DartTemplateStrings = {
      model: fs.readFileSync(modelTemplatePath, 'utf-8'),
      collectionRef: fs.readFileSync(collectionRefTemplatePath, 'utf-8'),
      queryBuilder: fs.readFileSync(queryBuilderTemplatePath, 'utf-8'),
      updateBuilder: fs.readFileSync(updateBuilderTemplatePath, 'utf-8'),
  };

  // Generate files for each top-level collection
  for (const collectionId in schema.collections) {
    const collection = schema.collections[collectionId];
    await generateFilesForDartCollection(collection, target.outputDir, options, templates);
  }

  // Generate pubspec.yaml (Optional)
  if (target.package) {
    try {
        const runtimePackageDir = path.resolve(process.cwd(), 'packages/fireschema_dart_runtime');
        const relativeRuntimePath = path.relative(target.outputDir, runtimePackageDir).replace(/\\/g, '/');

        const pubspecContent = `
name: ${target.package.name}
description: ${target.package.description || `Generated Firestore ODM for ${target.package.name} (Dart Client)`}
version: ${target.package.version || '0.1.0'}
publish_to: none

environment:
  sdk: '>=2.17.0 <4.0.0'
  # flutter: '>=1.17.0'

dependencies:
  # flutter:
  #   sdk: flutter
  cloud_firestore: ^4.0.0 # User needs this
  fireschema_dart_runtime: # Depends on the runtime package
    path: ${relativeRuntimePath}
  # meta: ^1.8.0

dev_dependencies:
  # flutter_test:
  #   sdk: flutter
  flutter_lints: ^2.0.0

`.trimStart();

        const pubspecPath = path.join(target.outputDir, 'pubspec.yaml');
        await fs.promises.writeFile(pubspecPath, pubspecContent);
        console.log(`  ✓ Generated pubspec.yaml: ${pubspecPath}`);
    } catch (error: any) {
        console.error(`  ✗ Error generating pubspec.yaml: ${error.message}`);
        throw error;
    }
  }
}


// --- Helper Functions (Copied, consider moving to shared util) ---

async function generateFilesForDartCollection(
    collection: ParsedCollectionDefinition, outputBaseDir: string, options: Record<string, any>,
    templates: DartTemplateStrings, parentPath: string = ''
): Promise<void> {
    const collectionId = collection.collectionId;
    const modelName = camelToPascalCase(collectionId);
    const fileNameBase = toSnakeCase(collectionId);
    const currentOutputDir = parentPath ? path.join(outputBaseDir, parentPath) : outputBaseDir;
    if (parentPath) await fs.promises.mkdir(currentOutputDir, { recursive: true }).catch(e => { if (e.code !== 'EEXIST') throw e; });

    console.log(`  Generating Dart files for collection: ${parentPath ? parentPath + '/' : ''}${collectionId}`);

    const commonData = {
        modelName, fileNameBase, collection, options,
        getDartType: (field: ParsedFieldDefinition) => getDartType(field, options),
        capitalizeFirstLetter, camelToPascalCase, toSnakeCase,
        parentPath, isSubcollection: !!parentPath,
    };
    const queryBuilderData = { ...commonData, getDartQueryInfoForField: (field: ParsedFieldDefinition) => getDartQueryInfoForField(field, options) };
    const updateBuilderData = { ...commonData };
    const collectionRefData = { ...commonData };

    // Generate files...
    try {
        const renderedModel = ejs.render(templates.model, commonData);
        await fs.promises.writeFile(path.join(currentOutputDir, `${fileNameBase}_data.dart`), renderedModel);
        console.log(`    ✓ Generated model: ${path.join(currentOutputDir, `${fileNameBase}_data.dart`)}`);
    } catch (error: any) {
        console.error(`    ✗ Error generating model for collection "${collectionId}": ${error.message}`);
        throw error; // Re-throw to halt generation on template error
    }

    try {
        const renderedCollectionRef = ejs.render(templates.collectionRef, collectionRefData);
        await fs.promises.writeFile(path.join(currentOutputDir, `${fileNameBase}_collection.dart`), renderedCollectionRef);
        console.log(`    ✓ Generated collection reference: ${path.join(currentOutputDir, `${fileNameBase}_collection.dart`)}`);
    } catch (error: any) {
        console.error(`    ✗ Error generating collection reference for collection "${collectionId}": ${error.message}`);
        throw error;
    }

    try {
        const renderedQueryBuilder = ejs.render(templates.queryBuilder, queryBuilderData);
        await fs.promises.writeFile(path.join(currentOutputDir, `${fileNameBase}_query.dart`), renderedQueryBuilder);
        console.log(`    ✓ Generated query builder: ${path.join(currentOutputDir, `${fileNameBase}_query.dart`)}`);
    } catch (error: any) {
        console.error(`    ✗ Error generating query builder for collection "${collectionId}": ${error.message}`);
        throw error;
    }

    try {
        const renderedUpdateBuilder = ejs.render(templates.updateBuilder, updateBuilderData);
        await fs.promises.writeFile(path.join(currentOutputDir, `${fileNameBase}_update.dart`), renderedUpdateBuilder);
        console.log(`    ✓ Generated update builder: ${path.join(currentOutputDir, `${fileNameBase}_update.dart`)}`);
    } catch (error: any) {
        console.error(`    ✗ Error generating update builder for collection "${collectionId}": ${error.message}`);
        throw error;
    }


    if (collection.subcollections) {
        for (const subcollectionId in collection.subcollections) {
            const subcollection = collection.subcollections[subcollectionId];
            const subcollectionParentPath = parentPath ? `${parentPath}/${collectionId}` : `${collectionId}`;
            await generateFilesForDartCollection(subcollection, outputBaseDir, options, templates, subcollectionParentPath);
        }
    }
}

function getDartType(field: ParsedFieldDefinition, options: Record<string, any>): string {
    const safeOptions = options || {};
    switch (field.type) {
      case 'string': return 'String';
      case 'number': return 'num';
      case 'boolean': return 'bool';
      case 'timestamp': return 'Timestamp';
      case 'geopoint': return 'GeoPoint';
      case 'reference': return `DocumentReference<Map<String, dynamic>>`;
      case 'array':
        if (!field.items) return 'List<dynamic>';
        return `List<${getDartType(field.items, safeOptions)}>`;
      case 'map':
        if (!field.properties) return 'Map<String, dynamic>';
        // TODO: Generate typed map class
        return 'Map<String, dynamic>';
      default: return 'dynamic';
    }
}

const dartQueryOpMap: { [key in WhereFilterOp]?: string } = {
    '==': 'isEqualTo', '!=': 'isNotEqualTo',
    '<': 'isLessThan', '<=': 'isLessThanOrEqualTo',
    '>': 'isGreaterThan', '>=': 'isGreaterThanOrEqualTo',
    'array-contains': 'arrayContains', 'array-contains-any': 'arrayContainsAny',
    'in': 'whereIn', 'not-in': 'whereNotIn',
};

function getDartQueryInfoForField(field: ParsedFieldDefinition, options: Record<string, any>): Array<{ paramName: string, valueType: string }> {
    const safeOptions = options || {};
    const valueType = getDartType(field, safeOptions);
    let validOps: WhereFilterOp[];
    switch (field.type) {
        case 'string': case 'number': case 'boolean': case 'timestamp': case 'geopoint': case 'reference':
            validOps = ['==', '!=', '<', '<=', '>', '>=', 'in', 'not-in']; break;
        case 'array': validOps = ['array-contains', 'array-contains-any', 'in', 'not-in']; break;
        case 'map': validOps = ['==', '!=', 'in', 'not-in']; break;
        default: validOps = [];
    }
    const queryInfos: Array<{ paramName: string, valueType: string }> = [];
    for (const op of validOps) {
        const paramName = dartQueryOpMap[op];
        if (!paramName) continue;
        let specificValueType = valueType;
        if (paramName === 'arrayContains') specificValueType = field.items ? getDartType(field.items, safeOptions) : 'dynamic';
        else if (paramName === 'arrayContainsAny' || paramName === 'whereIn' || paramName === 'whereNotIn') {
             const itemType = field.items ? getDartType(field.items, safeOptions) : 'dynamic';
             specificValueType = field.type === 'array' ? `List<${valueType}>` : `List<${itemType}>`;
        } else if (field.type !== 'array' && (paramName === 'whereIn' || paramName === 'whereNotIn')) {
             specificValueType = `List<${valueType}>`;
        }
        const isNullable = !field.required && !specificValueType.startsWith('List<');
        queryInfos.push({ paramName: paramName, valueType: `${specificValueType}${isNullable ? '?' : ''}` });
    }
    return queryInfos;
}