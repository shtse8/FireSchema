import fs from 'fs';
import path from 'path';
import ejs from 'ejs';
import type { WhereFilterOp } from 'firebase/firestore';
import { FirestoreODMConfig, OutputTarget } from '../../types/config'; // Adjusted import path
import { ParsedFirestoreSchema, ParsedCollectionDefinition, ParsedFieldDefinition } from '../../types/schema'; // Adjusted import path
import { capitalizeFirstLetter, camelToPascalCase } from '../../utils/naming'; // Adjusted import path
// Runtime Imports
// No longer need core-types import
// import type { FirestoreLike, DocumentReferenceLike, CollectionReferenceLike, FieldValueLike, TimestampLike, GeoPointLike, DocumentDataLike, WhereFilterOpLike } from '@shtse8/fireschema-core-types';
// WhereFilterOp is already imported at the top

// Interfaces (copied)
interface TemplateStrings {
    model: string;
    collectionRef: string;
    queryBuilder: string;
    updateBuilder: string;
}

interface UpdateMethodDefinition {
  methodName: string;
  fieldPath: string;
  fieldType: string;
  fieldNameCamelCase: string;
  originalField: ParsedFieldDefinition;
}

/**
 * Generates TypeScript Client ODM code.
 */
export async function generate(target: OutputTarget, schema: ParsedFirestoreSchema, config: FirestoreODMConfig): Promise<void> {
  console.log(` -> Running TypeScript Client Adapter...`);
  const options = target.options || {};
  // const sdkOption = 'client'; // No longer needed, templates are client-specific

  // Load templates relative to the source file location (__dirname)
  const templateDir = path.resolve(__dirname, './templates'); // Load templates from adapter's directory
  const modelTemplatePath = path.join(templateDir, 'model.ejs');
  const collectionRefTemplatePath = path.join(templateDir, 'collectionRef.ejs');
  const queryBuilderTemplatePath = path.join(templateDir, 'queryBuilder.ejs');
  const updateBuilderTemplatePath = path.join(templateDir, 'updateBuilder.ejs');

  // Pre-load all templates
  if (!fs.existsSync(modelTemplatePath)) throw new Error(`TS Client Adapter: Model template not found at: ${modelTemplatePath}`);
  if (!fs.existsSync(collectionRefTemplatePath)) throw new Error(`TS Client Adapter: CollectionRef template not found at: ${collectionRefTemplatePath}`);
  if (!fs.existsSync(queryBuilderTemplatePath)) throw new Error(`TS Client Adapter: QueryBuilder template not found at: ${queryBuilderTemplatePath}`);
  if (!fs.existsSync(updateBuilderTemplatePath)) throw new Error(`TS Client Adapter: UpdateBuilder template not found at: ${updateBuilderTemplatePath}`);

  const templates: TemplateStrings = {
      model: fs.readFileSync(modelTemplatePath, 'utf-8'),
      collectionRef: fs.readFileSync(collectionRefTemplatePath, 'utf-8'),
      queryBuilder: fs.readFileSync(queryBuilderTemplatePath, 'utf-8'),
      updateBuilder: fs.readFileSync(updateBuilderTemplatePath, 'utf-8'),
  };

  // console.log(`    (SDK Target: ${sdkOption})`); // No longer needed

  // Generate files for each collection
  for (const collectionId in schema.collections) {
    const collection = schema.collections[collectionId];
    await generateFilesForCollection(collection, target.outputDir, options, templates); // Remove sdkOption
  }

  // Generate package.json (Optional)
  if (target.package) {
    try {
        const packageJsonContent: any = {
            name: target.package.name, version: target.package.version || '0.1.0',
            description: target.package.description || `Generated Firestore ODM for ${target.package.name} (TS Client)`,
            "type": "module", "main": "./dist/index.js", "types": "./dist/index.d.ts",
            scripts: { "clean": "npx rimraf dist", "build": "bun run clean && tsc -b", "test": "jest" },
            // Dependencies now include only the specific client runtime
            "dependencies": {
              "@shtse8/fireschema-ts-client-runtime": "workspace:^" // Or specific version
            },
            "peerDependencies": {
              "firebase": "^9.0.0 || ^10.0.0 || ^11.0.0" // Keep peer dependency for the SDK
            },
            "devDependencies": {
              "@types/jest": "^29.5.14",
              "firebase": "^10.12.4", // Keep for testing/dev purposes if needed
              "jest": "^29.7.0",
              "ts-jest": "^29.3.1",
              "typescript": "^5.0.0"
            }
        };
        const packageJsonPath = path.join(target.outputDir, 'package.json');
        await fs.promises.writeFile(packageJsonPath, JSON.stringify(packageJsonContent, null, 2));
        console.log(`  ✓ Generated/Updated package.json: ${packageJsonPath}`);
    } catch (error: any) {
        console.error(`  ✗ Error generating package.json: ${error.message}`);
        throw error;
    }
  }
}


// --- Helper Functions (Copied, consider moving to shared util) ---

async function generateFilesForCollection(
    collection: ParsedCollectionDefinition, outputBaseDir: string, options: Record<string, any>,
    templates: TemplateStrings, parentPath: string = '' // Remove sdkOption
): Promise<void> {
    const collectionId = collection.collectionId;
    const modelName = camelToPascalCase(collectionId);
    const currentOutputDir = parentPath ? path.join(outputBaseDir, parentPath) : outputBaseDir;
    if (parentPath) await fs.promises.mkdir(currentOutputDir, { recursive: true }).catch(e => { if (e.code !== 'EEXIST') throw e; });

    console.log(`  Generating files for collection: ${parentPath ? parentPath + '/' : ''}${collectionId}`);

    const commonData = {
        modelName, collection, options, getTypeScriptType, // Remove sdk property
        capitalizeFirstLetter, camelToPascalCase, isSubcollection: !!parentPath,
        FirestoreLike: 'FirestoreLike', DocumentReferenceLike: 'DocumentReferenceLike',
        CollectionReferenceLike: 'CollectionReferenceLike', FieldValueLike: 'FieldValueLike',
        TimestampLike: 'TimestampLike', GeoPointLike: 'GeoPointLike', DocumentDataLike: 'DocumentDataLike',
    };
    const queryBuilderData = { ...commonData, getQueryInfoForField };
    const updateMethods = getUpdateMethodsForFields(collection.fields, options, '', 'set'); // Remove sdkOption
    const updateBuilderData = { ...commonData, updateMethods };
    const collectionRefData = { ...commonData, parentPath };

    // Generate files...
    const renderedModel = ejs.render(templates.model, { ...commonData, getTypeScriptType: (field: ParsedFieldDefinition) => getTypeScriptType(field, options) });
    await fs.promises.writeFile(path.join(currentOutputDir, `${collectionId}.types.ts`), renderedModel);
    console.log(`    ✓ Generated model: ${path.join(currentOutputDir, `${collectionId}.types.ts`)}`);

    const renderedCollectionRef = ejs.render(templates.collectionRef, collectionRefData);
    await fs.promises.writeFile(path.join(currentOutputDir, `${collectionId}.collection.ts`), renderedCollectionRef);
     console.log(`    ✓ Generated collection reference: ${path.join(currentOutputDir, `${collectionId}.collection.ts`)}`);

    const renderedQueryBuilder = ejs.render(templates.queryBuilder, { ...queryBuilderData, getQueryInfoForField: (field: ParsedFieldDefinition) => getQueryInfoForField(field, options) });
    await fs.promises.writeFile(path.join(currentOutputDir, `${collectionId}.query.ts`), renderedQueryBuilder);
     console.log(`    ✓ Generated query builder: ${path.join(currentOutputDir, `${collectionId}.query.ts`)}`);

    const renderedUpdateBuilder = ejs.render(templates.updateBuilder, { ...updateBuilderData, getTypeScriptType: (field: ParsedFieldDefinition) => getTypeScriptType(field, options) });
    await fs.promises.writeFile(path.join(currentOutputDir, `${collectionId}.update.ts`), renderedUpdateBuilder);
     console.log(`    ✓ Generated update builder: ${path.join(currentOutputDir, `${collectionId}.update.ts`)}`);


    if (collection.subcollections) {
        for (const subcollectionId in collection.subcollections) {
            const subcollection = collection.subcollections[subcollectionId];
            const subcollectionParentPath = parentPath ? `${parentPath}/${collectionId}/{${collectionId}Id}` : `${collectionId}/{${collectionId}Id}`;
            await generateFilesForCollection(subcollection, outputBaseDir, options, templates, subcollectionParentPath); // Remove sdkOption
        }
    }
}

function getTypeScriptType(field: ParsedFieldDefinition, options: Record<string, any>): string {
  const safeOptions = options || {};
  switch (field.type) {
    case 'string': return 'string';
    case 'number': return 'number';
    case 'boolean': return 'boolean';
    case 'timestamp': return safeOptions.dateTimeType === 'Date' ? 'Date' : 'TimestampLike';
    case 'geopoint': return 'GeoPointLike';
    case 'reference':
      const refModelName = field.referenceTo ? `${camelToPascalCase(field.referenceTo)}Data` : 'DocumentDataLike';
      return `DocumentReferenceLike<${refModelName}>`;
    case 'array':
      if (!field.items) return 'any[]';
      return `${getTypeScriptType(field.items, safeOptions)}[]`;
    case 'map':
       if (!field.properties) return 'Record<string, any>';
       const props = Object.entries(field.properties).map(([k, p]) => `${k}${p.required ? '' : '?'}: ${getTypeScriptType(p, safeOptions)}`).join('; ');
       return `{ ${props} }`;
    default: return 'any';
  }
}

// Ensure WhereFilterOp from the SDK is used
function getQueryInfoForField(field: ParsedFieldDefinition, options: Record<string, any>): Array<{ op: WhereFilterOp, valueType: string }> {
    const safeOptions = options || {};
    const valueType = getTypeScriptType(field, safeOptions);
    let validOps: WhereFilterOp[];
    switch (field.type) {
        case 'string': case 'number': case 'boolean': case 'timestamp': case 'geopoint': case 'reference':
            validOps = ['==', '!=', '<', '<=', '>', '>=', 'in', 'not-in']; break;
        case 'array': validOps = ['array-contains', 'array-contains-any', 'in', 'not-in']; break;
        case 'map': validOps = ['==', '!=', 'in', 'not-in']; break;
        default: validOps = [];
    }
    const queryInfos: Array<{ op: WhereFilterOp, valueType: string }> = [];
    for (const op of validOps) {
        let specificValueType = valueType;
        if (op === 'in' || op === 'not-in') specificValueType = `${valueType}[]`;
        else if (field.type === 'array') {
            const itemType = field.items ? getTypeScriptType(field.items, safeOptions) : 'any';
            if (op === 'array-contains') specificValueType = itemType;
            else if (op === 'array-contains-any') specificValueType = `${itemType}[]`;
        }
        queryInfos.push({ op, valueType: specificValueType });
    }
    return queryInfos;
}

function getUpdateMethodsForFields(
    fields: Record<string, ParsedFieldDefinition>, options: Record<string, any>,
    currentPath: string = '', methodPrefix: string = 'set' // Remove sdkOption
): UpdateMethodDefinition[] {
    const safeOptions = options || {};
    let methods: UpdateMethodDefinition[] = [];
    for (const fieldName in fields) {
        const field = fields[fieldName];
        const fieldPath = currentPath ? `${currentPath}.${fieldName}` : fieldName;
        const pascalFieldNamePart = capitalizeFirstLetter(fieldName);
        const methodName = `${methodPrefix}${pascalFieldNamePart}`;
        const fieldType = getTypeScriptType(field, safeOptions);
        methods.push({ methodName, fieldPath, fieldType: `${fieldType} | FieldValueLike`, fieldNameCamelCase: fieldName, originalField: field });
        if (field.type === 'map' && field.properties) {
            const nestedMethods = getUpdateMethodsForFields(field.properties, safeOptions, fieldPath, methodName); // Remove sdkOption
            methods = methods.concat(nestedMethods);
        }
    }
    return methods;
}