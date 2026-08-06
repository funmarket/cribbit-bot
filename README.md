# Cribbit

Cribbit is a Telegram roommate bot and Mini App for shared expenses, balances, chores, groceries, roomies, activity, and house settings.

## Source of truth

The only authoritative project code is the GitHub repository [`funmarket/cribbit-bot`](https://github.com/funmarket/cribbit-bot), branch `main`.

- Canonical local clone: `C:\Users\GrowB\cribbit-bot`
- Railway deploys the bot and API from GitHub `main`.
- Vercel deploys the landing page and Mini App from GitHub `main`.
- Never edit or deploy files directly in Vercel, Railway, downloads, temporary folders, or old Codex work folders.
- Every production change must be committed, tested, pushed to GitHub, and then deployed from that commit.

## Production ownership

| Component | Platform | Routes |
| --- | --- | --- |
| Telegram bot and persistent JSON store | Railway | Telegram polling and `expenses.json` |
| Authenticated dashboard API | Railway | `/health`, `/api/houses`, `/api/dashboard`, `/api/action` |
| Landing page and Telegram Mini App | Vercel | `/`, `/app`, `/dashboard`, static assets |

Production Mini App origin: `https://cribbit-dashboard-sigma.vercel.app`

Telegram bot: [@Cribbit_bot](https://t.me/Cribbit_bot)

## Required environment variables

Railway:

```text
BOT_TOKEN=<Telegram bot token>
MINI_APP_URL=https://cribbit-dashboard-sigma.vercel.app
DATA_DIR=/data
```

Railway supplies `PORT`, `RAILWAY_PUBLIC_DOMAIN`, and `RAILWAY_VOLUME_MOUNT_PATH`. `MINI_APP_URL` must be the origin; URL generation also safely normalizes an accidental `/app` or `/dashboard` path.

Do not commit secrets or `.env` files.

## Local verification

```powershell
cd C:\Users\GrowB\cribbit-bot
npm install
npm run typecheck
npm run build
```

`npm run typecheck` runs syntax checks and the complete Node test suite. `npm run build` creates the deterministic Vercel static output in ignored folder `dist`.

## Telegram launch behavior

- `/dashboard` creates a group-specific `/app` URL containing `chatId` and the Railway API origin.
- The blue **Cribbit** menu button opens `/app` with the Railway API origin but no hard-coded group ID.
- `/api/houses` validates Telegram `initData` and returns only active shared-group memberships for that user.
- One house opens automatically; multiple houses show a selector; no houses shows onboarding.

The bot synchronizes the global menu button on Railway startup. A synchronization error is logged without preventing normal bot commands from starting.

## Deployment procedure

1. Create a branch from current GitHub `main`.
2. Make one focused change.
3. Run `npm run typecheck` and `npm run build`.
4. Review `git diff --check` and the full diff.
5. Push the branch and merge it into GitHub `main`.
6. Confirm Railway and Vercel both deploy that same commit from GitHub.
7. Verify `/health`, `/`, `/app`, `/dashboard`, `/app.js`, `/logo.png`, `/api/houses`, and Telegram launch buttons.

Do not repair production by uploading a different local folder or creating a direct Vercel deployment.
