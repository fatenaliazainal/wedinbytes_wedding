---
name: YouTube music — final working approach per platform
description: Root causes, failed approaches, and the correct two-path implementation for desktop/Android vs iOS Safari
---

# YouTube Music — What Works

## Root Cause Summary (all compounding)

1. **Helmet CSP blocked YouTube iframes in production** — no `frameSrc` directive, fell back to `defaultSrc:'self'`. Fix: add `frameSrc: ["https://www.youtube.com","https://www.youtube-nocookie.com"]` to production CSP directives in `artifacts/api-server/src/app.ts`.

2. **Static 1×1px hidden iframe** — YouTube's player refused to initialise at that size, `autoplay=1` silently failed. Fix: proper dimensions (320×180).

3. **Setting `.src` on a pre-rendered iframe** — does NOT reliably transfer user-activation on all browsers. Fix: **create the iframe dynamically inside the click handler** — browsers guarantee user-activation for elements created synchronously during a gesture.

4. **iOS Safari cross-frame activation** — impossible to transfer user-activation from parent frame click into iframe audio context on iOS. No workaround. Server-side proxy also blocked by YouTube bot-detection on Replit cloud IPs.

## Final Implementation

### Desktop / Android — dynamic iframe in click handler
```tsx
const ytPlay = useCallback(() => {
  if (isIOSSafari.current) return;
  if (ytStartedRef.current || !youtubeVideoId) return;
  ytStartedRef.current = true;

  const iframe = document.createElement("iframe");
  iframe.src = `https://www.youtube-nocookie.com/embed/${youtubeVideoId}?autoplay=1&loop=1&playlist=${youtubeVideoId}&controls=0&playsinline=1&rel=0&modestbranding=1&fs=0&enablejsapi=1`;
  iframe.allow = "autoplay; encrypted-media";
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText = "position:fixed;left:-9999px;top:0;width:320px;height:180px;border:none;pointer-events:none;";
  document.body.appendChild(iframe);
  ytIframeRef.current = iframe;
}, [youtubeVideoId]);
```
- Append to `document.body` directly — avoids parent `overflow:hidden` or `transform` interference
- Use `youtube-nocookie.com` — fewer restrictions than `youtube.com`
- 320×180 off-screen — big enough for YouTube to initialise the player
- Mute/unmute via postMessage with `'*'` targetOrigin after the player is running

### iOS Safari — visible mini YouTube player
- Detect: `/iPad|iPhone|iPod/.test(navigator.userAgent)`
- Show a 🎵 button (`<Music>` icon) after envelope opens
- Tapping reveals a `200×113` iframe from `youtube-nocookie.com` with `controls=1`
- User taps YouTube's own ▶ button directly — this IS a direct gesture on media, which iOS permits
- `autoplay=0` in the iOS mini-player URL (let user tap play themselves)

### Non-YouTube direct audio URLs (MP3 etc.)
- Standard HTML5 `<audio>` preloaded with `preload="auto"`, `.play()` called in gesture handler
- Retry on `attachInteractionRetry` if blocked

## What Does NOT Work
- `ytdl-core` / `@distube/ytdl-core` on Replit: YouTube returns "Sign in to confirm you're not a bot" for cloud/VPS IPs
- `yt-dlp` on Replit NixOS: package too old to build (2021.08.02)
- Setting `iframe.src` on a pre-rendered static iframe: weaker user-activation than dynamic creation
- YouTube IFrame API `postMessage` (`playVideo()`, `unMute()`) on iOS: always async, gesture context gone by the time it fires
- `autoplay=1` on iframe with `muted=1` then `unMute()` postMessage: same async issue

## Dev environment note
Dev runs on HTTP localhost — YouTube postMessage shows origin mismatch warnings. Expected, harmless.
Test music only on the HTTPS production/dev-preview URL.
