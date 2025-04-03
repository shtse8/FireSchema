import fs from 'fs';
import path from 'path';
import ejs from 'ejs';
import type { WhereFilterOp } from 'firebase/firestore';
import { FirestoreODMConfig, OutputTarget, TypeScriptOptions } from '../types/config';
import { ParsedFirestoreSchema, ParsedCollectionDefinition, ParsedFieldDefinition } from '../types/schema'; // Removed FieldType import as it's not used directly
import { capitalizeFirstLetter, camelToPascalCase } from '../utils/naming';
// Runtime Imports
import type { FirestoreLike, DocumentReferenceLike, CollectionReferenceLike, FieldValueLike, TimestampLike, GeoPointLike, DocumentDataLike } from '@shtse8/fireschema-runtime';
import { BaseCollectionRef } from '@shtse8/fireschema-runtime';
import { BaseQueryBuilder } from '@shtse8/fireschema-runtime';
import { BaseUpdateBuilder } from '@shtse8/fireschema-runtime';


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
 * Generates TypeScript ODM code based on the provided schema and configuration.
 */
export async function generateTypeScript(target: OutputTarget, schema: ParsedFirestoreSchema, config: FirestoreODMConfig): Promise<void> {
  console.log(`Generating TypeScript code into ${target.outputDir}...`);
  const options = target.options as TypeScriptOptions || {};

  // Load templates
  const modelTemplatePath = path.resolve(__dirname, '../../templates/typescript/model.ejs');
  const collectionRefTemplatePath = path.resolve(__dirname, '../../templates/typescript/collectionRef.ejs');
  const queryBuilderTemplatePath = path.resolve(__dirname, '../../templates/typescript/queryBuilder.ejs');
  const updateBuilderTemplatePath = path.resolve(__dirname, '../../templates/typescript/updateBuilder.ejs');

  // Pre-load templates
  if (!fs.existsSync(modelTemplatePath)) throw new Error(`TypeScript model template not found at: ${modelTemplatePath}`);
  if (!fs.existsSync(collectionRefTemplatePath)) throw new Error(`TypeScript collectionRef template not found at: ${collectionRefTemplatePath}`);
  if (!fs.existsSync(queryBuilderTemplatePath)) throw new Error(`TypeScript queryBuilder template not found at: ${queryBuilderTemplatePath}`);
  if (!fs.existsSync(updateBuilderTemplatePath)) throw new Error(`TypeScript updateBuilder template not found at: ${updateBuilderTemplatePath}`);

  const templates: TemplateStrings = {
      model: fs.readFileSync(modelTemplatePath, 'utf-8'),
      collectionRef: fs.readFileSync(collectionRefTemplatePath, 'utf-8'),
      queryBuilder: fs.readFileSync(queryBuilderTemplatePath, 'utf-8'),
      updateBuilder: fs.readFileSync(updateBuilderTemplatePath, 'utf-8'),
  };

  // Generate files for each collection
  for (const collectionId in schema.collections) {
    const collection = schema.collections[collectionId];
    await generateFilesForCollection(collection, target.outputDir, options, templates);
  }

  // Generate package.json (Optional)
  if (target.package) {
    try {
        const packageJsonContent: any = {
            name: target.package.name,
            version: target.package.version || '0.1.0',
            description: target.package.description || `Generated Firestore ODM for ${target.package.name}`,
            "type": "module",
            "main": "./dist/index.js",
            "types": "./dist/index.d.ts",
            scripts: {
              "clean": "npx rimraf dist",
              "build": "bun run clean && tsc -b",
              "test": "jest"
            },
            peerDependencies: {
                "@shtse8/fireschema-runtime": "^0.1.0",
                "firebase": "^9.0.0 || ^10.0.0 || ^11.0.0",
                "firebase-admin": "^11.0.0 || ^12.0.0"
            },
             peerDependenciesMeta: {
                "firebase": { "optional": true },
                "firebase-admin": { "optional": true }
            },
            devDependencies: {
              "@types/jest": "^29.5.14",
              "firebase": "^10.12.4",
              "firebase-admin": "^12.0.0",
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

  console.log(`TypeScript generation finished for ${target.outputDir}.`);
}


/**
 * Generates the necessary files for a single collection and recursively calls itself for subcollections.
 */
async function generateFilesForCollection(
    collection: ParsedCollectionDefinition,
    outputBaseDir: string,
    options: TypeScriptOptions,
    templates: TemplateStrings,
    parentPath: string = ''
): Promise<void> {
    const collectionId = collection.collectionId;
    const modelName = camelToPascalCase(collectionId);
    const currentOutputDir = parentPath ? path.join(outputBaseDir, parentPath) : outputBaseDir;
    if (parentPath) {
        await fs.promises.mkdir(currentOutputDir, { recursive: true });
    }

    console.log(`  Generating files for collection: ${parentPath ? parentPath + '/' : ''}${collectionId}`);

    const sdkOption = options.sdk || 'client';

    // Prepare data objects for templates
    const commonData = {
        modelName: modelName,
        collection: collection,
        options: options, // Pass options object directly
        sdk: sdkOption,
        // Pass the original helper function reference
        getTypeScriptType: getTypeScriptType,
        capitalizeFirstLetter: capitalizeFirstLetter,
        camelToPascalCase: camelToPascalCase,
        isSubcollection: !!parentPath,
        // Pass generic type names
        FirestoreLike: 'FirestoreLike',
        DocumentReferenceLike: 'DocumentReferenceLike',
        CollectionReferenceLike: 'CollectionReferenceLike',
        FieldValueLike: 'FieldValueLike',
        TimestampLike: 'TimestampLike',
        GeoPointLike: 'GeoPointLike',
        DocumentDataLike: 'DocumentDataLike',
    };
    // Pass helper references to other data objects too
    const queryBuilderData = {
        ...commonData,
        // Pass the original helper function reference
        getQueryInfoForField: getQueryInfoForField
    };
    const updateMethods = getUpdateMethodsForFields(collection.fields, options);
    const updateBuilderData = {
        ...commonData,
        updateMethods: updateMethods,
        // Pass the original helper function reference
        // getTypeScriptTypeForUpdate: getTypeScriptTypeForUpdate, // If needed
    };
    const collectionRefData = {
        ...commonData,
        parentPath: parentPath,
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
        throw error;
    }

    // Generate Collection Reference File
    try {
        const renderedCollectionRef = ejs.render(templates.collectionRef, collectionRefData);
        const collectionRefFileName = `${collectionId}.collection.ts`;
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
        const queryBuilderFileName = `${collectionId}.query.ts`;
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
        const updateBuilderFileName = `${collectionId}.update.ts`;
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
                ? `${parentPath}/${collectionId}/{${collectionId}Id}`
                : `${collectionId}/{${collectionId}Id}`;
            await generateFilesForCollection(subcollection, outputBaseDir, options, templates, subcollectionParentPath);
        }
    }
}

/**
 * Helper function to determine the TypeScript type string for a given field definition.
 * Returns generic 'Like' type names from the runtime package.
 */
function getTypeScriptType(field: ParsedFieldDefinition, options: TypeScriptOptions): string {
  // Ensure options is treated as potentially undefined or empty
  const safeOptions = options || {};
  switch (field.type) {
    case 'string': return 'string';
    case 'number': return 'number';
    case 'boolean': return 'boolean';
    case 'timestamp':
      return safeOptions.dateTimeType === 'Date' ? 'Date' : 'TimestampLike';
    case 'geopoint':
      return 'GeoPointLike';
    case 'reference':
      const referencedModelName = field.referenceTo ? `${camelToPascalCase(field.referenceTo)}Data` : 'DocumentDataLike';
      return `DocumentReferenceLike<${referencedModelName}>`;
    case 'array':
      if (!field.items) return 'any[]';
      // Pass options down recursively
      return `${getTypeScriptType(field.items, safeOptions)}[]`;
    case 'map':
       if (!field.properties) return 'Record<string, any>';
       // Pass options down recursively
       const properties = Object.entries(field.properties)
         .map(([key, propDef]) => `${key}${propDef.required ? '' : '?'}: ${getTypeScriptType(propDef, safeOptions)}`)
         .join('; ');
       return `{ ${properties} }`;
    default:
      console.warn(`Unknown field type encountered: ${field.type}. Defaulting to 'any'.`);
      return 'any';
  }
}

/**
 * Returns an array of valid query operator details for a given field.
 * Uses the generic types returned by getTypeScriptType.
 */
function getQueryInfoForField(field: ParsedFieldDefinition, options: TypeScriptOptions): Array<{ op: WhereFilterOp, valueType: string }> {
    const safeOptions = options || {};
    // Pass safeOptions to getTypeScriptType
    const valueType = getTypeScriptType(field, safeOptions);
    let validOps: WhereFilterOp[];

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
            validOps = ['==', '!=', 'in', 'not-in'];
            break;
        default:
            validOps = [];
    }

    const queryInfos: Array<{ op: WhereFilterOp, valueType: string }> = [];
    for (const op of validOps) {
        let specificValueType = valueType;
        if (op === 'in' || op === 'not-in') {
            specificValueType = `${valueType}[]`;
        } else if (field.type === 'array') {
            // Pass safeOptions down
            const itemType = field.items ? getTypeScriptType(field.items, safeOptions) : 'any';
            if (op === 'array-contains') {
                specificValueType = itemType;
            } else if (op === 'array-contains-any') {
                specificValueType = `${itemType}[]`;
            }
        }
        queryInfos.push({ op: op, valueType: specificValueType });
    }
    return queryInfos;
}

/**
 * Recursively generates a list of update method definitions for all fields.
 * Uses generic FieldValueLike type.
 */
function getUpdateMethodsForFields(
    fields: Record<string, ParsedFieldDefinition>,
    options: TypeScriptOptions,
    currentPath: string = '',
    methodPrefix: string = 'set'
): UpdateMethodDefinition[] {
    const safeOptions = options || {};
    let methods: UpdateMethodDefinition[] = [];

    for (const fieldName in fields) {
        const field = fields[fieldName];
        const fieldPath = currentPath ? `${currentPath}.${fieldName}` : fieldName;
        const pascalFieldNamePart = capitalizeFirstLetter(fieldName);
        const methodName = `${methodPrefix}${pascalFieldNamePart}`;
        // Pass safeOptions down
        const fieldType = getTypeScriptType(field, safeOptions);

        methods.push({
            methodName: methodName,
            fieldPath: fieldPath,
            fieldType: `${fieldType} | FieldValueLike`,
            fieldNameCamelCase: fieldName,
            originalField: field
        });

        if (field.type === 'map' && field.properties) {
            // Pass safeOptions down
            const nestedMethods = getUpdateMethodsForFields(
                field.properties,
                safeOptions, // Pass safeOptions
                fieldPath,
                methodName
            );
            methods = methods.concat(nestedMethods);
        }
    }
    return methods;
}