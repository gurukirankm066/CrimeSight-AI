# Deploying CrimeSight AI to Zoho Catalyst AppSail

CrimeSight AI is a pure static SPA. There is no Node server, no SSR, no Nitro,
and no custom runtime to deploy — only the contents of `dist/`.

## 1. Configure environment variables

The frontend reads exactly one required variable at build time:

| Variable                    | Required | Notes                                                         |
| --------------------------- | -------- | ------------------------------------------------------------- |
| `VITE_API_BASE_URL`         | yes      | Base URL for the Catalyst Functions backend.                  |
| `VITE_MAP_TILE_URL`         | no       | Only used if the Karnataka map is swapped to Leaflet.         |
| `VITE_MAP_TILE_ATTRIBUTION` | no       | Tile provider attribution string.                             |
| `VITE_MAP_MAX_ZOOM`         | no       | Leaflet max-zoom (defaults to 18).                            |

Copy `.env.example` to `.env` for local development or set the variables in
your build environment for production.

## 2. Build

```sh
npm install
npm run build
```

Output: `dist/` containing `index.html` plus hashed JS/CSS assets. Verify
there are no Node-only files in the output — `dist/` should be a static
asset tree with no server entry, no `nitro.json`, no functions.

## 3. Upload to Catalyst AppSail

1. Create or open the AppSail project.
2. Upload the contents of `dist/` (not the folder itself).
3. Confirm the public root is `index.html`.

## 4. Configure the SPA rewrite

React Router uses HTML5 history paths (`/network`, `/reports`, etc.). For
deep links and browser refresh to work, AppSail must serve `index.html` for
any path that does not match a static asset.

Add an AppSail rewrite rule (or equivalent platform config) that rewrites
**all unmatched paths to `/index.html`** while leaving static assets
(`/assets/*`, `/*.js`, `/*.css`, etc.) untouched.

### If SPA rewrites are not available

Swap `BrowserRouter` for `HashRouter` in `src/App.tsx`. URLs then look like
`/#/network` and routing works without any rewrite rule.

```tsx
// src/App.tsx
import { HashRouter } from "react-router-dom"; // instead of BrowserRouter
```

## 5. Post-deploy verification checklist

After publishing, verify each of the following manually:

- [ ] Root URL loads correctly.
- [ ] Browser refresh works on every route.
- [ ] Direct navigation to `/network`, `/reports`, `/evidence`, and `/brief`
      does **not** return 404.
- [ ] Unknown routes (e.g. `/does-not-exist`) show the themed 404 page.
- [ ] `OfflineBanner` appears when `VITE_API_BASE_URL` is unreachable, and
      every page still renders cached/mock data.
- [ ] No runtime errors or warnings in the browser console after loading
      every page.
- [ ] All API requests in the network panel are sent to `VITE_API_BASE_URL`
      (and originate from `src/services/api.ts`).
