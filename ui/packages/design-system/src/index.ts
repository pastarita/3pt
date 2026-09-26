/** @3pt/design-system — tokens. Values mirror hub/site/3pt.css (:root). Change there first, then here. */
export const color = {
  bg: '#0f1216', panel: '#151a21', card: '#1a2029', sand: '#1f262f', line: '#2a323d', lineStrong: '#3a4552',
  ink: '#e6e9ee', soft: '#a3adbb', faint: '#6b7684',
  plan: '#8b7cf6', build: '#e0a33a', instrument: '#3fb886',   // the three points
  violet: '#8b7cf6', cyan: '#3aa6d9', amber: '#e0a33a', slate: '#7d8a99',
  flag: '#ff6b4a', good: '#3fb886', warn: '#e0a33a', alert: '#e5534b',
} as const;
export const font = {
  sans: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif',
  serif: 'Georgia,"Iowan Old Style","Times New Roman",serif',
  mono: 'ui-monospace,SFMono-Regular,Menlo,Consolas,monospace',
} as const;
export const radius = 10;
export const stage = { plan: color.plan, build: color.build, instrument: color.instrument } as const;
/** CSS custom properties block, for surfaces that want the tokens as variables. */
export function cssVars(): string {
  return `:root{${Object.entries(color).map(([k, v]) => `--${k}:${v}`).join(';')};--sans:${font.sans};--serif:${font.serif};--mono:${font.mono};--radius:${radius}px}`;
}

/**
 * App theme: the light-first palette for the role-based app (ui/apps/web). The hub's dark tokens
 * above stay the source of truth for the hub. The app is for non-technical people, so it uses a
 * calm light base, one accent, and no mono type. Every color, size and radius the app may use is
 * listed here. The capture suite (ui/apps/web/e2e) counts any computed style outside this list as
 * design-system drift.
 */
export const app = {
  light: {
    bg: '#f7f7f5', surface: '#ffffff', sunk: '#f0efec', line: '#e6e4df', lineStrong: '#d4d1ca',
    ink: '#1d1d1f', soft: '#5f5e5a', faint: '#8e8c86',
    accent: '#2f6fed', accentSoft: '#e8f0fe', onAccent: '#ffffff',
    good: '#1f8a5b', goodSoft: '#e5f4ec', warn: '#b76e00', warnSoft: '#fdf1dc', alert: '#c93c2c', alertSoft: '#fbe9e6',
    scrim: 'rgba(20,20,22,.55)',
  },
  dark: {
    bg: '#161617', surface: '#1f1f21', sunk: '#262628', line: '#323235', lineStrong: '#44444a',
    ink: '#f2f2f0', soft: '#b3b1ab', faint: '#85837e',
    accent: '#6b9cff', accentSoft: '#1d2a45', onAccent: '#0b1020',
    good: '#4cc28a', goodSoft: '#16302a', warn: '#e6a23c', warnSoft: '#3a2c14', alert: '#f07060', alertSoft: '#3d1f1b',
    scrim: 'rgba(0,0,0,.6)',
  },
  /** type scale in px: caption, body, lead, title, display */
  size: { xs: 12, sm: 13, md: 15, lg: 18, xl: 24, xxl: 32 },
  radius: { sm: 8, md: 14, lg: 20, pill: 999 },
  space: { 1: 4, 2: 8, 3: 12, 4: 16, 5: 24, 6: 32, 7: 48 },
  font: '-apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",Roboto,Helvetica,Arial,sans-serif',
} as const;

const kebab = (k: string) => k.replace(/[A-Z]/g, m => '-' + m.toLowerCase());

/** CSS custom properties for the app theme, light by default, dark by system setting or data-theme. */
export function appCssVars(): string {
  const pal = (p: Record<string, string>) => Object.entries(p).map(([k, v]) => `--${kebab(k)}:${v}`).join(';');
  const fixed = [
    ...Object.entries(app.size).map(([k, v]) => `--fs-${k}:${v}px`),
    ...Object.entries(app.radius).map(([k, v]) => `--r-${k}:${v}px`),
    ...Object.entries(app.space).map(([k, v]) => `--s-${k}:${v}px`),
    `--font:${app.font}`,
  ].join(';');
  return `:root{${pal(app.light)};${fixed};color-scheme:light}` +
    `@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){${pal(app.dark)};color-scheme:dark}}` +
    `:root[data-theme="dark"]{${pal(app.dark)};color-scheme:dark}`;
}
