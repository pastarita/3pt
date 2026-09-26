/** One readiness report for the setup page and CLI. Values and provider response bodies never leave here. */
export type CheckStatus = 'pass' | 'missing' | 'fail' | 'unverified';
export interface ProbeResult { status: CheckStatus; code: string; detail: string }
export interface BatteryCheck extends ProbeResult { id: string; label: string; required: boolean; checkedAt: string; durationMs: number }
export interface BatteryReport { ready: boolean; checkedAt: string; checks: BatteryCheck[] }
type Keys = Readonly<Record<string, string | undefined>>;
type Http = (url: string, init?: RequestInit) => Promise<Response>;
export const configured = (s?: string): s is string => !!s?.trim() && !s.includes('<');
const result = (status: CheckStatus, code: string, detail: string): ProbeResult => ({ status, code, detail });

function httpFailure(status: number): ProbeResult {
  if (status === 401) return result('fail', 'authentication', 'The service rejected this key. Save a valid key and test again.');
  if (status === 403) return result('fail', 'permission', 'The key does not have access to this service. Check its permissions.');
  if (status === 402) return result('fail', 'credits', 'Add service credits or raise this key’s spending limit.');
  if (status === 429) return result('unverified', 'rate_limit', 'The service is rate limited. Wait and test again.');
  return result('fail', 'service', `The service returned HTTP ${status}. Try again or check its status page.`);
}
export async function checkBatteries(keys: Keys, probes: { atlas(): Promise<ProbeResult>; fetch?: Http }): Promise<BatteryReport> {
  const http = probes.fetch ?? fetch;
  const run = async (id: string, label: string, required: boolean, task: () => Promise<ProbeResult>): Promise<BatteryCheck> => {
    const start = Date.now(); let r: ProbeResult;
    try { r = await task(); } catch { r = result('fail', 'network', 'Could not reach the service. Check the connection and try again.'); }
    return { id, label, required, ...r, checkedAt: new Date().toISOString(), durationMs: Date.now() - start };
  };
  const provider = (name: string, url: string, verify: (j: any) => boolean, headers: (key: string) => Record<string, string> = k => ({ authorization: `Bearer ${k}` }), options: RequestInit = {}) => async (): Promise<ProbeResult> => {
    const key = keys[name]?.trim();
    if (!configured(key)) return result('missing', 'missing', 'No key is configured.');
    const response = await http(url, { ...options, headers: { ...headers(key), 'content-type': 'application/json' }, redirect: 'error', signal: AbortSignal.timeout(12_000) });
    if (!response.ok) { await response.body?.cancel(); return httpFailure(response.status); }
    let json: unknown;
    try { json = await response.json(); } catch { return result('fail', 'response', 'The service returned an unexpected response.'); }
    return verify(json) ? result('pass', 'verified', 'Connected and authenticated.') : result('fail', 'response', 'The service response did not confirm access.');
  };
  const checks = await Promise.all([
    run('atlas', 'Database', true, probes.atlas),
    run('models', 'Models', true, provider('OPENROUTER_API_KEY', 'https://openrouter.ai/api/v1/key', j => !!j?.data && typeof j.data === 'object')),
    // One short embedding verifies usable access; no user documents are sent.
    run('embeddings', 'Embeddings', false, provider('VOYAGE_API_KEY', 'https://api.voyageai.com/v1/embeddings', j => Array.isArray(j?.data?.[0]?.embedding), undefined,
      { method: 'POST', body: JSON.stringify({ input: ['3PT connection check'], model: 'voyage-3.5-lite', input_type: 'document' }) })),
    run('tracing', 'Tracing', false, provider('LANGSMITH_API_KEY', 'https://api.smith.langchain.com/sessions?limit=1', j => Array.isArray(j), k => ({ 'x-api-key': k }))),
    run('github', 'Code repository', false, provider('GITHUB_TOKEN', 'https://api.github.com/repos/pastarita/3pt', j => j?.full_name === 'pastarita/3pt', k => ({ authorization: `Bearer ${k}`, 'user-agent': '3pt-setup', accept: 'application/vnd.github+json' }))),
  ]);
  return { ready: checks.every(c => c.status === 'pass' || (!c.required && c.status === 'missing')), checkedAt: new Date().toISOString(), checks };
}

/** Reach the deployed API, rather than assuming a local saved key has reached production. No secrets sent. */
export async function checkDeployment(url: string, http: Http = fetch): Promise<ProbeResult> {
  try {
    const response = await http(new URL('/health', url).href, { redirect: 'error', signal: AbortSignal.timeout(15_000) });
    if (!response.ok) { await response.body?.cancel(); return result('fail', 'deployment', `The deployed API returned HTTP ${response.status}. Check its connection settings and network access.`); }
    const data = await response.json() as { ok?: boolean; store?: string };
    if (data.ok !== true) return result('fail', 'response', 'The deployed API did not report healthy.');
    if (data.store === 'atlas') return result('pass', 'verified', 'The deployed API connected to Atlas and read its state.');
    if (data.store === 'memory') return result('fail', 'volatile', 'The deployed API is using temporary memory. Configure its database connection.');
    return result('unverified', 'health_contract', 'The deployed health endpoint does not report database connectivity. Update it before treating this deployment as verified.');
  } catch { return result('fail', 'network', 'The deployed API could not be reached.'); }
}
