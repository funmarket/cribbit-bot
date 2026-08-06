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

Status: pending

Tasks:

- [ ] Record branch, commit SHA, and `git status --short --branch`.
- [ ] Confirm only `C:\Users\GrowB\cribbit-bot` is edited.
- [ ] Confirm the old extensionless `index` remains untouched and untracked.
- [ ] Read current `index.js`, `src/store.js`, `src/bot-commands.js`, dashboard settings code, locale files, tests, and `plan.md`.
- [ ] Decide whether `/mode` should be added to the Telegram command menu immediately or hidden until dashboard support exists.

Exit criteria:

- No code behavior changed.
- Exact target files for Phase 1 are known.

### Phase 1 — Mode model and source module

Status: pending

Tasks:

- [ ] Add `src/modes.js`.
- [ ] Define mode keys, display names, descriptions, tone labels, primary commands, dashboard cards, and aliases.
- [ ] Add `cribMode: "roomies"` to default settings.
- [ ] Normalize invalid/missing modes back to `roomies`.
- [ ] Export helpers such as:
  - `normalizeMode(value)`;
  - `modeDefinition(value)`;
  - `commandsForMode(value)`;
  - `modeNames()`;
  - `isPrimaryModeCommand(mode, command)`.
- [ ] Add tests for mode normalization and definitions.

Exit criteria:

- Mode definitions are centralized.
- Store settings persist a valid mode.
- Invalid mode data cannot crash the bot or dashboard.

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

## 6. Data model target

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

## 7. Command menu rule

Never add a command to `src/bot-commands.js` unless the same PR also:

- registers a handler;
- adds or updates tests proving the handler exists;
- updates `/help`;
- updates this plan if the command belongs to a mode.

The regression test must keep proving every `BOT_COMMANDS` entry has a registered handler.

## 8. Suggested fun extras backlog

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

## 9. Stop conditions

Stop and report before continuing if:

- local source and GitHub main differ unexpectedly;
- Railway deployed commit cannot be inferred and live behavior contradicts GitHub;
- adding `/mode` would make the menu advertise an unhandled command;
- a mode-specific command needs a product decision that changes persistent data shape;
- tests fail twice for the same unclear reason;
- a secret, token, or persistent data file may be exposed;
- the next action would touch the old untracked `index` file.

