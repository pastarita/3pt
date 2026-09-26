import { execSync } from 'node:child_process';
const sha = execSync('git rev-parse --short HEAD').toString().trim();
console.log(`[repo] at ${sha}; worktrees under .worktrees/, tags cp/<n>. GITHUB_TOKEN ${process.env.GITHUB_TOKEN ? 'set' : 'unset'} (needed only to instantiate a new remote)`);
