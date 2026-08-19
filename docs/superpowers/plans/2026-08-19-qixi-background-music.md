# Qixi Background Music Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Play Track A across the pre-reveal flow, switch to Track B when the concert result appears, and safely retry blocked autoplay on the first user interaction.

**Architecture:** Add a focused `src/music.js` controller that owns two persistent `Audio` objects and maps application views to the correct track. `mountApp` creates the controller once, synchronizes it after each render, and registers a one-time interaction retry; audio failures remain isolated from the gift flow.

**Tech Stack:** Browser `Audio` / `HTMLMediaElement`, vanilla JavaScript ES modules, Node.js built-in test runner.

---

## File Structure

- Create `src/music.js`: audio paths, safe playback, track switching, looping, rewinding, and retry behavior.
- Create `tests/music.test.mjs`: unit coverage for the controller with injected fake audio objects.
- Modify `src/app.js`: create one controller per mounted app, synchronize it to rendered state, and install the autoplay fallback.
- Modify `tests/app.test.mjs`: verify the mount integration without requiring a browser DOM or real audio playback.
- Keep `music/a.m4a` and `music/b.mp3` unchanged.
- Preserve the existing uncommitted white-editorial quiz changes in `src/app.js`, `src/styles.css`, and `tests/app.test.mjs`; stage only music-related hunks.

### Task 1: Build the tested music controller

**Files:**
- Create: `tests/music.test.mjs`
- Create: `src/music.js`

- [ ] **Step 1: Write the failing controller tests**

Create `tests/music.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  MUSIC_TRACKS,
  MUSIC_VOLUME,
  createMusicController,
} from '../src/music.js';

function createAudioHarness({ playFailure = null } = {}) {
  const audioBySource = new Map();
  const createAudio = (source) => {
    const audio = {
      source,
      loop: false,
      volume: 1,
      currentTime: 0,
      playCalls: 0,
      pauseCalls: 0,
      play() {
        this.playCalls += 1;
        if (playFailure === 'throw') throw new Error('playback blocked');
        if (playFailure === 'reject') {
          return Promise.reject(new Error('playback blocked'));
        }
        return Promise.resolve();
      },
      pause() {
        this.pauseCalls += 1;
      },
    };
    audioBySource.set(source, audio);
    return audio;
  };
  return { createAudio, audioBySource };
}

test('configures both tracks and starts A for pre-reveal views', async () => {
  const harness = createAudioHarness();
  const controller = createMusicController(harness.createAudio);
  const trackA = harness.audioBySource.get(MUSIC_TRACKS.a);
  const trackB = harness.audioBySource.get(MUSIC_TRACKS.b);

  await controller.sync('home');
  await controller.sync('quiz');
  await controller.sync('gift');

  assert.equal(MUSIC_VOLUME, 0.35);
  assert.equal(trackA.loop, true);
  assert.equal(trackB.loop, true);
  assert.equal(trackA.volume, MUSIC_VOLUME);
  assert.equal(trackB.volume, MUSIC_VOLUME);
  assert.equal(trackA.playCalls, 1);
  assert.equal(trackB.playCalls, 0);
  assert.equal(controller.getActiveTrack(), 'a');
});

test('switches to B for revealed and rewinds the outgoing track', async () => {
  const harness = createAudioHarness();
  const controller = createMusicController(harness.createAudio);
  const trackA = harness.audioBySource.get(MUSIC_TRACKS.a);
  const trackB = harness.audioBySource.get(MUSIC_TRACKS.b);

  await controller.sync('gift');
  trackA.currentTime = 12;
  await controller.sync('revealed');

  assert.equal(trackA.pauseCalls, 1);
  assert.equal(trackA.currentTime, 0);
  assert.equal(trackB.playCalls, 1);
  assert.equal(controller.getActiveTrack(), 'b');

  trackB.currentTime = 8;
  await controller.sync('gift');

  assert.equal(trackB.pauseCalls, 1);
  assert.equal(trackB.currentTime, 0);
  assert.equal(trackA.playCalls, 2);
  assert.equal(controller.getActiveTrack(), 'a');
});

test('retries whichever track is active', async () => {
  const harness = createAudioHarness();
  const controller = createMusicController(harness.createAudio);
  const trackA = harness.audioBySource.get(MUSIC_TRACKS.a);
  const trackB = harness.audioBySource.get(MUSIC_TRACKS.b);

  await controller.sync('home');
  await controller.retryActive();
  assert.equal(trackA.playCalls, 2);

  await controller.sync('revealed');
  await controller.retryActive();
  assert.equal(trackB.playCalls, 2);
});

test('playback errors never escape into the gift flow', async () => {
  const rejected = createAudioHarness({ playFailure: 'reject' });
  const rejectedController = createMusicController(rejected.createAudio);
  assert.equal(await rejectedController.sync('home'), false);
  assert.equal(await rejectedController.retryActive(), false);

  const thrown = createAudioHarness({ playFailure: 'throw' });
  const thrownController = createMusicController(thrown.createAudio);
  assert.equal(await thrownController.sync('home'), false);
  assert.equal(await thrownController.sync('revealed'), false);
});
```

- [ ] **Step 2: Run the tests and verify RED**

Run:

```bash
/Users/welronhe/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test tests/music.test.mjs
```

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `src/music.js`.

- [ ] **Step 3: Implement the minimal controller**

Create `src/music.js`:

```js
export const MUSIC_TRACKS = Object.freeze({
  a: '/music/a.m4a',
  b: '/music/b.mp3',
});

export const MUSIC_VOLUME = 0.35;

async function playSafely(audio) {
  try {
    await audio.play();
    return true;
  } catch {
    // Audio is decorative; playback failures must not block the experience.
    return false;
  }
}

function stopAndRewind(audio) {
  audio.pause();
  audio.currentTime = 0;
}

export function createMusicController(
  createAudio = (source) => new Audio(source),
) {
  const tracks = {
    a: createAudio(MUSIC_TRACKS.a),
    b: createAudio(MUSIC_TRACKS.b),
  };

  Object.values(tracks).forEach((track) => {
    track.loop = true;
    track.volume = MUSIC_VOLUME;
  });

  let activeTrack = null;
  let activePlayback = false;

  async function playActive() {
    const requestedTrack = activeTrack;
    const started = await playSafely(tracks[requestedTrack]);
    if (activeTrack === requestedTrack) activePlayback = started;
    return started;
  }

  return {
    async sync(view) {
      const nextTrack = view === 'revealed' ? 'b' : 'a';
      if (nextTrack === activeTrack) {
        return activePlayback ? true : playActive();
      }

      if (activeTrack) stopAndRewind(tracks[activeTrack]);
      activeTrack = nextTrack;
      activePlayback = false;
      return playActive();
    },
    retryActive() {
      return activeTrack ? playActive() : Promise.resolve(false);
    },
    getActiveTrack() {
      return activeTrack;
    },
  };
}
```

- [ ] **Step 4: Run the controller tests and verify GREEN**

Run:

```bash
/Users/welronhe/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test tests/music.test.mjs
```

Expected: 4 tests pass and 0 fail.

- [ ] **Step 5: Commit the controller**

```bash
git add src/music.js tests/music.test.mjs
git commit -m "feat: add background music controller"
```

### Task 2: Connect music to the rendered gift flow

**Files:**
- Modify: `tests/app.test.mjs`
- Modify: `src/app.js:1,336-424`

- [ ] **Step 1: Write the failing mount integration test**

Append to `tests/app.test.mjs`:

```js
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
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```bash
/Users/welronhe/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test tests/app.test.mjs
```

Expected: FAIL because `mountApp` does not yet synchronize the injected music controller.

- [ ] **Step 3: Integrate the controller with `mountApp`**

Add at the top of `src/app.js`:

```js
import { createMusicController } from './music.js';
```

Change the `mountApp` signature and initialization to:

```js
export function mountApp(
  root,
  {
    musicController = createMusicController(),
    interactionTarget = document,
  } = {},
) {
  if (!root) throw new Error('App root is required');

  let state = createInitialState();
  let locked = false;

  const retryMusic = () => musicController.retryActive();
  interactionTarget.addEventListener(
    'pointerdown',
    retryMusic,
    { once: true },
  );

  const render = () => {
    root.innerHTML = renderScreen(state);
    const playback = musicController.sync(state.view);
    Promise.resolve(playback).then((started) => {
      if (started || state.view === 'revealed') {
        interactionTarget.removeEventListener('pointerdown', retryMusic);
      }
    });
```

Keep the existing event bindings below this point unchanged. Because `render()` runs after the reveal timeout updates state, A continues through the animation and the `revealed` render switches to B. The replay handler renders `gift`, which switches back to A.

- [ ] **Step 4: Run the integration tests and verify GREEN**

Run:

```bash
/Users/welronhe/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test tests/app.test.mjs
```

Expected: 15 tests pass and 0 fail.

- [ ] **Step 5: Run the complete test suite**

Run:

```bash
/Users/welronhe/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test
```

Expected: 19 tests pass and 0 fail.

- [ ] **Step 6: Commit the app integration**

Use `git add -p src/app.js tests/app.test.mjs` and stage only these music hunks:

- the `createMusicController` import;
- the injectable `musicController` / `interactionTarget` mount dependencies;
- the first-interaction retry and render synchronization;
- the new mount integration test.

Leave the white-editorial quiz hunks unstaged, then run:

```bash
git commit -m "feat: play music across the Qixi gift flow"
```

### Task 3: Verify assets and final behavior

**Files:**
- Verify: `music/a.m4a`
- Verify: `music/b.mp3`
- Verify: `src/music.js`
- Verify: `src/app.js`

- [ ] **Step 1: Confirm both referenced assets exist and are non-empty**

Run:

```bash
test -s music/a.m4a && test -s music/b.mp3 && file music/a.m4a music/b.mp3
```

Expected: exit 0, with `a.m4a` reported as ISO Media audio and `b.mp3` as MPEG Layer III audio.

- [ ] **Step 2: Re-run all automated tests**

Run:

```bash
/Users/welronhe/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test
```

Expected: 19 tests pass and 0 fail, with no unhandled rejection output.

- [ ] **Step 3: Review final scope and whitespace**

Run:

```bash
git diff HEAD~2 --check
git diff HEAD~2 -- src/music.js src/app.js tests/music.test.mjs tests/app.test.mjs
git status --short
```

Expected: no whitespace errors; existing `.DS_Store` and `.superpowers/` items remain untouched.

- [ ] **Step 4: Commit the user-provided audio assets separately**

```bash
git add music/a.m4a music/b.mp3
git commit -m "assets: add Qixi background music"
```

Expected: the two audio files are tracked without modifying their contents.
