/** App state: who is looking, and where. Kept in the URL hash (route) and localStorage (role). */
export const ROLES = [
  { id: 'super', name: 'Superintendent' }, { id: 'pm', name: 'Project manager' }, { id: 'owner', name: 'Owner / executive' },
  { id: 'pe', name: 'Project engineer' }, { id: 'trade', name: 'Plumbing foreman' }, { id: 'safety', name: 'Safety manager' },
] as const;
export type Route = { page: 'home' } | { page: 'project'; id: string } | { page: 'harness' };

export function route(): Route {
  const [a, b] = location.hash.replace(/^#\/?/, '').split('/');
  if (a === 'p' && b) return { page: 'project', id: b };
  if (a === 'harness') return { page: 'harness' };
  return { page: 'home' };
}
export function getRole(): string { try { return localStorage.getItem('3pt_role') ?? 'super'; } catch { return 'super'; } }
export function setRole(r: string): void { try { localStorage.setItem('3pt_role', r); } catch { /* private mode */ } }
