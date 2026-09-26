import test from 'node:test';
import assert from 'node:assert/strict';
import { Script } from 'node:vm';
import { handleKeys } from '../dist/keys.js';

test('connection tests reject remote clients, foreign origins and DNS rebinding before loading keys', async () => {
  const valid = { method: 'POST', socket: { remoteAddress: '127.0.0.1' }, headers: { host: '127.0.0.1:8787', origin: 'http://127.0.0.1:8787' } };
  for (const request of [
    { ...valid, socket: { remoteAddress: '10.0.0.1' } },
    { ...valid, headers: { ...valid.headers, origin: 'https://example.com' } },
    { ...valid, headers: { ...valid.headers, host: 'attacker.example:8787' } },
    { ...valid, headers: { host: valid.headers.host } },
  ]) assert.equal((await handleKeys(request, new URL('http://localhost:8787/keys/check'), {}, 8787)).status, 403);
});
test('setup page offers one connection check and its browser script parses', async () => {
  const page = await handleKeys({ method: 'GET', socket: { remoteAddress: '127.0.0.1' }, headers: { host: '127.0.0.1:8787' } }, new URL('http://localhost:8787/keys'), {}, 8787);
  assert.equal(page.status, 200); assert.match(page.body, /Test connections/);
  assert.doesNotMatch(page.body, /<h2>.*Keychain/);
  new Script(page.body.match(/<script>([\s\S]*?)<\/script>/)[1]);
});
