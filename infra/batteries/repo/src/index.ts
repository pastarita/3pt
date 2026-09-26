/** git is the checkpoint substrate: one worktree per iteration, one tag per checkpoint. */
export const battery = { name: 'repo', provides: ['repo.worktree', 'repo.tag', 'repo.rollback', 'repo.instantiate'], env: ['GITHUB_TOKEN'] } as const;
export function tagFor(iteration: number): string { return `cp/${iteration}`; }
export function worktreeFor(iteration: number): string { return `.worktrees/iter-${iteration}`; }
