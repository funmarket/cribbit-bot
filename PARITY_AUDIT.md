# Cribbit Parity Audit

Source of visual truth: `C:\Users\GrowB\Downloads\cribbit_dashboard_sidebar_scroll_2026.html`

Implementation under review:
- `C:\Users\GrowB\cribbit-bot\frontend\app.html`
- `C:\Users\GrowB\cribbit-bot\frontend\src\app.ts`
- `C:\Users\GrowB\cribbit-bot\frontend\src\forms.ts`
- `C:\Users\GrowB\cribbit-bot\frontend\src\config.ts`

This is a parity audit only. No application code was changed in this step.

## What went wrong

The current product drift is not one bug. It is three overlapping mismatches:

1. Launch-path mismatch: the Telegram app and the browser can land on different deployed builds, so Telegram may show an older production snapshot even when local code has moved on.
2. Data-shape mismatch: the approved HTML expects richer domain flows than the backend store and action layer fully persist today.
3. Modal lifecycle mismatch: several feature forms still close before async save completes, which hides failure states and can make the app feel like nothing happened.

The result is the exact user complaint: the app can look close enough to the demo to feel familiar, while still failing to behave like the approved source of truth once you try real actions.

## Root cause summary

- The Vite app already contains most of the approved section structure, but some of the important flows are still demo-only, partial, or adapter-based.
- `frontend/src/app.ts` accepts legacy aliases such as `expense.submit -> payment.claim.submit`, but the backend persistence layer does not yet guarantee every approved flow is stored and replayed with the same semantics as the HTML.
- `frontend/src/forms.ts` does handle a good submit lifecycle in the generic case, but a number of feature-specific handlers still manually close dialogs before the save promise resolves.
- The auth gate and demo fallback make it easy to mistake a demo or stale deployment for the real app if the canonical launch URL is not the one Telegram is actually opening.

## Parity matrix

| Area | Approved HTML behavior | Current Vite implementation | Mismatch cause | Solution target |
|---|---|---|---|---|
| Overview | Compact command surface with clickable summary cards, quick actions, and home/logo navigation | Present in `frontend/app.html` and `frontend/src/app.ts` | Mostly visual parity is there, but some cards still depend on stale data and not all clicks resolve to durable entities | Keep the layout, ensure every summary card opens the right persistent entity and refreshes after mutations |
| Expenses | Separate shared expense and payment claim flow, receipt upload, OCR review, approval/rejection, verified expense creation, settlements | Partially present; claim aliases exist, OCR UI exists, approvals/rejections exist | Some flows still depend on simplified action handling and the save/close timing is inconsistent | Preserve claim/review semantics, keep dialogs open on failure, and make verified expense creation the only approval outcome |
| Chores | Open -> pending review -> needs fixing -> verified, with admin feedback and resubmission | Present in UI and some action handlers | Backend/handler semantics still need explicit review-state persistence everywhere | Keep explicit chore review states and resubmit flow, do not collapse them to a boolean done flag |
| Groceries | Normal list plus grocery wishlist and bought/restoration flow | Present in UI | Some grocery wishlist and claim behavior remains adapter-based | Persist grocery wishlist and claim behavior as first-class actions |
| Plans | Create, search, join/leave, bring-item claims, shared/free costs, related requests | Present in UI | Related entity links and deep links still need durable normalization | Preserve all plan controls and make related links survive round-trips |
| Funds | Expand contributors, chip-in, funded state, goal tracking | Present in UI | Chip-in state depends on action persistence | Keep contributor expansion and chip-in as persistent, replayable actions |
| Requests | Recipient, message, type, due date, related plan/wishlist/fund/chore, accept/decline/done | Present in UI | Request persistence is still incomplete relative to the approved flow | Add request persistence with the same linkage rules as the HTML |
| Wishlists | Separate expense and grocery wishlists, join/leave/chip in, claim/unclaim, target handling | Present in UI | Wishlist behavior is partly local/demo-driven and not fully durable | Persist wishlist membership, chip-ins, and claim state |
| Activity | Semantic deep links that open the right entity | Present in UI | Activity events are not always backed by fully normalized entity metadata | Keep deep links, but write stable entity metadata for every actionable event |
| Notifications | Personal notifications with unread state and precise deep links | Present in UI | Read state is partly browser-local, and recipient notifications are not yet fully durable | Keep read/unread UI, but persist recipient events and entity links on the backend |
| Reports | Verified spending only, with time/category/person filters and export | Present in UI | Report output depends on the approval pipeline being correct first | Make report rows derive from verified approvals only |
| Roomies | Member cards with roles, balances, and activity | Present in UI | Mostly data-completeness rather than layout | Keep the roomie view, ensure membership and balances are always synchronized |
| Settings | Theme, locale, house data, crib switch, and house preferences | Present in UI | Some settings can still feel local-only if the active crib or locale state is not persisted consistently | Keep the controls, normalize the active crib and settings persistence |
| Navigation | Home logo, crib dropdown, sidebar, bottom nav, more menu | Present in UI | Navigation is mostly there, but the launch target can still be stale or inconsistent in production | Make the canonical `/app` path the only Telegram launch target |
| Modal/sheet behavior | Feature-specific dialogs, outside click closes modal, close button works, failed submit keeps dialog open | Partially present | Several handlers close dialogs before async completion, which hides errors and can discard user context | Standardize all modal submit flows on a single save lifecycle and only close on success |

## Specific technical observations

### 1. The Vite app already contains most of the approved section set

`frontend/app.html` includes the approved navigation and content areas:
- overview
- expenses
- chores
- groceries
- plans
- requests
- wishlists
- funds
- roomies
- activity
- reports
- settings

That means the broad section structure is not the main problem anymore. The problem is the fidelity of the flows inside those sections.

### 2. The generic submit helper is correct, but not used consistently

`frontend/src/forms.ts` has a good generic lifecycle:
- disable submit
- await save
- reset form
- close dialog on success
- restore controls in `finally`

But `frontend/src/app.ts` still contains many feature-specific submit handlers that close their dialog before the save finishes, for example:
- expense rejection
- chore review feedback
- request creation
- fund creation
- fund chip-in
- wishlist chip-in
- plan creation

That is exactly the kind of mismatch that makes the UI feel broken even when the action actually succeeded or failed.

### 3. The backend is still treating some approved flows as compatibility layers

In `frontend/src/app.ts`, the code still normalizes legacy action names:
- `expense.submit -> payment.claim.submit`
- `expense.approve -> payment.claim.approve`
- `expense.reject -> payment.claim.reject`

That is useful as an adapter, but it also confirms the underlying store and action system are not yet speaking the approved product language end-to-end.

### 4. Demo confusion is still plausible

The app still has an explicit demo fallback:
- `demoMode = query.get("demo") === "1" || import.meta.env.DEV`
- auth gate includes `Explore demo dashboard`

If Telegram or a browser tab lands on a stale deployment, or if the wrong URL is opened, it is easy for the user to think they are seeing the real app while actually looking at a demo-like snapshot.

## Most likely failure chain

1. Telegram opens a canonical app URL.
2. The deployment served there is not the latest reviewed local state.
3. The UI is close enough to the demo that it appears “the same”.
4. Some high-value actions still use incomplete persistence or close-too-early modal handlers.
5. The user sees no durable result and concludes the fix never landed.

## Recommended solution path

1. Lock the launch path to one canonical production `/app` build before judging UI parity.
2. Finish the data adapters first for the approved flows:
   - payment claims
   - chore review states
   - requests
   - wishlists
   - settlements
   - plan links
3. Standardize all modal submits on the shared submit lifecycle so failed saves do not dismiss the dialog.
4. Re-check the approved HTML against the live app after those adapters are in place.
5. Only then do cleanup or refactors.

## Approval checkpoint

I have not edited the app yet.

If you approve, the next implementation pass should start with the smallest high-impact fix:

1. unify the modal submit lifecycle so feature dialogs only close on successful save, or
2. finish the missing persistence/action adapters for requests, wishlists, and chore reviews first.

## Local implementation update

After approval, the modal submit lifecycle fix was implemented locally in:
- `C:\Users\GrowB\cribbit-bot\frontend\src\forms.ts`
- `C:\Users\GrowB\cribbit-bot\frontend\src\app.ts`

The local regression suite and production build both passed after that change.
