# @3pt/live

The app a construction team uses. The harness composes every screen; this app renders it and reports what people do.

```
pages/       home · project · harness          fetch one screen, compose organisms
organisms/   top-bar · block-frame · blocks · photo-viewer
molecules/   project-card · action-card · unit-tile · saver-card · query-card
             feedback-photo · learned-strip · version-row · role-select
atoms/       button · badge · icon · photo · stat
lib/         dom (element builder) · state (route, role)
```

Rules: a component is a function, props in, one element out. Atoms know no data shapes. Only pages call the API.
Blocks never decide which blocks show: `GET /app/screen` returns the layout the current harness version chose for the role.

Run:

```
pnpm turbo run build --filter @3pt/live... --filter @3pt/api...
node harness/apps/api/dist/index.js                     # :8787, serves /app, /sim and /media-pool
pnpm --filter @3pt/live preview                         # :5174
```

`VITE_THREEPT_API_URL` points the app at another API.
