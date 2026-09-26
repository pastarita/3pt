import test from 'node:test';
import assert from 'node:assert/strict';
import { checkBatteries, checkDeployment } from '../dist/index.js';

const pass = async () => ({ status: 'pass', code: 'verified', detail: 'Round trip passed.' });
const json = (body, status = 200) => new Response(JSON.stringify(body), { status });
test('missing required keys are not ready; absent optional services are explicit', async () => {
  let requests = 0;
  const report = await checkBatteries({}, { atlas: pass, fetch: async () => { requests++; return json({}); } });
  assert.equal(report.ready, false); assert.equal(requests, 0);
  assert.equal(report.checks.find(c => c.id === 'models').status, 'missing');
  assert.equal(report.checks.find(c => c.id === 'github').required, false);
});
test('presence never substitutes for valid authentication; no secret or provider error is returned', async () => {
  const secret = 'super-secret-example';
  const report = await checkBatteries({ OPENROUTER_API_KEY: secret }, {
    atlas: pass, fetch: async (_url, options) => {
      assert.equal(options.headers.authorization, `Bearer ${secret}`);
      assert.equal(options.redirect, 'error'); assert.ok(options.signal);
      return json({ error: secret }, 401);
    },
  });
  assert.equal(report.ready, false);
  assert.equal(report.checks.find(c => c.id === 'models').code, 'authentication');
  assert.equal(JSON.stringify(report).includes(secret), false);
});
test('optional services may be absent, but a configured failing service prevents a ready result', async () => {
  const keys = { OPENROUTER_API_KEY: 'configured' };
  assert.equal((await checkBatteries(keys, { atlas: pass, fetch: async () => json({ data: { limit: 1 } }) })).ready, true);
  const bad = await checkBatteries({ ...keys, GITHUB_TOKEN: 'configured' }, { atlas: pass,
    fetch: async url => url.includes('github') ? json({}, 403) : json({ data: {} }) });
  assert.equal(bad.ready, false); assert.equal(bad.checks.find(c => c.id === 'github').code, 'permission');
});
test('timeouts, rate limits and malformed success responses never pass', async () => {
  for (const fetch of [async () => { throw new Error('secret-url'); }, async () => json({}, 429), async () => json({})]) {
    const report = await checkBatteries({ OPENROUTER_API_KEY: 'configured' }, { atlas: pass, fetch });
    assert.equal(report.ready, false); assert.notEqual(report.checks[1].status, 'pass');
    assert.equal(JSON.stringify(report).includes('secret-url'), false);
  }
});
test('database failure remains visible even when service authentication succeeds', async () => {
  const report = await checkBatteries({ OPENROUTER_API_KEY: 'configured' }, { fetch: async () => json({ data: {} }),
    atlas: async () => ({ status: 'fail', code: 'permission', detail: 'Write denied.' }) });
  assert.equal(report.ready, false); assert.equal(report.checks[0].code, 'permission');
});
test('deployed readiness requires a healthy Atlas-backed response, not just HTTP 200', async () => {
  for (const body of [{ ok: true }, { ok: true, store: 'memory' }, { ok: false, store: 'atlas' }]) {
    assert.notEqual((await checkDeployment('https://example.com', async () => json(body))).status, 'pass');
  }
  assert.equal((await checkDeployment('https://example.com', async () => json({ ok: true, store: 'atlas' }))).status, 'pass');
  assert.equal((await checkDeployment('https://example.com', async () => json({}, 503))).code, 'deployment');
});
