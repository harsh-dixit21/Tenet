# Tenet Firebase backend

The frontend integration and callable backend are implemented. A live Firebase project has **not** been created or deployed. The website remains a clearly marked sample workspace until you configure Firebase.

## 1. Create the Firebase project

Use [Firebase Console](https://console.firebase.google.com/) with the account that will own Tenet. Register a Web app in Project settings and copy its public configuration. Do not send or commit a service-account private key.

- Enable Authentication → Sign-in method → Google.
- Add `localhost` and `tenet-fdr-harsh.ayuccingh.chatgpt.site` to Authentication → Settings → Authorized domains. Add any future frontend domain too.
- Create a Cloud Firestore database and a default Storage bucket. Select the location intentionally; functions use `asia-south1`.
- Deployment of Cloud Functions and use of Cloud Storage require Firebase's Blaze billing plan. Review billing and budgets yourself before enabling it. Local emulators require no live billing project. See [Functions setup](https://firebase.google.com/docs/functions/get-started) and [Storage setup](https://firebase.google.com/docs/storage/web/start).
- Register the Web app in App Check using reCAPTCHA Enterprise and your allowed domains. Production callable functions enforce App Check by default. This complements, and does not replace, account authorization.

## 2. Configure the frontend

Copy `.env.example` to `.env.local` and fill in every Firebase Web app value. Copy the public App Check site key into `VITE_FIREBASE_APPCHECK_SITE_KEY`. Keep `VITE_FIREBASE_USE_EMULATORS=false` for the real project. Vite embeds these public values at build time, so rebuild after changing them.

The frontend uses Google popup sign-in, with redirect fallback for blocked popups. Routes wait for authenticated account provisioning. New Google accounts receive Institution access and must enroll an institution. No browser role selector can elevate a live account. If provisioning fails, the app displays the error and offers retry/sign-out rather than silently loading sample records.

## 3. Deploy the backend and rules

From the project directory:

```powershell
npm install
npm install --prefix functions
npx firebase login
npx firebase use --add
```

Select your actual Firebase project in the prompt. Then copy `functions/.env.example` to `functions/.env`:

```text
INITIAL_ADMIN_EMAIL=harshd21507@gmail.com
TENET_ENFORCE_APP_CHECK=true
```

Deploy only the Tenet backend resources:

```powershell
npx firebase deploy --only functions,firestore,storage
npm run build
npm run dev
```

Open `http://localhost:5173/portal/#auth` (use the port Vite prints). Sign in with **harshd21507@gmail.com first**. Its verified Google identity is granted Admin once, protected by the `system/adminBootstrap` transaction lock. That account cannot change itself through the role-management UI. Other users must sign in once to appear under Settings → Account access. Assign Reviewer/Approver roles there, or assign an Institution user to an existing institution ID. Account deactivation takes effect on subsequent server requests; Firebase access tokens alone do not grant a workflow role.

The existing Sites frontend hosting is independent of Firebase backend deployment. After the live `.env.local` configuration is available, rebuild and publish the frontend through the normal Sites workflow. Current production source uses no invented Firebase project ID or keys.

## 4. Test without a live project

Requirements: Node 22 for the Functions runtime, Java 21 or newer, and the dependencies above. Node 24 can run the local tooling, but deploy uses the declared Node 22 runtime.

```powershell
npm test --prefix functions
npx firebase emulators:exec --project demo-tenet --only auth,firestore,storage,functions "node functions/integration.mjs"
```

The integration test uses only local emulated Google identities and an isolated `demo-tenet` project. It checks unauthenticated access, administrator provisioning, role escalation denial, tenant isolation, private documents, concurrent duplicate submissions, transaction idempotency, decision races, deactivated users and direct Firestore access denial. It never logs real access tokens.

For manual UI testing with emulators, fill `.env.local` with a demo Web app configuration using `demo-tenet` as project ID, a syntactically valid fake API key, `demo-tenet.firebaseapp.com` auth domain, `demo-tenet.appspot.com` bucket and a demo app ID. Set `VITE_FIREBASE_USE_EMULATORS=true` and leave the App Check key empty. Run:

```powershell
npx firebase emulators:start --project demo-tenet --only auth,firestore,storage,functions
```

In a second terminal run `npm run dev`. Emulator mode is rejected outside localhost/127.0.0.1. Do not deploy an emulator-enabled frontend.

## Core behavior and boundaries

- All live writes go through authenticated Cloud Functions. Firestore and Storage deny direct client reads/writes. Documents are returned only after record ownership/role checks; no public download token is created.
- Institution identity and audit actor come from server account profiles, never client payloads. Bank/instrument uniqueness and successor reservations use transaction locks. Commands carry receipt IDs to make retries idempotent. Concurrent request decisions can commit only once.
- Documents are checked for supported content type, matching extension and signature, with a 1 MB upload limit. Version numbers are assigned by the server, and verified documents are locked. Uploaded bytes are kept in private Storage; record metadata stays in Firestore. Failed transactions clean up uploaded files.
- Verification requires a submitted record, required document categories, and source/reference/date/notes. Users cannot verify their own submissions. A verified successor atomically closes the original lifecycle.
- Approvals require a different official from the submitter and verifier, an eligibility confirmation, verification evidence and required documents. Release/refund defaults require maturity. These are implementation defaults, not a statement of AICTE policy; validate and configure actual operational requirements before production use.
- Verification records authorized manual evidence. There is no live bank API, interest calculation, financial transfer, email/SMS delivery or automated eligibility decision. Approvals are administrative decisions only.
- Live records are refreshed on mutations and can be refreshed manually; an active page polls every 30 seconds. Alerts are generated on the server from current records/settings. There is no unattended email scheduler.
- Current views support up to 500 records/requests/accounts and return the most recent 200 audit events. The backend reports an explicit limit error rather than silently presenting incomplete financial totals. Audit documents remain stored; add pagination/archiving for larger deployments.
- Sample localStorage records are never imported automatically into the real database. Restoring samples and role switching are disabled for live workspaces.

Relevant implementation files: `functions/src/domain.js`, `functions/src/index.js`, `functions/src/alerts.js`, `src/lib/firebase/`, `src/components/workspace/store.tsx`.

### Windows emulator socket troubleshooting

If Firestore reports `Unable to establish loopback connection` / `UnixDomainSockets.connect`, create a short writable socket directory and set its path for the emulator process. This workspace was tested with a portable Java 21 runtime under the ignored `.local/java21` directory, without changing the system Java installation:

```powershell
New-Item -ItemType Directory -Force C:\SIH\tenet-source\.local\sockets
$env:JAVA_TOOL_OPTIONS='-Djdk.net.unixdomain.tmpdir=C:\SIH\tenet-source\.local\sockets'
```

Use the Java 21 runtime's `bin` directory first in the current terminal's PATH if necessary. `functions/.env.local` is an ignored emulator-only file containing the initial administrator email and `TENET_ENFORCE_APP_CHECK=false`; production enforcement remains enabled by default.
