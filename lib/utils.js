import chalk from 'chalk';

/**
 * Formats a score with color coding
 * @param {number} score - Score value (0-1)
 * @returns {string} Formatted score
 */
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

/**
 * Formats version comparison
 * @param {string} current - Current version
 * @param {string} latest - Latest version
 * @returns {string} Formatted version comparison
 */
export function formatVersion(current, latest) {
  return `${chalk.dim(current)} → ${chalk.green(latest)}`;
}

/**
 * Truncates a string to a maximum length
 * @param {string} str - String to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated string
 */
export function truncate(str, maxLength = 80) {
  if (!str || str.length <= maxLength) {
    return str;
  }
  return str.substring(0, maxLength - 3) + '...';
}