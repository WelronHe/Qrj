import test from 'node:test';
import assert from 'node:assert/strict';

import * as appModule from '../src/app.js';
import {
  QUESTIONS,
  createInitialState,
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
