const { execSync } = require('child_process');
const fs = require('fs');

const prs = [365, 364, 360];
const repo = 'Moeabdelaziz007/AxiomID';

let output = '';

for (const pr of prs) {
  output += `\n\n=== PR #${pr} ===\n`;
  try {
    const reviews = JSON.parse(execSync(`gh api repos/${repo}/pulls/${pr}/reviews`).toString());
    const comments = JSON.parse(execSync(`gh api repos/${repo}/pulls/${pr}/comments`).toString());
    const issueComments = JSON.parse(execSync(`gh api repos/${repo}/issues/${pr}/comments`).toString());
    
    output += `\n--- Reviews ---\n`;
    reviews.forEach(r => output += `[${r.user.login}]: ${r.body}\n`);
    
    output += `\n--- Review Comments ---\n`;
    comments.forEach(c => output += `[${c.user.login}] on ${c.path}:\n${c.body}\n\n`);
    
    output += `\n--- Issue Comments ---\n`;
    issueComments.forEach(c => output += `[${c.user.login}]:\n${c.body}\n\n`);
  } catch (e) {
    output += `Error fetching PR ${pr}: ${e.message}\n`;
  }
}

fs.writeFileSync('pr_comments_summary.txt', output);
console.log('Saved to pr_comments_summary.txt');
