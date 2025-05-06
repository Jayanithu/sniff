import ora from 'ora';
import fetch from 'node-fetch';
import chalk from 'chalk';

const KNOWN_ALTERNATIVES = {
  'request': ['node-fetch', 'axios', 'got', 'undici'],
  'moment': ['date-fns', 'dayjs', 'luxon'],
  'lodash': ['ramda', 'radash', 'remeda'],
  'jquery': ['cash-dom', 'umbrella', 'zepto'],
  'express': ['fastify', 'koa', 'hapi'],
  'mongoose': ['prisma', 'typeorm', 'sequelize'],
  'mocha': ['jest', 'vitest', 'ava'],
  'gulp': ['esbuild', 'vite', 'webpack'],
  'grunt': ['npm scripts', 'vite', 'webpack'],
  'babel': ['esbuild', 'swc', 'typescript'],
  'webpack': ['vite', 'esbuild', 'rollup'],
  'eslint': ['biome', 'oxlint', 'standardjs']
};

export async function suggestAlternatives(analysisResults, options) {
  const spinner = ora('Finding alternative packages...').start();
  
  try {
    const { packages } = analysisResults;
    const packagesToSuggest = packages.filter(pkg => 
      pkg.flags?.lowQuality || 
      pkg.flags?.lowMaintenance || 
      pkg.flags?.outdated
    );
    
    if (packagesToSuggest.length === 0) {
      spinner.info('No packages need alternatives');
      return analysisResults;
    }
    
    for (const pkg of packagesToSuggest) {
      if (KNOWN_ALTERNATIVES[pkg.name]) {
        pkg.alternatives = KNOWN_ALTERNATIVES[pkg.name].map(name => ({ name }));
        continue;
      }
      
      try {
        const keywords = pkg.description ? 
          pkg.description.split(' ').filter(word => word.length > 4).slice(0, 3) : 
          [pkg.name];
        
        const searchQuery = encodeURIComponent(keywords.join(' '));
        const response = await fetch(`https://api.npms.io/v2/search?q=${searchQuery}&size=5`);
        
        if (!response.ok) {
          throw new Error(`Failed to search alternatives: ${response.statusText}`);
        }
        
        const searchResults = await response.json();
        
        pkg.alternatives = searchResults.results
          .filter(result => result.package.name !== pkg.name)
          .slice(0, 3)
          .map(result => ({
            name: result.package.name,
            description: result.package.description,
            score: result.score.final
          }));
      } catch (error) {
        pkg.alternatives = [];
        console.error(`Failed to find alternatives for ${pkg.name}: ${error.message}`);
      }
    }
    
    spinner.succeed(`Found alternatives for ${packagesToSuggest.length} packages`);
    return analysisResults;
  } catch (error) {
    spinner.fail(`Failed to suggest alternatives: ${error.message}`);
    throw error;
  }
}