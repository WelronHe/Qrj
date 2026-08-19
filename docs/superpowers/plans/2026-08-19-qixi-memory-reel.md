# 七夕回忆胶片过场 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在第三题与礼物盒之间加入三张私人照片组成的必经回忆胶片，并以“和你在一起 / 再普通的日子 / 也万幸有光”收束。

**Architecture:** 沿用 `src/app.js` 的纯状态函数与字符串渲染结构，新增 `memories` 视图、照片索引和两个纯状态动作；`mountApp` 负责自动换片、点击加速和图片失败降级。视觉全部放在 `src/styles.css`，原图保留不动，另生成适合手机加载的 JPEG 副本。

**Tech Stack:** 原生 ES Modules、HTML 字符串模板、CSS 动画、Node.js `node:test`、macOS `sips`

---

## 文件结构

- Modify: `src/app.js` — 回忆数据、状态转换、页面渲染和定时交互。
- Modify: `src/styles.css` — 回忆胶片布局、动效、断点和降级样式。
- Modify: `src/main.js` — 更新资源版本，避免本地浏览器继续使用旧脚本。
- Modify: `index.html` — 更新 CSS 和入口脚本版本。
- Modify: `tests/app.test.mjs` — 回忆状态、文案、资源、交互钩子回归测试。
- Create: `public/memory-duck.jpg` — 小鸭子优化副本。
- Create: `public/memory-huahua.jpg` — 花花抱小鸭子优化副本。
- Create: `public/memory-us.jpg` — 两人亲密照优化副本。

### Task 1: 回忆视图状态

**Files:**
- Modify: `tests/app.test.mjs`
- Modify: `src/app.js`

- [ ] **Step 1: 写失败测试**

在 `tests/app.test.mjs` 导入 `MEMORY_SLIDES`、`advanceMemory` 和 `enterGift`，加入：

```js
test('the final answer opens the memory reel before the gift', () => {
  let state = startQuiz(createInitialState());
  state = selectAnswer(state, 0);
  state = selectAnswer(state, 0);
  state = selectAnswer(state, 0);

  assert.equal(state.view, 'memories');
  assert.equal(state.memoryIndex, 0);
  assert.equal(MEMORY_SLIDES.length, 3);
});

test('memory reel advances one photo at a time and only then enters gift', () => {
  const first = { ...createInitialState(), view: 'memories', memoryIndex: 0 };
  const second = advanceMemory(first);
  const third = advanceMemory(second);

  assert.equal(second.memoryIndex, 1);
  assert.equal(third.memoryIndex, 2);
  assert.equal(advanceMemory(third), third);
  assert.equal(enterGift(third).view, 'gift');
  assert.equal(enterGift(first), first);
});
```

- [ ] **Step 2: 确认测试按预期失败**

Run: `/Users/welronhe/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test tests/app.test.mjs`

Expected: FAIL，提示新导出不存在或最终答案仍进入 `gift`。

- [ ] **Step 3: 实现最小状态转换**

在 `src/app.js` 新增三张照片数据和状态函数：

```js
export const MEMORY_SLIDES = [
  { src: '/public/memory-duck.jpg', alt: '草地上的小鸭子', focus: 'duck' },
  { src: '/public/memory-huahua.jpg', alt: '花花抱着两只小鸭子', focus: 'huahua' },
  { src: '/public/memory-us.jpg', alt: '我们靠在一起的回忆', focus: 'us' },
];

export function advanceMemory(state) {
  if (state.view !== 'memories' || state.memoryIndex >= MEMORY_SLIDES.length - 1) return state;
  return { ...state, memoryIndex: state.memoryIndex + 1 };
}

export function enterGift(state) {
  if (state.view !== 'memories' || state.memoryIndex !== MEMORY_SLIDES.length - 1) return state;
  return { ...state, view: 'gift' };
}
```

给初始状态增加 `memoryIndex: 0`；第三题回答后进入 `memories`；`goBack` 让 `memories` 返回第三题、`gift` 返回回忆第三张。

- [ ] **Step 4: 运行测试确认通过**

Run: `/Users/welronhe/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test tests/app.test.mjs`

Expected: 新测试通过；若旧测试仍期待 `gift`，更新为新的必经流程语义后全部通过。

### Task 2: 胶片页面与交互

**Files:**
- Modify: `tests/app.test.mjs`
- Modify: `src/app.js`

- [ ] **Step 1: 写渲染失败测试**

```js
test('memory reel renders the approved sequence and final copy', () => {
  const first = appModule.renderScreen({ ...createInitialState(), view: 'memories', memoryIndex: 0 });
  const final = appModule.renderScreen({ ...createInitialState(), view: 'memories', memoryIndex: 2 });

  assert.match(first, /memory-duck\.jpg/);
  assert.doesNotMatch(first, /继续拆礼物/);
  assert.match(final, /和你在一起/);
  assert.match(final, /再普通的日子/);
  assert.match(final, /也万幸有光/);
  assert.match(final, /继续拆礼物/);
});
```

- [ ] **Step 2: 确认渲染测试失败**

Run: `/Users/welronhe/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test tests/app.test.mjs`

Expected: FAIL，因为 `renderScreen` 尚未处理 `memories`。

- [ ] **Step 3: 实现回忆页面**

在 `src/app.js` 新增 `MEMORY_SLIDE_MS = 1800` 和 `renderMemories(state)`。页面包含返回按钮、模糊背景图、三层相片舞台、`data-action="memory-next"` 点击区、三枚进度点；仅第三张渲染三行文案和 `data-action="memory-continue"` 按钮。

在 `mountApp` 中保存 `memoryTimer`：每次渲染先清理旧计时器；前两张用 `window.setTimeout` 调用 `advanceMemory`；点击照片先清理计时器再只前进一张；继续按钮调用 `enterGift`。给图片绑定 `error`，失败时给其父层增加 `is-image-missing`，但保留下一步交互。

- [ ] **Step 4: 运行测试确认通过**

Run: `/Users/welronhe/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test tests/app.test.mjs`

Expected: 所有应用测试通过。

### Task 3: 照片优化与视觉实现

**Files:**
- Create: `public/memory-duck.jpg`
- Create: `public/memory-huahua.jpg`
- Create: `public/memory-us.jpg`
- Modify: `src/styles.css`

- [ ] **Step 1: 生成优化副本**

Run:

```bash
sips -Z 1800 -s format jpeg -s formatOptions 82 public/IMG_5892.JPG --out public/memory-duck.jpg
sips -Z 1800 -s format jpeg -s formatOptions 82 public/IMG_5804.JPG --out public/memory-huahua.jpg
sips -Z 1800 -s format jpeg -s formatOptions 82 public/IMG_5954.JPG --out public/memory-us.jpg
```

Expected: 三个副本均存在，长边不超过 1800px，原始 `IMG_*.JPG` 不发生修改。

- [ ] **Step 2: 添加全屏胶片样式**

在 `src/styles.css` 新增 `.memory-screen`、`.memory-backdrop`、`.memory-stage`、`.memory-photo`、`.memory-copy`、`.memory-progress` 和 `.memory-continue`。使用深墨绿到黑色渐变、柔焦照片背景、细白边与暖金色光；三张图分别使用 `object-position`，最后一张让人物居中。第一、二张带轻微旋转叠放，第三张回正放大；文案逐行淡入，最后一行使用 `#f0d794`。

- [ ] **Step 3: 添加响应式与减少动效降级**

在 359px 宽和 720px 高断点缩小照片及间距；在既有 `prefers-reduced-motion` 规则下确保页面无需动画也能看到最终状态。所有可点击区保留键盘焦点样式。

- [ ] **Step 4: 检查资源和 CSS**

Run: `sips -g pixelWidth -g pixelHeight public/memory-*.jpg && git diff --check`

Expected: 三张图尺寸有效，`git diff --check` 无输出。

### Task 4: 缓存版本与完整验证

**Files:**
- Modify: `src/main.js`
- Modify: `index.html`
- Modify: `tests/app.test.mjs`

- [ ] **Step 1: 写缓存版本失败测试**

把测试期望更新为统一版本 `qixi-memory-20260819-1`，同时断言三个优化资源文件存在且非空。

- [ ] **Step 2: 确认测试失败**

Run: `/Users/welronhe/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test`

Expected: FAIL，因为入口仍使用旧版本字符串。

- [ ] **Step 3: 更新入口版本**

将 `index.html` 中 CSS/JS 查询参数和 `src/main.js` 中 `app.js` 查询参数统一改为 `qixi-memory-20260819-1`。

- [ ] **Step 4: 运行自动化验证**

Run: `/Users/welronhe/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test`

Expected: 0 failures。

- [ ] **Step 5: 启动本地预览并检查完整流程**

Run: `python3 -m http.server 4173 --bind 127.0.0.1`

从首页依次检查：首页 → 三道问卷 → 三张回忆 → 礼物盒 → 演唱会揭晓 → 点赞回应；同时检查返回、自动换片、点击加速、音乐 A/B 切换和 375px 窄屏。

- [ ] **Step 6: 提交实现**

```bash
git add src/app.js src/styles.css src/main.js index.html tests/app.test.mjs public/memory-duck.jpg public/memory-huahua.jpg public/memory-us.jpg
git commit -m "feat: add memory reel before gift reveal"
```
