// 3PT signal-pipeline plugin · a decisioning engine pushed into the box pipeline. docs/20-kernel-signals.md §5.
// Contract: module.exports = (signal, ctx) => Signal | Signal[] | null.
//   ctx.seen  a Map the host keeps for you across events (cleared when the plugin reloads)
//   ctx.now() epoch ms · ctx.marker() the current {stage, iteration}
// This one raises a 'finding' signal the second time a media path is opened in the same iteration:
// the read-once rule (policy.contextPolicy.readOnceTranscripts) witnessed at the kernel, not self-reported.
module.exports = (s, ctx) => {
  if (s.kind !== 'open' || !s.attrs.media) return s;
  const key = `${s.iteration}:${s.attrs.path}`;
  const n = (ctx.seen.get(key) ?? 0) + 1;
  ctx.seen.set(key, n);
  if (n < 2) return s;
  return [s, { ...s, kind: 'finding', attrs: { check: 'kernel:read-once', path: s.attrs.path, count: n, by: 'reread-alarm', passed: false } }];
};
