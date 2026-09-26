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
