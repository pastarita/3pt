/** A tiny element builder. Every component in this app is a function: props in, one HTMLElement out. */
export type Child = Node | string | number | null | undefined | false | Child[];
export type Props = { class?: string; style?: string; on?: { [K in keyof HTMLElementEventMap]?: (e: HTMLElementEventMap[K]) => void } } & Record<string, unknown>;

export function h<K extends keyof HTMLElementTagNameMap>(tag: K, props: Props = {}, ...children: Child[]): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = String(v);
    else if (k === 'on') for (const [ev, fn] of Object.entries(v as object)) el.addEventListener(ev, fn as EventListener);
    else if (v === true) el.setAttribute(k, '');
    else el.setAttribute(k, String(v));
  }
  append(el, children);
  return el;
}
export function append(el: Element, children: Child[]): void {
  for (const c of children.flat(Infinity as 1)) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
}
/** Inline SVG from trusted, static markup (icons only). */
export function svg(markup: string): SVGElement {
  const t = document.createElement('template'); t.innerHTML = markup.trim(); return t.content.firstElementChild as SVGElement;
}
