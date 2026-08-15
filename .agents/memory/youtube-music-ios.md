---
name: YouTube music iOS limit
description: YouTube IFrame API cannot play audio on iOS Safari; use direct audio files instead.
---

## Rule
Never use YouTube IFrame API (`playVideo()`, `unMute()`) as the primary background music mechanism for mobile. It will silently fail on iOS Safari regardless of how the call is structured.

**Why:**
iOS Safari does not transfer gesture "permission" across frames. The YouTube player lives in a separate cross-origin iframe. Our tap handler fires in our frame, but `postMessage` to the YouTube iframe does not carry the gesture context. So `playVideo()` and `unMute()` both get blocked by iOS's audio policy, even when called synchronously inside a user gesture handler.

Approaches tried and confirmed not working on iOS Safari:
- `autoplay:0` → `playVideo()` in synchronous tap handler (gesture lost cross-frame)
- `autoplay:1, mute:1` → `unMute()` in tap handler (player at -9999px never starts; in-viewport version hit same cross-frame block)
- Player resized to 200×150px off-screen (YouTube IntersectionObserver stops autoplay for off-screen elements)

**How to apply:**
- For background music that must work on iOS: use a native `<audio>` element with a direct MP3/M4A URL hosted in R2.
- `playAudioNow()` in `InvitationPage.tsx` already handles this path correctly — it calls `audio.play()` synchronously in the tap gesture within our own frame.
- YouTube URL support can remain as a desktop-only fallback, with a note in admin UI that it may not play on iPhone.
- The `musicUrl` field already routes to `<audio>` for non-YouTube URLs — no extra code needed once the URL is a direct audio file.
