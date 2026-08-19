# Qixi Gift Music Handoff Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop track A and start track B at the exact moment the gift-opening animation begins, while keeping replay and all error handling intact.

**Architecture:** Add a dedicated `beginReveal()` command to the music controller so the click handler can express an event rather than pretending the state has already changed. Reuse the controller's existing safe track-switching logic; the later `sync('revealed')` call keeps B active without restarting it, and `sync('gift')` restores A on replay.

**Tech Stack:** Vanilla JavaScript ES modules, HTML Audio, Node built-in test runner.

---

### Task 1: Lock the opening-time handoff with failing tests

**Files:**
- Modify: `tests/music.test.mjs`
- Modify: `tests/app.test.mjs`

- [ ] **Step 1: Add the controller handoff test**

Start A with `sync('gift')`, set its playhead, call `beginReveal()`, and assert A pauses and rewinds while B starts. Then call `sync('revealed')` and assert B does not restart.

- [ ] **Step 2: Add the app wiring assertion**

Read `src/app.js` and assert the gift reveal click handler calls `musicController.beginReveal()` before the reveal timeout.

- [ ] **Step 3: Run the tests and verify failure**

```bash
/Users/welronhe/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test tests/music.test.mjs tests/app.test.mjs
```

Expected: FAIL because `beginReveal()` and its click-handler wiring do not exist.

### Task 2: Implement the event-driven handoff

**Files:**
- Modify: `src/music.js`
- Modify: `src/app.js`
- Modify: `index.html`
- Modify: `src/main.js`
- Modify: `tests/app.test.mjs`
- Test: `tests/music.test.mjs`
- Test: `tests/app.test.mjs`

- [ ] **Step 1: Extract a private track switch helper**

Refactor the existing body of `sync(view)` into a private `switchTo(nextTrack)` function that stops and rewinds the outgoing track before requesting the incoming track.

- [ ] **Step 2: Add `beginReveal()`**

Expose `beginReveal()` as `switchTo('b')`; keep `sync(view)` mapping `revealed` to B and other rendered views to A.

- [ ] **Step 3: Wire the gift click**

Call `musicController.beginReveal()` immediately after the gift button receives its opening classes and before scheduling `GIFT_REVEAL_MS`.

- [ ] **Step 4: Increment the local static asset version**

Change `qixi-editorial-20260819-2` to `qixi-editorial-20260819-3` in the entry files and cache-busting assertions so the browser receives the new controller and handler.

- [ ] **Step 5: Run the focused tests and verify green**

Run the command from Task 1. Expected: all focused tests pass.

### Task 3: Verify the full local experience

**Files:**
- Verify: `src/music.js`
- Verify: `src/app.js`
- Test: `tests/music.test.mjs`
- Test: `tests/app.test.mjs`

- [ ] **Step 1: Run complete verification**

```bash
/Users/welronhe/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test
/Users/welronhe/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --check src/app.js
/Users/welronhe/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --check src/music.js
git diff --check
```

Expected: all tests pass, scripts are valid, and no whitespace errors exist.

- [ ] **Step 2: Verify versioned local resources**

Confirm `http://127.0.0.1:4173/` references `qixi-editorial-20260819-3` and the served app script contains `musicController.beginReveal()`.
