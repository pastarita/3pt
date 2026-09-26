/**
 * Capture suite: runs every flow in flows.ts on every viewport and saves one screenshot per step,
 * plus a JSON record with the numbers a machine can check without a model:
 *   drift    computed colors, font sizes and radii that are not design tokens
 *   density  words and tap targets on screen (a proxy for "too much at once")
 *   regions  the box of every [data-region] on screen, so a reviewer can crop one part
 * Output: captures/<run>/<viewport>/<flow>/<NN>-<step>.png and <flow>.json beside them.
 * teardown.ts merges the JSON into captures/<run>/manifest.json and flowmap.json.
 * Conventions: docs/17-ui-capture.md.
 */
import { test, expect, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { app } from '@3pt/design-system';
import { FLOWS, type Flow } from './flows';
import { OUT } from './paths';


/** Token values as the browser reports them (rgb()/rgba() strings and px). */
function tokenSets() {
  const rgb = (v: string) => {
    if (v.startsWith('rgba')) { const [r, g, b, a] = v.slice(5, -1).split(',').map(s => s.trim()); return `rgba(${r}, ${g}, ${b}, ${Number(a)})`; }
    const n = parseInt(v.slice(1), 16);
    return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
  };
  return {
    colors: [...Object.values(app.light), 'rgba(0, 0, 0, 0)'].map(v => (v.startsWith('#') || v.startsWith('rgba(') && v.includes('.')) && !v.includes(' ') ? rgb(v) : v),
    sizes: Object.values(app.size).map(v => `${v}px`),
    radii: ['0px', ...Object.values(app.radius).map(v => `${v}px`)],
  };
}

async function measure(page: Page, tokens: ReturnType<typeof tokenSets>) {
  return page.evaluate(({ tokens }) => {
    const off = { colors: {} as Record<string, number>, fontSizes: {} as Record<string, number>, radii: {} as Record<string, number> };
    const bump = (m: Record<string, number>, k: string) => { m[k] = (m[k] ?? 0) + 1; };
    const inView = (r: DOMRect) => r.width > 0 && r.height > 0 && r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < innerWidth;
    let words = 0, targets = 0;
    for (const el of document.querySelectorAll<HTMLElement>('body *')) {
      if (el.closest('[data-photo]') || el.closest('svg')) continue;          // photos are content, not chrome
      const r = el.getBoundingClientRect();
      if (!inView(r)) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) === 0) continue;
      const hasText = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent!.trim());
      if (hasText) {
        words += [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent!.trim().split(/\s+/).filter(Boolean).length).reduce((a, b) => a + b, 0);
        if (!tokens.colors.includes(cs.color)) bump(off.colors, `color ${cs.color}`);
        if (!tokens.sizes.includes(cs.fontSize)) bump(off.fontSizes, cs.fontSize);
      }
      if (!tokens.colors.includes(cs.backgroundColor)) bump(off.colors, `background ${cs.backgroundColor}`);
      for (const side of ['Top', 'Right', 'Bottom', 'Left'] as const) {
        const w = parseFloat(cs.getPropertyValue(`border-${side.toLowerCase()}-width`));
        const c = cs.getPropertyValue(`border-${side.toLowerCase()}-color`);
        if (w > 0 && cs.getPropertyValue(`border-${side.toLowerCase()}-style`) !== 'none' && !tokens.colors.includes(c)) bump(off.colors, `border ${c}`);
      }
      for (const k of ['borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomLeftRadius', 'borderBottomRightRadius'] as const) {
        if (!tokens.radii.includes(cs[k])) bump(off.radii, cs[k]);
      }
      if (el.matches('a[href],button,select,textarea,input') && !(el as HTMLButtonElement).disabled) targets++;
    }
    const regions: Record<string, { x: number; y: number; w: number; h: number }> = {};
    for (const el of document.querySelectorAll<HTMLElement>('[data-region]')) {
      const r = el.getBoundingClientRect();
      if (inView(r)) regions[el.dataset.region!] = { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
    }
    const smallTargets = [...document.querySelectorAll<HTMLElement>('a[href],button,select,textarea')]
      .map(e => e.getBoundingClientRect()).filter(r => inView(r) && (r.width < 24 || r.height < 24)).length;
    const a = (window as unknown as { __app?: { route: unknown; role: unknown; tour: unknown; flags: unknown } }).__app;
    return {
      screen: document.querySelector('main')?.getAttribute('data-screen'), route: location.hash, state: a,
      drift: { ...off, total: Object.values(off.colors).concat(Object.values(off.fontSizes), Object.values(off.radii)).reduce((x, y) => x + y, 0) },
      density: { words, targets, smallTargets, regions: Object.keys(regions).length },
      regions,
    };
  }, { tokens });
}

async function seed(page: Page, flow: Flow) {
  await page.addInitScript(({ role, toursSeen, visits }) => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    localStorage.clear();
    if (role) localStorage.setItem('tpt_web_state', JSON.stringify({ role, visits: visits ?? 0 }));
    if (toursSeen) localStorage.setItem('tpt_web_tours', JSON.stringify({ basics: true, project: true, harness: true }));
  }, { role: flow.role, toursSeen: !!flow.toursSeen, visits: flow.visits });
}

for (const flow of FLOWS) {
  test(`flow ${flow.id}`, async ({ page }, info) => {
    const viewport = info.project.name;
    const dir = join(OUT, viewport, flow.id);
    mkdirSync(dir, { recursive: true });
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await seed(page, flow);
    await page.goto(`./${flow.flags ? `?ff=${flow.flags}` : ''}${flow.start}`);
    const tokens = tokenSets();
    const shots = [];
    let n = 0;
    for (const step of flow.steps) {
      const res = await step.run(page);
      if (res === 'skip') continue;
      await page.waitForFunction(() => [...document.images].filter(i => i.loading !== 'lazy' || i.getBoundingClientRect().top < innerHeight).every(i => i.complete));
      await page.waitForTimeout(120);
      const file = `${String(++n).padStart(2, '0')}-${step.id}.png`;
      await page.screenshot({ path: join(dir, file), animations: 'disabled', caret: 'hide' });
      shots.push({ file: join(viewport, flow.id, file), step: step.id, intent: step.intent, ...(await measure(page, tokens)) });
    }
    writeFileSync(join(dir, `${flow.id}.json`), JSON.stringify({ flow: flow.id, role: flow.role, intent: flow.intent, flags: flow.flags ?? '', viewport, errors, shots }, null, 2));
    expect(errors, 'page errors').toEqual([]);
    expect(shots.length).toBeGreaterThan(0);
  });
}
