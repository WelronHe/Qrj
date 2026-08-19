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
    if (activeTrack === requestedTrack) {
      activePlayback = started;
    }
    return started;
  }

  return {
    async sync(view) {
      const nextTrack = view === 'revealed' ? 'b' : 'a';
      if (nextTrack === activeTrack) {
        return activePlayback ? true : playActive();
      }

      if (activeTrack) {
        stopAndRewind(tracks[activeTrack]);
      }
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
