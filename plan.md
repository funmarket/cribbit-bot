do not drift , do not guess , do not loop , do not skip fixes , do not pretend , do not skip errors , fix everything you face and follow the plan

# Cribbit Corrective Development Plan

## 1. Non-negotiable operating rules

1. The only editable source of truth is `C:\Users\GrowB\cribbit-bot`.
2. Never edit application code independently in GitHub, Railway, Vercel, Downloads, temp folders, or an old work tree.
3. Every change follows this exact order: inspect -> reproduce -> test the failing behavior -> make one focused local change -> run verification -> review the diff -> commit locally -> push that commit -> deploy that same commit -> verify production.
4. Never treat GitHub, Railway, or Vercel as a second source of truth. They are synchronized outputs of reviewed local commits.
5. Do not guess a root cause. Record the exact symptom and gather code, test, log, configuration, or runtime evidence before editing.
6. Do not loop through the same unproven fix. If a test fails twice for the same reason, stop, preserve the evidence, and re-evaluate the hypothesis.
7. Do not skip a discovered blocking error. Resolve it in the current phase or record it explicitly with an owner, risk, and required evidence before continuing.
8. Do not silently expand scope. Unrelated improvements go into a later phase unless they block correctness, security, or data safety.
9. Preserve unrelated and untracked user files. The obsolete extensionless `index` is not source and must not be staged, run, edited, or deleted without explicit approval.
10. Never expose or commit bot tokens, Telegram login secrets, session tokens, Railway secrets, persistent data, or user identity payloads.
11. Keep implemented, locally tested, committed, deployed, and end-to-end verified as separate states. A checkmark requires evidence for that exact state.
12. Do not call work complete while any phase exit criterion is unproven.

## 2. Permanent source and release workflow

```text
C:\Users\GrowB\cribbit-bot
  -> inspect current Git state
  -> create one focused local change
  -> npm ci when dependencies changed or the install is untrusted
  -> npm run typecheck
  -> npm run build
  -> targeted regression tests and manual local verification
  -> git diff --check and full diff review
  -> local commit
  -> push the exact commit to funmarket/cribbit-bot
  -> Railway deploys that exact Git commit
  -> Vercel deploys that exact Git commit
  -> verify Telegram, Railway API, Vercel routes, authentication, and persistence
  -> record the release evidence
```

No platform is synchronized merely because a deployment says `Active` or `Ready`. The deployed Git SHA and runtime behavior must match the approved local commit.

## 3. Verified starting state and known defects

Application work must begin from a freshly recorded Git status and commit. At the time this plan was written, the existing test/typecheck suite passed 20 tests, but it did not cover the critical group launch and modal behaviors below.

### P0 — Critical

- Group replies attach `InlineKeyboardButton.web_app` through `dashboardKeyboard()`. Telegram permits that button type only in private chats, so Telegram can reject the entire reply in groups. This can hide `/start`, `/balance`, `/dashboard`, populated lists, and confirmations after a mutation has already been saved.
- The previously exposed Telegram bot token must be rotated before production-secure status.
- `/clear` can erase the current house without an owner/admin authorization check or confirmation.

### P1 — High

- Telegram privacy mode is enabled. Ordinary natural-language group messages may not be delivered unless Cribbit is an administrator, privacy mode is disabled, or users explicitly address/reply to the bot.
- Telegram command definitions drifted: BotFather/default commands were manually updated to the full product list, but `src/bot-commands.js` and Telegram language-specific scopes (`en`, `fr`, `ar`) still used the old shorter list.
- Expense and chore submit handlers use `event.currentTarget` after `await`; it becomes `null`, reset throws, and the modal stays open after a successful save.
- Multiple-Crib persistence and switching are implemented and browser-verified locally; production publication and live Telegram verification are still pending.
- Telegram Main Mini App, blue menu button, `/dashboard`, `/app`, and `/dashboard` alias must all be verified as consistent launch paths.

### P2 — Required product/security work

- External browser login is not implemented. Users outside Telegram cannot authenticate to real house data.
- `/start` is a long help response rather than a concise action-oriented entry point.
- The settlement algorithm conserves balances and returns valid simplified transfers, but greedy matching is not guaranteed to produce the mathematical minimum number of transfers.
- Protected APIs have no rate limiting and incomplete security headers.
- Persistence uses a fixed `.tmp` filename without a serialized write queue or tested recovery procedure.
- `index.js` is 113 lines but contains many compressed, very long handler lines, making isolated testing and maintenance difficult.

## 4. Required state labels

Every task and phase must use these states:

```text
PENDING -> IMPLEMENTED LOCALLY -> TESTED LOCALLY -> COMMITTED
-> DEPLOYED TO RAILWAY -> DEPLOYED TO VERCEL -> END-TO-END VERIFIED
```

`BLOCKED` is permitted only when the exact blocker, attempted evidence, required permission/input, and safe next action are recorded.

## Phase 0 — Baseline, contracts, and credentials

Status: **Required first**

### Tasks

- [ ] Record current local branch, full Git SHA, `git status --short`, remotes, and untracked files.
- [ ] Confirm `C:\Users\GrowB\cribbit-bot` remains authoritative and GitHub `funmarket/cribbit-bot` `main` is its reviewed mirror.
- [ ] Confirm Railway and Vercel are linked to the same repository and intended branch.
- [ ] Preserve the current passing test result as the baseline; do not interpret it as coverage of untested group/web flows.
- [x] Update governing requirements before implementation so external Web Login is a target requirement while unauthenticated access remains forbidden.
- [ ] Rotate the exposed testing token through BotFather.
- [ ] Replace `BOT_TOKEN` only in Railway's secret variables and approved local secret storage.
- [ ] Confirm the old token is rejected and the replacement bot responds.
- [ ] Run a repository secret scan without printing secret values.
- [ ] Verify GitHub branch protection requires the existing `Verify Cribbit` workflow, or record the missing protection as a release blocker.

### Exit criteria

- Baseline SHA and worktree state are recorded.
- The exposed token is invalid.
- The replacement token exists only in approved secret stores.
- Requirements, plan, structure, and README contain no contradictory authority or authentication claims.
- No application behavior has changed during baseline work.

## Phase 1 — Add regression seams before behavior changes

Status: **Pending after Phase 0**

### Tasks

- [ ] Make bot handler registration testable without launching polling or binding the production HTTP port.
- [ ] Add tests proving Telegraf routes `/start@Cribbit_bot`, `/balance@Cribbit_bot`, `/chores@Cribbit_bot`, and `/dashboard@Cribbit_bot` to the intended handlers.
- [ ] Do not add username-stripping middleware unless a failing test proves installed Telegraf cannot route a specific command. Installed Telegraf already parses the suffix.
- [ ] Add private-chat versus group-chat keyboard tests.
- [ ] Add a regression test that no group reply contains `InlineKeyboardButton.web_app`.
- [ ] Add a regression test that a saved mutation cannot be followed by an invalid reply markup path that encourages duplicate submission.
- [ ] Add frontend tests for successful and failed form submission state.
- [ ] Add tests for multiple-house selection, unauthorized house selection, and inactive membership.

### Exit criteria

- Tests reproduce the group button and modal failures before their fixes.
- Username-suffixed routing is proven rather than assumed.
- Production polling and ports are not needed to run handler tests.

## Command menu synchronization hotfix

Status: **Tested locally; publish pending**

### Root cause

Telegram can return different slash-command menus by command scope and language code. The live default scope had the manually added full command list, but the code-owned `en`, `fr`, and `ar` language scopes still synchronized the old 18-command list on bot startup.

### Tasks

- [x] Make `src/bot-commands.js` define the full BotFather command list once.
- [x] Use that same command order for default, English, French, and Arabic Telegram scopes.
- [x] Update `/help` text in bot and public locale files so it does not contradict the command menu.
- [x] Add a regression test proving default and localized command lists stay identical.
- [x] Run local verification.
- [ ] Commit and merge the fix from the local source of truth.
- [ ] Let Railway deploy the same Git commit.
- [ ] Verify Telegram `getMyCommands` for default, `en`, `fr`, and `ar` all return the same full list.

### Exit criteria

- Telegram slash-command menus no longer show the stale 18-command list for English, French, or Arabic users.
- The local source of truth, GitHub, Railway runtime, and Telegram command scopes all match the same command list.

## Phase 2 — Fix Telegram group commands and dashboard launching

Status: **Pending after Phase 1**

### Design rules

- Private bot chat may use an inline `web_app` button.
- Group and supergroup replies must use a Telegram-supported Main Mini App/direct-link launch, not `InlineKeyboardButton.web_app`.
- The supported group launch should use Cribbit's configured Main Mini App deep link, such as `https://t.me/Cribbit_bot?startapp=<opaque-context>` or the BotFather-assigned direct Mini App short name.
- Never expose a trusted raw group ID without server-side membership validation. Any start parameter must be opaque or signed, short-lived where appropriate, and validated before selecting a house.
- An optional dashboard button must never cause the underlying bot response or completed mutation to disappear.

### Tasks

- [ ] Split `dashboardKeyboard()` into explicit private-chat and group-chat launch builders.
- [ ] Preserve the canonical Vercel `/app` URL and Railway `apiBaseUrl`; never create `/app/app` or a second dashboard project.
- [ ] Configure/verify the BotFather Main Mini App URL and direct-link short name against the canonical app.
- [ ] Implement parsing of the approved `startapp` context in the frontend.
- [ ] Resolve that context to a house only after authenticated Telegram identity and active membership checks.
- [ ] Keep the global blue **Cribbit** menu button context-free so `/api/houses` performs zero/one/multiple-house discovery.
- [ ] Ensure `/start`, `/balance`, `/split`, `/chore`, `/chores`, `/groceries`, `/roomies`, `/activity`, `/settings`, and `/dashboard` return group-compatible markup.
- [ ] Log Telegram send errors with command/update/chat type and no message contents or secrets.
- [ ] Verify the exact Bot API error from the old group markup is no longer present.

### Manual acceptance matrix

Test in both a private chat and a real group/supergroup:

- [ ] `/start` and `/start@Cribbit_bot`
- [ ] `/split 10 pizza` and `/split@Cribbit_bot 10 pizza`
- [ ] `/balance` and `/balance@Cribbit_bot`
- [ ] `/chore add clean kitchen` and suffixed equivalent
- [ ] `/chores`, `/groceries`, `/roomies`, `/activity`, `/settings`
- [ ] `/dashboard` and `/dashboard@Cribbit_bot`
- [ ] Dashboard button opens the same canonical Cribbit app in every supported path.

### Exit criteria

- Addressed commands work in private and group contexts.
- No group response sends a private-only Web App button.
- Successful mutations produce visible confirmations exactly once.
- Railway logs show no button-type rejection during the acceptance matrix.

## Phase 3 — Define and verify natural-language group behavior

Status: **Pending after Phase 2**

### Required product decision

Use one documented policy; do not pretend code can process messages Telegram does not deliver:

1. Disable privacy mode through BotFather so Cribbit can receive ordinary group text; or
2. Require Cribbit to be a group administrator; or
3. Keep privacy mode and require natural-language expenses to mention/reply to Cribbit.

Recommended target: disable privacy mode for the house-management use case, explain the access clearly during onboarding, and still operate safely when permissions are limited.

### Tasks

- [ ] Record the chosen policy in requirements and README.
- [ ] Verify BotFather privacy configuration using `getMe.can_read_all_group_messages`.
- [ ] Add onboarding/help text explaining the required group permission.
- [ ] Test ordinary English, French, and Arabic natural-language expenses in a real group.
- [ ] Test addressed commands when ordinary messages remain unavailable.
- [ ] Confirm channels are unsupported unless dedicated `channel_post` behavior is separately designed and tested.

### Exit criteria

- Group natural-language behavior is predictable, documented, and verified.
- Missing Telegram permission produces a clear onboarding instruction rather than a false success claim.

## Phase 4 — Fix add forms, modal lifecycle, and duplicate submissions

Status: **Pending after Phase 2**

### Tasks

- [ ] Capture each form element in a stable variable before any `await`.
- [ ] Disable the submit button and show a saving state while the request is pending.
- [ ] On success: refresh data once, reset the captured form, close the correct dialog, restore controls, and announce success accessibly.
- [ ] On failure: keep the dialog open, preserve entered values, restore controls, and show a useful error.
- [ ] Prevent double-click and repeated-submit duplicates.
- [ ] Apply the same lifecycle to expense, chore, grocery, and future add forms.
- [ ] Correct unresolved UI interpolation such as `Due: {date}`.
- [ ] Test slow success, API error, timeout, duplicate click, keyboard submit, Cancel, and close-button behavior.

### Exit criteria

- Every successful add closes once and immediately displays the new persistent item.
- Failed submissions remain editable and do not create hidden data.
- Repeated clicks cannot create duplicates.

## Phase 5 — Implement persistent Crib selection and switching

Status: **Implemented and verified locally; not yet published or production-verified**

### Data and authorization design

- Extend `userPreferences` with `activeChatId` and `updatedAt`.
- Treat `activeChatId` as a preference only, never authorization.
- Every house load and mutation must continue checking the authenticated Telegram ID against active membership.
- If the saved Crib is missing or inactive, clear the preference and return to the chooser.

### Tasks

- [x] Add store methods to get, validate, set, and clear the active Crib.
- [x] Add authenticated API operations for reading and updating the active Crib.
- [x] Make the desktop sidebar Crib card interactive.
- [x] Add an equivalent mobile Crib switcher.
- [x] Add “Switch Crib” to Settings.
- [x] Reuse `/api/houses`; do not build a second membership list.
- [x] Synchronize the current URL after a switch without trusting it for access.
- [x] Refresh Overview, Expenses, Chores, Groceries, Roomies, Activity, and Settings after switching.
- [x] Test users with zero, one, multiple, removed, and inactive memberships.

### Exit criteria

- A user can switch among authorized Cribs from both navigation and Settings.
- The selection persists across a fresh launch.
- Cross-house and inactive-house access tests fail safely.

## Phase 6 — External Web Login and synchronized browser dashboard

Status: **Approved requirement; implement locally after core group/data fixes; production launch is blocked until Phase 9 passes**

Release gate: completing Phase 6 proves the feature in local/non-production environments. External Web Login must remain disabled in production until Phase 9 security acceptance and Phase 12 synchronized deployment acceptance both pass.

### Product definition

- Telegram Mini App: `/app` opened inside Telegram and authenticated with signed Mini App `initData`.
- External Web Login: the same `/app` opened in Chrome, Safari, Edge, or Firefox and authenticated with Telegram's official Web Login/OIDC flow.
- Both surfaces use the same Railway API, `src/store.js`, Railway persistent volume, Telegram user ID, house membership rules, and mutations. There is no second database and no independently maintained web application.
- The public landing page remains `/`. Native iOS and Android apps remain **Coming soon**.

### Chosen authentication architecture

Use Telegram's current official OpenID Connect Web Login flow configured under BotFather -> Bot Settings -> Web Login. Do not implement the legacy hash widget and OIDC simultaneously.

Authentication sequence:

```text
Browser /app
  -> no Mini App initData and no valid web session
  -> user chooses “Continue with Telegram”
  -> Railway /api/auth/telegram/start creates state, nonce, and PKCE challenge
  -> Telegram authorization
  -> Railway /api/auth/telegram/callback validates state and exchanges the code
  -> Railway verifies Telegram ID-token signature and claims
  -> Railway creates a one-time exchange code
  -> redirect to Vercel /app#login_code=<single-use-code>
  -> frontend immediately exchanges and removes login_code from browser history
  -> frontend receives a short-lived opaque session token
  -> protected API normalizes the session to the same viewer identity used by Mini App auth
  -> /api/houses and /api/action use the existing membership/store logic
```

### BotFather and environment configuration

- [ ] Register the production Vercel origin and exact Railway callback URI in BotFather Web Login Allowed URLs.
- [ ] Record separate localhost/test callback URLs only when explicitly needed.
- [ ] Store `TELEGRAM_LOGIN_CLIENT_ID` and `TELEGRAM_LOGIN_CLIENT_SECRET` in Railway only.
- [ ] Add `WEB_SESSION_SECRET` or, preferably, generate opaque random sessions and store only hashed tokens server-side.
- [ ] Add `WEB_SESSION_TTL_SECONDS=3600` as the initial explicit one-hour session policy.
- [ ] Never expose the client secret, bot token, PKCE verifier, session token, or full ID token in frontend code, logs, analytics, or persistent URLs.

### Backend tasks

- [ ] Add `GET /api/auth/telegram/start` with allow-listed `returnTo`, cryptographic state, nonce, and PKCE S256.
- [ ] Add `GET /api/auth/telegram/callback` with state verification and single-use authorization-code exchange.
- [ ] Store a bounded OAuth transaction record containing hashed state, nonce, PKCE verifier, allow-listed return target, expiry, and consumed time so a Railway restart cannot turn a valid login into an unverifiable or replayable request.
- [ ] Validate the ID token using Telegram's JWKS and the configured algorithm.
- [ ] Validate at minimum signature, `iss`, `aud`, `exp`, `iat`, and `nonce`.
- [ ] Cache JWKS safely with rotation handling; never accept an unknown key indefinitely.
- [ ] Add `POST /api/auth/session/exchange` for a random, single-use, short-expiry login code.
- [ ] Add `GET /api/auth/me` and `POST /api/auth/logout`.
- [ ] Store only a hash of opaque session tokens with Telegram ID, issued time, expiry, last-used time, and revocation time.
- [ ] Remove expired OAuth transactions, login codes, and sessions with bounded cleanup.
- [ ] Add an authentication adapter that accepts either valid `X-Telegram-Init-Data` or `Authorization: Bearer <web-session>`, never both ambiguously.
- [ ] Normalize both methods to one trusted viewer object before membership checks.
- [ ] Keep active-house authorization in the existing membership layer.
- [ ] Rate-limit auth start, callback, exchange, and failed-session requests separately.

### Frontend tasks

- [ ] Keep one dashboard application at `/app`; do not fork a separate `/web-app` codebase.
- [ ] Authentication priority: valid Telegram Mini App context -> valid external web session -> explicit demo mode -> login screen.
- [ ] Replace the outside-Telegram dead-end gate with a clear “Continue with Telegram” Web Login action.
- [ ] Keep `?demo=1` visibly non-persistent and separate from authenticated sessions.
- [ ] Receive `login_code` in the URL fragment, not the query string, so it is not sent in the Vercel HTTP request or referrer; exchange it immediately and remove it with `history.replaceState` before analytics or additional navigation.
- [ ] Store the one-hour session in `sessionStorage`, not `localStorage`; never place the session token in a URL.
- [ ] Attach the bearer token only to the configured Railway API origin.
- [ ] Provide logout, expired-session, revoked-session, popup-blocked, denied-login, offline, and retry states.
- [ ] After login, run the same zero/one/multiple-Crib discovery and persistent Crib selection from Phase 5.
- [ ] Explain that Web Login identifies the user but cannot discover arbitrary Telegram groups: a house appears only after Cribbit has registered that Telegram user as an active member of the group.
- [ ] Add “Log in with Telegram” to the public landing page and retain the Demo Dashboard action.

### Security tests

- [ ] Invalid/missing state, nonce, PKCE verifier, signature, issuer, audience, timestamps, or redirect URI is rejected.
- [ ] Authorization codes, login exchange codes, and logout tokens are single-use where applicable.
- [ ] Open redirects and unregistered return URLs are rejected.
- [ ] Expired and revoked sessions cannot access `/api/houses`, `/api/dashboard`, or `/api/action`.
- [ ] A valid user cannot access a Crib where membership is absent/inactive.
- [ ] Session tokens do not appear in URLs, logs, HTML, generated assets, or Git.
- [ ] Mini App `initData` authentication continues to work unchanged.
- [ ] Login works on current Chrome, Safari, Edge, Firefox, Telegram Desktop, Telegram Android, and Telegram iOS where applicable.
- [ ] If Telegram's popup library is used, security headers allow the required popup communication; do not use `Cross-Origin-Opener-Policy: same-origin` because it blocks that flow.

### Synchronization acceptance

- [ ] Add an expense through a Telegram group; it appears after refresh in the external browser dashboard.
- [ ] Add or complete a chore in the browser; the same persistent state appears in the Mini App and bot commands.
- [ ] Add/purchase a grocery item on either surface; both surfaces show the same result.
- [ ] Switch Cribs in the browser and Mini App without crossing authorization boundaries.
- [ ] Restart Railway safely and confirm authenticated state/data behavior matches the documented persistence policy.

### Exit criteria

- External browsers can authenticate through Telegram in local/non-production verification and access only authorized Cribs.
- Mini App and external browser actions are synchronized through the same Railway store.
- No second database, divergent dashboard, or platform-edited source exists.
- Authentication and session threat tests pass.
- The feature is ready for the Phase 9 security gate; it is not production-enabled early.

## Phase 7 — Improve `/start` and bot interaction UX

Status: **Pending after the group-safe launch path exists**

### Tasks

- [ ] Replace the long `/start` response with no more than three short introductory lines.
- [ ] Add action buttons for Split help, Balance, Chores, Groceries, Dashboard, and Help.
- [ ] Use callback buttons for bot actions and the Phase 2 group-safe launch for Dashboard.
- [ ] Extract shared command functions so callbacks and slash commands cannot diverge.
- [ ] Call `answerCbQuery()` for every callback outcome.
- [ ] Keep `/help` as the complete command reference.
- [ ] Localize every new label and response in English, French, and Arabic.
- [ ] Verify all callback actions in private and group contexts.

### Exit criteria

- `/start` is concise and action-oriented.
- Slash commands and buttons share the same tested business logic.
- No private-only button is sent in a group.

## Phase 8 — Settlement correctness

Status: **Pending**

### Tasks

- [ ] Preserve integer-cent balance conservation tests.
- [ ] Add a counterexample where current greedy matching uses four transfers although three are possible.
- [ ] Decide and record the product contract: exact minimum transfers for normal household sizes, or accurately labeled simplified transfers.
- [ ] If exact minimization remains required, implement a bounded exact algorithm with a documented fallback for large groups.
- [ ] Test zero balances, rounding remainders, excluded participants, deleted expenses, duplicate display names, and many-member houses.
- [ ] Ensure bot and dashboard use the same settlement implementation and wording.

### Exit criteria

- Output satisfies the documented contract for every test case.
- Marketing, help, requirements, and UI do not overclaim mathematical minimality.

## Phase 9 — Authorization, API security, and safe destructive actions

Status: **Pending before broad public Web Login launch**

### Tasks

- [ ] Require owner/admin authorization for `/clear` and every privileged setting or destructive action.
- [ ] Add an explicit confirmation step for house clearing; confirmation must be short-lived and bound to user and house.
- [ ] Add action-specific validation and normalized limits for every `/api/action` payload.
- [ ] Rate-limit public health/auth endpoints separately from authenticated read and mutation endpoints.
- [ ] Derive client IP only from Railway's documented trusted proxy headers.
- [ ] Apply security headers by surface: API responses, landing page, and dashboard need different policies.
- [ ] Build CSP around self-hosted assets, Telegram's required login/WebApp resources, and the exact Railway API origin.
- [ ] Do not blindly apply `X-Frame-Options: DENY`; verify Telegram Web/Mini App embedding requirements first.
- [ ] Avoid `Cross-Origin-Opener-Policy: same-origin` on the Web Login page when popup login is used.
- [ ] Test CORS with absent, allowed, and malicious origins, while treating authentication—not CORS—as the security boundary.
- [ ] Ensure client errors expose no stacks, filesystem paths, secrets, raw Telegram payloads, or session tokens.
- [ ] Run dependency and secret audits under a documented release policy.

### Exit criteria

- Destructive and privileged actions are server-authorized and confirmed.
- Rate limits and security headers pass automated tests without breaking Telegram or external Web Login.
- Cross-house, replay, payload-abuse, open-redirect, and information-leak tests pass.

## Phase 10 — Data durability and recovery

Status: **Pending before production-critical use**

### Tasks

- [ ] Verify the exact Railway data directory resolved from `DATA_DIR` or `RAILWAY_VOLUME_MOUNT_PATH`; never assume `/data`.
- [ ] Add a serialized write queue so concurrent mutations cannot share/overwrite one temporary file.
- [ ] Add startup validation and quarantine/recovery behavior for corrupt JSON rather than silently replacing it.
- [ ] Define schema versioning and forward migrations.
- [ ] Configure scheduled backups and retention outside the live volume.
- [ ] Restore a backup in non-production and compare record counts/checksums.
- [ ] Verify persistence through a controlled Railway restart.
- [ ] Define measured thresholds for migration to a transactional database.

### Exit criteria

- Concurrent-write, corruption, restart, backup, and restore tests pass.
- The production volume path and latest successful restore evidence are recorded.

## Phase 11 — Incremental handler refactor

Status: **Pending after critical behavior is protected by tests**

### Rules

- Do not perform a big-bang rewrite.
- Move one product area at a time and preserve observable behavior.
- Do not use an arbitrary line-count target as proof of quality.

### Tasks

- [ ] Extract setup/configuration and handler registration without changing behavior.
- [ ] Extract start/help/menu handlers.
- [ ] Extract expense and settlement handlers.
- [ ] Extract chore handlers.
- [ ] Extract grocery handlers.
- [ ] Extract roomies/activity/settings/language handlers.
- [ ] Centralize error handling and Telegram response construction.
- [ ] Run the full regression suite and manual acceptance matrix after every extraction.

### Exit criteria

- `index.js` owns startup/wiring rather than compressed business logic.
- Commands and callbacks reuse tested functions.
- No behavior, localization, URL, authentication, or persistence regression exists.

## Phase 12 — Deployment consistency, observability, and product quality

Status: **Pending**

### Tasks

- [ ] Keep Railway and Vercel connected to the same GitHub repository/branch with blank/verified root settings.
- [ ] End reliance on manual platform deployments after Git-linked deployments are proven.
- [ ] Expose non-secret release metadata so both runtimes report their Git SHA.
- [ ] Add structured startup, Telegram send, API, authentication, and shutdown logs without personal data or secrets.
- [ ] Monitor `/health` and define alert/incident ownership.
- [ ] Bound or paginate large expense/activity histories.
- [ ] Validate accessibility, keyboard navigation, screen readers, RTL, safe areas, and 375px mobile layout.
- [ ] Load-test non-production API/store/session behavior.
- [ ] Keep native iOS and Android apps labeled **Coming soon** until separately approved and built.
- [ ] Record last-known-good deployment IDs and test rollback without touching the Railway volume.

### Exit criteria

- Both deployed runtimes prove the same approved Git SHA.
- Operators can isolate bot, frontend, API, authentication, and persistence failures.
- Supported desktop/mobile acceptance and measured scale limits are recorded.

## 5. Required release record

```text
Objective and phase:
Local path and starting commit:
Local resulting commit:
GitHub commit:
Files changed:
Dependencies changed:
npm ci:
npm run typecheck:
npm run build:
targeted regression tests:
git diff --check:
full diff review:
Railway deployment SHA and /health:
Vercel deployment SHA and routes:
BotFather settings verified:
Telegram private acceptance:
Telegram group acceptance:
Mini App authentication:
External Web Login authentication:
Cross-surface synchronization:
Persistence restart/restore:
Rollback target:
Known unverified items or accepted risks:
```

## 6. Stop conditions

Stop the current phase and report evidence when:

- The target file, source tree, or intended behavior is unclear.
- Local and GitHub differ unexpectedly.
- A production deployment cannot be tied to a Git SHA.
- A secret may have been exposed.
- Persistent data could be overwritten or lost.
- A test fails and the cause is not understood.
- The same hypothesis fails twice without new evidence.
- The next action would overwrite, delete, force-push, wipe a volume, bypass branch protection, or weaken authentication without explicit approval.
- Telegram, Railway, Vercel, or GitHub authorization is required but unavailable.

When stopped, record: exact error, affected phase/task, evidence gathered, what was not changed, and the smallest safe action needed to continue.
