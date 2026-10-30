# Tenet — supplied component integration

## Complete demo workspace

The active portal now uses one shared, versioned browser-storage model in `src/components/workspace/store.tsx`. The previous standalone register is retained in source, but its route now opens the shared register. The App1 dashboard uses the same instruments, pending requests, document counts and activity events as all other screens.

Features include drafts and submissions; searchable/filterable/sortable records; institution directories; instrument details; versioned document uploads/downloads; separate verification evidence; discrepancy correction and resubmission; linked renewals/replacements; release/refund/discharge requests with approval/rejection; maturity/overdue alerts and read state; configurable reminder/escalation thresholds; status/institution reports; CSV exports; and timestamped audit history. Demo role selection controls available actions. The dashboard chart is derived from saved events. Closed/superseded instruments do not double-count active deposit totals.

Records, small attachments and settings persist in localStorage on the same browser/origin. Each upload is limited to 1 MB (PDF, PNG, JPEG or text); storage failures are reported without accepting an unsaved mutation. Documents are downloadable demo attachments, with prior category versions retained. There is no bank, payment, email or SMS integration, server authentication, cross-device persistence or production authorization. The role switcher explicitly identifies this as a demo. Settings offers a confirmation before restoring the synthetic samples.

The landing page, local video, TechText and live sign-up design are preserved. Per the user's later explicit motion request, the two background animations run even under reduced-motion settings, while other motion behavior remains separate.

`qa-workspace.mjs` exercises submissions, file uploads, correction/resubmission, verification evidence, release approval, renewal linking, persistence, settings, alert state, screen navigation and responsive layout. Older notes below describe the initial prototype and are superseded by this section.

The landing page follows the user's full-viewport video reference. Its static HTML entry uses `landing/styles.css`, `landing/main.js`, and a vanilla JavaScript adaptation of the supplied React Bits TechText canvas renderer. It preserves idle sweep, outline reveal, click kick, and draggable spring-return letters. The exact supplied CloudFront video loops in the background. Content has been adapted to security deposits and FDRs; there are no invented customer endorsements or uptime claims.

The portal uses the existing React 19, TypeScript, Vite and Tailwind 4 setup. `components.json` already defines `@/components/ui` as `src/components/ui`; there is no need to initialize another shadcn project or create a duplicate root components directory. New shared components live in that folder. Portal tokens/styles are in `src/portal-styles.css`. Motion imports use the existing `motion/react` package (the same Motion API), avoiding a duplicate animation package.

Routes:
- `/`: static video landing page.
- `/portal/#auth`: supplied split sign-up composition with both continuously animated 36-path fields, social-provider feedback, validated demo email and role selection.
- `/portal/#dashboard`: supplied App1 layout adapted to FDR summary metrics, a Recharts area chart, document-readiness panels and activity history. Includes search, queue filtering, notifications, CSV export, chart period control, mobile sidebar and sign-out.
- `/portal/#records`: preserved pre-existing register, details, record entry, maturity list and requests. Its styles are scoped to prevent leaking into the new screens. These screens await the user's replacement prompts.

The actual brand-logo file and Geist Pixel Circle font were not provided. The landing uses a neutral Home icon temporarily; portal identity uses the icon from the supplied auth component. The headline uses Inter for the supplied TechText effect; footer symbols use the requested Bubbledot CDN. Replace the Home icon with the user's actual logo when supplied. Do not invent a new brand mark.

## Demo boundaries
All data is synthetic, with a fixed snapshot of 30 October 2026. Summary totals are computed from five sample instruments. The area chart is separately labelled illustrative weekly case activity, including repeated renewals/corrections; it is not presented as the count of instruments currently held. The selected role is a presentation setting, not an authorization boundary. Email and role are stored only in sessionStorage; no account is created, no email is sent, and OAuth providers are not connected. Register additions remain in its component memory and reset when leaving it. No live bank verification or financial decision executes.

## Run and check
`npm install`, then `npm run dev`. Open the server URL for the landing page and `/portal/#auth` for the app. `npm run build` runs TypeScript checks and emits both entries to `dist/`.

`qa.mjs` uses the installed Taste Skill browser helper for responsive and interaction checks. Its screenshots and check results are local QA artifacts. Taste's generic bans on pill navigation, glows, small footer labels, a single video and gradient chart fills are intentionally overridden by the user's exact component prompts. No alternative design was drawn.

Motion uses requestAnimationFrame and cached glyph sprites for TechText, with capped pixel density and time steps. Auth-path periods are deterministic to avoid restarting randomly on form updates. Reduced-motion preferences stop the video, idle sweep and path loops. Video and auth paths pause while the document is hidden. The canvas, video, and SVG paths are checked separately from layout.

The supplied auth path geometry is retained, with native SVG/CSS keyframes for its continuous dash and opacity loops. This avoids the observed stalled Motion path animation and reduces the initial portal JavaScript. The dashboard inspector passed its measurements at desktop/tablet/phone widths; its warnings about monochrome chart data, 12px metadata and matched-height panels reflect the supplied composition and retained neutral theme.
