# Qixi Concert Result Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the generic Qixi ticket reveal with the approved New Pants concert invitation, real poster/live assets, and a non-navigating like-style response interaction.

**Architecture:** Keep the existing single-file state model and template renderer in `src/app.js`. Add one pure invitation response action and render the approved concert result from state; keep all visual treatment in `src/styles.css`, and store the two user-provided images under `public/`.

**Tech Stack:** Vanilla JavaScript ES modules, HTML templates, CSS animations, Node built-in test runner, Python local HTTP server.

---

### Task 1: Lock the approved result behavior with failing tests

**Files:**
- Modify: `tests/app.test.mjs`
- Test: `tests/app.test.mjs`

- [ ] **Step 1: Write the failing model and markup tests**

Import `respondToInvitation` and add assertions that the initial state contains `responded: false`, the revealed screen contains the approved concert copy and both `/public/concert-live.png` and `/public/concert-poster.png`, and responding changes the button copy without leaving the revealed view:

```js
test('concert invitation can be accepted without leaving the result', () => {
  let state = startQuiz(createInitialState());
  state = selectAnswer(state, 0);
  state = selectAnswer(state, 0);
  state = selectAnswer(state, 0);
  state = revealGift(state);

  const responded = respondToInvitation(state);
  assert.equal(responded.view, 'revealed');
  assert.equal(responded.responded, true);
  assert.match(renderScreen(responded), /说好了，现场见 ♥/);
});

test('revealed result uses the approved concert assets and copy', () => {
  const html = renderScreen({
    ...createInitialState(),
    view: 'revealed',
  });

  assert.match(html, /新裤子巡回演唱会/);
  assert.match(html, /花花，8月22日周六/);
  assert.match(html, /\/public\/concert-live\.png/);
  assert.match(html, /\/public\/concert-poster\.png/);
  assert.doesNotMatch(html, /\/public\/tickets\.svg/);
});
```

- [ ] **Step 2: Run the tests and verify the expected failure**

Run:

```bash
/Users/welronhe/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test tests/app.test.mjs
```

Expected: FAIL because `respondToInvitation` and the concert result markup do not exist yet.

### Task 2: Add state, concert markup, and real image assets

**Files:**
- Modify: `src/app.js`
- Create: `public/concert-live.png`
- Create: `public/concert-poster.png`
- Test: `tests/app.test.mjs`

- [ ] **Step 1: Copy the two approved source images into `public/`**

Use the user-provided live photo as `public/concert-live.png` and the official poster as `public/concert-poster.png`. Do not copy the order screenshot.

- [ ] **Step 2: Add the invitation state transition**

Add `responded: false` to `createInitialState()`, reset it in `resetGift()`, and export this pure action:

```js
export function respondToInvitation(state) {
  return state.view === 'revealed'
    ? { ...state, responded: true }
    : state;
}
```

- [ ] **Step 3: Replace `renderRevealed()` with the approved concert result**

Render a `.concert-result-screen` containing:

```html
<section class="concert-result">
  <div class="concert-hero">
    <img class="concert-live-photo" src="/public/concert-live.png" alt="新裤子演唱会现场" />
    <p class="concert-pixel-title">NEW<br />PANTS</p>
    <span class="concert-live-badge">LIVE!</span>
    <div class="concert-ticket">
      <div class="concert-ticket-main">
        <small>TWO TICKETS · ONE NIGHT</small>
        <h2>新裤子巡回演唱会<br />广州站</h2>
        <p>宝能广州国际体育演艺中心<br />2026.08.22 · SAT · 19:30</p>
      </div>
      <div class="concert-ticket-stub"><strong>08.22</strong><span>ADMIT TWO</span></div>
      <img class="concert-poster" src="/public/concert-poster.png" alt="新裤子巡回演唱会广州站海报" />
    </div>
  </div>
  <div class="concert-invitation">
    <p class="concert-meta">2026 · GUANGZHOU</p>
    <h1>花花，8月22日周六，<br />和我一起去看新裤子吧。</h1>
    <p>为我们准备了两张相邻的票。</p>
    <div class="concert-answer ${state.responded ? 'is-loved' : ''}">
      <div class="concert-heart-burst" aria-hidden="true"><i>♥</i><i>✦</i><i>♥</i><i>✦</i><i>♥</i><i>✦</i><i>♥</i></div>
      <button data-action="respond">${state.responded ? '说好了，现场见 ♥' : '当然要一起 ♥'}</button>
    </div>
    <button class="concert-replay" data-action="replay">再看一次</button>
  </div>
</section>
```

- [ ] **Step 4: Bind the response action in `mountApp()`**

Add a click handler for `[data-action="respond"]` that calls `respondToInvitation(state)` and renders again. It must not navigate, reload, or mutate the quiz answers.

- [ ] **Step 5: Run tests and verify the model and markup pass**

Run the Node test command from Task 1. Expected: all tests pass.

### Task 3: Implement the approved visual system and verify the whole flow

**Files:**
- Modify: `src/styles.css`
- Test: `tests/app.test.mjs`

- [ ] **Step 1: Replace the legacy reveal styles**

Add the approved full-bleed result system with these exact visual roles:

```css
.concert-result-screen { display: block; overflow-y: auto; padding: 0; background: #09090b; }
.concert-result { width: min(100%, 480px); min-height: 100dvh; margin: 0 auto; background: #09090b; color: #fff; }
.concert-hero { position: relative; height: 472px; overflow: hidden; }
.concert-live-photo { width: 100%; height: 100%; object-fit: cover; object-position: center 46%; }
.concert-ticket { position: absolute; left: 22px; right: 22px; bottom: -60px; display: grid; grid-template-columns: 1fr 110px; transform: rotate(-1.6deg); }
.concert-invitation { position: relative; padding: 88px 26px 30px; background: #09090b; }
.concert-answer button { width: 100%; border-radius: 999px; background: #fff; box-shadow: 0 12px 28px rgba(0,0,0,.4), 0 5px 0 rgba(186,255,25,.72); }
.concert-answer.is-loved button { background: #baff19; box-shadow: 0 8px 28px rgba(186,255,25,.25), 0 2px 0 #6f9800; }
```

Use `ui-monospace` at `46px` with `3px 3px #f02a33` and `-2px -2px #3269ff` text shadows for `.concert-pixel-title`; use `#baff19` for `.concert-live-badge` and `.concert-ticket-stub`; use `#f8f0dc` for `.concert-ticket`; position `.concert-poster` as a `57px × 80px` rotated sticker over the ticket stub. Set the invitation to Songti at `30px/1.36`, make `.concert-replay` a low-contrast text button, and animate seven burst items from the button center for `800ms`. Under `prefers-reduced-motion: reduce`, reduce this animation to `0.01ms`; below `360px`, reduce ticket gutters and the invitation type size so the page remains within the viewport.

- [ ] **Step 2: Run automated verification**

Run:

```bash
/Users/welronhe/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test
/Users/welronhe/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --check src/app.js
git diff --check
```

Expected: all tests pass, JavaScript syntax is valid, and no whitespace errors are reported.

- [ ] **Step 3: Verify the real page at 390 × 844**

Open `http://127.0.0.1:4173/`, complete home → three questions → gift → reveal, then verify:

- The live photo and ticket appear before the invitation.
- The copy includes `8月22日周六`.
- The response button changes to `说好了，现场见 ♥` and plays the burst without navigation.
- Replay returns to the gift page.
- There is no horizontal overflow and no console warning or error.
