# ui/ — the surfaces

Every surface is an **inspector** over harness state read through `@3pt/api`. The rules make the
UI secondary; nothing here classifies images or is the headline. Turborepo convention inside the lane:

| Path | Package | Runs | What |
|---|---|---|---|
| `apps/pwa` | `@3pt/pwa` | local, installable | Vite + TypeScript PWA (manifest + service worker). The supervisory view for the operator. |
| `apps/web` | `@3pt/web` | deployed | The role-based app for non-technical users: projects on the left, the assistant on the right, familiar role screens with harness insights on top (`docs/18-role-ui-case-study.md`). Tours and feature flags in `src/tour.ts`, `src/flags.ts`. `pnpm capture` runs the Playwright capture suite (`docs/17-ui-capture.md`). Deploy target: Cloudflare Pages (sibling of `hub/`, never inside it). |
| `apps/macos` | `@3pt/macos` | local, installed by the install loop | SwiftUI app; `project.yml` for xcodegen, no committed `.xcodeproj`. A `package.json` wrapper lets `turbo build` drive it. |
| `packages/design-system` | `@3pt/design-system` | lib | Tokens mirrored from `hub/site/3pt.css` (the hub is the visual source of truth). |
| `packages/inspector-client` | `@3pt/inspector-client` | lib | Typed client over `@3pt/api`; the only way a surface touches state. |

Dependency direction: `apps → packages → @3pt/core` (types only). Surfaces never import a stage or a battery.
Swift talks to the same API over HTTP; it shares the tokens by value, not by import.
Full picture: `docs/10-architecture.md`.
