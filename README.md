# Cribbit

Cribbit is a Telegram roommate and shared-house assistant for expenses, balances, chores, groceries, roomies, activity, and settings. It includes a responsive Telegram Mini App and public landing page.

- Telegram: [@Cribbit_bot](https://t.me/Cribbit_bot)
- Production web: [cribbit-dashboard-sigma.vercel.app](https://cribbit-dashboard-sigma.vercel.app)
- GitHub mirror: [funmarket/cribbit-bot](https://github.com/funmarket/cribbit-bot)

## Source of truth — mandatory

The only authoritative editable copy is:

```text
C:\Users\GrowB\cribbit-bot
```

| Location | Role | May originate edits? |
| --- | --- | --- |
| Local folder above | Authoritative working source | Yes |
| GitHub `funmarket/cribbit-bot` `main` | Versioned mirror and deployment handoff | No independent edits |
| Railway | Bot, API, persistent runtime | No |
| Vercel | Landing page and Mini App runtime | No |
| Downloads, temp folders, old work trees | References/obsolete copies | No |

## Permanent workflow — do not bypass

```text
C:\Users\GrowB\cribbit-bot
-> make the focused fix locally
-> test and review locally
-> commit locally
-> synchronize that commit to GitHub
-> deploy that same commit to Railway and Vercel
-> verify Telegram, Railway, Vercel, and persistence
```

This workflow is permanent unless the project owner explicitly changes it. Never fix the same issue separately in multiple locations. Never deploy another folder. Platform deployments are outputs, not source code. Every synchronized location must derive from the local source of truth and match the same approved application commit.

Read [structure.md](structure.md), [requirements.md](requirements.md), and [plan.md](plan.md) before changing the application.

## Architecture

| Component | Platform | Responsibility |
| --- | --- | --- |
| Telegram bot | Railway | Poll Telegram and handle commands/natural language |
| Dashboard API | Railway | Authenticate, authorize membership, persist actions |
| JSON store | Railway volume | Persist `expenses.json` |
| Landing page/Mini App | Vercel | Render public site and dashboard theme |
| Mirror/CI | GitHub | Store reviewed commits and run verification |

Production:

```text
Mini App: https://cribbit-dashboard-sigma.vercel.app/app
API:      https://cribbit-bot-production.up.railway.app
```

`/dashboard` is a compatibility alias for `/app`. New URLs must use `/app`.
The dashboard theme source lives in `frontend/` and is built into the Vercel `dist/` output.

## Features

- `/split 50 dinner` and natural-language expenses such as `Paid 45 for groceries`.
- Exact-cent balances and simplified settlements.
- Assigned chores with completion, reopen, reassignment, deletion, dates, and priority.
- Persistent groceries, roomies, activity, and house settings.
- Responsive Overview, Expenses, Chores, Groceries, Roomies, Activity, and Settings views.
- English, French, and Arabic with Arabic RTL support.
- Telegram-authenticated house discovery for the global Mini App button.

## Telegram commands

| Command | Purpose |
| --- | --- |
| `/start`, `/help` | Help and Open Cribbit action |
| `/split <amount> <description>` | Add expense |
| `/balance` | Personal balance and settlements |
| `/chore add <task> [@user or for name]` | Add assigned chore |
| `/chores`, `/done <number-or-id>` | List/complete chores |
| `/grocery add <item> [urgent]`, `/groceries` | Manage groceries |
| `/roomies`, `/activity` | View members/activity |
| `/settings` | View/update permitted house settings |
| `/dashboard` | Open group-specific Mini App |
| `/language` | Choose language as permitted |
| `/clear` | Clear current house data |

Telegram may append `@Cribbit_bot` in groups; handlers must remain compatible.

## Mini App launch behavior

1. `/dashboard` returns `/app?chatId=<group>&apiBaseUrl=<railway-origin>`.
2. The global blue **Cribbit** button opens `/app?apiBaseUrl=<railway-origin>`.
3. The same Mini App document serves both `/app` and `/dashboard`.
3. The BotFather Main App may use the simple canonical URL `/app`; Vercel proxies `/api/*` to Railway and the frontend safely falls back to its current origin when an `apiBaseUrl` override is absent or malformed.

Without `chatId`, signed Telegram identity is used with `/api/houses`: zero houses show onboarding, one opens automatically, and multiple houses show a selector. The selected active Crib is stored as a user preference, revalidated against active membership on every launch, and can be switched from the desktop sidebar, mobile header, or Settings. Outside Telegram, real data stays behind the authentication gate. `?demo=1` is explicitly non-persistent.

## Requirements and installation

- Node.js 18+; CI uses Node.js 20.
- npm and committed `package-lock.json`.
- Telegram bot token.
- Railway service with persistent volume.
- Existing Vercel project.

```powershell
cd C:\Users\GrowB\cribbit-bot
npm ci
```

## Environment variables

Copy `.env.example` to `.env` locally. Never commit `.env`.

| Variable | Requirement | Purpose |
| --- | --- | --- |
| `BOT_TOKEN` | Local/Railway required | Bot API and initData validation |
| `MINI_APP_URL` | Railway required | Vercel origin without `/app` |
| `DATA_DIR` | Optional when Railway supplies `RAILWAY_VOLUME_MOUNT_PATH` | Explicit persistent JSON directory override |
| `PORT` | Railway supplied | HTTP port |
| `RAILWAY_PUBLIC_DOMAIN` | Railway supplied | Public API origin in app links |
| `RAILWAY_VOLUME_MOUNT_PATH` | Railway volume supplied | Persistent-path fallback |

Required production origin:

```text
MINI_APP_URL=https://cribbit-dashboard-sigma.vercel.app
```

For persistence, use exactly one verified Railway volume path:

```text
DATA_DIR=<verified absolute Railway volume mount path>
```

Do not assume `/data`. If `DATA_DIR` is omitted, the application uses Railway's `RAILWAY_VOLUME_MOUNT_PATH`; the resolved location must be verified before a release.

**Security action required:** rotate the testing bot token exposed during recovery before production-secure status. Update Railway, invalidate the old token, and never put either value in docs or frontend code.

## Local development and verification

```powershell
cd C:\Users\GrowB\cribbit-bot
npm start
```

Full checks:

```powershell
npm run typecheck
npm run build
git diff --check
```

| Script | Result |
| --- | --- |
| `npm start` | Runs `node index.js` |
| `npm test` | Node test suite |
| `npm run typecheck` | Syntax checks and all tests |
| `npm run build` | Deterministic ignored `dist/` output |

## API

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Public liveness |
| `GET` | `/api/houses` | Authenticated house discovery |
| `PUT` | `/api/preferences/active-crib` | Persist an authenticated, membership-authorized active Crib |
| `GET` | `/api/dashboard?chatId=…` | Authenticated/member-authorized dashboard |
| `POST` | `/api/action` | Authenticated/member-authorized allow-listed mutation |

Protected routes require `X-Telegram-Init-Data`. The server verifies HMAC, timestamp, Telegram identity, and active group membership. Never replace this with trust in `chatId`, browser state, or CORS.

Actions: `expense.add`, `chore.add`, `chore.toggle`, `grocery.add`, `grocery.toggle`, `settings.update`, and `locale.update`.

## Persistence

`expenses.json` is partitioned by Telegram chat ID and stores expenses, chores, groceries, members, activity, settings, processed updates, and language preferences.

- Mount the Railway volume at `DATA_DIR`.
- Never commit runtime JSON.
- Never wipe/detach the volume during normal deployment.
- Back up before schema changes and test restoration outside production.

## Deployment procedure

### Prepare locally

```powershell
cd C:\Users\GrowB\cribbit-bot
git status --short
npm ci
npm run typecheck
npm run build
git diff --check
git diff
```

Stage only intended files. Do not stage `audit-state.md`, obsolete extensionless `index`, secrets, runtime JSON, or `dist/`.

### Commit and push the mirror

```powershell
git switch -c change/<short-name>
git add <only-intended-files>
git commit -m "Describe the focused change"
git push -u origin change/<short-name>
```

Open a pull request, require the verification workflow, review the diff, and merge it into GitHub `main`. Then update local `main` with a reviewed fast-forward. Until branch protection is enabled, a direct `main` push is an exception that must still contain only a locally reviewed and tested commit.

### Railway

- Existing service: `cribbit-bot`
- Repository/branch: `funmarket/cribbit-bot` / `main`
- Root directory: blank
- Start command: `npm start`
- Volume mounted at the verified directory resolved from `DATA_DIR` or `RAILWAY_VOLUME_MOUNT_PATH`

Use **Deploy Latest Commit** when fetching a newer GitHub commit; ordinary **Redeploy** reuses existing source. Verify `/health`, startup logs, and `/start`.

### Vercel

- Existing project: `cribbit-dashboard`
- Build: `npm run build`
- Output: `dist`
- Domain: `cribbit-dashboard-sigma.vercel.app`

Vercel must deploy the same reviewed GitHub `main` commit as Railway. Until Vercel's Git integration is proven, a manual deployment is a temporary controlled exception: it must use the exact committed local source, record its commit and deployment ID, and pass the same verification. Do not create another project or deploy an old folder. Verify `/`, `/app`, `/dashboard`, `/app.js`, and `/logo.png`, including content types. `/app` and `/dashboard` must be identical HTML.

### Telegram end-to-end

In a real group:

1. Test `/start`.
2. Test `/dashboard` and **Open Cribbit**.
3. Close the webview and test the blue **Cribbit** button.
4. Confirm both show the same persistent house.
5. Add one reversible item and verify it in Telegram and the Mini App.

## Release and rollback

- Record local/GitHub commit and platform deployment IDs.
- Keep the previous known-good Vercel deployment until checks pass.
- Roll back code only; never wipe the Railway volume.
- Repeat health, route, and Telegram checks after rollback.
- Never treat “Ready” or “Active” alone as proof.

## Current protections

- Telegram initData HMAC and expiry validation
- Active-house membership authorization
- Server-enforced admin settings policy
- Allow-listed actions and bounded JSON bodies
- Origin-limited browser CORS
- Git exclusions for secrets, data, dependencies, and builds
- Locked dependencies and GitHub test/build workflow
- Deterministic Vercel build and Telegram update deduplication

Outstanding hardening is tracked in [plan.md](plan.md): token rotation, branch protection, rate limiting, security headers, backups, provenance, and observability.

## Troubleshooting

### `/dashboard` works but the blue button does not

The inline link contains `chatId`; the global button does not. Verify the live Telegram menu URL, `/api/houses`, initData, membership, and deployed `app.js`.

### Railway is Active but Telegram does not respond

HTTP health does not prove polling. Inspect startup/Telegram errors, verify the secret, and ensure only the intended process uses the token.

### Vercel says Ready but assets are wrong

Check public statuses, content types, sizes, and hashes. Ready proves build completion, not correct routing.

### Data disappears

Stop mutations. Confirm `DATA_DIR`, volume attachment, and mount path before recovery. Do not overwrite the expected data path with an empty store.

## Governing documents

- [structure.md](structure.md): ownership, architecture, and data flow
- [requirements.md](requirements.md): product, security, operational, and acceptance rules
- [plan.md](plan.md): ordered hardening and delivery work

Priority for conflicts: explicit owner instruction, `requirements.md`, `plan.md`, `structure.md`, then README. Resolve conflicts locally before deployment.
