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

// Create a new command instance
const program = new Command();

// Custom help formatting
program.configureHelp({
  formatHelp: (cmd, helper) => {
    const termWidth = process.stdout.columns || 80;
    
    // Create a modern header with gradient-like effect
    const headerStr = `\n${chalk.bgBlue.white.bold(' SNIFF ')} ${chalk.blue.bold('━')} ${chalk.cyan.bold('Dependency Health Analyzer')}\n`;
    
    // Create a divider line
    const divider = chalk.dim('━'.repeat(termWidth));
    
    // Format options with icons, colors and better spacing
    const optionsStr = `\n${chalk.yellow.bold('OPTIONS')}\n\n` + 
      cmd.options.map(option => {
        // Format the flags with better spacing and colors
        const flagParts = option.flags.split(',').map(f => f.trim());
        const shortFlag = flagParts[0] ? chalk.green(flagParts[0]) : '';
        const longFlag = flagParts[1] ? chalk.green(flagParts[1]) : '';
        const formattedFlags = [shortFlag, longFlag].filter(Boolean).join('  ');
        
        const desc = option.description;
        
        // Add icons based on option type
        let icon = '';
        if (option.flags.includes('version')) icon = '📋 ';
        else if (option.flags.includes('top')) icon = '🔝 ';
        else if (option.flags.includes('report')) icon = '📊 ';
        else if (option.flags.includes('find-alternatives')) icon = '💡 ';
        else if (option.flags.includes('unused')) icon = '🗑️ ';
        else if (option.flags.includes('outdated')) icon = '⏰ ';
        else if (option.flags.includes('scores')) icon = '⭐ ';
        else if (option.flags.includes('json')) icon = '📄 ';
        else if (option.flags.includes('verbose')) icon = '🔍 ';
        else if (option.flags.includes('help')) icon = '❓ ';
        
        return `  ${icon}${formattedFlags.padEnd(30)} ${chalk.white(desc)}`;
      }).join('\n\n');
    
    // Format examples section with more spacing and better formatting
    const examplesStr = `\n${chalk.yellow.bold('EXAMPLES')}\n\n` +
      `  ${chalk.cyan(cmd.name())}\n  ${chalk.dim('# Basic analysis')}\n\n` +
      `  ${chalk.cyan(cmd.name())} ${chalk.green('-t 10')}\n  ${chalk.dim('# Analyze top 10 dependencies only')}\n\n` +
      `  ${chalk.cyan(cmd.name())} ${chalk.green('-r json')}\n  ${chalk.dim('# Export results to JSON file')}\n\n` +
      `  ${chalk.cyan(cmd.name())} ${chalk.green('-r markdown')}\n  ${chalk.dim('# Export results to Markdown file')}\n\n` +
      `  ${chalk.cyan(cmd.name())} ${chalk.green('-f')}\n  ${chalk.dim('# Suggest better alternatives')}\n\n` +
      `  ${chalk.cyan(cmd.name())} ${chalk.green('-u -o')}\n  ${chalk.dim('# List unused and outdated dependencies')}\n\n` +
      `  ${chalk.cyan(cmd.name())} ${chalk.green('-s')}\n  ${chalk.dim('# Show npms.io scores for each package')}\n\n` +
      `  ${chalk.cyan(cmd.name())} ${chalk.green('--json | jq')}\n  ${chalk.dim('# Raw JSON output for scripting')}\n`;
    
    // Format footer with version and author info
    const footerStr = `\n${divider}\n${chalk.dim('Made with')} ${chalk.red('❤️')}  ${chalk.dim('by Jayanithu')} ${chalk.cyan(`v${version}`)}\n`;
    
    return headerStr + divider + optionsStr + examplesStr + footerStr;
  }
});

// Configure the CLI options with fixed report option
program
  .name('sniff')
  .description('Analyze Node.js project dependencies and suggest healthier alternatives')
  .version(version, '-V, --version', 'Output the version number')
  .option('-t, --top <number>', 'Analyze only top N dependencies', parseInt)
  .option('-r, --report <format>', 'Export results to a file (json, markdown)')
  .option('-f, --find-alternatives', 'Suggest better alternatives for weak packages')
  .option('-u, --unused', 'List unused dependencies')
  .option('-o, --outdated', 'List outdated dependencies')
  .option('-s, --scores', 'Show npms.io scores for each package')
  .option('--json', 'Output raw JSON for scripting/pipelines')
  .option('-v, --verbose', 'Show detailed output')
  .helpOption('-h, --help', 'Display help for command');

// Parse command line arguments
program.parse();

// Get the options
const options = program.opts();

// Fix the report format if it's set to true
if (options.report === true) {
  options.report = 'json';
}

// Main function
async function main() {
  try {
    // Display a fancy header with gradient-like effect
    console.log('\n' + 
      chalk.bgBlue.white.bold(' SNIFF ') + ' ' + 
      chalk.blue.bold('━') + ' ' + 
      chalk.cyan.bold('Dependency Health Analyzer') + 
      '\n');
    
    // Create a divider line
    const divider = chalk.dim('━'.repeat(process.stdout.columns || 80));
    console.log(divider);
    
    console.log('\n' + chalk.blue('🔍 ') + chalk.bold('Sniffing your dependencies...') + '\n');
    
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
    
    // Display a footer
    console.log('\n' + divider);
    console.log(chalk.dim('Run with') + ' ' + chalk.cyan('--help') + ' ' + chalk.dim('for more options.'));
    console.log(chalk.dim('Made with ') + chalk.red('❤️') + chalk.dim(' by Jayanithu') + '\n');
    
  } catch (error) {
    console.error('\n' + chalk.bgRed.white.bold(' ERROR ') + ' ' + chalk.red(error.message));
    if (options.verbose) {
      console.error(chalk.dim('\nStack trace:'));
      console.error(chalk.dim(error.stack));
    }
    console.error(chalk.yellow('\nTip: Run with --verbose for more details.'));
    process.exit(1);
  }
}

// Run the main function
main();