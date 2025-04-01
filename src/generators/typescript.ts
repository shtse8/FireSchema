import fs from 'fs';
import path from 'path';
import ejs from 'ejs';
import { Timestamp, GeoPoint, DocumentReference, DocumentData, WhereFilterOp } from 'firebase/firestore'; // Import Firestore types
import { FirestoreODMConfig, OutputTarget, TypeScriptOptions } from '../types/config';
import { ParsedFirestoreSchema, ParsedCollectionDefinition, ParsedFieldDefinition, FieldType } from '../types/schema';
import { capitalizeFirstLetter, camelToPascalCase } from '../utils/naming';

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
  const modelTemplate = fs.readFileSync(modelTemplatePath, 'utf-8');
  const collectionRefTemplate = fs.readFileSync(collectionRefTemplatePath, 'utf-8');
  const queryBuilderTemplate = fs.readFileSync(queryBuilderTemplatePath, 'utf-8');
  const coreTemplate = fs.readFileSync(coreTemplatePath, 'utf-8');
  const updateBuilderTemplate = fs.readFileSync(updateBuilderTemplatePath, 'utf-8');

  // Generate files for each collection
  for (const collectionId in schema.collections) {
    const collection = schema.collections[collectionId];
    const modelName = camelToPascalCase(collectionId); // e.g., users -> Users

    // --- Generate Model File ---
    const modelData = {
      modelName: modelName,
      collection: collection,
      options: options,
      // Pass helper functions to the template
      // Note: We need to pass options to the helper. EJS can call functions with arguments from the data object.
      // So, we ensure 'options' is in the data object and call getTypeScriptType(field, options) in the template.
      getTypeScriptType: getTypeScriptType,
    };
    // Data specifically for the collectionRef template
    const collectionRefData = {
        modelName: modelName,
        collection: collection,
        options: options,
    };
    // Data for the queryBuilder template (same as collectionRef for now)
    const queryBuilderData = {
        modelName: modelName,
        collection: collection,
        options: options,
        // Pass query helper
        getQueryInfoForField: getQueryInfoForField,
        // Pass type helper (needed by query helper)
        getTypeScriptType: getTypeScriptType,
        // Pass naming helper
        capitalizeFirstLetter: capitalizeFirstLetter,
    };
    // Data for the updateBuilder template
    const updateBuilderData = {
        modelName: modelName,
        collection: collection,
        options: options,
        // Pass helpers needed by the template
        getTypeScriptType: getTypeScriptType,
        capitalizeFirstLetter: capitalizeFirstLetter,
    };

    try {
      const renderedModel = ejs.render(modelTemplate, modelData);
      const modelFileName = `${collectionId}.types.ts`; // Or model.ts, types.ts? Decide convention
      const modelFilePath = path.join(target.outputDir, modelFileName);
      await fs.promises.writeFile(modelFilePath, renderedModel);
      console.log(`  ✓ Generated model: ${modelFilePath}`);
    } catch (error: any) {
      console.error(`  ✗ Error generating model for collection "${collectionId}": ${error.message}`);
      // Decide if one error should stop the whole process
    }

    // --- Generate Collection Reference File (Placeholder) ---
    try {
        const renderedCollectionRef = ejs.render(collectionRefTemplate, collectionRefData);
        const collectionRefFileName = `${collectionId}.collection.ts`; // Naming convention
        const collectionRefFilePath = path.join(target.outputDir, collectionRefFileName);
        await fs.promises.writeFile(collectionRefFilePath, renderedCollectionRef);
        console.log(`  ✓ Generated collection reference: ${collectionRefFilePath}`);
    } catch (error: any) {
        console.error(`  ✗ Error generating collection reference for collection "${collectionId}": ${error.message}`);
    }

    // --- Generate Query Builder File ---
    try {
        const renderedQueryBuilder = ejs.render(queryBuilderTemplate, queryBuilderData);
        const queryBuilderFileName = `${collectionId}.query.ts`; // Naming convention
        const queryBuilderFilePath = path.join(target.outputDir, queryBuilderFileName);
        await fs.promises.writeFile(queryBuilderFilePath, renderedQueryBuilder);
        console.log(`  ✓ Generated query builder: ${queryBuilderFilePath}`);
    } catch (error: any) {
        console.error(`  ✗ Error generating query builder for collection "${collectionId}": ${error.message}`);
    }

    // --- Generate Update Builder File ---
    try {
        const renderedUpdateBuilder = ejs.render(updateBuilderTemplate, updateBuilderData);
        const updateBuilderFileName = `${collectionId}.update.ts`; // Naming convention
        const updateBuilderFilePath = path.join(target.outputDir, updateBuilderFileName);
        await fs.promises.writeFile(updateBuilderFilePath, renderedUpdateBuilder);
        console.log(`  ✓ Generated update builder: ${updateBuilderFilePath}`);
    } catch (error: any) {
        console.error(`  ✗ Error generating update builder for collection "${collectionId}": ${error.message}`);
    }

    // --- Generate Subcollection Files (Recursive Call or Logic) ---
    if (collection.subcollections) {
       console.log(`  - Placeholder: Generate subcollections for ${modelName}`);
       // TODO: Handle subcollection generation
    }
  }

  // --- Generate Core Runtime File (Placeholder) ---
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

  // --- Generate package.json (Optional) ---
  if (target.package) {
    console.log(`  - Placeholder: Generate package.json`);
    // TODO: Create package.json content based on target.package info
  }

  console.log(`TypeScript generation finished for ${target.outputDir}.`);
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