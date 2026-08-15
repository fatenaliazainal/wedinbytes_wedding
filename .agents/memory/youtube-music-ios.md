---
name: YouTube music — real root causes and two-path fix
description: Why YouTube audio fails silently on all browsers, and the correct desktop vs iOS approach
---

# YouTube Music — Root Causes and Fix

## Root Cause 1: Helmet CSP blocked the iframe entirely in production

`artifacts/api-server/src/app.ts` had no `frameSrc` directive in its production CSP. 
`defaultSrc: ["'self'"]` was the fallback — YouTube iframes were **blocked entirely** before loading.

**Fix:** Added `frameSrc: ["https://www.youtube.com", "https://www.youtube-nocookie.com"]` to the production CSP directives.

## Root Cause 2: 1×1px iframe prevents YouTube player from initializing

The hidden iframe used `className="absolute w-px h-px opacity-0 overflow-hidden pointer-events-none"`.
YouTube's embed player fails to initialize at 1×1px — autoplay=1 silently does nothing.

**Fix:** Off-screen iframe with real dimensions:
```
position: fixed; left: -9999px; top: 0; width: 320px; height: 180px;
```

## Root Cause 3: iOS Safari never transfers user activation to iframes

On iOS Safari, setting `iframe.src = url` inside a click handler does **not** grant the iframe
autoplay permission with audio. User activation from the parent frame is never propagated
to the child iframe's audio context. This is a hard iOS OS restriction with no workaround.

**Fix:** Two-path approach based on iOS detection:

### Desktop / Android (non-iOS)
- Off-screen properly-sized iframe (320×180, `left: -9999px`)
- `ytPlay()` sets `iframe.src = ytEmbedSrc` on envelope tap — browser-level navigation in gesture context grants autoplay
- Mute/unmute via `postMessage({ event: "command", func: "mute"/"unMute" })` with `'*'` targetOrigin

### iOS Safari
- Skip iframe src-swap on envelope tap entirely
- After envelope opens: show a 🎵 button (top-left, same area as mute button)
- Tapping 🎵 reveals a visible 200×113 YouTube mini-player with `controls=1`
- User taps YouTube's own ▶ button directly — this IS a direct gesture on the media element, which iOS Safari permits

## iOS detection
```tsx
const isIOSSafari = useRef(
  typeof navigator !== "undefined" &&
  /iPad|iPhone|iPod/.test(navigator.userAgent)
);
```

## Dev environment note
Dev runs on HTTP localhost — YouTube iframe postMessage gives origin mismatch warnings. Expected and harmless.
Only test music autoplay behavior on the HTTPS production URL.

## Embed URL params (desktop hidden player)
`autoplay=1&loop=1&playlist=VIDEO_ID&controls=0&playsinline=1&rel=0&modestbranding=1&fs=0&enablejsapi=1`

**Why `'*'` targetOrigin for postMessage:** Avoids origin mismatch error; safe because we only send harmless playback commands.
