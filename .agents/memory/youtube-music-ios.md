---
name: YouTube music iOS approach
description: What works (and doesn't) for playing YouTube audio on iOS Safari in a cross-origin iframe invitation page
---

# YouTube Music on iOS Safari — Invitation Page

## The Core Problem
iOS Safari requires **user gesture** to start audio. For cross-origin YouTube iframes using the YT.Player JS API, `playVideo()` is sent via `postMessage`, which is **async** — by the time YouTube's JS processes it, the gesture context is gone. All `player.*()` methods (unMute, playVideo, setVolume) go through postMessage and face this.

## Approaches that did NOT work reliably

### 1. autoplay:0 + playVideo() in gesture handler
Calling `ytPlayerRef.current.playVideo()` inside onClick — the call is in gesture context on our page but postMessage delivery to YouTube's iframe is async, losing gesture context.

### 2. autoplay:1 + mute:1 → unMute() on tap
Player starts muted. On tap call `unMute()` via postMessage. Also didn't work — postMessage still async.

### 3. YT.Player constructor race condition crash
`new YT.Player()` returns an object immediately but `.unMute()`, `.playVideo()` etc. only exist after `onReady` fires. Calling them before `onReady` → `TypeError: player.unMute is not a function`. Fixed with `ytPlayerReadyRef`.

## Approach that should work: direct iframe.src swap

**Why:** Setting `iframe.src` from within a click handler is a **browser-level navigation** — iOS Safari transfers user activation to the navigated frame because it's treated as user-initiated navigation, not an async postMessage. The YouTube embed URL with `autoplay=1` receives this activation and can play with sound.

**Implementation:**
```tsx
const ytIframeRef = useRef<HTMLIFrameElement | null>(null);
const ytStartedRef = useRef(false);

// On tap gesture:
const ytPlay = () => {
  if (!ytIframeRef.current || ytStartedRef.current || !ytEmbedSrc) return;
  ytStartedRef.current = true;
  ytIframeRef.current.src = ytEmbedSrc; // browser navigation in gesture context
};

// Mute toggle (after player is running):
iframe.contentWindow?.postMessage(
  JSON.stringify({ event: "command", func: "mute", args: [] }),
  "*"  // use '*' not 'https://www.youtube.com' — avoids origin mismatch error
);
```

**Embed URL params:**
`?autoplay=1&loop=1&playlist=VIDEO_ID&controls=0&playsinline=1&rel=0&modestbranding=1&fs=0&enablejsapi=1`

**Key notes:**
- No `youtube.com/iframe_api` script needed — pure iframe src manipulation
- `enablejsapi=1` in URL allows postMessage commands for mute/unmute after load
- Use `'*'` as postMessage targetOrigin (avoids the origin mismatch error seen on HTTP localhost dev)
- The iframe starts with NO src — loaded only on tap to avoid any pre-tap network request
- 1-2s delay for YouTube to load is acceptable; masked by the envelope open animation (0.9-1.4s)

**Why '*' targetOrigin is safe:** We're only sending harmless playback commands (mute/unmute), not sensitive data.

## Dev environment note
Dev runs on HTTP localhost — YouTube iframe postMessage gives a "target origin mismatch" warning. This is expected and harmless on dev. Only test music on the **HTTPS production URL**.
