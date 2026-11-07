# Tenet

**Firebase backend and Google sign-in:** see [BACKEND_SETUP.md](BACKEND_SETUP.md). Backend logic, authentication integration, private documents and server-enforced workflows are implemented; live activation requires your Firebase project configuration.

**Current implementation:** see [IMPLEMENTATION.md](IMPLEMENTATION.md) for the video landing page, TechText animation, supplied App1 dashboard, and animated sign-up integration. The active checkout is `C:\SIH\tenet-source`. The notes below describe the preserved previous prototype.

A React + TypeScript prototype for security deposit and FDR management. Black and off-white visual system, self-hosted Manrope Variable, an animated silver flower hero, and a floating navigation dock. Entrance animations begin on mount. Scrolling drives a sticky six-scene timeline: the title separates, the flower rotates, the camera moves, and FDR workflow content reveals in sequence. Scrolling back reverses the sequence. Reduced-motion preferences disable idle movement and smooth camera interpolation.

## Run

```powershell
cd C:\SIH\tenet-source
npm install
npm run dev
```

See [docs/TOOLING.md](docs/TOOLING.md) for environment validation, production preflight, build checks and release manifests.

`npm run build` checks TypeScript and creates the production build in `dist/`.

## Structure

- `src/components/ui/`: shared UI and supplied component adaptations, following shadcn's component convention.
- `src/components/motion-primitives/`: upstream TextEffect and AnimatedGroup from https://github.com/ibelick/motion-primitives (AnimatedGroup updated for the React 19 JSX namespace).
- `src/components/dashboard.tsx`: FDR dashboard, search, filters, details, sample record entry, maturity list, request queue, CSV export.
- `src/styles.css`: Tailwind entry and monochrome styles.
- `src/lib/utils.ts`: shadcn-compatible `cn()` helper.

The flower renderer is adapted from the user-supplied Lycoris Specimen by Kedhareswer. The dock is adapted from the supplied FloatingDock. The dashboard follows the supplied App1 structure, with FDR-specific records in place of project data. The unrelated stock social links and newsletter form were omitted.

## Prototype boundaries

All records and verification evidence are synthetic. The reference date is 29 October 2026. New records stay in dashboard component memory; refreshing or leaving the dashboard resets them. There is no authentication, persistent database, document upload, bank integration, real notification service, or financial approval execution. Those require the authorized backend described in the solution brief.

UI UX Pro Max was installed into the user's Codex skills directory. Its spacing, accessibility, and restrained interaction guidance informed this interface; the requested black/off-white palette takes precedence over its suggested colors.

Portfolio analysis is available from **Portfolio** in the authenticated or demo workspace. See [docs/PORTFOLIO.md](docs/PORTFOLIO.md) for its filters, selections, exports and analytical worklists.
