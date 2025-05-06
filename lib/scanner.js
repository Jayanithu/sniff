import fs from 'fs-extra';
import path from 'path';
import ora from 'ora';
import chalk from 'chalk';
import depcheck from 'depcheck';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function scanProject(options) {
  const spinner = ora('Scanning project files...').start();
  
  try {
    const packageJsonPath = path.resolve(process.cwd(), 'package.json');
    if (!await fs.pathExists(packageJsonPath)) {
      spinner.fail('No package.json found in the current directory');
      throw new Error('No package.json found in the current directory');
    }
    
    const packageJson = await fs.readJson(packageJsonPath);
    
    const allDependencies = {
      ...packageJson.dependencies || {},
      ...packageJson.devDependencies || {}
    };
    
    let dependencies = allDependencies;
    if (options.top) {
      const depEntries = Object.entries(allDependencies);
      dependencies = Object.fromEntries(depEntries.slice(0, options.top));
    }
    
    let outdatedPackages = {};
    if (options.outdated) {
      spinner.text = 'Checking for outdated packages...';
      try {
        const { stdout } = await execAsync('npm outdated --json');
        outdatedPackages = JSON.parse(stdout || '{}');
      } catch (error) {
        if (error.stdout) {
          outdatedPackages = JSON.parse(error.stdout || '{}');
        }
      }
    }
    
    let unusedDependencies = [];
    if (options.unused) {
      spinner.text = 'Detecting unused dependencies...';
      const depcheckResults = await depcheck(process.cwd(), {});
      unusedDependencies = [
        ...depcheckResults.dependencies,
        ...depcheckResults.devDependencies
      ];
    }
    
    const lockFileData = {};
    const packageLockPath = path.resolve(process.cwd(), 'package-lock.json');
    const pnpmLockPath = path.resolve(process.cwd(), 'pnpm-lock.yaml');
    
    if (await fs.pathExists(packageLockPath)) {
      lockFileData.type = 'npm';
      lockFileData.path = packageLockPath;
    } else if (await fs.pathExists(pnpmLockPath)) {
      lockFileData.type = 'pnpm';
      lockFileData.path = pnpmLockPath;
    }
    
    spinner.succeed('Project scan completed');
    
    return {
      name: packageJson.name,
      dependencies,
      allDependencies,
      outdatedPackages,
      unusedDependencies,
      lockFileData
    };
  } catch (error) {
    spinner.fail(`Failed to scan project: ${error.message}`);
    throw error;
  }
}