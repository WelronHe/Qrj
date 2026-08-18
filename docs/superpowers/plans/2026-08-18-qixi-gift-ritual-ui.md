# 七夕拆礼物仪式感 UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将已跑通的七夕 H5 MVP 升级为“黑玫瑰邀请—一题一屏—礼盒绽放—门票升起”的完整仪式体验。

**Architecture:** 保留 `home`、`quiz`、`gift`、`revealed` 四态纯函数模型，不引入框架或网络资源。`src/app.js` 负责语义化页面结构、流程锁和两段过渡时长，`src/styles.css` 负责所有花瓣、金色微光、礼盒与门票动画，`tests/app.test.mjs` 用渲染输出和状态转换锁定关键体验。

**Tech Stack:** 原生 ES Modules、HTML5、CSS3 动画、Node.js 内置测试运行器。

---

### Task 1: 锁定新体验契约

**Files:**
- Modify: `tests/app.test.mjs`
- Test: `tests/app.test.mjs`

- [ ] **Step 1: Write the failing tests**

新增测试，要求导出明确的自动前进时长与揭晓时长，并验证三个页面的关键结构：

```js
test('ritual pacing uses deliberate answer and reveal timings', () => {
  assert.equal(appModule.ANSWER_ADVANCE_MS, 420);
  assert.equal(appModule.GIFT_REVEAL_MS, 1450);
});

test('home renders the black rose invitation', () => {
  const html = appModule.renderScreen(createInitialState());
  assert.match(html, /black-rose/);
  assert.match(html, /刻有你名字/);
});

test('gift opening contains petals and the revealed screen contains the local tickets', () => {
  let gift = startQuiz(createInitialState());
  gift = selectAnswer(gift, 0);
  gift = selectAnswer(gift, 0);
  gift = selectAnswer(gift, 0);

  const giftHtml = appModule.renderScreen(gift);
  assert.equal((giftHtml.match(/opening-petal/g) || []).length, 8);

  const revealedHtml = appModule.renderScreen(revealGift(gift));
  assert.match(revealedHtml, /ticket-stack/);
  assert.match(revealedHtml, /\/public\/tickets\.svg/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
/Users/welronhe/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test tests/app.test.mjs
```

Expected: FAIL because the timing exports and new ritual class names do not exist yet.

### Task 2: Implement the ritual markup and interaction pacing

**Files:**
- Modify: `src/app.js`
- Test: `tests/app.test.mjs`

- [ ] **Step 1: Add the public timing contract**

```js
export const ANSWER_ADVANCE_MS = 420;
export const GIFT_REVEAL_MS = 1450;
```

- [ ] **Step 2: Replace the home rose emoji with code-native rose markup**

```html
<div class="black-rose" aria-hidden="true">
  <span class="rose-bloom"><i></i><i></i><i></i><i></i><i></i></span>
  <span class="rose-stem"></span>
  <span class="rose-leaf rose-leaf-left"></span>
  <span class="rose-leaf rose-leaf-right"></span>
</div>
```

- [ ] **Step 3: Add the gift-opening bloom layer**

```html
<div class="opening-bloom" aria-hidden="true">
  <i class="opening-petal"></i><i class="opening-petal"></i>
  <i class="opening-petal"></i><i class="opening-petal"></i>
  <i class="opening-petal"></i><i class="opening-petal"></i>
  <i class="opening-petal"></i><i class="opening-petal"></i>
  <span class="opening-light"></span>
</div>
<p class="opening-line">我们的第一个七夕，正式入场。</p>
```

- [ ] **Step 4: Use the timing constants in `mountApp`**

```js
window.setTimeout(() => {
  state = selectAnswer(state, Number(button.dataset.option));
  locked = false;
  render();
}, ANSWER_ADVANCE_MS);

window.setTimeout(() => {
  state = revealGift(state);
  locked = false;
  render();
}, GIFT_REVEAL_MS);
```

- [ ] **Step 5: Run tests to verify they pass**

Run the Node test command from Task 1. Expected: 10 tests pass, 0 fail.

### Task 3: Build the polished visual system and motion

**Files:**
- Modify: `src/styles.css`

- [ ] **Step 1: Refine the base palette and editorial background**

Use ivory paper, ink black, wine, muted rose and restrained antique gold variables. Add layered radial gradients and hairline texture without external assets.

- [ ] **Step 2: Style the black rose invitation**

Build the rose from rotated rounded petals, a tapered stem and two leaves. Give the bloom a subtle `rose-breathe` animation and a warm gold halo.

- [ ] **Step 3: Make the quiz feel like one-screen storytelling**

Keep the progress bar at the top, use `01 / 03` editorial numbering, increase answer touch targets, and animate selected answers with a wine fill before the 420 ms auto-advance.

- [ ] **Step 4: Animate the layered gift reveal**

On `.gift-box.is-opening`, lift and rotate the lid, fade the body, expand `.opening-light`, scatter eight `.opening-petal` elements in unique directions, and reveal `.opening-line` during the pause.

- [ ] **Step 5: Animate the ticket entrance**

Wrap the existing local SVG in `.ticket-stack`, add a shadow/halo, and use `ticket-rise` so it arrives from below after the gift bloom rather than appearing abruptly.

- [ ] **Step 6: Preserve reduced-motion and short-screen behavior**

Retain `prefers-reduced-motion`, safe-area padding, `320px` minimum width, and compact spacing for screens under `700px` tall.

### Task 4: Browser verification

**Files:**
- Verify: `index.html`
- Verify: `src/app.js`
- Verify: `src/styles.css`
- Verify: `public/tickets.svg`

- [ ] **Step 1: Run the full automated suite**

Run:

```bash
/Users/welronhe/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test
```

Expected: all tests pass with 0 failures.

- [ ] **Step 2: Walk the full flow at a mobile viewport**

Open `http://127.0.0.1:4173/` at approximately `390 × 844`, then verify: home → three selections → gift opening → ticket reveal → replay.

- [ ] **Step 3: Check console and repository state**

Confirm no browser console errors, no network-dependent visual assets, and only the intended plan, test, JavaScript and CSS files changed.
