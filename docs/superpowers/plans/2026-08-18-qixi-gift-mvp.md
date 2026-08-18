# 七夕拆礼物 H5 MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个无需第三方依赖、可在本地运行的手机端七夕问卷拆礼物 H5。

**Architecture:** 使用一个纯函数状态模型驱动 `home → quiz → gift → revealed` 四种页面状态，DOM 层根据状态整体渲染当前画面。问卷选择、返回、礼物揭晓与重播都通过不可变状态转换完成，视觉和动效独立放在 CSS 中。

**Tech Stack:** HTML5、CSS3、原生 ES Modules、Node.js 内置测试运行器、Python 静态文件服务

---

## 文件结构

- `package.json`：项目元信息与测试脚本。
- `index.html`：移动端页面入口、字体和应用挂载节点。
- `src/app.js`：题目数据、状态转换、DOM 渲染和事件绑定。
- `src/main.js`：浏览器启动入口。
- `src/styles.css`：视觉样式、响应式布局与动画。
- `public/tickets.svg`：礼物揭晓时展示的叠放门票静态图。
- `tests/app.test.mjs`：状态流程与边界行为测试。

### Task 1: 建立测试环境和状态模型

**Files:**
- Create: `package.json`
- Create: `tests/app.test.mjs`
- Create: `src/app.js`

- [ ] **Step 1: 创建项目元信息**

```json
{
  "name": "qixi-gift-h5",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test"
  }
}
```

- [ ] **Step 2: 写入失败的流程测试**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  QUESTIONS,
  createInitialState,
  startQuiz,
  selectAnswer,
  goBack,
  revealGift,
  resetGift,
  getProgress,
} from '../src/app.js';

test('starts at home with no answers', () => {
  assert.deepEqual(createInitialState(), {
    view: 'home',
    currentQuestion: 0,
    answers: [null, null, null],
  });
});

test('every option advances and the third answer unlocks the gift', () => {
  let state = startQuiz(createInitialState());
  state = selectAnswer(state, 0);
  state = selectAnswer(state, 2);
  state = selectAnswer(state, 1);
  assert.equal(state.view, 'gift');
  assert.deepEqual(state.answers, [0, 2, 1]);
});

test('progress follows the active question', () => {
  const state = selectAnswer(startQuiz(createInitialState()), 0);
  assert.deepEqual(getProgress(state), { current: 2, total: 3, percent: 66.66666666666666 });
});

test('back keeps the previous selection', () => {
  let state = startQuiz(createInitialState());
  state = selectAnswer(state, 1);
  state = goBack(state);
  assert.equal(state.currentQuestion, 0);
  assert.equal(state.answers[0], 1);
});

test('gift can be revealed and reset without clearing answers', () => {
  let state = startQuiz(createInitialState());
  state = selectAnswer(state, 0);
  state = selectAnswer(state, 0);
  state = selectAnswer(state, 0);
  const revealed = revealGift(state);
  assert.equal(revealed.view, 'revealed');
  assert.deepEqual(resetGift(revealed), { ...revealed, view: 'gift' });
});

test('invalid actions leave state unchanged', () => {
  const state = createInitialState();
  assert.equal(selectAnswer(state, 0), state);
  assert.equal(revealGift(state), state);
  assert.equal(QUESTIONS.length, 3);
});
```

- [ ] **Step 3: 运行测试并确认因模块缺失而失败**

Run: `node --test tests/app.test.mjs`

Expected: FAIL，错误包含 `Cannot find module '../src/app.js'`。

- [ ] **Step 4: 实现最小状态模型**

```js
export const QUESTIONS = [
  { title: '你是谁？', options: ['黄婷', '何威龙老婆'] },
  { title: '《乐队的夏天》中，哪个组合你最想和男朋友去一次？', options: ['本拉登', '新裤子乐队', '披投士'] },
  { title: '你老公是谁？', options: ['何威龙', '何威龙', '何威龙'] },
];

export function createInitialState() {
  return { view: 'home', currentQuestion: 0, answers: Array(QUESTIONS.length).fill(null) };
}

export function startQuiz(state) {
  return { ...state, view: 'quiz', currentQuestion: 0 };
}

export function selectAnswer(state, optionIndex) {
  if (state.view !== 'quiz' || !Number.isInteger(optionIndex)) return state;
  const answers = [...state.answers];
  answers[state.currentQuestion] = optionIndex;
  if (state.currentQuestion === QUESTIONS.length - 1) return { ...state, answers, view: 'gift' };
  return { ...state, answers, currentQuestion: state.currentQuestion + 1 };
}

export function goBack(state) {
  if (state.view === 'gift') return { ...state, view: 'quiz', currentQuestion: QUESTIONS.length - 1 };
  if (state.view !== 'quiz') return state;
  if (state.currentQuestion === 0) return { ...state, view: 'home' };
  return { ...state, currentQuestion: state.currentQuestion - 1 };
}

export function revealGift(state) {
  return state.view === 'gift' ? { ...state, view: 'revealed' } : state;
}

export function resetGift(state) {
  return state.view === 'revealed' ? { ...state, view: 'gift' } : state;
}

export function getProgress(state) {
  return {
    current: state.currentQuestion + 1,
    total: QUESTIONS.length,
    percent: ((state.currentQuestion + 1) / QUESTIONS.length) * 100,
  };
}
```

- [ ] **Step 5: 运行测试并确认全部通过**

Run: `node --test tests/app.test.mjs`

Expected: 6 tests passed, 0 failed。

### Task 2: 实现页面渲染和完整交互

**Files:**
- Create: `index.html`
- Create: `src/main.js`
- Modify: `src/app.js`

- [ ] **Step 1: 增加渲染契约测试**

在 `tests/app.test.mjs` 顶部增加 `import * as appModule from '../src/app.js';`，并追加：

```js
test('content includes the agreed home and gift copy', () => {
  assert.deepEqual(appModule.HOME_COPY, {
    eyebrow: '我们的第一个七夕',
    title: '何花花的第一个七夕。',
    subtitle: '抱着刻有你名字的黑色玫瑰，我们出发吧',
    action: '现在出发',
  });
  assert.equal(appModule.GIFT_COPY.revealedTitle, '今晚，我们去见喜欢的声音。');
  assert.match(appModule.renderScreen(createInitialState()), /何花花的第一个七夕/);
});
```

- [ ] **Step 2: 运行测试并确认新增测试失败**

Run: `node --test tests/app.test.mjs`

Expected: FAIL，因为首页和礼物页内容常量尚未导出。

- [ ] **Step 3: 完成 HTML 入口和 `mountApp` 渲染器**

创建 `index.html`：

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="theme-color" content="#f5eee6" />
    <title>何花花的第一个七夕</title>
    <link rel="stylesheet" href="/src/styles.css" />
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>
```

创建 `src/main.js`：

```js
import { mountApp } from './app.js';

mountApp(document.querySelector('#app'));
```

在 `src/app.js` 的状态模型后追加页面内容和渲染器：

```js
export const HOME_COPY = {
  eyebrow: '我们的第一个七夕',
  title: '何花花的第一个七夕。',
  subtitle: '抱着刻有你名字的黑色玫瑰，我们出发吧',
  action: '现在出发',
};

export const GIFT_COPY = {
  title: '有一份礼物，等你亲手拆开。',
  hint: '轻轻点一下礼物盒',
  revealedEyebrow: 'QIXI SURPRISE',
  revealedTitle: '今晚，我们去见喜欢的声音。',
  replay: '再看一次',
};

function renderHome() {
  return `<main class="screen home-screen">
    <div class="ambient ambient-one"></div><div class="ambient ambient-two"></div>
    <section class="hero-card">
      <p class="eyebrow">${HOME_COPY.eyebrow}</p>
      <div class="rose-mark" aria-hidden="true">🌹</div>
      <h1>${HOME_COPY.title}</h1>
      <p class="subtitle">${HOME_COPY.subtitle}</p>
      <button class="primary-button" data-action="start">${HOME_COPY.action}<span>→</span></button>
    </section>
  </main>`;
}

function renderQuiz(state) {
  const progress = getProgress(state);
  const question = QUESTIONS[state.currentQuestion];
  return `<main class="screen quiz-screen">
    <section class="quiz-card">
      <header class="quiz-header">
        <button class="icon-button" data-action="back" aria-label="返回上一页">←</button>
        <span>${progress.current} / ${progress.total}</span>
      </header>
      <div class="progress-track"><div class="progress-value" style="width:${progress.percent}%"></div></div>
      <p class="eyebrow">A LITTLE QUESTION</p>
      <h2>${question.title}</h2>
      <div class="options">${question.options.map((option, index) => `
        <button class="option ${state.answers[state.currentQuestion] === index ? 'is-previous' : ''}" data-option="${index}">
          <span class="option-index">0${index + 1}</span><span>${option}</span><span class="option-arrow">→</span>
        </button>`).join('')}</div>
    </section>
  </main>`;
}

function renderGift() {
  return `<main class="screen gift-screen">
    <button class="icon-button gift-back" data-action="back" aria-label="返回上一题">←</button>
    <section class="gift-content">
      <p class="eyebrow">THE FINAL MOMENT</p><h2>${GIFT_COPY.title}</h2>
      <button class="gift-box" data-action="reveal" aria-label="拆开礼物">
        <span class="gift-shadow"></span><span class="gift-body"></span><span class="gift-ribbon"></span>
        <span class="gift-lid"></span><span class="gift-bow gift-bow-left"></span><span class="gift-bow gift-bow-right"></span>
      </button>
      <p class="gift-hint">${GIFT_COPY.hint}</p>
    </section>
  </main>`;
}

function renderRevealed() {
  return `<main class="screen revealed-screen">
    <div class="sparkles" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
    <section class="revealed-content">
      <p class="eyebrow">${GIFT_COPY.revealedEyebrow}</p><h2>${GIFT_COPY.revealedTitle}</h2>
      <img class="tickets" src="/public/tickets.svg" alt="何花花与何威龙的七夕门票" />
      <button class="secondary-button" data-action="replay">${GIFT_COPY.replay}</button>
    </section>
  </main>`;
}

export function renderScreen(state) {
  if (state.view === 'quiz') return renderQuiz(state);
  if (state.view === 'gift') return renderGift();
  if (state.view === 'revealed') return renderRevealed();
  return renderHome();
}

export function mountApp(root) {
  let state = createInitialState();
  let locked = false;
  const render = () => {
    root.innerHTML = renderScreen(state);
    root.querySelector('[data-action="start"]')?.addEventListener('click', () => { state = startQuiz(state); render(); });
    root.querySelector('[data-action="back"]')?.addEventListener('click', () => { if (!locked) { state = goBack(state); render(); } });
    root.querySelectorAll('[data-option]').forEach((button) => button.addEventListener('click', () => {
      if (locked) return;
      locked = true;
      button.classList.add('is-selected');
      window.setTimeout(() => { state = selectAnswer(state, Number(button.dataset.option)); locked = false; render(); }, 280);
    }));
    root.querySelector('[data-action="reveal"]')?.addEventListener('click', (event) => {
      if (locked) return;
      locked = true;
      event.currentTarget.disabled = true;
      event.currentTarget.classList.add('is-opening');
      window.setTimeout(() => { state = revealGift(state); locked = false; render(); }, 900);
    });
    root.querySelector('[data-action="replay"]')?.addEventListener('click', () => { state = resetGift(state); render(); });
  };
  render();
  return { getState: () => state };
}
```

- [ ] **Step 4: 运行测试并确认全部通过**

Run: `node --test tests/app.test.mjs`

Expected: 7 tests passed, 0 failed。

### Task 3: 完成基础视觉、门票资产和本地验收

**Files:**
- Create: `src/styles.css`
- Create: `public/tickets.svg`
- Modify: `index.html`

- [ ] **Step 1: 创建本地门票静态图**

创建 `public/tickets.svg`，不引用外部图片或字体：

```svg
<svg width="960" height="720" viewBox="0 0 960 720" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="28" stdDeviation="22" flood-color="#331017" flood-opacity=".22"/></filter>
    <linearGradient id="wine" x1="190" y1="138" x2="735" y2="580" gradientUnits="userSpaceOnUse"><stop stop-color="#741C31"/><stop offset="1" stop-color="#3B101C"/></linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#F4D994"/><stop offset="1" stop-color="#B98B36"/></linearGradient>
  </defs>
  <g filter="url(#shadow)" transform="rotate(-9 470 360)">
    <rect x="154" y="184" width="650" height="330" rx="28" fill="#DAB76B"/>
    <circle cx="154" cy="349" r="25" fill="#F5EEE6"/><circle cx="804" cy="349" r="25" fill="#F5EEE6"/>
  </g>
  <g filter="url(#shadow)" transform="rotate(7 490 360)">
    <rect x="170" y="175" width="650" height="350" rx="30" fill="#EEE0D4"/>
    <circle cx="170" cy="350" r="26" fill="#F5EEE6"/><circle cx="820" cy="350" r="26" fill="#F5EEE6"/>
  </g>
  <g filter="url(#shadow)">
    <rect x="148" y="170" width="664" height="370" rx="32" fill="url(#wine)"/>
    <circle cx="148" cy="355" r="27" fill="#F5EEE6"/><circle cx="812" cy="355" r="27" fill="#F5EEE6"/>
    <path d="M622 170V540" stroke="#EBCF8A" stroke-width="2" stroke-dasharray="10 12" opacity=".72"/>
    <text x="204" y="245" fill="#EBCF8A" font-family="Georgia, serif" font-size="24" letter-spacing="8">QIXI 2026</text>
    <text x="204" y="335" fill="#FFF9F2" font-family="Georgia, serif" font-size="46" font-weight="700">何花花 × 何威龙</text>
    <text x="204" y="385" fill="#DDBDAA" font-family="Arial, sans-serif" font-size="20" letter-spacing="4">OUR FIRST QIXI NIGHT</text>
    <text x="204" y="470" fill="#EBCF8A" font-family="Arial, sans-serif" font-size="18" letter-spacing="3">抱着黑色玫瑰，我们出发吧</text>
    <text x="674" y="274" fill="#EBCF8A" font-family="Arial, sans-serif" font-size="16" letter-spacing="3">ADMIT</text>
    <text x="670" y="355" fill="#FFF9F2" font-family="Georgia, serif" font-size="68" font-weight="700">TWO</text>
    <rect x="671" y="414" width="92" height="34" rx="17" fill="url(#gold)"/>
    <text x="693" y="437" fill="#3B101C" font-family="Arial, sans-serif" font-size="13" font-weight="700" letter-spacing="2">LOVE</text>
  </g>
</svg>
```

- [ ] **Step 2: 完成移动端优先样式**

创建 `src/styles.css`：

```css
:root {
  color-scheme: light;
  --paper: #f5eee6;
  --paper-deep: #eaded2;
  --ink: #291218;
  --muted: #7c6870;
  --wine: #641a2e;
  --wine-deep: #3b101c;
  --gold: #d3ad5f;
  --line: rgba(59, 16, 28, 0.12);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif;
}

* { box-sizing: border-box; }
html, body { margin: 0; min-height: 100%; background: var(--paper); }
body { min-width: 320px; color: var(--ink); overflow-x: hidden; }
button { color: inherit; font: inherit; }
#app, .screen { min-height: 100vh; min-height: 100dvh; }
.screen { position: relative; display: grid; place-items: center; overflow: hidden; padding: max(28px, env(safe-area-inset-top)) 22px max(28px, env(safe-area-inset-bottom)); }
.screen::before { content: ""; position: absolute; inset: 0; pointer-events: none; background-image: radial-gradient(rgba(100,26,46,.07) .8px, transparent .8px); background-size: 15px 15px; mask-image: linear-gradient(to bottom, transparent, #000 24%, #000 78%, transparent); }
.hero-card, .quiz-card, .gift-content, .revealed-content { position: relative; z-index: 1; width: min(100%, 430px); }
.eyebrow { margin: 0 0 18px; color: var(--wine); font-size: 11px; font-weight: 800; letter-spacing: .22em; text-transform: uppercase; }
h1, h2 { margin: 0; font-family: "Songti SC", STSong, Georgia, serif; font-weight: 700; letter-spacing: -.045em; }
h1 { max-width: 350px; font-size: clamp(42px, 12vw, 66px); line-height: 1.06; }
h2 { font-size: clamp(31px, 9vw, 46px); line-height: 1.18; }
.subtitle { max-width: 320px; margin: 24px 0 34px; color: var(--muted); font-family: "Songti SC", STSong, serif; font-size: 17px; line-height: 1.8; }
.rose-mark { width: 92px; height: 92px; margin: 0 0 32px; display: grid; place-items: center; border: 1px solid rgba(211,173,95,.5); border-radius: 50%; background: rgba(255,255,255,.33); box-shadow: 0 24px 60px rgba(59,16,28,.11); filter: grayscale(1) brightness(.25) sepia(.2); font-size: 48px; transform: rotate(-8deg); }
.ambient { position: absolute; border-radius: 50%; filter: blur(3px); opacity: .75; }
.ambient-one { width: 310px; height: 310px; top: -130px; right: -150px; background: radial-gradient(circle, rgba(211,173,95,.31), transparent 68%); }
.ambient-two { width: 360px; height: 360px; bottom: -210px; left: -180px; background: radial-gradient(circle, rgba(100,26,46,.2), transparent 68%); }
.primary-button, .secondary-button { min-height: 56px; border-radius: 999px; padding: 0 24px; font-weight: 700; cursor: pointer; transition: transform .2s ease, box-shadow .2s ease, background .2s ease; }
.primary-button { display: inline-flex; align-items: center; gap: 36px; border: 0; background: var(--wine-deep); color: #fff9f2; box-shadow: 0 18px 34px rgba(59,16,28,.22); }
.primary-button:hover { transform: translateY(-2px); box-shadow: 0 22px 40px rgba(59,16,28,.26); }
.primary-button:active, .secondary-button:active, .option:active { transform: scale(.98); }
.quiz-screen { align-items: stretch; }
.quiz-card { margin: auto; }
.quiz-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; color: var(--muted); font-size: 13px; font-weight: 700; }
.icon-button { width: 44px; height: 44px; border: 1px solid var(--line); border-radius: 50%; background: rgba(255,255,255,.46); cursor: pointer; }
.progress-track { height: 5px; margin-bottom: clamp(56px, 14vh, 110px); border-radius: 999px; overflow: hidden; background: rgba(100,26,46,.1); }
.progress-value { height: 100%; border-radius: inherit; background: linear-gradient(90deg, var(--wine-deep), #9a3f55, var(--gold)); transition: width .45s cubic-bezier(.2,.8,.2,1); }
.options { display: grid; gap: 12px; margin-top: 34px; }
.option { width: 100%; min-height: 70px; display: grid; grid-template-columns: 42px 1fr 28px; align-items: center; gap: 10px; padding: 12px 18px; border: 1px solid var(--line); border-radius: 20px; background: rgba(255,255,255,.52); text-align: left; cursor: pointer; transition: transform .2s ease, border-color .2s ease, background .2s ease; }
.option:hover, .option.is-previous { border-color: rgba(100,26,46,.32); background: rgba(255,255,255,.82); }
.option.is-selected { border-color: var(--wine); background: var(--wine); color: #fff; transform: scale(.985); }
.option-index { color: var(--gold); font-family: Georgia, serif; font-size: 13px; }
.option-arrow { justify-self: end; opacity: .56; }
.gift-back { position: absolute; z-index: 4; top: max(24px, env(safe-area-inset-top)); left: 22px; }
.gift-content, .revealed-content { text-align: center; }
.gift-content h2, .revealed-content h2 { max-width: 360px; margin-inline: auto; }
.gift-box { position: relative; width: 230px; height: 250px; display: block; margin: 58px auto 14px; border: 0; background: transparent; cursor: pointer; animation: gift-float 2.5s ease-in-out infinite; }
.gift-shadow { position: absolute; width: 190px; height: 30px; left: 20px; bottom: 5px; border-radius: 50%; background: rgba(59,16,28,.16); filter: blur(10px); }
.gift-body, .gift-lid, .gift-ribbon, .gift-bow { position: absolute; display: block; }
.gift-body { width: 180px; height: 148px; left: 25px; bottom: 24px; border-radius: 8px 8px 18px 18px; background: linear-gradient(145deg, #7c233a, var(--wine-deep)); box-shadow: 0 30px 50px rgba(59,16,28,.25); }
.gift-ribbon { z-index: 2; width: 34px; height: 148px; left: 98px; bottom: 24px; background: linear-gradient(90deg, #c69a49, #f0d58f, #ba8834); }
.gift-lid { z-index: 3; width: 206px; height: 48px; left: 12px; bottom: 154px; border-radius: 12px; background: linear-gradient(145deg, #8f2d47, #511425); box-shadow: 0 10px 18px rgba(59,16,28,.19); transform-origin: 20% 100%; }
.gift-bow { z-index: 2; width: 72px; height: 48px; bottom: 194px; border: 13px solid var(--gold); }
.gift-bow-left { left: 49px; border-radius: 50% 50% 8px 50%; transform: rotate(18deg); }
.gift-bow-right { right: 49px; border-radius: 50% 50% 50% 8px; transform: rotate(-18deg); }
.gift-hint { color: var(--muted); font-family: "Songti SC", STSong, serif; }
.gift-box.is-opening { animation: none; }
.gift-box.is-opening .gift-lid { animation: lid-open .9s cubic-bezier(.25,.8,.25,1) forwards; }
.gift-box.is-opening .gift-bow { animation: bow-open .9s ease forwards; }
.revealed-screen { background: radial-gradient(circle at 50% 42%, #fffaf3 0, var(--paper) 52%, #e8d7cd 100%); }
.tickets { display: block; width: min(116%, 560px); max-width: none; margin: 18px 50% 4px; transform: translateX(-50%); filter: drop-shadow(0 28px 28px rgba(59,16,28,.12)); animation: ticket-in .85s cubic-bezier(.2,.82,.2,1) both; }
.secondary-button { border: 1px solid rgba(59,16,28,.22); background: rgba(255,255,255,.5); }
.sparkles i { position: absolute; z-index: 0; width: 8px; height: 8px; border-radius: 50%; background: var(--gold); animation: sparkle 2.4s ease-in-out infinite; }
.sparkles i:nth-child(1) { top: 14%; left: 18%; }.sparkles i:nth-child(2) { top: 24%; right: 15%; animation-delay: .4s; }.sparkles i:nth-child(3) { bottom: 18%; left: 12%; animation-delay: .8s; }.sparkles i:nth-child(4) { bottom: 12%; right: 20%; animation-delay: 1.2s; }.sparkles i:nth-child(5) { top: 48%; left: 7%; animation-delay: 1.5s; }
@keyframes gift-float { 0%,100% { transform: translateY(0) rotate(-1deg); } 50% { transform: translateY(-10px) rotate(1deg); } }
@keyframes lid-open { 0% { transform: translate(0,0) rotate(0); } 55% { transform: translate(-24px,-64px) rotate(-18deg); } 100% { transform: translate(-68px,22px) rotate(-64deg); opacity: 0; } }
@keyframes bow-open { to { opacity: 0; transform: translateY(-60px) scale(.7); } }
@keyframes ticket-in { from { opacity: 0; transform: translate(-50%,38px) scale(.86) rotate(-2deg); } to { opacity: 1; transform: translate(-50%,0) scale(1) rotate(0); } }
@keyframes sparkle { 0%,100% { opacity: .2; transform: scale(.6); } 50% { opacity: 1; transform: scale(1.5); } }
@media (min-width: 700px) { .screen { padding-inline: 48px; } .hero-card { width: min(100%, 520px); } .quiz-card { width: min(100%, 520px); } }
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; scroll-behavior: auto !important; transition-duration: .01ms !important; } }
```

- [ ] **Step 3: 运行自动化测试和静态检查**

Run: `node --test && git diff --check`

Expected: 所有测试通过，`git diff --check` 无输出。

- [ ] **Step 4: 启动本地静态服务并完成浏览器验收**

Run: `python3 -m http.server 4173`

在浏览器打开 `http://127.0.0.1:4173`，依次验证首页、三题进度、返回保留选择、礼盒拆开、门票展示和“再看一次”。同时以 390×844 和桌面宽度检查无横向滚动、文字不截断、按钮可点击。

- [ ] **Step 5: 提交 MVP**

```bash
git add package.json index.html src public tests docs/superpowers/plans/2026-08-18-qixi-gift-mvp.md
git commit -m "feat: build qixi gift MVP"
```
