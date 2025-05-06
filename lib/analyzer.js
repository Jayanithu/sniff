import ora from 'ora';
import fetch from 'node-fetch';
import chalk from 'chalk';
import { formatScore } from './utils.js';

const NPMS_API_URL = 'https://api.npms.io/v2/package/';
const NPMS_BULK_API_URL = 'https://api.npms.io/v2/package/mget';

export async function analyzePackages(projectData, options) {
  const spinner = ora('Analyzing packages using npms.io...').start();
  
  try {
    const { dependencies } = projectData;
    const packageNames = Object.keys(dependencies);
    
    if (packageNames.length === 0) {
      spinner.info('No dependencies found to analyze');
      return { packages: [] };
    }
    
    const batchSize = 50;
    const batches = [];
    
    for (let i = 0; i < packageNames.length; i += batchSize) {
      batches.push(packageNames.slice(i, i + batchSize));
    }
    
    let packagesData = [];
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      spinner.text = `Analyzing packages (batch ${i + 1}/${batches.length})...`;
      
      const response = await fetch(NPMS_BULK_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(batch)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch package data: ${response.statusText}`);
      }
      
      const batchData = await response.json();
      
      for (const packageName of batch) {
        const packageInfo = batchData[packageName];
        const currentVersion = dependencies[packageName];
        
        if (!packageInfo) {
          packagesData.push({
            name: packageName,
            currentVersion,
            error: 'Package not found in npms.io'
          });
          continue;
        }
        
        const { score, collected } = packageInfo;
        const { metadata } = collected;
        
        packagesData.push({
          name: packageName,
          currentVersion,
          latestVersion: metadata.version,
          isOutdated: currentVersion !== metadata.version,
          description: metadata.description,
          links: metadata.links,
          scores: {
            final: score.final,
            quality: score.detail.quality,
            popularity: score.detail.popularity,
            maintenance: score.detail.maintenance
          },
          flags: {
            lowQuality: score.detail.quality < 0.5,
            lowMaintenance: score.detail.maintenance < 0.5,
            unused: projectData.unusedDependencies?.includes(packageName) || false,
            outdated: packageName in projectData.outdatedPackages
          }
        });
      }
    }
    
    packagesData.sort((a, b) => {
      if (!a.scores?.final) return 1;
      if (!b.scores?.final) return -1;
      return a.scores.final - b.scores.final;
    });
    
    spinner.succeed(`Analyzed ${packagesData.length} packages`);
    
    return {
      packages: packagesData,
      summary: {
        total: packagesData.length,
        lowQuality: packagesData.filter(p => p.flags?.lowQuality).length,
        lowMaintenance: packagesData.filter(p => p.flags?.lowMaintenance).length,
        unused: packagesData.filter(p => p.flags?.unused).length,
        outdated: packagesData.filter(p => p.flags?.outdated).length
      }
    };
  } catch (error) {
    spinner.fail(`Failed to analyze packages: ${error.message}`);
    throw error;
  }
}