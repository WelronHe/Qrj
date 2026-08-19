# QRJ Background Music Design

## Goal

Add continuous background music to the existing Qixi gift flow without changing the current visual design or blocking any interaction when audio playback is unavailable.

## Audio Assets

- Track A: `/music/a.m4a`
- Track B: `/music/b.mp3`
- Both tracks loop while active.
- Both tracks use a restrained background volume of `0.35`.

The files remain in the existing `music/` directory. This change does not rename, convert, or modify either audio file.

## Playback Flow

1. When the page mounts, immediately attempt to start Track A.
2. If the browser blocks audible autoplay, keep the page fully usable and retry Track A on the user's first interaction anywhere on the page. No dedicated music button is required.
3. Track A remains active on the home screen, every quiz screen, the closed-gift screen, and throughout the 1.45-second gift-opening animation.
4. When the animation completes and the concert result screen appears, stop Track A and start Track B from the beginning.
5. Track B loops while the concert result screen is visible.
6. When the user selects "再看一次", stop Track B and restart Track A from the beginning as the closed-gift screen returns.

## Implementation Shape

Create one persistent music controller when `mountApp` runs. The controller owns two `Audio` objects so screen re-renders do not recreate or interrupt the active track.

The controller exposes three focused operations:

- attempt or retry Track A;
- switch from Track A to Track B;
- switch from Track B back to Track A.

Only one track may be active at a time. A switch pauses and rewinds the outgoing track before starting the incoming track from the beginning. The result-page switch runs inside the existing reveal timeout, at the same point that application state changes to `revealed`.

## Failure Handling

- Rejected `play()` promises are handled so browser autoplay blocking does not create an unhandled error.
- A failed or unsupported audio file leaves the experience silent; it does not interrupt navigation, answering, gift opening, replay, or invitation acceptance.
- The first-interaction retry is removed after Track A starts or when the flow has already switched to Track B, preventing a late retry from restarting the wrong track.

## Testing

Use an injected fake audio factory in Node tests to verify:

- the correct source paths, loop setting, and volume;
- initial Track A playback is attempted;
- blocked autoplay can be retried;
- Track A remains active until the reveal completes;
- switching to Track B pauses and rewinds Track A;
- replaying switches back to Track A and rewinds Track B;
- rejected playback does not break the application flow.

No visual snapshots are required because the feature adds no visible UI.
