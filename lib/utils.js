import chalk from 'chalk';

export function formatScore(score) {
  if (score === undefined || score === null) {
    return chalk.gray('N/A');
  }
  
  const formattedScore = score.toFixed(2);
  
  if (score >= 0.8) {
    return chalk.green(formattedScore);
  } else if (score >= 0.5) {
    return chalk.yellow(formattedScore);
  } else {
    return chalk.red(formattedScore);
  }
}

export function formatVersion(current, latest) {
  return `${chalk.dim(current)} → ${chalk.green(latest)}`;
}

export function truncate(str, maxLength = 80) {
  if (!str || str.length <= maxLength) {
    return str;
  }
  return str.substring(0, maxLength - 3) + '...';
}