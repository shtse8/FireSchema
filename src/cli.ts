#!/usr/bin/env node

import { Command } from 'commander';
import path from 'path';
// We will import the actual generator logic later
import { loadAndValidateSchema } from './schemaLoader';
import { loadConfig } from './configLoader';
import { generate } from './generator';

const program = new Command();

program
  .name('fireschema')
  .description('CLI tool to generate strongly-typed Firestore ODM code from a JSON schema')
  .version('0.0.1'); // Start with an initial version

program
  .command('generate')
  .description('Generate ODM code based on the schema and configuration')
  .option('-c, --config <path>', 'Path to the configuration file', './firestore-odm.config.json')
  .action(async (options) => {
    const configPath = path.resolve(process.cwd(), options.config);
    console.log(`Starting generation process...`);
    console.log(`Using configuration file: ${configPath}`);

    try {
      const config = loadConfig(configPath);

      // Load and validate the schema
      const parsedSchema = loadAndValidateSchema(config.schema);
      console.log(`Successfully loaded and validated schema: ${config.schema}`);

      // Placeholder for the actual generation logic
 // No longer needed, logged by generator
     //  console.log(`Output Targets: ${config.outputs.map(o => `${o.language} (${o.outputDir})`).join(', ')}`);
 // No longer needed, logged by generator

   await generate(config, parsedSchema); // Call the main generator function with config and schema

      // console.log('Code generation complete (placeholder).');
 // No longer needed, logged by generator
    } catch (error) {
      console.error('Error during code generation:', error);
      process.exit(1);
    }
  });

program.parse(process.argv);

// Handle cases where no command is specified
if (!process.argv.slice(2).length) {
  program.outputHelp();
}