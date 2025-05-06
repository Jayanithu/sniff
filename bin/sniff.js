#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { scanProject } from '../lib/scanner.js';
import { analyzePackages } from '../lib/analyzer.js';
import { suggestAlternatives } from '../lib/suggestor.js';
import { generateReport } from '../lib/reporter.js';

// Get version from package.json
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
const { version } = packageJson;

const program = new Command();

program
  .name('sniff')
  .description('Analyze Node.js project dependencies and suggest healthier alternatives')
  .version(version)
  .option('-t, --top <number>', 'Analyze only top N dependencies', parseInt)
  .option('-r, --report <format>', 'Export results to a file (json, markdown)')
  .option('-f, --find-alternatives', 'Suggest better alternatives for weak packages')
  .option('-u, --unused', 'List unused dependencies')
  .option('-o, --outdated', 'List outdated dependencies')
  .option('-s, --scores', 'Show npms.io scores for each package')
  .option('--json', 'Output raw JSON for scripting/pipelines')
  .option('-v, --verbose', 'Show detailed output');

program.parse();

const options = program.opts();

async function main() {
  try {
    console.log(chalk.bold.blue('🔍 Sniffing your dependencies...\n'));
    
    // Scan the project for dependencies
    const projectData = await scanProject(options);
    
    // Analyze packages using npms.io
    const analysisResults = await analyzePackages(projectData, options);
    
    // Generate suggestions if requested
    if (options.findAlternatives) {
      await suggestAlternatives(analysisResults, options);
    }
    
    // Generate and display the report
    await generateReport(analysisResults, options);
    
  } catch (error) {
    console.error(chalk.red(`\n❌ Error: ${error.message}`));
    if (options.verbose) {
      console.error(error);
    }
    process.exit(1);
  }
}

main();