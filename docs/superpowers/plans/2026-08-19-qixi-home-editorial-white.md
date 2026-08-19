# Qixi Home Editorial White Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the approved warm-white editorial home treatment to the existing local H5 while preserving the complete home-to-concert flow.

**Architecture:** Keep the existing homepage markup and interaction logic unchanged. Add home-local color tokens and replace only homepage visual styles in `src/styles.css`; update the static asset version in the entry files so the local in-app browser cannot reuse the prior beige homepage CSS.

**Tech Stack:** Vanilla JavaScript ES modules, HTML, CSS, Node built-in test runner, Python local HTTP server.

---

### Task 1: Lock the approved homepage visual contract

**Files:**
- Modify: `tests/app.test.mjs`
- Test: `tests/app.test.mjs`

- [ ] **Step 1: Add a failing homepage style test**

Read `src/styles.css` and assert the approved home tokens, neutral background, sage button, and removed home ambience exist:

```js
test('home uses the approved white editorial treatment', () => {
  const styles = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');

  assert.match(styles, /--home-paper:\s*#fffefa/);
  assert.match(styles, /--home-sage:\s*#6f9585/);
  assert.match(styles, /\.home-screen[\s\S]*background:\s*var\(--home-paper\)/);
  assert.match(styles, /\.home-screen \.ambient[\s\S]*display:\s*none/);
  assert.match(styles, /\.primary-button[\s\S]*background:\s*var\(--home-sage-deep\)/);
});
```

- [ ] **Step 2: Run the focused suite and verify failure**

Run:

```bash
/Users/welronhe/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test tests/app.test.mjs
```

Expected: FAIL because the current homepage still uses the wine and gold palette.

### Task 2: Implement the white editorial homepage

**Files:**
- Modify: `src/styles.css`
- Modify: `index.html`
- Modify: `src/main.js`
- Test: `tests/app.test.mjs`

- [ ] **Step 1: Add homepage-local tokens and replace the large color fields**

Use these exact roles:

```css
.home-screen {
  --home-paper: #fffefa;
  --home-ink: #111714;
  --home-muted: #74817b;
  --home-sage: #6f9585;
  --home-sage-deep: #284238;
  align-items: stretch;
  color: var(--home-ink);
  background: var(--home-paper);
}

.home-screen::before,
.home-screen .ambient {
  display: none;
}
```

Change the left rule, date, eyebrow, subtitle, rose halo, rose shadow, `H · H` label, primary button, arrow, hover shadow, and focus outline to the approved sage and neutral colors. Do not change dimensions, layout, animations, copy, or click handling.

- [ ] **Step 2: Increment the static entry version**

Change the shared asset query from `editorial-white-20260819` to `qixi-editorial-20260819-2` in `index.html`, `src/main.js`, and the cache-busting test. This forces the browser to request the updated home CSS and the current app module graph.

- [ ] **Step 3: Run the focused tests and verify green**

Run the Node command from Task 1. Expected: all tests pass.

### Task 3: Verify the complete local flow

**Files:**
- Verify: `index.html`
- Verify: `src/main.js`
- Verify: `src/styles.css`
- Test: `tests/app.test.mjs`

- [ ] **Step 1: Run complete automated verification**

```bash
/Users/welronhe/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test
/Users/welronhe/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --check src/app.js
/Users/welronhe/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --check src/main.js
git diff --check
```

Expected: all tests pass, scripts are syntactically valid, and no whitespace errors exist.

- [ ] **Step 2: Check the local server responses**

Verify `http://127.0.0.1:4173/` references `qixi-editorial-20260819-2`, the versioned stylesheet contains `--home-paper: #fffefa`, and the versioned app script contains no `OUR LITTLE QUIZ`.

- [ ] **Step 3: Hand off the complete flow preview**

Open `http://127.0.0.1:4173/?v=qixi-editorial-20260819-2` and run home → three questions → gift → reveal. Confirm the white homepage, editorial quiz, gift reveal, concert invitation, and music behavior remain connected.
