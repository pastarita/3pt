/** `.env.example` ships every key empty with a trailing comment, and systemd's EnvironmentFile passes both through
 *  verbatim (it strips nothing), so `SIGNALS_ITERATION` arrived as "# iteration when there is no marker" and became NULL
 *  in the store (box, 2026-09-26 15:05). Rule: an empty value is unset, a trailing `#` comment is not a value. */
export function envOr(name: string, fallback: string, env: NodeJS.ProcessEnv = process.env): string {
  const v = (env[name] ?? '').replace(/(^|\s+)#.*$/, '').trim();
  return v === '' ? fallback : v;
}
export function envNum(name: string, fallback: number, env: NodeJS.ProcessEnv = process.env): number {
  const n = Number(envOr(name, String(fallback), env)); return Number.isFinite(n) ? n : fallback;
}
/** A placeholder from .env.example (`<user>`), an empty string, or a bare comment is no URI. */
export function atlasUri(env: NodeJS.ProcessEnv = process.env): string | undefined {
  const raw = envOr('ATLAS_URI', '', env);
  return raw && !raw.includes('<') && /^mongodb(\+srv)?:\/\//.test(raw) ? raw : undefined;
}
