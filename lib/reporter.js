import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { formatScore, formatVersion } from './utils.js';

export async function generateReport(analysisResults, options) {
  const { packages, summary } = analysisResults;
  
  if (options.json) {
    console.log(JSON.stringify(analysisResults, null, 2));
    return;
  }
  
  console.log(chalk.bold('\n📊 Summary:'));
  console.log(`Total dependencies analyzed: ${chalk.bold(summary.total)}`);
  
  if (summary.lowQuality > 0) {
    console.log(`Low quality packages: ${chalk.yellow.bold(summary.lowQuality)}`);
  }
  
  if (summary.lowMaintenance > 0) {
    console.log(`Poorly maintained packages: ${chalk.yellow.bold(summary.lowMaintenance)}`);
  }
  
  if (summary.outdated > 0) {
    console.log(`Outdated packages: ${chalk.yellow.bold(summary.outdated)}`);
  }
  
  if (summary.unused > 0) {
    console.log(`Unused packages: ${chalk.yellow.bold(summary.unused)}`);
  }
  
  console.log(chalk.bold('\n📦 Package Analysis:'));
  
  for (const pkg of packages) {
    let statusColor = chalk.green;
    let statusIcon = '✅';
    
    if (pkg.flags?.lowQuality || pkg.flags?.lowMaintenance) {
      statusColor = chalk.red;
      statusIcon = '⚠️';
    } else if (pkg.flags?.outdated) {
      statusColor = chalk.yellow;
      statusIcon = '⚠️';
    }
    
    console.log(`\n${statusIcon} ${statusColor.bold(pkg.name)} ${chalk.dim(`v${pkg.currentVersion}`)}`);
    
    if (pkg.description) {
      console.log(`   ${chalk.dim(pkg.description)}`);
    }
    
    if (pkg.flags?.outdated) {
      console.log(`   ${chalk.yellow('Outdated:')} ${formatVersion(pkg.currentVersion, pkg.latestVersion)}`);
    }
    
    const flags = [];
    if (pkg.flags?.lowQuality) flags.push(chalk.red('low quality'));
    if (pkg.flags?.lowMaintenance) flags.push(chalk.red('poorly maintained'));
    if (pkg.flags?.unused) flags.push(chalk.yellow('unused'));
    if (pkg.flags?.outdated) flags.push(chalk.yellow('outdated'));
    
    if (flags.length > 0) {
      console.log(`   ${chalk.dim('Flags:')} ${flags.join(', ')}`);
    }
    
    if (options.scores && pkg.scores) {
      console.log(`   ${chalk.dim('Scores:')} overall ${formatScore(pkg.scores.final)}, quality ${formatScore(pkg.scores.quality)}, maintenance ${formatScore(pkg.scores.maintenance)}`);
    }
    
    if (pkg.alternatives && pkg.alternatives.length > 0 && options.findAlternatives) {
      console.log(`   ${chalk.dim('Alternatives:')}`);
      for (const alt of pkg.alternatives) {
        console.log(`     ${chalk.green('→')} ${chalk.bold(alt.name)}${alt.description ? ` - ${alt.description}` : ''}`);
      }
    }
  }
  
  if (options.report) {
    await exportReport(analysisResults, options.report);
  }
}

async function exportReport(analysisResults, format) {
  const spinner = ora(`Exporting report as ${format}...`).start();
  
  try {
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const filename = `sniff-report-${timestamp}.${format === 'markdown' ? 'md' : 'json'}`;
    
    if (format === 'json') {
      await fs.writeJson(filename, analysisResults, { spaces: 2 });
    } else if (format === 'markdown') {
      const markdown = generateMarkdownReport(analysisResults);
      await fs.writeFile(filename, markdown);
    } else {
      throw new Error(`Unsupported report format: ${format}`);
    }
    
    spinner.succeed(`Report exported to ${chalk.bold(filename)}`);
  } catch (error) {
    spinner.fail(`Failed to export report: ${error.message}`);
    throw error;
  }
}

function generateMarkdownReport(analysisResults) {
  const { packages, summary } = analysisResults;
  
  let markdown = `# Dependency Analysis Report\n\n`;
  markdown += `Generated on ${new Date().toLocaleString()}\n\n`;
  
  markdown += `## Summary\n\n`;
  markdown += `- Total dependencies analyzed: ${summary.total}\n`;
  markdown += `- Low quality packages: ${summary.lowQuality}\n`;
  markdown += `- Poorly maintained packages: ${summary.lowMaintenance}\n`;
  markdown += `- Outdated packages: ${summary.outdated}\n`;
  markdown += `- Unused packages: ${summary.unused}\n\n`;
  
  markdown += `## Package Analysis\n\n`;
  
  for (const pkg of packages) {
    markdown += `### ${pkg.name} (v${pkg.currentVersion})\n\n`;
    
    if (pkg.description) {
      markdown += `${pkg.description}\n\n`;
    }
    
    const flags = [];
    if (pkg.flags?.lowQuality) flags.push('low quality');
    if (pkg.flags?.lowMaintenance) flags.push('poorly maintained');
    if (pkg.flags?.unused) flags.push('unused');
    if (pkg.flags?.outdated) flags.push('outdated');
    
    if (flags.length > 0) {
      markdown += `**Flags:** ${flags.join(', ')}\n\n`;
    }
    
    if (pkg.flags?.outdated) {
      markdown += `**Current version:** ${pkg.currentVersion}\n`;
      markdown += `**Latest version:** ${pkg.latestVersion}\n\n`;
    }
    
    if (pkg.scores) {
      markdown += `**Scores:**\n`;
      markdown += `- Overall: ${pkg.scores.final.toFixed(2)}\n`;
      markdown += `- Quality: ${pkg.scores.quality.toFixed(2)}\n`;
      markdown += `- Popularity: ${pkg.scores.popularity.toFixed(2)}\n`;
      markdown += `- Maintenance: ${pkg.scores.maintenance.toFixed(2)}\n\n`;
    }
    
    if (pkg.alternatives && pkg.alternatives.length > 0) {
      markdown += `**Alternatives:**\n`;
      for (const alt of pkg.alternatives) {
        markdown += `- **${alt.name}**${alt.description ? ` - ${alt.description}` : ''}\n`;
      }
      markdown += '\n';
    }
  }
  
  return markdown;
}