export const QUESTIONS = [
  {
    title: '你是谁？',
    options: ['黄婷', '何威龙老婆'],
  },
  {
    title: '《乐队的夏天》中，哪个组合你最想和男朋友去一次？',
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

export function createInitialState() {
  return {
    view: 'home',
    currentQuestion: 0,
    answers: Array(QUESTIONS.length).fill(null),
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
      view: 'gift',
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

      <section class="hero-card">
        <p class="eyebrow">${HOME_COPY.eyebrow}</p>
        <div class="rose-mark" aria-hidden="true">🌹</div>
        <h1>${HOME_COPY.title}</h1>
        <p class="subtitle">${HOME_COPY.subtitle}</p>
        <button class="primary-button" data-action="start">
          <span>${HOME_COPY.action}</span>
          <span aria-hidden="true">→</span>
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
      <section class="quiz-card">
        <header class="quiz-header">
          <button class="icon-button" data-action="back" type="button" aria-label="返回上一页">←</button>
          <span>${progress.current} / ${progress.total}</span>
        </header>

        <div class="progress-track" aria-label="答题进度">
          <div class="progress-value" style="width: ${progress.percent}%"></div>
        </div>

        <div class="question-content">
          <p class="eyebrow">A LITTLE QUESTION</p>
          <h2>${question.title}</h2>
          <div class="options">${options}</div>
        </div>
      </section>
    </main>
  `;
}

function renderGift() {
  return `
    <main class="screen gift-screen">
      <button class="icon-button gift-back" data-action="back" type="button" aria-label="返回上一题">←</button>

      <section class="gift-content">
        <p class="eyebrow">THE FINAL MOMENT</p>
        <h2>${GIFT_COPY.title}</h2>

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
      </section>
    </main>
  `;
}

function renderRevealed() {
  return `
    <main class="screen revealed-screen">
      <div class="sparkles" aria-hidden="true">
        <i></i><i></i><i></i><i></i><i></i>
      </div>

      <section class="revealed-content">
        <p class="eyebrow">${GIFT_COPY.revealedEyebrow}</p>
        <h2>${GIFT_COPY.revealedTitle}</h2>
        <p class="revealed-subtitle">${GIFT_COPY.revealedSubtitle}</p>
        <img
          class="tickets"
          src="/public/tickets.svg"
          alt="何花花与何威龙的七夕门票"
        />
        <button class="secondary-button" data-action="replay" type="button">
          ${GIFT_COPY.replay}
        </button>
      </section>
    </main>
  `;
}

export function renderScreen(state) {
  if (state.view === 'quiz') {
    return renderQuiz(state);
  }
  if (state.view === 'gift') {
    return renderGift();
  }
  if (state.view === 'revealed') {
    return renderRevealed();
  }
  return renderHome();
}

export function mountApp(root) {
  if (!root) {
    throw new Error('App root is required');
  }

  let state = createInitialState();
  let locked = false;

  const render = () => {
    root.innerHTML = renderScreen(state);

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
        }, 280);
      });
    });

    root
      .querySelector('[data-action="reveal"]')
      ?.addEventListener('click', (event) => {
        if (locked) {
          return;
        }

        locked = true;
        event.currentTarget.disabled = true;
        event.currentTarget.classList.add('is-opening');

        window.setTimeout(() => {
          state = revealGift(state);
          locked = false;
          render();
        }, 900);
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
