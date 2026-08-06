# Cribbit Requirements

This file defines the mandatory target state. An unmet requirement is not a claim about current production; every known gap must appear as pending work in `plan.md` until verified and closed.

## 1. Scope

Cribbit is a shared-house Telegram bot with one responsive dashboard that works both as a Telegram Mini App and, after Telegram Web Login, as an external browser application. Railway runs the bot, authenticated API, Web Login/session endpoints, and persistent store. Vercel serves the landing page and shared dashboard frontend. Both authenticated surfaces use the same Railway data and membership rules. Native iOS and Android apps remain **Coming soon** until separately built and released.

## 2. Source and change control

- **SRC-001:** `C:\Users\GrowB\cribbit-bot` is the only authoritative editable copy.
- **SRC-002:** No production change may originate in Vercel, Railway, GitHub's web editor, Downloads, temp folders, or old work trees.
- **SRC-003:** GitHub `funmarket/cribbit-bot` `main` mirrors reviewed commits created locally.
- **SRC-004:** Railway and Vercel deploy the same approved Git commit from GitHub.
- **SRC-005:** A release is synchronized only after local, GitHub, Railway, and Vercel evidence agrees.
- **SRC-006:** Unrelated or untracked user files are never staged, deleted, or deployed without approval.
- **SRC-007:** Changes are focused, reversible, reviewed, and proportionally tested.

## 3. Functional requirements

### Telegram bot

- **BOT-001:** `/start` and `/help` show current commands and an Open Cribbit action when configured.
- **BOT-002:** `/split <amount> <description>` remains backward compatible.
- **BOT-003:** Natural-language expense messages extract supported amounts, descriptions, payers, and participant rules.
- **BOT-004:** `/balance` shows the viewer's balance and simplified settlement transfers.
- **BOT-005:** Chores support add, list, complete, reopen, reassign, and delete; `/done <number-or-id>` remains supported.
- **BOT-006:** Chore assignment supports `@username` and `for <name>` syntax and displays the assignee.
- **BOT-007:** Groceries support add, list, purchased/restore, price, urgency, and deletion.
- **BOT-008:** `/roomies`, `/activity`, and `/settings` return persistent house data.
- **BOT-009:** `/dashboard` generates canonical Vercel `/app` links using the current Railway API origin.
- **BOT-010:** The Telegram command menu includes every supported product area.
- **BOT-011:** English, French, and Arabic remain supported; Arabic uses RTL where applicable.
- **BOT-012:** Duplicate Telegram update IDs do not create duplicate mutations.

### Mini App and landing page

- **WEB-001:** `/` serves the responsive public landing page.
- **WEB-002:** `/app` is the canonical dashboard route.
- **WEB-003:** `/dashboard` remains a compatibility alias returning the same dashboard document.
- **WEB-004:** Dashboard views include Overview, Expenses, Chores, Groceries, Roomies, Activity, and Settings.
- **WEB-005:** Desktop uses an application sidebar; mobile uses a compact header and bottom navigation with 44px minimum touch targets.
- **WEB-006:** Valid Telegram launches load persistent data from Railway.
- **WEB-007:** Menu launches without `chatId` discover active houses through `/api/houses`.
- **WEB-008:** Zero houses show onboarding, one opens automatically, and multiple houses show a selector.
- **WEB-009:** Outside Telegram, unauthenticated users cannot access real house data and are shown Telegram Web Login; successfully authenticated browser users may access only houses where their Telegram ID is an active member.
- **WEB-010:** `?demo=1` may use clearly labeled, non-persistent sample data.
- **WEB-011:** Requests time out with useful recoverable errors.
- **WEB-012:** The real Cribbit logo loads from deployed static assets.
- **WEB-013:** Telegram Mini App and external Web Login use the same `/app` frontend, Railway API, store, Telegram identity, membership checks, and mutations; no second database or divergent dashboard is permitted.
- **WEB-014:** External Web Login uses Telegram's current official BotFather Web Login/OpenID Connect flow with registered origins and redirect URIs.
- **WEB-015:** Users can log out, and expired, revoked, invalid, replayed, or unauthorized web sessions fail without exposing house data.

### Data and calculations

- **DATA-001:** Data is separated by Telegram group `chatId`.
- **DATA-002:** Money is stored and calculated in integer cents.
- **DATA-003:** Settlement output conserves net balances and minimizes supported transfers.
- **DATA-004:** Expenses, chores, groceries, members, activity, settings, update IDs, and user preferences survive Railway restarts.
- **DATA-005:** Runtime JSON is written only under the configured persistent directory.
- **DATA-006:** Clearing affects only the selected house and re-registers the initiating member.

## 4. Security requirements

- **SEC-001:** Secrets exist only in approved local/platform secret stores; never in Git, logs, URLs, docs, or frontend assets.
- **SEC-002:** The testing bot token exposed during recovery must be rotated through BotFather and replaced in Railway before production-secure status.
- **SEC-003:** Every dashboard data/action endpoint validates Telegram Mini App `initData` with the bot token.
- **SEC-004:** Missing hashes, invalid signatures, malformed users, and expired `auth_date` values are rejected.
- **SEC-005:** Protected house access additionally requires active membership in the requested group.
- **SEC-006:** Owner/admin restrictions are enforced server-side.
- **SEC-007:** Mutations use an allow-list; unknown actions fail without mutation.
- **SEC-008:** Request bodies are size-bounded and invalid JSON receives controlled errors.
- **SEC-009:** Browser CORS is limited to the configured Mini App origin and is never treated as authentication.
- **SEC-010:** Production Vercel and Railway origins use HTTPS.
- **SEC-011:** User errors do not expose stacks, secrets, filesystem paths, or internal state.
- **SEC-012:** Dependencies are locked and reviewed for high-severity vulnerabilities before releases.
- **SEC-013:** GitHub `main` should require the `Verify Cribbit` check and protected review/merge rules.
- **SEC-014:** Platform access uses least privilege.
- **SEC-015:** Public API endpoints require rate limiting before broad public launch.
- **SEC-016:** Security headers, including a suitable Content Security Policy, are required before broad public launch.
- **SEC-017:** Telegram Web Login validates OAuth state, PKCE, nonce, ID-token signature, issuer, audience, and timestamps server-side before creating a session.
- **SEC-018:** Browser sessions use random opaque tokens; only token hashes are persisted, sessions expire and can be revoked, and tokens never appear in URLs, logs, Git, or frontend assets.
- **SEC-019:** Mini App `initData` authentication and external bearer-session authentication normalize to one trusted viewer identity before active-house membership and authorization checks.
- **SEC-020:** External Web Login remains disabled in production until its authentication, session, cross-house, replay, open-redirect, and synchronized-deployment acceptance tests pass.

## 5. Reliability and operations

- **OPS-001:** Railway exposes `/health` and keeps bot/API online continuously.
- **OPS-002:** Railway mounts persistent storage at the configured data directory.
- **OPS-003:** Startup synchronizes Telegram commands/menu and clearly logs failures.
- **OPS-004:** Vercel runs `npm run build` with output directory `dist`.
- **OPS-005:** `/`, `/app`, `/dashboard`, `/app.js`, and `/logo.png` return correct statuses and content types.
- **OPS-006:** `/app` and `/dashboard` return byte-identical dashboard HTML.
- **OPS-007:** Releases have a rollback target and never destroy the Railway volume.
- **OPS-008:** Restorable backups of `expenses.json` are required before production-critical use.
- **OPS-009:** Logs identify startup, menu-sync failures, server errors, and shutdown without secrets.
- **OPS-010:** Releases are tested through both `/dashboard` and the blue **Cribbit** button.

## 6. Development requirements

- **DEV-001:** Node.js 18+ is required; CI uses Node.js 20.
- **DEV-002:** CI/deployments use reproducible `npm ci` installs.
- **DEV-003:** `npm run typecheck` passes before commit/deployment.
- **DEV-004:** `npm run build` passes and creates required deterministic `dist/` files.
- **DEV-005:** `git diff --check` and full diff review pass before commit.
- **DEV-006:** Tests cover parsers, balances, persistence, authorization, localization, URLs, API actions, and route compatibility.
- **DEV-007:** Authentication, authorization, persistence, URL, and deployment changes require regression tests.
- **DEV-008:** Web Login tests cover OAuth state, PKCE, nonce, ID-token claims, single-use exchange, expiry, revocation, logout, open redirects, and cross-house denial without making live Telegram authorization a unit-test dependency.

## 7. Release acceptance

Every applicable item must pass:

1. The authoritative checkout and all changes are understood.
2. `npm ci`, `npm run typecheck`, `npm run build`, and `git diff --check` pass.
3. Only intended files are committed.
4. GitHub `main` contains the reviewed local commit.
5. Railway health and authenticated API behavior pass.
6. Vercel critical routes return canonical artifacts and correct content types.
7. Telegram `/start`, `/dashboard`, and the blue menu button work in a real group.
8. Persistent data survives a safe restart.
9. No secrets appear in Git, logs, frontend assets, or documentation.
10. A rollback target is recorded.
11. When Web Login is included, the same expense/chore/grocery mutation is visible consistently through the bot, Mini App, and authenticated external browser dashboard.
