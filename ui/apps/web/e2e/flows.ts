/**
 * The UX flow map. Each flow is a list of steps a real person takes. The capture spec runs every
 * flow on every viewport and saves one screenshot per step, so the image review loop can judge
 * each step in the context of the step before it. Add a flow here, not in the spec.
 */
import type { Page } from '@playwright/test';

export type RoleId = 'super' | 'pm' | 'owner' | 'trade' | 'safety';
/** `run` returns 'skip' when the step does not apply on this viewport; no screenshot is taken. */
export interface Step { id: string; intent: string; run: (page: Page) => Promise<void | 'skip'> }
export interface Flow {
  id: string; role: RoleId | null; intent: string;
  flags?: string;            // the ?ff= value, e.g. "presenter,-tour.autostart"
  toursSeen?: boolean;       // true: start with every tour marked seen
  visits?: number;           // start as a returning user (drives progressive disclosure)
  start: string;             // hash route to open first
  steps: Step[];
}

const tourNext = async (page: Page): Promise<void | 'skip'> => {
  const next = page.locator('[data-tour="next"]');
  if (!(await next.count())) return 'skip';
  const label = await next.textContent();
  await next.click();
  if (label === 'Done') return 'skip';
  await page.waitForTimeout(150);
};
const tourOpen = (page: Page) => page.locator('#tour .tour-pop').waitFor();
const firstLive = (page: Page) => page.locator('a.pcard').first().click();

export const FLOWS: Flow[] = [
  { id: 'first-run', role: null, intent: 'A new site lead opens the app for the first time and takes the tips.', start: '#/', steps: [
    { id: 'setup', intent: 'Asked one question: what is your job?', run: async p => { await p.locator('[data-region="role-picker"]').waitFor(); } },
    { id: 'home-tip-1', intent: 'Lands on their projects; tip 1 points at them.', run: async p => { await p.locator('[data-id="super"]').click(); await tourOpen(p); } },
    { id: 'home-tip-2', intent: 'Next tip, if the screen has one.', run: tourNext },
    { id: 'home-tip-3', intent: 'Next tip, if the screen has one.', run: tourNext },
    { id: 'home-tip-4', intent: 'Next tip, if the screen has one.', run: tourNext },
    { id: 'home-tip-5', intent: 'Next tip, if the screen has one.', run: tourNext },
    { id: 'home-tip-6', intent: 'Next tip, if the screen has one.', run: tourNext },
    { id: 'home-calm', intent: 'Tips done; the calm home screen.', run: async p => { while (await p.locator('[data-tour="next"]').count()) await p.locator('[data-tour="next"]').click(); await p.locator('#tour').waitFor({ state: 'detached' }); } },
    { id: 'project-tip-1', intent: 'Opens the live project; the project tour starts.', run: async p => { await firstLive(p); await tourOpen(p); } },
    { id: 'project-first-look', intent: 'Skips the tips; three cards only.', run: async p => { await p.locator('[data-tour="skip"]').first().click(); await p.locator('#tour').waitFor({ state: 'detached' }); } },
  ] },
  ...(['super', 'pm', 'owner', 'trade', 'safety'] as const).map((role): Flow => ({
    id: `day-${role}`, role, toursSeen: true, flags: '-tour.autostart', intent: `A ${role} checks in, opens their live project, and asks one question.`, start: '#/', steps: [
      { id: 'home', intent: 'Their projects, and the assistant on the right.', run: async p => { await p.locator('[data-region="projects"]').waitFor(); } },
      { id: 'project', intent: 'Opens the live project; first three cards.', run: async p => { await firstLive(p); await p.locator('[data-region="banner"]').waitFor(); } },
      { id: 'project-more', intent: 'Asks for the rest of the cards.', run: async p => { const m = p.locator('[data-region="more"]'); if (await m.count()) await m.click(); } },
      { id: 'ask', intent: 'Taps the first quick question; reads the answer.', run: async p => {
        const fab = p.locator('[data-region="ask-fab"]'); if (await fab.isVisible()) await fab.click();
        await p.locator('[data-region="quick"] .chip').first().click(); await p.locator('.msg.ai').waitFor(); } },
    ],
  })),
  { id: 'presenter', role: 'super', toursSeen: true, visits: 2, flags: 'presenter,-tour.autostart', intent: 'A presenter explains how the assistant learns, on a live project.', start: '#/p/towerb', steps: [
    { id: 'project', intent: 'All cards open in presenter mode.', run: async p => { await p.locator('[data-region="banner"]').waitFor(); } },
    { id: 'harness-1', intent: 'Tip: it spots repeat work.', run: async p => { await p.locator('[data-act="tour"][data-id="harness"]').click(); await tourOpen(p); } },
    { id: 'harness-2', intent: 'Tip: it changes itself.', run: tourNext },
    { id: 'harness-3', intent: 'Tip: you stay in charge (undo).', run: tourNext },
    { id: 'harness-4', intent: 'Tip: same assistant, every role.', run: tourNext },
  ] },
];
