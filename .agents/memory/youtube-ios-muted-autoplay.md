---
name: YouTube iOS muted-autoplay
description: How to make YouTube music play automatically on iOS Safari when envelope is tapped.
---

# YouTube iOS muted-autoplay strategy

## The Rule
Use `autoplay: 1, mute: 1` in YT.Player playerVars, then call `unMute()` + `setVolume(100)` synchronously inside the envelope tap gesture handler. This is the only reliable path for iOS autoplay with YouTube.

**Why:** iOS Safari blocks cross-frame audio start via postMessage (so `playVideo()` from parent page never works). But iOS DOES allow:
1. Muted autoplay (`autoplay:1 mute:1`) — same as `<video muted autoplay>`
2. Unmuting already-playing muted media within a synchronous user gesture handler

**How to apply:**
- Player `playerVars`: `autoplay: 1, mute: 1` (not `autoplay: 0`)
- Player div: `position:fixed; top:0; left:0; opacity:0; z-index:-1; width:320px; height:180px` — must be in viewport (not off-screen) for YouTube's autoplay to trigger
- `ytPlay()` called synchronously from envelope tap → `unMute()` + `setVolume(100)` + `playVideo()` (playVideo covers case where autoplay was blocked)
- `onReady` with tap pending → same `unMute()` + `setVolume(100)` + `playVideo()`
- `YTPlayerInstance` interface must include `setVolume(volume: number): void`
- No separate iOS mini-player needed

**What was removed:** The iOS detection (`isIOSSafari` useRef), `iosPlayerVisible` state, the 🎵 toggle button, and the visible mini-player iframe fallback.
