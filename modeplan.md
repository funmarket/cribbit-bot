# Crib Modes Implementation Plan

Do not drift. Do not guess. Do not loop. Do not skip fixes. Do not pretend. Do not skip errors. Fix everything discovered in the active phase or record the exact blocker before moving on. Always change the local source of truth first, then synchronize that exact reviewed code to GitHub, Railway, Vercel, and Telegram/BotFather where applicable.

## 1. Source-of-truth workflow

Authoritative project path:

```text
C:\Users\GrowB\cribbit-bot
```

Every Crib Modes change must follow this order:

```text
inspect local source
-> record exact current Git state
-> implement one focused phase locally
-> run local tests/build
-> review diff
-> commit local branch
-> push to GitHub PR
-> merge reviewed PR
-> verify Railway/Vercel/Telegram runtime
-> update this plan with proof
```

Never edit Railway, Vercel, GitHub web UI, Downloads folders, temp folders, or older worktrees as a second codebase. Those are deployment targets or references only.

## 2. Product definition

Crib Modes let each household choose the vibe Cribbit should use. A mode changes:

- command suggestions;
- wording/tone;
- dashboard quick actions;
- overview cards;
- settings labels;
- onboarding examples.

Base Cribbit features remain available in every mode:

```text
/start
/help
/setup
/split
/balance
/settle
/undo
/void
/last
/chore
/chores
/done
/grocery
/groceries
/roomies
/activity
/settings
/dashboard
/language
```

Mode-specific commands should be highlighted and tone-matched, but they should not break when used outside their primary mode. If a command is not primary for the current mode, Cribbit can still handle it and optionally say it is usually part of another vibe.

## 3. Initial modes

| Mode key | Display name | Audience | Personality |
| --- | --- | --- | --- |
| `roomies` | Roomies | roommates / flatshare | practical, direct, calm |
| `cubs` | Cubs | friends / social house | playful, party-energy, teasing but helpful |
| `nest` | Nest | family / household | warm, organized, gentle |
| `twinsoul` | TwinSoul | couples | intimate, soft, thoughtful |
| `colleagues` | Colleagues | work team / office | clear, professional, action-oriented |
| `buddies` | Buddies | sports / events / hobby partners | energetic, casual, team-focused |
| `crew` | Crew | travel / project group | mission-style, coordinated, practical |
| `guild` | Guild | gaming / online community | playful, quest-like, achievement-flavored |

Future optional modes:

| Mode key | Display name | Use case |
| --- | --- | --- |
| `studio` | Studio | creators, artists, shared creative spaces |
| `lab` | Lab | student groups, research groups, hackathons |
| `camp` | Camp | retreats, temporary group stays |
| `clubhouse` | Clubhouse | community clubs and recurring meetups |

Do not add future modes to production command/menu behavior until the mode definition, tests, dashboard support, and copy are ready.

## 4. Mode command map

### Roomies

Primary focus:

```text
/split
/balance
/settle
/chore
/chores
/grocery
/groceries
/houserules
/quiethours
/tab
```

Overview cards:

- balances;
- chores due;
- groceries;
- house rules;
- quiet hours.

### Cubs

Primary focus:

```text
/party
/ding
/tab
/fundme
/chipin
/funds
/dinner
```

Overview cards:

- party mode;
- shared tab;
- who is free;
- fund goals;
- recent activity.

### Nest

Primary focus:

```text
/dinner
/pickup
/sundayplan
/grocery
/groceries
/chore
/chores
/quiethours
```

Overview cards:

- dinner plan;
- pickup tasks;
- groceries;
- chores;
- quiet hours;
- weekly plan.

### TwinSoul

Primary focus:

```text
/date
/ours
/mood
/dinner
/split
/balance
```

Overview cards:

- date plan;
- mood check-in;
- couple summary;
- shared expenses;
- dinner plan.

### Colleagues

Primary focus:

```text
/corrections
/confirm
/reject
/sundayplan
/fundme
/chipin
/funds
/activity
```

Overview cards:

- pending corrections;
- action items;
- shared fund;
- weekly plan;
- activity log.

### Buddies

Primary focus:

```text
/ding
/sundayplan
/tab
/fundme
/chipin
/funds
/party
```

Overview cards:

- game/event plan;
- shared tab;
- who is free;
- funds;
- activity.

### Crew

Primary focus:

```text
/sundayplan
/fundme
/chipin
/funds
/tab
/ding
/corrections
```

Overview cards:

- mission plan;
- shared costs;
- funds;
- unresolved corrections;
- activity.

### Guild

Primary focus:

```text
/ding
/party
/tab
/mood
/fundme
/chipin
/funds
```

Overview cards:

- guild status;
- active quests/plans;
- shared tab;
- fund goals;
- mood/check-in.

## 5. Implementation phases

### Phase 0 — Baseline and safety

Status: complete for Slice B start

Tasks:

- [x] Record branch, commit SHA, and `git status --short --branch`.
- [x] Confirm only `C:\Users\GrowB\cribbit-bot` is edited.
- [x] Confirm the old extensionless `index` remains untouched and untracked.
- [x] Read current `index.js`, `src/store.js`, `src/bot-commands.js`, dashboard settings code, locale files, tests, and `plan.md`.
- [x] Decide whether `/mode` should be added to the Telegram command menu immediately or hidden until dashboard support exists.

Exit criteria:

- No code behavior changed.
- Exact target files for Phase 1 are known.

### Phase 1 — Mode model and source module

Status: complete through Slice C

Tasks:

- [x] Add `src/modes.js`.
- [x] Define mode keys, display names, descriptions, tone labels, primary commands, dashboard cards, and aliases.
- [x] Add `cribMode: "roomies"` to default settings.
- [x] Normalize invalid/missing modes back to `roomies`.
- [x] Export helpers such as:
  - `normalizeMode(value)`;
  - `modeDefinition(value)`;
  - `commandsForMode(value)`;
  - `modeNames()`;
  - `isPrimaryModeCommand(mode, command)`.
- [x] Add tests for mode normalization and definitions.

Exit criteria:

- Mode definitions are centralized.
- Store settings persist a valid mode.
- Invalid mode data cannot crash the bot or dashboard.

Slice B note: `cribMode` persistence remains intentionally unchecked here because `modeplan.md` assigns it to Slice C.

### Phase 2 — `/mode` Telegram command

Status: pending

Tasks:

- [ ] Add `/mode` to `src/bot-commands.js` only when the handler is implemented in the same PR.
- [ ] Register `bot.command('mode', ...)`.
- [ ] Support:
  - `/mode`;
  - `/mode roomies`;
  - `/mode cubs`;
  - `/mode nest`;
  - `/mode twinsoul`;
  - `/mode colleagues`;
  - `/mode buddies`;
  - `/mode crew`;
  - `/mode guild`.
- [ ] In groups, only owner/admin can change the mode.
- [ ] In private chat, show the user's known Cribs and explain mode is set per Crib.
- [ ] Update `/help` so it includes `/mode` and shows current mode suggestions.
- [ ] Add tests proving `/mode` is advertised and handled.

Exit criteria:

- `/mode` never falls into unknown-command fallback.
- Mode changes persist in JSON.
- Non-admin group users cannot change shared mode.

### Phase 3 — Mode-aware command suggestions

Status: pending

Tasks:

- [ ] Keep the full command menu stable unless a product decision says otherwise.
- [ ] Make `/help` show:
  - full base commands;
  - current mode;
  - top mode-specific commands.
- [ ] Make `/start` concise and mode-aware.
- [ ] Avoid claiming commands are unavailable if they still work.
- [ ] Add tests proving each mode renders the right suggested commands.

Exit criteria:

- Users see the right commands for their mode without losing access to base features.
- No advertised command lacks a handler.

### Phase 4 — Mode-aware tone

Status: pending

Tasks:

- [ ] Add central tone strings or response helpers.
- [ ] Apply tone safely to:
  - `/start`;
  - `/help`;
  - `/mode`;
  - `/chore`;
  - `/grocery`;
  - `/fundme`;
  - `/dinner`;
  - `/mood`;
  - `/party`.
- [ ] Keep transactional details clear even when tone is playful.
- [ ] Avoid jokes in error states, payment amounts, destructive actions, or authorization failures.

Exit criteria:

- Mode personality is visible.
- Financial and safety-critical messages stay precise.

### Phase 5 — Dashboard settings UI

Status: pending

Tasks:

- [ ] Add Crib Mode selector to Settings.
- [ ] Save mode through the existing authenticated settings API.
- [ ] Show current mode in desktop sidebar and mobile crib switcher.
- [ ] Add mode descriptions and command chips.
- [ ] Preserve Telegram Mini App authentication and demo mode.
- [ ] Add browser/UI tests where available.

Exit criteria:

- Users can view and change mode from the app.
- Mode persists across refresh and Crib switching.

### Phase 6 — Mode-aware dashboard overview

Status: pending

Tasks:

- [ ] Add mode-specific overview card definitions from `src/modes.js` or a mirrored frontend config generated from it.
- [ ] Do not duplicate divergent mode definitions in frontend and backend.
- [ ] Show cards relevant to each mode while preserving balances and key household state.
- [ ] Make mobile layout fit at 375px and 390px widths.
- [ ] Keep `Roomies` as the default dashboard shape.

Exit criteria:

- Dashboard reflects selected mode.
- No second dashboard or route fork is created.

### Phase 7 — Mode-specific command polish

Status: pending

Tasks:

- [ ] Improve existing lightweight handlers into more complete mode features:
  - `/pickup` with owner/date/status;
  - `/date` with date/time/place;
  - `/mood` with simple mood scale;
  - `/dinner` with attendees/diet notes;
  - `/party` with event time/quiet-hours warning;
  - `/tab` with settle/export behavior;
  - `/corrections` with target record references.
- [ ] Add dashboard views for mode-specific records where appropriate.
- [ ] Add persistence and regression tests for each polished command.

Exit criteria:

- Mode commands feel real, not thin wrappers around notes.
- Dashboard and bot show the same data.

### Phase 8 — Localization

Status: pending

Tasks:

- [ ] Add mode names/descriptions/tone strings to English, French, and Arabic locale files.
- [ ] Verify Arabic RTL remains correct and logo is not mirrored.
- [ ] Keep command names official/lowercase and untranslated.
- [ ] Add missing-translation tests.

Exit criteria:

- No missing locale keys.
- English/French/Arabic mode UI is coherent.

### Phase 9 — Deployment synchronization

Status: pending

Tasks:

- [ ] Commit local source.
- [ ] Push PR.
- [ ] Verify PR checks or document GitHub infrastructure failures honestly.
- [ ] Merge.
- [ ] Confirm Railway health.
- [ ] Confirm Vercel `/app` loads.
- [ ] Verify Telegram command menu if `/mode` is added.
- [ ] Manually test `/mode`, one mode switch, and one mode-specific command in Telegram.
- [ ] Update `modeplan.md` and `plan.md` with evidence.

Exit criteria:

- Local, GitHub, Railway, Vercel, and Telegram are synchronized.
- Any unverified item is explicitly listed.

## 6. Ready-to-execute implementation checklist

Use this checklist when implementation starts. Complete one slice at a time. Do not start the next slice until the current slice is tested, committed, pushed, merged, deployed if applicable, and recorded.

### Slice A — Baseline proof before code changes

Purpose: prove the starting state and prevent source drift.

Exact files to read, in order:

1. `C:\Users\GrowB\cribbit-bot\modeplan.md`
2. `C:\Users\GrowB\cribbit-bot\plan.md`
3. `C:\Users\GrowB\cribbit-bot\structure.md`
4. `C:\Users\GrowB\cribbit-bot\requirements.md`
5. `C:\Users\GrowB\cribbit-bot\README.md`
6. `C:\Users\GrowB\cribbit-bot\package.json`
7. `C:\Users\GrowB\cribbit-bot\index.js`
8. `C:\Users\GrowB\cribbit-bot\src\store.js`
9. `C:\Users\GrowB\cribbit-bot\src\bot-commands.js`
10. `C:\Users\GrowB\cribbit-bot\test\cribbit.test.js`
11. `C:\Users\GrowB\cribbit-bot\public\app.js`
12. `C:\Users\GrowB\cribbit-bot\public\app.html`
13. `C:\Users\GrowB\cribbit-bot\public\styles.css`

Commands:

```powershell
cd C:\Users\GrowB\cribbit-bot
git status --short --branch
git log -1 --oneline
npm run typecheck
npm run build
```

Checklist:

- [x] Confirm branch is `main...origin/main`.
- [x] Confirm only the old extensionless `index` is untracked.
- [x] Confirm no source file is modified before implementation starts.
- [x] Record current commit SHA in this file under the active slice notes.
- [x] Run `npm run typecheck`.
- [x] Run `npm run build`.

Stop if:

- local main is not synchronized with origin;
- more files than the old extensionless `index` are dirty;
- baseline tests/build fail for a reason unrelated to the planned slice.

### Slice B — Central mode definitions

Purpose: define Crib Modes once so bot, dashboard, tests, and help text cannot drift.

Exact files to change, in order:

1. Add `C:\Users\GrowB\cribbit-bot\src\modes.js`
2. Edit `C:\Users\GrowB\cribbit-bot\test\cribbit.test.js`
3. Edit `C:\Users\GrowB\cribbit-bot\modeplan.md`

Expected `src\modes.js` exports:

```js
const DEFAULT_MODE = 'roomies';
const MODE_DEFINITIONS = { /* roomies, cubs, nest, twinsoul, colleagues, buddies, crew, guild */ };
function normalizeMode(value) {}
function modeDefinition(value) {}
function modeNames() {}
function commandsForMode(value) {}
function isPrimaryModeCommand(mode, command) {}
module.exports = { DEFAULT_MODE, MODE_DEFINITIONS, normalizeMode, modeDefinition, modeNames, commandsForMode, isPrimaryModeCommand };
```

Test checklist:

- [ ] `normalizeMode()` returns `roomies` for empty, unknown, null, and invalid values.
- [ ] Every mode has `key`, `name`, `audience`, `personality`, `primaryCommands`, `overviewCards`, and `tone`.
- [ ] Every primary command referenced by a mode exists in `BOT_COMMANDS` or is intentionally marked as future.
- [ ] `commandsForMode('twinsoul')` includes `/date`, `/ours`, and `/mood`.
- [ ] `commandsForMode('nest')` includes `/pickup`, `/sundayplan`, and `/dinner`.

Commands:

```powershell
npm run typecheck
npm run build
git diff --check
```

Do not change yet:

- `index.js`
- `src\store.js`
- `src\bot-commands.js`
- dashboard UI files

Exit criteria:

- `src\modes.js` exists.
- Tests pass.
- No runtime behavior changes yet.

Slice B evidence:

```text
Slice: B — Central mode definitions
Starting commit: 1fee9ba
Files changed locally: src/modes.js, test/cribbit.test.js, modeplan.md
npm run typecheck: passed, 30/30 tests
npm run build: passed
Runtime behavior changed: no
Command menu changed: no
```

### Slice C — Persist `settings.cribMode`

Purpose: make Crib Mode durable in the shared store without exposing UI yet.

Exact files to change, in order:

1. Edit `C:\Users\GrowB\cribbit-bot\src\store.js`
2. Edit `C:\Users\GrowB\cribbit-bot\test\cribbit.test.js`
3. Edit `C:\Users\GrowB\cribbit-bot\modeplan.md`

Store changes:

- [x] Import `DEFAULT_MODE` and `normalizeMode` from `src\modes.js`.
- [x] Add `cribMode: DEFAULT_MODE` to `defaultSettings()`.
- [x] In `settings(chatId, houseName)`, normalize existing `state.settings[chatId].cribMode`.
- [x] Add `cribMode` to `updateSettings()` allowed keys.
- [x] Ensure invalid saved values normalize to `roomies`.
- [x] Keep existing `quietHours`, `houseRules`, and `partyMode` behavior intact.

Test checklist:

- [x] New stores default to `cribMode: "roomies"`.
- [x] Updating settings with `{ cribMode: "nest" }` persists.
- [x] Reloading the store preserves `cribMode`.
- [x] Invalid stored mode reloads as `roomies`.
- [x] `dashboard(chatId).settings.cribMode` is present.

Commands:

```powershell
npm run typecheck
npm run build
git diff --check
```

Exit criteria:

- Mode is stored per Crib.
- No command menu change yet.

Slice C evidence:

```text
Slice: C — Persist settings.cribMode
Starting commit: 2845329
Local commit: 2422523
PR: #12
Merge commit: 9dc0d64
Files changed locally: src/store.js, test/cribbit.test.js, modeplan.md
npm run typecheck: passed, 31/31 tests before PR and after merge
npm run build: passed before PR and after merge
git diff --check: passed with LF-to-CRLF warnings only
Vercel: PR preview checks passed; production /app returned 200 after merge
Railway: /health returned ok after merge
Runtime behavior changed: settings now persist normalized cribMode per Crib
Command menu changed: no
Known repair included: restored registerMember profile creation from a dirty partial local edit before continuing
```

### Slice D — Add `/mode` command and command-menu sync

Purpose: expose mode control in Telegram only after persistence exists.

Exact files to change, in order:

1. Edit `C:\Users\GrowB\cribbit-bot\src\bot-commands.js`
2. Edit `C:\Users\GrowB\cribbit-bot\index.js`
3. Edit `C:\Users\GrowB\cribbit-bot\locales\en.json`
4. Edit `C:\Users\GrowB\cribbit-bot\locales\fr.json`
5. Edit `C:\Users\GrowB\cribbit-bot\locales\ar.json`
6. Edit `C:\Users\GrowB\cribbit-bot\public\locales\en.json`
7. Edit `C:\Users\GrowB\cribbit-bot\public\locales\fr.json`
8. Edit `C:\Users\GrowB\cribbit-bot\public\locales\ar.json`
9. Edit `C:\Users\GrowB\cribbit-bot\test\cribbit.test.js`
10. Edit `C:\Users\GrowB\cribbit-bot\modeplan.md`

Command behavior:

- [ ] `/mode` shows current mode, all available modes, and suggested commands.
- [ ] `/mode roomies` sets Roomies mode.
- [ ] `/mode cubs` sets Cubs mode.
- [ ] `/mode nest` sets Nest mode.
- [ ] `/mode twinsoul` sets TwinSoul mode.
- [ ] `/mode colleagues` sets Colleagues mode.
- [ ] `/mode buddies` sets Buddies mode.
- [ ] `/mode crew` sets Crew mode.
- [ ] `/mode guild` sets Guild mode.
- [ ] Invalid values show a helpful list and do not change settings.
- [ ] In groups, only owner/admin can change mode.
- [ ] In groups, non-admin users can still run `/mode` read-only.
- [ ] In private chat, `/mode` explains mode is per Crib and prompts opening a group/dashboard if no Crib context is selected.

Tests:

- [ ] `BOT_COMMANDS` includes `mode`.
- [ ] Existing test proving every advertised command has a handler still passes.
- [ ] `/mode` handler exists.
- [ ] Mode descriptions exist in English/French/Arabic locale dictionaries.
- [ ] Missing translation test still passes.

Commands:

```powershell
npm run typecheck
npm run build
git diff --check
```

Deployment verification after merge:

- [ ] Telegram `getMyCommands` returns the same count for default, `en`, `fr`, and `ar`.
- [ ] `/mode` in Telegram does not hit unknown-command fallback.
- [ ] `/mode nest` persists and `/mode` shows Nest afterward.

Exit criteria:

- `/mode` is advertised and handled in the same release.
- No command-menu drift is introduced.

### Slice E — Mode-aware `/start` and `/help`

Purpose: make the bot feel mode-aware without changing core business logic.

Exact files to change, in order:

1. Edit `C:\Users\GrowB\cribbit-bot\index.js`
2. Edit `C:\Users\GrowB\cribbit-bot\src\modes.js`
3. Edit `C:\Users\GrowB\cribbit-bot\locales\en.json`
4. Edit `C:\Users\GrowB\cribbit-bot\locales\fr.json`
5. Edit `C:\Users\GrowB\cribbit-bot\locales\ar.json`
6. Edit `C:\Users\GrowB\cribbit-bot\public\locales\en.json`
7. Edit `C:\Users\GrowB\cribbit-bot\public\locales\fr.json`
8. Edit `C:\Users\GrowB\cribbit-bot\public\locales\ar.json`
9. Edit `C:\Users\GrowB\cribbit-bot\test\cribbit.test.js`
10. Edit `C:\Users\GrowB\cribbit-bot\modeplan.md`

Implementation checklist:

- [ ] Create a helper that builds mode-aware help text from mode definitions.
- [ ] `/start` becomes concise and shows current Crib mode.
- [ ] `/help` shows base commands plus “Best for this mode.”
- [ ] Keep full command menu stable; do not remove commands from BotFather menu.
- [ ] Do not use playful tone for errors, authorization failures, destructive actions, or payment amounts.

Tests:

- [ ] `/help` content includes current mode name.
- [ ] Roomies help suggests `/split`, `/chore`, `/groceries`.
- [ ] TwinSoul help suggests `/date`, `/ours`, `/mood`.
- [ ] Nest help suggests `/pickup`, `/dinner`, `/sundayplan`.
- [ ] Colleagues help suggests `/corrections`, `/confirm`, `/reject`.

Commands:

```powershell
npm run typecheck
npm run build
git diff --check
```

Exit criteria:

- Help/start text is generated from source definitions, not hand-copied divergent lists.

### Slice F — Dashboard Settings mode selector

Purpose: allow mode viewing/changing from the Mini App/web dashboard.

Exact files to change, in order:

1. Edit `C:\Users\GrowB\cribbit-bot\public\app.html`
2. Edit `C:\Users\GrowB\cribbit-bot\public\app.js`
3. Edit `C:\Users\GrowB\cribbit-bot\public\styles.css`
4. Edit `C:\Users\GrowB\cribbit-bot\public\locales\en.json`
5. Edit `C:\Users\GrowB\cribbit-bot\public\locales\fr.json`
6. Edit `C:\Users\GrowB\cribbit-bot\public\locales\ar.json`
7. Edit `C:\Users\GrowB\cribbit-bot\test\cribbit.test.js`
8. Edit `C:\Users\GrowB\cribbit-bot\modeplan.md`

Implementation checklist:

- [ ] Add mode selector to Settings view.
- [ ] Show mode name and description near the Crib/house settings.
- [ ] Save through existing `settings.update` API.
- [ ] Refresh dashboard state after save.
- [ ] Show mode command chips or quick suggestions.
- [ ] Preserve demo-mode behavior.
- [ ] Preserve Mini App Telegram authentication.
- [ ] Preserve mobile layout at 375px and 390px.

Tests:

- [ ] Dashboard payload includes `settings.cribMode`.
- [ ] Settings update accepts `cribMode`.
- [ ] Invalid mode cannot be saved through API.
- [ ] Existing settings tests still pass.

Commands:

```powershell
npm run typecheck
npm run build
git diff --check
```

Manual visual checks:

- [ ] Desktop Settings shows selector.
- [ ] Mobile Settings shows selector without overflow.
- [ ] Switching mode updates UI after save.

Exit criteria:

- Mode can be changed from Telegram and dashboard.

### Slice G — Mode-aware overview cards

Purpose: make the dashboard visibly adapt to the selected Crib Mode.

Exact files to change, in order:

1. Edit `C:\Users\GrowB\cribbit-bot\src\modes.js`
2. Edit `C:\Users\GrowB\cribbit-bot\public\app.js`
3. Edit `C:\Users\GrowB\cribbit-bot\public\styles.css`
4. Edit `C:\Users\GrowB\cribbit-bot\public\locales\en.json`
5. Edit `C:\Users\GrowB\cribbit-bot\public\locales\fr.json`
6. Edit `C:\Users\GrowB\cribbit-bot\public\locales\ar.json`
7. Edit `C:\Users\GrowB\cribbit-bot\test\cribbit.test.js`
8. Edit `C:\Users\GrowB\cribbit-bot\modeplan.md`

Implementation checklist:

- [ ] Keep balance cards visible in every mode.
- [ ] Roomies emphasizes chores, groceries, rules.
- [ ] Cubs emphasizes party, tab, ding, funds.
- [ ] Nest emphasizes dinner, pickup, groceries, quiet hours.
- [ ] TwinSoul emphasizes date, mood, ours, dinner.
- [ ] Colleagues emphasizes corrections, weekly plan, activity.
- [ ] Buddies emphasizes event plan, tab, ding, funds.
- [ ] Crew emphasizes plan, funds, tab, corrections.
- [ ] Guild emphasizes quests/plans, tab, party, mood.
- [ ] Avoid duplicating mode definitions separately in backend and frontend.

Tests:

- [ ] Each mode has overview card definitions.
- [ ] Unknown mode falls back to Roomies card definitions.
- [ ] Dashboard route still serves required assets.

Commands:

```powershell
npm run typecheck
npm run build
git diff --check
```

Manual visual checks:

- [ ] `/app?demo=1` renders mode sections.
- [ ] Mobile balance cards remain aligned.
- [ ] Bottom nav still works.

Exit criteria:

- Dashboard visibly matches the selected mode.
- No second app route or duplicate dashboard is created.

### Slice H — Mode command polish

Purpose: upgrade current lightweight note-style commands into richer mode features.

Implement one command per PR unless the diff is tiny and tightly coupled.

Recommended order and exact files:

1. `/pickup`
   - `C:\Users\GrowB\cribbit-bot\src\store.js`
   - `C:\Users\GrowB\cribbit-bot\index.js`
   - `C:\Users\GrowB\cribbit-bot\test\cribbit.test.js`
   - `C:\Users\GrowB\cribbit-bot\public\app.js`
   - `C:\Users\GrowB\cribbit-bot\modeplan.md`
2. `/date`
   - `C:\Users\GrowB\cribbit-bot\src\store.js`
   - `C:\Users\GrowB\cribbit-bot\index.js`
   - `C:\Users\GrowB\cribbit-bot\test\cribbit.test.js`
   - `C:\Users\GrowB\cribbit-bot\public\app.js`
   - `C:\Users\GrowB\cribbit-bot\modeplan.md`
3. `/mood`
   - `C:\Users\GrowB\cribbit-bot\src\store.js`
   - `C:\Users\GrowB\cribbit-bot\index.js`
   - `C:\Users\GrowB\cribbit-bot\test\cribbit.test.js`
   - `C:\Users\GrowB\cribbit-bot\public\app.js`
   - `C:\Users\GrowB\cribbit-bot\modeplan.md`
4. `/dinner`
   - `C:\Users\GrowB\cribbit-bot\src\store.js`
   - `C:\Users\GrowB\cribbit-bot\index.js`
   - `C:\Users\GrowB\cribbit-bot\test\cribbit.test.js`
   - `C:\Users\GrowB\cribbit-bot\public\app.js`
   - `C:\Users\GrowB\cribbit-bot\modeplan.md`
5. `/party`
   - `C:\Users\GrowB\cribbit-bot\src\store.js`
   - `C:\Users\GrowB\cribbit-bot\index.js`
   - `C:\Users\GrowB\cribbit-bot\test\cribbit.test.js`
   - `C:\Users\GrowB\cribbit-bot\public\app.js`
   - `C:\Users\GrowB\cribbit-bot\modeplan.md`
6. `/tab`
   - `C:\Users\GrowB\cribbit-bot\src\store.js`
   - `C:\Users\GrowB\cribbit-bot\index.js`
   - `C:\Users\GrowB\cribbit-bot\test\cribbit.test.js`
   - `C:\Users\GrowB\cribbit-bot\public\app.js`
   - `C:\Users\GrowB\cribbit-bot\modeplan.md`
7. `/corrections`
   - `C:\Users\GrowB\cribbit-bot\src\store.js`
   - `C:\Users\GrowB\cribbit-bot\index.js`
   - `C:\Users\GrowB\cribbit-bot\test\cribbit.test.js`
   - `C:\Users\GrowB\cribbit-bot\public\app.js`
   - `C:\Users\GrowB\cribbit-bot\modeplan.md`

Each command polish PR must include:

- [ ] parse rules;
- [ ] list behavior;
- [ ] create/update behavior;
- [ ] persistence test;
- [ ] bot handler test or handler coverage test;
- [ ] dashboard display if relevant;
- [ ] `/help` or mode suggestion update if command usage changes.

Commands:

```powershell
npm run typecheck
npm run build
git diff --check
```

Exit criteria:

- The command stores structured data, not only free-text notes.
- Bot and dashboard read the same data.

### Slice I — Localization pass

Purpose: remove hard-coded English from mode UX once the behavior stabilizes.

Exact files to change, in order:

1. Edit `C:\Users\GrowB\cribbit-bot\locales\en.json`
2. Edit `C:\Users\GrowB\cribbit-bot\locales\fr.json`
3. Edit `C:\Users\GrowB\cribbit-bot\locales\ar.json`
4. Edit `C:\Users\GrowB\cribbit-bot\public\locales\en.json`
5. Edit `C:\Users\GrowB\cribbit-bot\public\locales\fr.json`
6. Edit `C:\Users\GrowB\cribbit-bot\public\locales\ar.json`
7. Edit `C:\Users\GrowB\cribbit-bot\src\i18n.js` only if needed.
8. Edit `C:\Users\GrowB\cribbit-bot\public\i18n.js` only if needed.
9. Edit `C:\Users\GrowB\cribbit-bot\test\cribbit.test.js`
10. Edit `C:\Users\GrowB\cribbit-bot\modeplan.md`

Checklist:

- [ ] Add mode names.
- [ ] Add mode descriptions.
- [ ] Add `/mode` responses.
- [ ] Add mode-aware `/start` responses.
- [ ] Add mode-aware `/help` labels.
- [ ] Add dashboard selector labels.
- [ ] Verify command names stay untranslated and lowercase.
- [ ] Verify Arabic RTL and logo behavior.

Commands:

```powershell
npm run typecheck
npm run build
git diff --check
```

Exit criteria:

- Missing translation test passes.
- English/French/Arabic all show coherent mode UX.

### Slice J — Deployment and live acceptance

Purpose: synchronize everything and prove the feature is live.

Exact files to update before release is called done:

1. `C:\Users\GrowB\cribbit-bot\modeplan.md`
2. `C:\Users\GrowB\cribbit-bot\plan.md`
3. `C:\Users\GrowB\cribbit-bot\README.md`
4. `C:\Users\GrowB\cribbit-bot\requirements.md`
5. `C:\Users\GrowB\cribbit-bot\structure.md`

Release checklist:

- [ ] `git status --short --branch`
- [ ] `git log -1 --oneline`
- [ ] `npm run typecheck`
- [ ] `npm run build`
- [ ] `git diff --check`
- [ ] Push branch.
- [ ] Open PR.
- [ ] Verify PR checks or record GitHub infrastructure failure honestly.
- [ ] Merge PR.
- [ ] Confirm local `main...origin/main`.
- [ ] Confirm Railway `/health`.
- [ ] Confirm Vercel `/app`.
- [ ] Confirm Telegram `getMyCommands` if command menu changed.
- [ ] User manually tests `/mode`.
- [ ] User manually tests one mode switch.
- [ ] User manually tests one mode-specific command.

Evidence block to fill:

```text
Slice:
Starting commit:
Local commit:
PR:
Merge commit:
Files changed:
npm run typecheck:
npm run build:
git diff --check:
Vercel:
Railway:
Telegram commands:
Manual Telegram test:
Known unverified items:
```

Exit criteria:

- Source of truth, GitHub, Vercel, Railway, and Telegram are either verified synchronized or the exact unverified item is recorded.

## 7. Data model target

Expected settings shape:

```json
{
  "houseName": "My Crib",
  "currency": "USD",
  "timezone": "UTC",
  "notifications": true,
  "weeklyDigest": true,
  "quietHours": "",
  "houseRules": "",
  "partyMode": false,
  "cribMode": "roomies",
  "defaultLocale": "en"
}
```

Mode-specific records should reuse existing durable buckets where possible:

- `notes` for lightweight plans and mood/date/dinner records;
- `funds` for shared goals;
- `corrections` for review/confirm/reject flows;
- `settings` for current mode, quiet hours, rules, and party mode;
- `activity` for timeline.

Do not create a second database or mode-specific store unless the existing JSON model is proven insufficient.

## 8. Command menu rule

Never add a command to `src/bot-commands.js` unless the same PR also:

- registers a handler;
- adds or updates tests proving the handler exists;
- updates `/help`;
- updates this plan if the command belongs to a mode.

The regression test must keep proving every `BOT_COMMANDS` entry has a registered handler.

## 9. Suggested fun extras backlog

Do not implement these until core modes are stable:

- `Crib XP`: streaks for completed chores and settled tabs.
- `Vibe check`: weekly mood summary per Crib.
- `Drama meter`: playful warning when chores/corrections pile up.
- `Tiny trophies`: “Kitchen Goblin defeated” after cleaning streaks.
- `Peace treaty`: guided settle-up message after conflicts.
- `Snack radar`: grocery items everyone keeps adding.
- `Main character mode`: temporary event owner for Cubs/Buddies/Crew.
- `Quest board`: Guild/Crew version of chores and plans.
- `Family command center`: Nest dashboard layout for dinner, pickups, groceries, chores.
- `TwinSoul rituals`: recurring date/mood/dinner reminders.

## 10. Stop conditions

Stop and report before continuing if:

- local source and GitHub main differ unexpectedly;
- Railway deployed commit cannot be inferred and live behavior contradicts GitHub;
- adding `/mode` would make the menu advertise an unhandled command;
- a mode-specific command needs a product decision that changes persistent data shape;
- tests fail twice for the same unclear reason;
- a secret, token, or persistent data file may be exposed;
- the next action would touch the old untracked `index` file.

