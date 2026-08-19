# Qixi Quiz Editorial White Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle only the three-question quiz as the approved white editorial direction while preserving all quiz behavior and the other screens.

**Architecture:** Keep the existing state model and rendering flow in `src/app.js`. Remove the decorative center label from the quiz header, then replace only the quiz-specific CSS block in `src/styles.css`; add narrow regression assertions in the existing Node test file for the markup and required visual hooks.

**Tech Stack:** Vanilla JavaScript ES modules, HTML templates, CSS, Node built-in test runner.

---

### Task 1: Lock the approved quiz markup and visual contract

**Files:**
- Modify: `tests/app.test.mjs`
- Test: `tests/app.test.mjs`

- [ ] **Step 1: Add the failing quiz design regression test**

Import `readFileSync` from `node:fs`, render a quiz state, and assert that the center English title is absent while the approved editorial CSS hooks exist:

```js
import { readFileSync } from 'node:fs';

test('quiz uses the approved white editorial treatment', () => {
  const quizHtml = appModule.renderScreen(startQuiz(createInitialState()));
  const styles = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');

  assert.doesNotMatch(quizHtml, /OUR LITTLE QUIZ/);
  assert.match(quizHtml, /<header class="quiz-header">/);
  assert.match(styles, /--quiz-sage:\s*#6f9585/);
  assert.match(styles, /\.option\.is-selected[\s\S]*box-shadow:\s*inset 4px 0 var\(--quiz-sage\)/);
  assert.match(styles, /\.quiz-footnote[\s\S]*text-align:\s*left/);
});
```

- [ ] **Step 2: Run the focused test and verify it fails for the missing design**

Run:

```bash
/Users/welronhe/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test tests/app.test.mjs
```

Expected: FAIL because the current quiz still renders `OUR LITTLE QUIZ` and the editorial CSS variables and selected treatment do not exist.

### Task 2: Implement the approved header and editorial visual system

**Files:**
- Modify: `src/app.js`
- Modify: `src/styles.css`
- Test: `tests/app.test.mjs`

- [ ] **Step 1: Remove the quiz header center label**

Change the quiz header template to contain only the back button and progress count:

```html
<header class="quiz-header">
  <button class="icon-button" data-action="back" type="button" aria-label="返回上一页">←</button>
  <span>${String(progress.current).padStart(2, '0')} / ${String(progress.total).padStart(2, '0')}</span>
</header>
```

- [ ] **Step 2: Replace the quiz-specific colors and option cards**

Add quiz-local tokens and implement the approved roles in `src/styles.css`:

```css
.quiz-screen {
  --quiz-paper: #fffefa;
  --quiz-ink: #111714;
  --quiz-muted: #7b8781;
  --quiz-sage: #6f9585;
  --quiz-line: #dfe5e2;
  align-items: stretch;
  color: var(--quiz-ink);
  background: var(--quiz-paper);
}

.quiz-header {
  display: flex;
  justify-content: space-between;
}

.progress-track {
  height: 2px;
  background: #edf1ef;
}

.progress-value {
  background: var(--quiz-sage);
}

.options {
  gap: 0;
  border-top: 1px solid var(--quiz-line);
}

.option {
  min-height: 72px;
  padding-inline: 4px;
  border: 0;
  border-bottom: 1px solid var(--quiz-line);
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.option.is-selected {
  background: linear-gradient(90deg, #edf4f0, transparent);
  box-shadow: inset 4px 0 var(--quiz-sage);
  color: #284238;
}

.quiz-footnote {
  text-align: left;
}
```

Make `.option:hover` and `.option.is-previous` share the same pale editorial feedback without translation or drop shadow. Keep the existing grid columns, labels, arrows, animation timing, and mobile height adjustments.

- [ ] **Step 3: Run the focused tests and verify they pass**

Run the Node command from Task 1. Expected: all tests pass.

### Task 3: Verify regression safety and the local mobile flow

**Files:**
- Verify: `src/app.js`
- Verify: `src/styles.css`
- Test: `tests/app.test.mjs`

- [ ] **Step 1: Run complete automated verification**

Run:

```bash
/Users/welronhe/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test
/Users/welronhe/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --check src/app.js
git diff --check
```

Expected: all tests pass, JavaScript syntax is valid, and no whitespace errors are reported.

- [ ] **Step 2: Verify the real page at a mobile viewport**

Open `http://127.0.0.1:4173/`, complete home → three questions → gift → reveal, and verify:

- The quiz header has only back and progress count.
- The question, three editorial list options, and footnote have no horizontal overflow.
- Selecting any answer advances; going back shows the pale green previous selection.
- The gift opening and concert result remain visually unchanged.
