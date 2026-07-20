# Project Instructions

## Project identity

- This repository is the Japanese web app **#コンパス履歴書ジェネレーター V2**. It creates a 1200 x 675 PNG player-resume card for sharing on social media and for finding friends.
- Treat the repository folder name as independent from the product name, package name, public URL, browser storage keys, and exported JSON format. A folder rename alone must not rewrite those identifiers.
- The production site is `https://cpsresume.aosankaku.net/` and is deployed at the domain root (`/`) over HTTPS.

## Stack and commands

- Use Bun 1.3.14 or later; `bun.lock` and the `packageManager` field in `package.json` are authoritative. Do not reintroduce Yarn or npm lockfiles.
- The app uses React 19, TypeScript 5.8 in strict mode, Vite 6, MUI 7/Emotion, and native Canvas 2D rendering.
- Install: `bun install --frozen-lockfile`
- Develop: `bun run dev` (fixed port `35173`; Vite fails if the port is occupied)
- Before completing code changes, run `bun run lint`, `bun run typecheck`, and `bun run build`.
- There is currently no automated test suite. Do not claim tests passed unless tests have been added and run.
- Production output is `dist/`; do not edit generated files there.

## Architecture and source of truth

- `src/main.tsx` mounts the single-page app. `src/App.tsx` owns resume data, site theme, persistence, reset, and JSON download behavior.
- `src/components/Input.tsx` is the editor; `src/components/ResumeCanvas.tsx` renders and downloads the fixed 1200 x 675 card. Keep canvas output behavior in sync with form/schema changes.
- `src/types.ts` defines `ResumeData` and its defaults. When adding a field, update the type, default value, editor, canvas/detail mapping where applicable, and serialization compatibility together.
- `src/details.ts` is the source of truth for optional detail keys. At most six details may be selected (`DETAIL_LIMIT`).
- `src/data/heroes.yaml` is the editable hero catalog. Each entry requires a unique `fullName`, a `name`, and one role from `attacker`, `gunner`, `tank`, or `sprinter`. `src/data/main.ts` validates and groups it at startup/build time.
- `vite.config.ts` contains the local YAML-to-module plugin. Preserve that plugin while YAML remains the hero data format.
- Role icons live in `src/assets/roles/`; role-to-icon/color/label mappings are in `ResumeCanvas.tsx`.
- `src/theme.ts` is the shared source of truth for accent HSL values and readable contrast colors.

## Data, privacy, and compatibility

- The app is client-only. User input and uploaded images must remain in the browser and must not be sent to a server unless the product requirements explicitly change.
- Resume state is stored under `compass-resume-v2`; the site theme uses `compass-site-theme`. Preserve these keys across cosmetic or folder renames so users do not lose saved data.
- `App.tsx` intentionally migrates legacy `rank`, `enjoyRank`, and `iconCount` fields. Do not remove migrations without an explicit compatibility decision.
- Large avatar data can exceed localStorage quota. Preserve the fallback that saves the resume without `avatarDataUrl` and reports `without-image`.
- Exported JSON uses format `cps-resume`, version `1`, and the production origin in `src/resumeJson.ts`. Version incompatible schema changes instead of silently reusing version 1.

## Public URL and naming changes

- `src/config/site.ts` is the app-level site metadata and share-link source.
- If the product name or public URL intentionally changes, update all coupled references in one change: `src/config/site.ts`, `src/resumeJson.ts`, the canvas credit in `src/components/ResumeCanvas.tsx`, `index.html` (title, canonical, OGP, Twitter metadata, and JSON-LD), `public/robots.txt`, `public/sitemap.xml`, `public/site.webmanifest`, `README.md`, and `package.json` when appropriate.
- Root-relative links and deployment assumptions also appear in `vite.config.ts` (`base: '/'`), `src/components/Appbar.tsx` (`href="/"`), `index.html`, and the web manifest. Review them before deploying under a subpath.

## Code conventions

- Follow the existing style: function components, hooks, explicit TypeScript types at boundaries, single quotes, and no semicolons.
- Keep user-facing copy in Japanese and retain accessible labels, focus handling, disabled states, and live status announcements when changing UI behavior.
- Use MUI for application-level UI primitives where already established; the downloadable card itself is drawn with Canvas 2D and should not depend on DOM screenshots.
- The outlined hero text intentionally combines an opaque background-colored fill, `-webkit-text-stroke`, and `paint-order: stroke`. Do not make its fill transparent: stroke-first rendering only masks the inner half of the stroke when the later fill is opaque. Keep the outlined phrase on one line and visually verify it at 320px and 375px widths in both site themes.
- Preserve unrelated working-tree changes. Do not commit; the repository owner handles GPG-authenticated commits.
