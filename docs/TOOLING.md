# Local validation and release tools

Run commands at the checkout root with Node.js 22. These tools read local files; they do not deploy resources, contact a database, or verify Firebase connectivity.

## Environment validation

Copy `.env.example` to `.env.local`, fill in your Firebase web app configuration, and run `npm run check:env`. An alternate filename can be passed with `npm run check:env -- path/to/file`.

The parser supports CRLF, a UTF-8 BOM, optional `export`, single or double quoted values and whitespace-delimited trailing comments. Quoted values preserve `#` and `=`. It rejects malformed lines, duplicate keys and unclosed quotes, and does not interpolate variables or interpret escape sequences. Diagnostics identify keys or line numbers without printing assignment values.

Validation checks required fields, common placeholders, project ID syntax, an auth hostname without a URL scheme, numeric sender IDs, a Firebase web app ID, and an optional boolean emulator flag. Production requires an App Check site key. Demo project IDs require emulator mode. Custom auth domains are supported.

## Production preflight

Run `npm run check:deploy -- your-project-id` after configuring `.env.local` and `functions/.env`. Preflight requires the frontend project to match the supplied target and emulator mode to be disabled. The backend must set a valid `INITIAL_ADMIN_EMAIL` and explicitly set `TENET_ENFORCE_APP_CHECK=true`.

Configured rules and index paths must point to nonempty regular files inside the checkout, including after resolving symbolic links. Firestore indexes must contain an `indexes` array; `fieldOverrides`, when present, must be an array. The Tenet codebase must use the `functions` directory, `nodejs22`, and package engine `22`.

Passing preflight does not check rule semantics, remote project permissions, billing, Google sign-in, authorized domains, App Check registration or backups. Review those in Firebase before deployment. No production deployment occurs during this check.

## Build verification and release evidence

Run `npm run build`, then `npm run check:dist`. Both landing and portal pages need a Tenet title element. Local scripts, styles, images, audio, video sources and posters must reference nonempty files inside `dist`. Relative URLs, single quoted attributes and cache-busting queries are supported. External URLs and navigation links are skipped. The landing background video must contain at least 1 KB. This is a targeted static check, not an HTML validator or browser rendering test.

After building, `npm run release:manifest --silent` emits JSON containing the current source commit and each output file's path, size and SHA-256. Hashing streams file contents to limit memory use. Entries are sorted and paths use forward slashes. Links and special files are rejected. Keep manifests outside `dist` so a later manifest does not include a previous copy. A manifest describes current local output; it does not prove that output was built from a clean checkout.

## Synthetic fixtures and repository hygiene

`npm run fixtures -- 25` emits deterministic synthetic JSON without writing records anywhere. Counts must be decimal integers from 1 through 500; the default is 10. Use `npm run fixtures -- --help` for usage. For pure JSON when redirecting output, use `node scripts/generate-fixtures.mjs 25` or npm's `--silent` flag.

`npm run check:tracked` rejects tracked environment credentials, recognized private key headers, generated directories and nonregular files. Missing tracked files produce actionable failures. It skips content scans above 2 MB and is not a comprehensive secret scanner. `npm run check:size` separately checks tracked file size budgets.

Run `npm run test:tooling` for isolated parser, preflight, build, manifest, fixture and repository-check regressions. Test directories are temporary and cleaned up automatically. The normal GitHub validation workflow runs this suite on Node.js 22 alongside the utility and backend tests.
