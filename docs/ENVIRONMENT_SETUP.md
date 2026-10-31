# Environment and activation

Use Node.js 22 for the frontend, tests and Cloud Functions. From the repository root run npm ci and npm --prefix functions ci. Copy .env.example to .env.local for the browser and functions/.env.example to functions/.env for server parameters. Both local files are ignored by Git.

Populate the Firebase Web app configuration from the owner's project. Web configuration identifies the app; service-account private keys must never be placed in browser variables. Configure INITIAL_ADMIN_EMAIL server-side. For production supply a reCAPTCHA Enterprise site key for App Check and retain server enforcement.

Run npm run check:env to check required local fields without printing values. Run npm run build after changes: Vite embeds browser environment values at build time. Setting deployment variables after building does not update an existing dist directory.

For local emulators use a demo- project ID and VITE_FIREBASE_USE_EMULATORS=true. Emulator connections are restricted to localhost/127.0.0.1. For production use a real project, enable Google sign-in, add the exact frontend host to authorized domains, create Firestore and Storage, configure billing and App Check, and select the intended region (asia-south1 by default).

npm run check:deploy -- project-id checks local deployment prerequisites but does not create resources or deploy. Run the full tests before the owner's approved Firebase deployment. Existing demo mode is a browser-local prototype; its roles are not Firebase privileges and its records are not automatically migrated into a live institution.
