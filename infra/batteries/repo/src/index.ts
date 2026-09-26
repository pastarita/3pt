/** git is the checkpoint substrate: one worktree per iteration, one tag per checkpoint. */
import { execFileSync } from 'node:child_process';

export const battery = { name: 'repo', provides: ['repo.worktree', 'repo.tag', 'repo.rollback', 'repo.instantiate'], env: ['GITHUB_TOKEN'] } as const;
export function tagFor(iteration: number): string { return `cp/${iteration}`; }
export function worktreeFor(iteration: number): string { return `.worktrees/iter-${iteration}`; }

const git = (args: string[], cwd?: string) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

/** Repo top level, or null outside a git checkout. */
export function repoRoot(cwd?: string): string | null {
  try { return git(['rev-parse', '--show-toplevel'], cwd); } catch { return null; }
}

export function headSha(cwd?: string): string {
  try { return git(['rev-parse', 'HEAD'], cwd); } catch { return 'unknown'; }
}

/** File content at a ref (`git show <ref>:<path>`), or null when the ref or path is missing. */
export function showAt(ref: string, path: string, cwd?: string): string | null {
  try { return git(['show', `${ref}:${path}`], cwd); } catch { return null; }
}

export function tagExists(tag: string, cwd?: string): boolean {
  try { git(['rev-parse', '-q', '--verify', `refs/tags/${tag}`], cwd); return true; } catch { return false; }
}

/**
 * repo.tag: commit ONLY `paths` (other staged or dirty files stay untouched), then tag that commit.
 * Returns the snapshot sha. Refuses to move an existing tag: a checkpoint is immutable.
 */
export function snapshot(opts: { tag: string; paths: string[]; message: string; cwd?: string }): string {
  const { tag, paths, message, cwd } = opts;
  if (tagExists(tag, cwd)) throw new Error(`repo.tag: ${tag} already exists; checkpoints are immutable`);
  git(['add', '--', ...paths], cwd);
  git(['commit', '--only', '-m', message, '--', ...paths], cwd);
  git(['tag', tag], cwd);
  return headSha(cwd);
}
