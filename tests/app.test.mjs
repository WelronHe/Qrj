import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import * as appModule from '../src/app.js';
import {
  MEMORY_SLIDES,
  QUESTIONS,
  advanceMemory,
  createInitialState,
  enterGift,
  getProgress,
  goBack,
  resetGift,
  revealGift,
  selectAnswer,
  startQuiz,
} from '../src/app.js';

test('starts at home with no answers', () => {
  assert.deepEqual(createInitialState(), {
    view: 'home',
    currentQuestion: 0,
    answers: [null, null, null],
    memoryIndex: 0,
    responded: false,
  });
});

test('the final answer opens the memory reel before the gift', () => {
  let state = startQuiz(createInitialState());
  state = selectAnswer(state, 0);
  state = selectAnswer(state, 2);
  state = selectAnswer(state, 1);

  assert.equal(state.view, 'memories');
  assert.equal(state.memoryIndex, 0);
  assert.deepEqual(state.answers, [0, 2, 1]);
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

test('progress follows the active question', () => {
  const state = selectAnswer(startQuiz(createInitialState()), 0);

  assert.deepEqual(getProgress(state), {
    current: 2,
    total: 3,
    percent: 66.66666666666666,
  });
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
  state = enterGift(advanceMemory(advanceMemory(state)));

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

test('content includes the agreed home and gift copy', () => {
  assert.deepEqual(appModule.HOME_COPY, {
    eyebrow: '我们的第一个七夕',
    title: '何花花的第一个七夕。',
    subtitle: '抱着刻有你名字的黑色玫瑰，我们出发吧',
    action: '现在出发',
  });
  assert.equal(
    appModule.GIFT_COPY.revealedTitle,
    '今晚，我们去见喜欢的声音。',
  );
  assert.match(
    appModule.renderScreen(createInitialState()),
    /何花花的第一个七夕/,
  );
});

test('the concert question uses the concise approved wording', () => {
  assert.equal(
    QUESTIONS[1].title,
    '《乐队的夏天》中，哪个组合你最想去一次？',
  );
});

test('quiz uses the approved white editorial treatment', () => {
  const quizHtml = appModule.renderScreen(startQuiz(createInitialState()));
  const styles = readFileSync(
    new URL('../src/styles.css', import.meta.url),
    'utf8',
  );

  assert.doesNotMatch(quizHtml, /OUR LITTLE QUIZ/);
  assert.match(quizHtml, /<header class="quiz-header">/);
  assert.match(styles, /--quiz-sage:\s*#6f9585/);
  assert.match(
    styles,
    /\.option\.is-selected[\s\S]*box-shadow:\s*inset 4px 0 var\(--quiz-sage\)/,
  );
  assert.match(styles, /\.quiz-footnote[\s\S]*text-align:\s*left/);
});

test('home uses the approved white editorial treatment', () => {
  const styles = readFileSync(
    new URL('../src/styles.css', import.meta.url),
    'utf8',
  );

  assert.match(styles, /--home-paper:\s*#fffefa/);
  assert.match(styles, /--home-sage:\s*#6f9585/);
  assert.match(
    styles,
    /\.home-screen[\s\S]*background:\s*var\(--home-paper\)/,
  );
  assert.match(styles, /\.home-screen \.ambient[\s\S]*display:\s*none/);
  assert.match(
    styles,
    /\.primary-button[\s\S]*background:\s*var\(--home-sage-deep\)/,
  );
});

test('local preview entrypoints bust stale editorial assets', () => {
  const indexHtml = readFileSync(
    new URL('../index.html', import.meta.url),
    'utf8',
  );
  const mainScript = readFileSync(
    new URL('../src/main.js', import.meta.url),
    'utf8',
  );

  assert.match(
    indexHtml,
    /\/src\/styles\.css\?v=qixi-editorial-20260819-3/,
  );
  assert.match(indexHtml, /\/src\/main\.js\?v=qixi-editorial-20260819-3/);
  assert.match(mainScript, /\.\/app\.js\?v=qixi-editorial-20260819-3/);
});

test('ritual pacing uses deliberate answer and reveal timings', () => {
  assert.equal(appModule.ANSWER_ADVANCE_MS, 420);
  assert.equal(appModule.GIFT_REVEAL_MS, 1450);
});

test('home renders the black rose invitation', () => {
  const html = appModule.renderScreen(createInitialState());

  assert.match(html, /black-rose/);
  assert.match(html, /刻有你名字/);
});

test('gift opening contains petals', () => {
  let gift = startQuiz(createInitialState());
  gift = selectAnswer(gift, 0);
  gift = selectAnswer(gift, 0);
  gift = selectAnswer(gift, 0);
  gift = enterGift(advanceMemory(advanceMemory(gift)));

  const giftHtml = appModule.renderScreen(gift);
  assert.equal((giftHtml.match(/opening-petal/g) || []).length, 8);
});

test('gift opening hands music to B before the reveal timeout', () => {
  const appSource = readFileSync(
    new URL('../src/app.js', import.meta.url),
    'utf8',
  );
  const revealHandler = appSource.match(
    /querySelector\('\[data-action="reveal"\]'\)[\s\S]*?window\.setTimeout/,
  )?.[0];

  assert.ok(revealHandler);
  assert.match(
    revealHandler,
    /musicController\.beginReveal\(\)[\s\S]*window\.setTimeout/,
  );
});

test('concert invitation can be accepted without leaving the result', () => {
  let state = startQuiz(createInitialState());
  state = selectAnswer(state, 0);
  state = selectAnswer(state, 0);
  state = selectAnswer(state, 0);
  state = enterGift(advanceMemory(advanceMemory(state)));
  state = revealGift(state);

  const responded = appModule.respondToInvitation(state);

  assert.equal(responded.view, 'revealed');
  assert.equal(responded.responded, true);
  assert.match(appModule.renderScreen(responded), /说好了，现场见 ♥/);
});

test('revealed result uses the approved concert assets and copy', () => {
  const revealedHtml = appModule.renderScreen({
    ...createInitialState(),
    view: 'revealed',
  });

  assert.match(revealedHtml, /新裤子巡回演唱会/);
  assert.match(revealedHtml, /花花，8月22日周六/);
  assert.match(revealedHtml, /\/public\/concert-live\.png/);
  assert.match(revealedHtml, /\/public\/concert-poster\.png/);
  assert.doesNotMatch(revealedHtml, /\/public\/tickets\.svg/);
});

test('mount starts view music and retries it on first interaction', async () => {
  const syncedViews = [];
  let retries = 0;
  let firstInteraction;
  let removedInteraction;
  const root = {
    innerHTML: '',
    querySelector() {
      return null;
    },
    querySelectorAll() {
      return [];
    },
  };
  const musicController = {
    sync(view) {
      syncedViews.push(view);
      return Promise.resolve(false);
    },
    retryActive() {
      retries += 1;
    },
  };
  const interactionTarget = {
    addEventListener(type, listener, options) {
      assert.equal(type, 'pointerdown');
      assert.deepEqual(options, { once: true });
      firstInteraction = listener;
    },
    removeEventListener(type, listener) {
      assert.equal(type, 'pointerdown');
      removedInteraction = listener;
    },
  };

  appModule.mountApp(root, { musicController, interactionTarget });
  await Promise.resolve();

  assert.deepEqual(syncedViews, ['home']);
  assert.equal(removedInteraction, undefined);
  firstInteraction();
  assert.equal(retries, 1);
});
