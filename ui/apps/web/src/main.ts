import { cssVars, stage } from '@3pt/design-system';
import { createClient } from '@3pt/inspector-client';

const style = document.createElement('style');
style.textContent = cssVars() + `body{margin:0;background:var(--bg);color:var(--ink);font-family:var(--sans)}main{max-width:900px;margin:0 auto;padding:24px}
.pt{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:6px;vertical-align:middle}pre{background:var(--panel);border:1px solid var(--line);border-radius:var(--radius);padding:12px;overflow:auto}`;
document.head.appendChild(style);

const api = createClient(import.meta.env.VITE_THREEPT_API_URL ?? 'http://127.0.0.1:8787');
const app = document.getElementById('app')!;
app.innerHTML = `<h1>3PT · inspector</h1><p>${(['plan', 'build', 'instrument'] as const).map(s => `<span class="pt" style="background:${stage[s]}"></span>${s}`).join(' &nbsp; ')}</p><pre id="out">connecting…</pre>`;
const out = document.getElementById('out')!;
api.latestPolicy().then(p => { out.textContent = JSON.stringify(p, null, 2); }).catch(e => { out.textContent = `api unreachable: ${e.message}\nstart it with: pnpm --filter @3pt/api build && node harness/apps/api/dist/index.js`; });
