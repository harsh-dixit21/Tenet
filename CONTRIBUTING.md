# Contributing to Tenet

Use Node.js 22. Install root and functions dependencies with npm ci and npm --prefix functions ci. Start the UI with npm run dev; see docs/ENVIRONMENT_SETUP.md for demo versus Firebase configuration.

Create a focused branch from main. Each commit should implement one observable behavior, regression check, operational tool or distinct documentation improvement. Do not split whitespace-only edits or duplicate documentation to increase commit counts. The original 100-update series is indexed in CHANGE_SERIES.md.

Keep workflow authorization in functions/src/domain.js and transaction consistency in functions/src/index.js. A hidden button is not a permission check. Cover rejected operations as well as successful transitions. Preserve institution isolation, maker/checker separation and server-derived actor identities.

Before opening a pull request run the commands in docs/TESTING.md. For workflow or rule changes run the isolated emulator suite too. UI changes need a desktop and phone-width check, including keyboard focus and loading/error states. Preserve the supplied landing artwork and continuous motion unless the requested change concerns them.

Never commit local environment files, service account keys, actual uploaded evidence, emulator state or generated dist output. Use synthetic fixtures. Deployment should use reviewed source and an owner-configured Firebase project; do not deploy from a test or issue reproduction script.

Describe the trigger, resulting behavior and validation in the PR. State any migration, capacity or compatibility implications. Avoid rewriting shared history; use a follow-up fix after publication.
