# Validation guide

Run these commands from the repository root with Node.js 22:

```powershell
npm run test:tooling
npm run test:utils
npm run test:portfolio
npm run test:planner
npm run test:backend
npm run build
npm run check:dist
npm run check:tracked
npm run check:size
npm run check:series
```

Operational script behavior and limitations are documented in [TOOLING.md](TOOLING.md). The tooling suite uses isolated temporary files and never production credentials.

The utility suite covers money precision, search, inclusive maturity boundaries, version selection, CSV escaping, malformed routes and renewal eligibility. Backend unit tests exercise both accepted transitions and permission, integrity, chronology and protocol rejections. check:series intentionally applies to the completed 100-commit branch and needs full Git history.

For end-to-end backend checks install Java 21, set JAVA_HOME and run npm run test:integration. The test project is demo-tenet and services bind locally. Never point the synthetic fixture suite at a production project. On Windows, if Java cannot create an AF_UNIX socket because the temporary path is long, create .local/sockets and set JAVA_TOOL_OPTIONS=-Djdk.net.unixdomain.tmpdir=C:/SIH/tenet-source/.local/sockets using your actual checkout path.

A passing build verifies types and bundling, not browser rendering. Manually inspect the landing video transition, sign-in hover/motion, register filtering and export, required-document checklist, review decisions and phone-width overflow. Demo-mode behavior should be checked separately from authenticated emulator behavior. The manual integration workflow runs local emulators only and requires no production credentials.

When a test fails, preserve the first failure and its inputs. Fix the underlying behavior or an incorrect fixture expectation; never weaken authorization assertions simply to make the suite pass.
