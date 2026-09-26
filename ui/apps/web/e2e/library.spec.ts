/**
 * Component library shots: #/components, full page, light and dark, per viewport.
 * Output: captures/<run>/library/<viewport>-<scheme>.png. The hub Components leaf shows these
 * (copy them to hub/site/components/ with `pnpm library:hub`).
 */
import { test } from '@playwright/test';
import { join } from 'node:path';
import { OUT } from './paths';

for (const scheme of ['light', 'dark'] as const) {
  test(`component library ${scheme}`, async ({ page }, info) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.addInitScript(() => {
      localStorage.setItem('tpt_web_state', JSON.stringify({ role: 'super' }));
      localStorage.setItem('tpt_web_tours', JSON.stringify({ basics: true, project: true, harness: true }));
    });
    await page.goto('./?ff=-tour.autostart#/components');
    await page.locator('[data-region="comp-k1"]').waitFor();
    for (const img of await page.locator('img').all()) await img.scrollIntoViewIfNeeded();
    await page.waitForFunction(() => [...document.images].every(i => i.complete));
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({ path: join(OUT, 'library', `${info.project.name}-${scheme}.png`), fullPage: true, animations: 'disabled' });
  });
}
