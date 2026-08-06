do not drift , do not guess , do not loop , do not skip fixes , do not pretend , do not skip errors , fix evrything you face and follow the plan

# Cribbit Project Plan

## Operating rules

1. The only editable source of truth is `C:\Users\GrowB\cribbit-bot`.
2. Read affected code and docs before editing.
3. Make one focused change at a time.
4. Never edit Vercel, Railway, GitHub web files, Downloads, temp folders, or old work trees independently.
5. Never deploy from an uncommitted or unidentified source tree.
6. Preserve unrelated and untracked user files.
7. Record errors; never hide or reinterpret them as success.
8. Separate implemented, tested, deployed, and end-to-end verified states.
9. Stop when required evidence or authorization is missing.
10. Complete work only when exit criteria are proven.

## Canonical release flow

This workflow is permanent and cannot be bypassed or replaced without explicit project-owner instruction.

```text
C:\Users\GrowB\cribbit-bot -> focused local fix -> local tests and review
-> local commit -> synchronize GitHub -> deploy the same commit to Railway and Vercel
-> verify Telegram, Railway, Vercel, and persistence
```

## Phase 0 — Establish the baseline

Status: **Local documentation complete; remote mirroring pending**

- [x] Declare `C:\Users\GrowB\cribbit-bot` authoritative.
- [x] Identify `funmarket/cribbit-bot` `main` as the versioned mirror.
- [x] Identify Railway as bot/API/persistence runtime.
- [x] Identify Vercel `cribbit-dashboard` as landing/Mini App runtime.
- [x] Record application baseline `67cface` before documentation changes.
- [x] Preserve untracked `audit-state.md` and obsolete extensionless `index`.
- [x] Create and locally verify these governing documents as one documentation-only change.
- [ ] Mirror the reviewed documentation commit to GitHub without triggering an unplanned production release.

Exit: the four documents agree, application source is unchanged, and Git status is understood.

## Phase 1 — Credentials and access

Status: **Required next**

- [ ] Rotate the exposed testing token in BotFather.
- [ ] Replace `BOT_TOKEN` in Railway without printing or committing it.
- [ ] Confirm the old token is rejected.
- [ ] Review and minimize GitHub, Railway, and Vercel access.
- [ ] Protect GitHub `main` and require `Verify Cribbit`.
- [ ] Require reviewed pull requests for application changes where practical.
- [ ] Run a repository secret scan and resolve all findings.

Exit: old token invalid, replacement active only in approved secret storage, required CI enforced, and no known repository secret.

## Phase 2 — Deployment consistency

Status: **Pending**

- [ ] Keep Railway connected to `funmarket/cribbit-bot` `main`, blank root.
- [ ] Connect Vercel `cribbit-dashboard` to the same repository/branch.
- [ ] End reliance on manual direct Vercel deployments after Git deployment is proven.
- [ ] Verify and record the actual persistent directory resolved from `DATA_DIR` or `RAILWAY_VOLUME_MOUNT_PATH`; never assume `/data`.
- [ ] Document where each platform exposes the deployed Git SHA.
- [ ] Add release metadata if provenance stays ambiguous.
- [ ] Record last-known-good deployment IDs before promotion.
- [ ] Test rollback without touching the Railway volume.

Exit: one GitHub commit produces both verifiable deployments and rollback is proven.

## Phase 3 — Application security

Status: **Pending**

- [ ] Add rate limiting to protected APIs.
- [ ] Add security headers and restrictive Content Security Policy.
- [ ] Test CORS for absent, expected, and malicious origins.
- [ ] Add authorization tests for every privileged action.
- [ ] Add negative cross-house access tests.
- [ ] Review error responses for information leakage.
- [ ] Review initData age and clock-skew policy.
- [ ] Define dependency audit severity policy.
- [ ] Threat-model replay, forged identity, cross-house access, payload abuse, and token compromise.

Exit: security requirements are implemented or explicitly accepted as residual risk, with passing regression tests.

## Phase 4 — Data protection

Status: **Pending**

- [ ] Confirm `DATA_DIR` resolves to the Railway volume.
- [ ] Verify persistence through a controlled restart.
- [ ] Configure scheduled backups and retention.
- [ ] Test restore in non-production.
- [ ] Review write atomicity and corruption recovery.
- [ ] Define schema migration/version handling.
- [ ] Define the threshold for moving from JSON to a transactional database.

Exit: a recent backup restores successfully and persistence evidence is recorded.

## Phase 5 — Reliability and observability

Status: **Pending**

- [ ] Add explicit success logging for Telegram menu synchronization.
- [ ] Add structured startup/API errors without secrets.
- [ ] Monitor `/health` with alerts.
- [ ] Add privacy-conscious frontend error reporting.
- [ ] Test Telegram failure, API timeout, malformed JSON, and asset failure paths.
- [ ] Document incident response and rollback.

Exit: operators can isolate bot, API, frontend, auth, and persistence failures and roll back quickly.

## Phase 6 — Product quality and scale

Status: **Pending**

- [ ] Test group suffix commands such as `/dashboard@Cribbit_bot`.
- [ ] Bound or paginate large expense/activity histories.
- [ ] Test settlement rounding and many-user cases.
- [ ] Validate accessibility, keyboard navigation, RTL, and mobile layouts.
- [ ] Load-test non-production API/store behavior.
- [ ] Keep native apps labeled **Coming soon** until separately approved.

Exit: product acceptance passes on supported devices and scale limits are measured.

## Required release record

```text
Local path and commit:
GitHub commit:
Files changed:
npm ci:
npm run typecheck:
npm run build:
git diff --check:
Railway deployment and /health:
Vercel deployment and routes:
Telegram /start, /dashboard, blue button:
Persistence restart:
Rollback target:
Known unverified items:
```

## Stop conditions

Stop and report when the target is unclear; local and GitHub differ unexpectedly; deployment provenance is missing; a secret may be exposed; persistent data is at risk; tests fail; or the next step would overwrite, delete, force-push, wipe a volume, or bypass protection without approval.
