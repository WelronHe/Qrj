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

test('starts B when gift opening begins and keeps it through reveal', async () => {
  const harness = createAudioHarness();
  const controller = createMusicController(harness.createAudio);
  const trackA = harness.audioBySource.get(MUSIC_TRACKS.a);
  const trackB = harness.audioBySource.get(MUSIC_TRACKS.b);

  await controller.sync('gift');
  trackA.currentTime = 9;
  await controller.beginReveal();

  assert.equal(trackA.pauseCalls, 1);
  assert.equal(trackA.currentTime, 0);
  assert.equal(trackB.playCalls, 1);
  assert.equal(controller.getActiveTrack(), 'b');

  await controller.sync('revealed');

  assert.equal(trackB.pauseCalls, 0);
  assert.equal(trackB.playCalls, 1);
  assert.equal(controller.getActiveTrack(), 'b');
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
