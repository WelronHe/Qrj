import { createMusicController } from './music.js';

export const QUESTIONS = [
  {
    title: '你是谁？',
    options: ['黄婷', '何威龙老婆'],
  },
  {
    title: '《乐队的夏天》中，哪个组合你最想去一次？',
    options: ['本拉登', '新裤子乐队', '披投士'],
  },
  {
    title: '你老公是谁？',
    options: ['何威龙', '何威龙', '何威龙'],
  },
];

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
  revealedSubtitle: '有你在身边，每一场奔赴都有了名字。',
  replay: '再看一次',
};

export const MEMORY_SLIDES = [
  {
    src: '/public/memory-duck.jpg',
    alt: '草地上的小鸭子',
    focus: 'duck',
  },
  {
    src: '/public/memory-huahua.jpg',
    alt: '花花抱着两只小鸭子',
    focus: 'huahua',
  },
  {
    src: '/public/memory-us.jpg',
    alt: '我们靠在一起的回忆',
    focus: 'us',
  },
];

export const ANSWER_ADVANCE_MS = 420;
export const MEMORY_SLIDE_MS = 1800;
export const GIFT_REVEAL_MS = 1450;

export function createInitialState() {
  return {
    view: 'home',
    currentQuestion: 0,
    answers: Array(QUESTIONS.length).fill(null),
    memoryIndex: 0,
    responded: false,
  };
}

export function startQuiz(state) {
  return {
    ...state,
    view: 'quiz',
    currentQuestion: 0,
  };
}

export function selectAnswer(state, optionIndex) {
  if (state.view !== 'quiz' || !Number.isInteger(optionIndex)) {
    return state;
  }

  const answers = [...state.answers];
  answers[state.currentQuestion] = optionIndex;

  if (state.currentQuestion === QUESTIONS.length - 1) {
    return {
      ...state,
      answers,
      view: 'memories',
      memoryIndex: 0,
    };
  }

  return {
    ...state,
    answers,
    currentQuestion: state.currentQuestion + 1,
  };
}

export function goBack(state) {
  if (state.view === 'gift') {
    return {
      ...state,
      view: 'memories',
      memoryIndex: MEMORY_SLIDES.length - 1,
    };
  }

  if (state.view === 'memories') {
    return {
      ...state,
      view: 'quiz',
      currentQuestion: QUESTIONS.length - 1,
    };
  }

  if (state.view !== 'quiz') {
    return state;
  }

  if (state.currentQuestion === 0) {
    return {
      ...state,
      view: 'home',
    };
  }

  return {
    ...state,
    currentQuestion: state.currentQuestion - 1,
  };
}

export function advanceMemory(state) {
  if (
    state.view !== 'memories' ||
    state.memoryIndex >= MEMORY_SLIDES.length - 1
  ) {
    return state;
  }

  return {
    ...state,
    memoryIndex: state.memoryIndex + 1,
  };
}

export function enterGift(state) {
  if (
    state.view !== 'memories' ||
    state.memoryIndex !== MEMORY_SLIDES.length - 1
  ) {
    return state;
  }

  return {
    ...state,
    view: 'gift',
  };
}

export function revealGift(state) {
  return state.view === 'gift'
    ? {
        ...state,
        view: 'revealed',
      }
    : state;
}

export function resetGift(state) {
  return state.view === 'revealed'
    ? {
        ...state,
        view: 'gift',
        responded: false,
      }
    : state;
}

export function respondToInvitation(state) {
  return state.view === 'revealed'
    ? {
        ...state,
        responded: true,
      }
    : state;
}

export function getProgress(state) {
  return {
    current: state.currentQuestion + 1,
    total: QUESTIONS.length,
    percent: ((state.currentQuestion + 1) / QUESTIONS.length) * 100,
  };
}

function renderHome() {
  return `
    <main class="screen home-screen">
      <div class="ambient ambient-one" aria-hidden="true"></div>
      <div class="ambient ambient-two" aria-hidden="true"></div>
      <div class="home-date" aria-hidden="true">
        <span>QIXI</span>
        <i></i>
        <span>2026</span>
      </div>

      <section class="hero-card">
        <div class="home-copy">
          <p class="eyebrow">${HOME_COPY.eyebrow}</p>
          <h1>${HOME_COPY.title}</h1>
          <p class="subtitle">${HOME_COPY.subtitle}</p>
        </div>

        <div class="rose-stage" aria-hidden="true">
          <span class="rose-halo"></span>
          <div class="black-rose">
            <span class="rose-bloom">
              <i></i><i></i><i></i><i></i><i></i><i></i>
            </span>
            <span class="rose-stem"></span>
            <span class="rose-leaf rose-leaf-left"></span>
            <span class="rose-leaf rose-leaf-right"></span>
          </div>
          <span class="rose-name">H · H</span>
        </div>

        <button class="primary-button" data-action="start">
          <span>${HOME_COPY.action}</span>
          <span class="button-arrow" aria-hidden="true">↗</span>
        </button>
      </section>
    </main>
  `;
}

function renderQuiz(state) {
  const progress = getProgress(state);
  const question = QUESTIONS[state.currentQuestion];
  const selectedAnswer = state.answers[state.currentQuestion];

  const options = question.options
    .map(
      (option, index) => `
        <button
          class="option ${selectedAnswer === index ? 'is-previous' : ''}"
          data-option="${index}"
          type="button"
        >
          <span class="option-index">0${index + 1}</span>
          <span class="option-label">${option}</span>
          <span class="option-arrow" aria-hidden="true">→</span>
        </button>
      `,
    )
    .join('');

  return `
    <main class="screen quiz-screen">
      <div class="quiz-ambient quiz-ambient-one" aria-hidden="true">✦</div>
      <div class="quiz-ambient quiz-ambient-two" aria-hidden="true">✦</div>
      <section class="quiz-card">
        <header class="quiz-header">
          <button class="icon-button" data-action="back" type="button" aria-label="返回上一页">←</button>
          <span>${String(progress.current).padStart(2, '0')} / ${String(progress.total).padStart(2, '0')}</span>
        </header>

        <div class="progress-track" aria-label="答题进度">
          <div class="progress-value" style="width: ${progress.percent}%"></div>
        </div>

        <div class="question-content">
          <p class="question-number">QUESTION ${String(progress.current).padStart(2, '0')}</p>
          <h2>${question.title}</h2>
          <div class="options">${options}</div>
          <p class="quiz-footnote">凭第一感觉选就好，没有标准答案。</p>
        </div>
      </section>
    </main>
  `;
}

function renderMemories(state) {
  const activeIndex = Math.min(
    Math.max(state.memoryIndex, 0),
    MEMORY_SLIDES.length - 1,
  );
  const activeSlide = MEMORY_SLIDES[activeIndex];
  const isFinal = activeIndex === MEMORY_SLIDES.length - 1;
  const frames = MEMORY_SLIDES.map((slide, index) => {
    const position =
      index === activeIndex
        ? 'is-active'
        : index < activeIndex
          ? 'is-past'
          : 'is-upcoming';

    return `
      <span class="memory-photo memory-photo-${slide.focus} ${position}" data-memory-frame="${index}">
        <img src="${slide.src}" alt="${slide.alt}" data-memory-image />
        <span class="memory-photo-shine" aria-hidden="true"></span>
      </span>
    `;
  }).join('');
  const stage = isFinal
    ? `<div class="memory-stage is-final">${frames}</div>`
    : `
      <button
        class="memory-stage"
        data-action="memory-next"
        type="button"
        aria-label="查看下一张回忆"
      >
        ${frames}
      </button>
    `;
  const progress = MEMORY_SLIDES.map(
    (_, index) => `
      <span class="${index === activeIndex ? 'is-current' : ''} ${index < activeIndex ? 'is-seen' : ''}"></span>
    `,
  ).join('');

  return `
    <main class="screen memory-screen memory-step-${activeIndex + 1}">
      <img
        class="memory-backdrop"
        src="${activeSlide.src}"
        alt=""
        aria-hidden="true"
        data-memory-image
      />
      <span class="memory-veil" aria-hidden="true"></span>
      <button class="icon-button memory-back" data-action="back" type="button" aria-label="返回第三题">←</button>

      <section class="memory-content">
        <header class="memory-header">
          <p>OUR LITTLE MOMENTS</p>
          <span>0${activeIndex + 1} / 0${MEMORY_SLIDES.length}</span>
        </header>

        ${stage}

        <div class="memory-ending ${isFinal ? 'is-visible' : ''}" aria-live="polite">
          ${
            isFinal
              ? `
                <p class="memory-line memory-line-one">和你在一起</p>
                <p class="memory-line memory-line-two">再普通的日子</p>
                <p class="memory-line memory-line-three">也万幸有光</p>
              `
              : '<p class="memory-hint">轻轻点一下，继续往前</p>'
          }
        </div>

        <footer class="memory-footer">
          <div class="memory-progress" aria-label="回忆进度">${progress}</div>
          ${
            isFinal
              ? `
                <button class="memory-continue" data-action="memory-continue" type="button">
                  <span>继续拆礼物</span>
                  <span aria-hidden="true">↗</span>
                </button>
              `
              : ''
          }
        </footer>
      </section>
    </main>
  `;
}

function renderGift() {
  return `
    <main class="screen gift-screen">
      <button class="icon-button gift-back" data-action="back" type="button" aria-label="返回上一题">←</button>

      <section class="gift-content">
        <div class="gift-stage-copy">
          <p class="eyebrow">THE FINAL MOMENT · 03 / 03</p>
          <h2>${GIFT_COPY.title}</h2>
        </div>

        <div class="opening-bloom" aria-hidden="true">
          <div class="petal-field">
            <i class="opening-petal"></i><i class="opening-petal"></i>
            <i class="opening-petal"></i><i class="opening-petal"></i>
            <i class="opening-petal"></i><i class="opening-petal"></i>
            <i class="opening-petal"></i><i class="opening-petal"></i>
          </div>
          <span class="opening-light"></span>
          <span class="opening-star opening-star-one">✦</span>
          <span class="opening-star opening-star-two">✦</span>
          <span class="opening-star opening-star-three">✦</span>
        </div>

        <button class="gift-box" data-action="reveal" type="button" aria-label="拆开礼物">
          <span class="gift-glow"></span>
          <span class="gift-shadow"></span>
          <span class="gift-body"></span>
          <span class="gift-ribbon"></span>
          <span class="gift-lid"></span>
          <span class="gift-bow gift-bow-left"></span>
          <span class="gift-bow gift-bow-right"></span>
        </button>

        <p class="gift-hint">${GIFT_COPY.hint}</p>
        <p class="opening-line">我们的第一个七夕，正式入场。</p>
      </section>
    </main>
  `;
}

function renderRevealed(state) {
  return `
    <main class="screen concert-result-screen">
      <section class="concert-result">
        <div class="concert-hero">
          <img
            class="concert-live-photo"
            src="/public/concert-live.png"
            alt="新裤子演唱会现场"
          />
          <div class="concert-photo-shade" aria-hidden="true"></div>
          <p class="concert-pixel-title" aria-hidden="true">NEW<br />PANTS</p>
          <span class="concert-live-badge">LIVE!</span>
          <span class="concert-stars" aria-hidden="true">✦ ✦ ✦</span>

          <div class="concert-ticket">
            <div class="concert-ticket-main">
              <small>TWO TICKETS · ONE NIGHT</small>
              <h2>新裤子巡回演唱会<br />广州站</h2>
              <p>宝能广州国际体育演艺中心<br />2026.08.22 · SAT · 19:30</p>
            </div>
            <div class="concert-ticket-stub">
              <div>
                <strong>08.22</strong>
                <span>ADMIT TWO</span>
              </div>
            </div>
            <img
              class="concert-poster"
              src="/public/concert-poster.png"
              alt="新裤子巡回演唱会广州站海报"
            />
          </div>
        </div>

        <div class="concert-invitation">
          <p class="concert-meta">2026 · GUANGZHOU</p>
          <h1>花花，8月22日周六，<br />和我一起去看新裤子吧。</h1>
          <p class="concert-note">为我们准备了两张相邻的票。</p>

          <div class="concert-answer ${state.responded ? 'is-loved' : ''}" aria-live="polite">
            <div class="concert-heart-burst" aria-hidden="true">
              <i>♥</i><i>✦</i><i>♥</i><i>✦</i><i>♥</i><i>✦</i><i>♥</i>
            </div>
            <button data-action="respond" type="button">
              ${state.responded ? '说好了，现场见 ♥' : '当然要一起 ♥'}
            </button>
          </div>

          <button class="concert-replay" data-action="replay" type="button">
            ${GIFT_COPY.replay}
          </button>
        </div>
      </section>
    </main>
  `;
}

export function renderScreen(state) {
  if (state.view === 'quiz') {
    return renderQuiz(state);
  }
  if (state.view === 'memories') {
    return renderMemories(state);
  }
  if (state.view === 'gift') {
    return renderGift();
  }
  if (state.view === 'revealed') {
    return renderRevealed(state);
  }
  return renderHome();
}

export function mountApp(
  root,
  {
    musicController = createMusicController(),
    interactionTarget = document,
  } = {},
) {
  if (!root) {
    throw new Error('App root is required');
  }

  let state = createInitialState();
  let locked = false;
  let memoryTimer = null;

  const clearMemoryTimer = () => {
    if (memoryTimer === null) {
      return;
    }

    window.clearTimeout(memoryTimer);
    memoryTimer = null;
  };

  const retryMusic = () => musicController.retryActive();
  interactionTarget.addEventListener('pointerdown', retryMusic, { once: true });

  const render = () => {
    clearMemoryTimer();
    root.innerHTML = renderScreen(state);
    const renderedView = state.view;
    const playback = musicController.sync(renderedView);
    Promise.resolve(playback).then((started) => {
      if (started || renderedView === 'revealed') {
        interactionTarget.removeEventListener('pointerdown', retryMusic);
      }
    });

    root
      .querySelector('[data-action="start"]')
      ?.addEventListener('click', () => {
        state = startQuiz(state);
        render();
      });

    root
      .querySelector('[data-action="back"]')
      ?.addEventListener('click', () => {
        if (locked) {
          return;
        }
        state = goBack(state);
        render();
      });

    root.querySelectorAll('[data-option]').forEach((button) => {
      button.addEventListener('click', () => {
        if (locked) {
          return;
        }

        locked = true;
        button.classList.add('is-selected');

        window.setTimeout(() => {
          state = selectAnswer(state, Number(button.dataset.option));
          locked = false;
          render();
        }, ANSWER_ADVANCE_MS);
      });
    });

    root.querySelectorAll('[data-memory-image]').forEach((image) => {
      image.addEventListener('error', () => {
        image.closest('.memory-screen, .memory-photo')?.classList.add('is-image-missing');
      });
    });

    root
      .querySelector('[data-action="memory-next"]')
      ?.addEventListener('click', () => {
        clearMemoryTimer();
        state = advanceMemory(state);
        render();
      });

    root
      .querySelector('[data-action="memory-continue"]')
      ?.addEventListener('click', () => {
        state = enterGift(state);
        render();
      });

    if (
      state.view === 'memories' &&
      state.memoryIndex < MEMORY_SLIDES.length - 1
    ) {
      memoryTimer = window.setTimeout(() => {
        memoryTimer = null;
        state = advanceMemory(state);
        render();
      }, MEMORY_SLIDE_MS);
    }

    root
      .querySelector('[data-action="reveal"]')
      ?.addEventListener('click', (event) => {
        if (locked) {
          return;
        }

        locked = true;
        event.currentTarget.disabled = true;
        event.currentTarget.classList.add('is-opening');
        event.currentTarget.closest('.gift-screen')?.classList.add('is-opening');
        void musicController.beginReveal();

        window.setTimeout(() => {
          state = revealGift(state);
          locked = false;
          render();
        }, GIFT_REVEAL_MS);
      });

    root
      .querySelector('[data-action="respond"]')
      ?.addEventListener('click', (event) => {
        state = respondToInvitation(state);
        const answer = event.currentTarget.closest('.concert-answer');
        answer?.classList.remove('is-loved');
        void answer?.offsetWidth;
        answer?.classList.add('is-loved');
        event.currentTarget.textContent = '说好了，现场见 ♥';
      });

    root
      .querySelector('[data-action="replay"]')
      ?.addEventListener('click', () => {
        state = resetGift(state);
        render();
      });
  };

  render();

  return {
    getState: () => state,
  };
}
