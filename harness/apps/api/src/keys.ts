/**
 * The key page and its routes. Node server only (index.ts), never the Worker: the Worker has no gate,
 * and the vault's native binding does not load there. Loopback only, and a POST must come from this
 * page's own origin, so no other site in the browser can write a key. No CORS headers on these routes.
 */
import type { IncomingMessage } from 'node:http';
import { KEYCHAIN_NAMES, VAULT_NAMES, keychainEnv, keychainGet, keychainSet, loadKeys, putSecret, vaultStatus, type KeychainName } from '@3pt/battery-atlas';

/** Where to get each key. */
const META: Record<string, { label: string; get: string; hint: string }> = {
  ATLAS_HOST:         { label: 'Atlas host', get: 'https://cloud.mongodb.com', hint: 'Cluster0 → Connect → Drivers: the part after @, e.g. cluster0.xxxxx.mongodb.net' },
  ATLAS_DBUSER:       { label: 'Atlas database user', get: 'https://cloud.mongodb.com', hint: 'Security → Database Access' },
  ATLAS_DBPASS:       { label: 'Atlas database password', get: 'https://cloud.mongodb.com', hint: 'Set when the user is created' },
  ATLAS_DB:           { label: 'Database name', get: '', hint: 'Blank means 3pt' },
  ATLAS_URI:          { label: 'Atlas URI (instead of the parts)', get: 'https://cloud.mongodb.com', hint: 'Optional. The parts are preferred' },
  ATLAS_CLUSTER:      { label: 'Cluster name', get: '', hint: 'Optional, appName only' },
  THREEPT_MASTER_KEY: { label: 'Vault master key', get: '', hint: 'Made on the first vault save. Never pasted' },
  OPENROUTER_API_KEY: { label: 'OpenRouter', get: 'https://openrouter.ai/keys', hint: 'Every model call' },
  VOYAGE_API_KEY:     { label: 'Voyage AI', get: 'https://dashboard.voyageai.com', hint: 'Embeddings' },
  LANGSMITH_API_KEY:  { label: 'LangSmith', get: 'https://smith.langchain.com/settings', hint: 'Traces' },
  GITHUB_TOKEN:       { label: 'GitHub', get: 'https://github.com/settings/personal-access-tokens', hint: 'Fine-grained, repo scope' },
};
const TESTS: Record<string, (v: string) => Promise<Response>> = {
  OPENROUTER_API_KEY: (v) => fetch('https://openrouter.ai/api/v1/key', { headers: { authorization: `Bearer ${v}` } }),
  GITHUB_TOKEN: (v) => fetch('https://api.github.com/user', { headers: { authorization: `Bearer ${v}`, 'user-agent': '3pt' } }),
};

const isLoopback = (a?: string) => a === '127.0.0.1' || a === '::1' || a === '::ffff:127.0.0.1';
function trusted(req: IncomingMessage, port: number): boolean {
  if (!isLoopback(req.socket.remoteAddress)) return false;
  const host = req.headers.host ?? '';
  if (host !== `127.0.0.1:${port}` && host !== `localhost:${port}`) return false;   // DNS rebinding guard
  if (req.method === 'POST') return req.headers.origin === `http://${host}`;
  return true;
}

type Out = { status: number; type: string; body: string };
const json = (status: number, b: unknown): Out => ({ status, type: 'application/json', body: JSON.stringify(b) });

export async function handleKeys(req: IncomingMessage, url: URL, body: Record<string, unknown>, port: number): Promise<Out | null> {
  if (url.pathname !== '/keys' && !url.pathname.startsWith('/keys/')) return null;
  if (!trusted(req, port)) return json(403, { error: `the key page is local only: open http://127.0.0.1:${port}/keys` });
  const env = () => ({ ...keychainEnv(), ...process.env });
  if (url.pathname === '/keys' && req.method === 'GET') return { status: 200, type: 'text/html; charset=utf-8', body: PAGE };
  if (url.pathname === '/keys/status' && req.method === 'GET') {
    const keychain = KEYCHAIN_NAMES.map((n) => ({ name: n, ...META[n], set: !!keychainGet(n), host: !!process.env[n] }));
    let vault: unknown[], vaultError: string | undefined;
    try { vault = (await vaultStatus(env())).map((s) => ({ ...s, ...META[s.name], host: !!process.env[s.name], test: !!TESTS[s.name] })); }
    catch (e) { vaultError = (e as Error).message; vault = VAULT_NAMES.map((n) => ({ name: n, ...META[n], set: false, test: !!TESTS[n] })); }
    return json(200, { keychain, vault, vaultError });
  }
  if (url.pathname === '/keys/set' && req.method === 'POST') {
    const name = String(body.name ?? ''), value = String(body.value ?? '').trim();
    if (!value) return json(400, { error: 'empty value' });
    try {
      if ((KEYCHAIN_NAMES as readonly string[]).includes(name) && name !== 'THREEPT_MASTER_KEY') keychainSet(name as KeychainName, value);
      else if (VAULT_NAMES.includes(name)) await putSecret(env(), name, value);
      else return json(400, { error: `unknown key ${name}` });
      return json(200, { ok: true });
    } catch (e) { return json(500, { error: (e as Error).message }); }
  }
  if (url.pathname === '/keys/test' && req.method === 'POST') {
    const name = String(body.name ?? ''), t = TESTS[name];
    if (!t) return json(400, { error: 'no test for this key' });
    const v = (await loadKeys())[name];
    if (!v) return json(200, { ok: false, note: 'not set' });
    try { const r = await t(v); return json(200, { ok: r.ok, note: r.ok ? 'works' : `HTTP ${r.status}` }); }
    catch (e) { return json(200, { ok: false, note: (e as Error).message }); }
  }
  return json(404, { error: 'not found' });
}

const PAGE = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>3PT keys</title><style>
:root{--bg:#f6f5f1;--card:#fff;--ink:#1c1b19;--mute:#6b6862;--line:#e3e0d8;--ok:#1f7a4d;--warn:#b25b00;--accent:#2f5bd3}
@media (prefers-color-scheme:dark){:root{--bg:#141412;--card:#1d1c1a;--ink:#ecebe7;--mute:#9a978f;--line:#2e2d2a;--ok:#4fbf86;--warn:#e39a4a;--accent:#7ea0ff}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.45 -apple-system,system-ui,sans-serif}
main{max-width:760px;margin:0 auto;padding:28px 16px 48px}h1{font-size:22px;margin:0 0 4px}p.lede{color:var(--mute);margin:0 0 22px}
h2{font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:var(--mute);margin:26px 0 8px}
.flow{font-size:12px;color:var(--mute);margin-bottom:6px}.flow b{color:var(--ink);font-weight:600}
.card{background:var(--card);border:1px solid var(--line);border-radius:10px}
.row{display:grid;grid-template-columns:1fr auto;gap:6px 12px;padding:12px 14px;border-top:1px solid var(--line)}.row:first-child{border-top:0}
.name{font-weight:600}.env{font:12px ui-monospace,Menlo,monospace;color:var(--mute)}.hint{font-size:12px;color:var(--mute)}
.state{font-size:12px;align-self:start;padding:2px 8px;border-radius:99px;border:1px solid var(--line);white-space:nowrap}
.state.on{color:var(--ok);border-color:currentColor}.state.off{color:var(--warn);border-color:currentColor}
.edit{grid-column:1/-1;display:flex;gap:6px;flex-wrap:wrap}input{flex:1;min-width:180px;padding:7px 9px;border:1px solid var(--line);border-radius:7px;background:var(--bg);color:var(--ink);font:13px ui-monospace,Menlo,monospace}
button,a.get{padding:7px 11px;border-radius:7px;border:1px solid var(--line);background:var(--card);color:var(--ink);font-size:13px;cursor:pointer;text-decoration:none}
button.save{background:var(--accent);border-color:var(--accent);color:#fff}.msg{font-size:12px;color:var(--mute);align-self:center}
.err{color:var(--warn);font-size:13px;margin:8px 0}
</style></head><body><main>
<h1>Keys</h1><p class="lede">Paste each key once. No file holds a key. A saved value is never shown again.</p>
<div class="flow"><b>This Mac</b> · Keychain → the Atlas connection and the vault master key</div>
<div class="flow"><b>Atlas</b> · 3pt.secrets → API keys, encrypted before they leave this Mac (CSFLE)</div>
<h2>1 · Reach Atlas (Keychain)</h2><div class="card" id="kc"></div>
<h2>2 · API keys (Atlas vault)</h2><div id="verr" class="err"></div><div class="card" id="vt"></div>
</main><script>
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function row(k){const d=document.createElement('div');d.className='row';
 const st=k.host?'<span class="state on">host env</span>':k.set?'<span class="state on">set'+(k.last4?' …'+esc(k.last4):'')+'</span>':'<span class="state off">missing</span>';
 const auto=k.name==='THREEPT_MASTER_KEY';
 d.innerHTML='<div><div class="name">'+esc(k.label)+'</div><div class="env">'+esc(k.name)+'</div><div class="hint">'+esc(k.hint)+'</div></div>'+st+
 (auto?'':'<div class="edit"><input type="password" autocomplete="off" placeholder="paste '+(k.set?'a new value':'value')+'">'+
 '<button class="save">Save</button>'+(k.test?'<button class="test">Test</button>':'')+(k.get?'<a class="get" target="_blank" rel="noopener" href="'+esc(k.get)+'">Get key ↗</a>':'')+'<span class="msg"></span></div>');
 if(!auto){const i=d.querySelector('input'),m=d.querySelector('.msg');
  d.querySelector('.save').onclick=async()=>{if(!i.value)return;m.textContent='saving…';const j=await (await fetch('/keys/set',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name:k.name,value:i.value})})).json();i.value='';m.textContent=j.ok?'saved':j.error;if(j.ok)load();};
  const t=d.querySelector('.test');if(t)t.onclick=async()=>{m.textContent='testing…';const j=await (await fetch('/keys/test',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name:k.name})})).json();m.textContent=(j.ok?'✓ ':'✗ ')+(j.note||j.error);};}
 return d}
async function load(){const s=await (await fetch('/keys/status')).json();
 $('#kc').replaceChildren(...s.keychain.filter(k=>k.name!=='ATLAS_CLUSTER').map(row));
 $('#vt').replaceChildren(...s.vault.map(row));
 $('#verr').textContent=s.vaultError?'Vault not reachable yet: '+s.vaultError+'. Fill step 1 first.':'';}
load();
</script></body></html>`;
