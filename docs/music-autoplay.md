# Music Autoplay — Full Technical Documentation

**Last updated:** 2026-08-16  
**Applies to:** `artifacts/wedding-invite` (frontend) + `artifacts/api-server` (backend)

---

## Table of Contents

1. [Overview](#1-overview)
2. [Music Modes: YouTube vs Direct Audio](#2-music-modes-youtube-vs-direct-audio)
3. [Where Music URL is Stored](#3-where-music-url-is-stored)
4. [URL Parsing — extractYouTubeId](#4-url-parsing--extractyoutubeid)
5. [Editor Validation Flow](#5-editor-validation-flow)
6. [Server Configuration](#6-server-configuration)
7. [YouTube Autoplay — Full Flow](#7-youtube-autoplay--full-flow)
8. [iOS Safari Solution (Muted-Autoplay + Gesture-Unmute)](#8-ios-safari-solution-muted-autoplay--gesture-unmute)
9. [HTML5 Audio Flow (Non-YouTube URLs)](#9-html5-audio-flow-non-youtube-urls)
10. [Mute Toggle](#10-mute-toggle)
11. [Player State Machine](#11-player-state-machine)
12. [YouTube Error Codes](#12-youtube-error-codes)
13. [File Map](#13-file-map)
14. [Common Problems & Fixes](#14-common-problems--fixes)

---

## 1. Overview

Wedding invitations support background music that plays automatically when a guest opens (taps) the envelope. Music can come from:

- **A YouTube URL** — played via the official YouTube IFrame Player API (invisible player in the background)
- **A direct audio URL** (MP3, OGG, etc.) — played via the browser's native HTML5 `<audio>` element

The challenge: browsers (especially **iOS Safari**) block audio that starts without a direct user gesture. The solution uses a **muted autoplay + gesture-unmute** strategy so music starts the moment the guest taps the envelope — no extra taps required.

---

## 2. Music Modes: YouTube vs Direct Audio

The decision is made at runtime by checking whether the stored `musicUrl` is a YouTube URL:

```ts
// InvitationPage.tsx
const youtubeVideoId = musicUrl ? extractYouTubeId(musicUrl) : null;
const isYouTubeMusic = Boolean(youtubeVideoId);
```

| Mode | Trigger | Player |
|---|---|---|
| YouTube | `extractYouTubeId()` returns a video ID | `window.YT.Player` (IFrame API) |
| Direct audio | Any non-YouTube URL | `new Audio(url)` |

---

## 3. Where Music URL is Stored

`musicUrl` flows in from two sources:

1. **Card Design** (admin-managed global template) — field `musicUrl` in the `card_designs` table  
2. **Invitation override** — field `musicUrl` in the `invitations` table (buyer/business edits this per-invitation)

The invitation's own `musicUrl` takes priority. If null/empty, the active card design's `musicUrl` is used. This cascade is resolved server-side in the invitation GET endpoint and delivered to the frontend as a single `musicUrl` string.

---

## 4. URL Parsing — extractYouTubeId

**File:** `artifacts/wedding-invite/src/lib/youtube.ts`

Accepts any YouTube URL format and returns the 11-character video ID, or `null` if the URL is not a valid YouTube video link.

**Supported URL formats:**

```
https://youtu.be/QgaTQ5-XfMM                          → QgaTQ5-XfMM
https://www.youtube.com/watch?v=QgaTQ5-XfMM           → QgaTQ5-XfMM
https://m.youtube.com/watch?v=QgaTQ5-XfMM             → QgaTQ5-XfMM
https://music.youtube.com/watch?v=QgaTQ5-XfMM         → QgaTQ5-XfMM
https://www.youtube.com/shorts/QgaTQ5-XfMM            → QgaTQ5-XfMM
https://www.youtube.com/embed/QgaTQ5-XfMM             → QgaTQ5-XfMM
```

**Validation rule:** the extracted ID must match `/^[A-Za-z0-9_-]{11}$/` exactly.

```ts
const YOUTUBE_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;
```

Returns `null` for non-YouTube URLs (they are treated as direct audio).

---

## 5. Editor Validation Flow

**When:** Every time an admin, buyer, or business editor pastes a music URL into the `MusicUrlInput` field.

**Hook:** `artifacts/wedding-invite/src/hooks/use-music-url-validation.ts`

### Flow diagram

```
User pastes URL
      │
      ▼
URL empty? ──yes──► status: "idle"       (save allowed, no message)
      │
      ▼ no
Valid URL? ──no───► status: "invalid-url" (save blocked)
      │
      ▼ yes
YouTube URL? ──no─► status: "direct-audio" (save allowed — treated as MP3 etc.)
      │
      ▼ yes
extractYouTubeId() ──null──► status: "invalid-url" (save blocked)
      │
      ▼ valid ID
[600ms debounce]
      │
      ▼
GET /api/music/validate?videoId=XXX
      │
      ├── { embeddable: true }            → status: "valid"          (save allowed)
      ├── { embeddable: false, reason: "not_embeddable" }            (save blocked)
      ├── { embeddable: false, reason: "not_found" }                 (save blocked)
      └── { embeddable: false, reason: "unavailable" } / network err → status: "idle" (lenient, save allowed)
```

### Server endpoint: `GET /api/music/validate`

**File:** `artifacts/api-server/src/routes/music.ts`

Queries YouTube's public **oEmbed endpoint**:

```
https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={videoId}&format=json
```

| YouTube oEmbed response | API response |
|---|---|
| HTTP 200 | `{ embeddable: true }` |
| HTTP 401 or 403 | `{ embeddable: false, reason: "not_embeddable" }` — owner disabled embedding |
| HTTP 404 | `{ embeddable: false, reason: "not_found" }` — video private or deleted |
| Timeout / network error | `{ embeddable: false, reason: "unavailable" }` |

**Timeout:** 5 seconds (AbortSignal.timeout). A slow YouTube response returns `unavailable` — the editor treats this leniently (does not block save).

> **Important:** oEmbed checks embedding permission at the metadata level only.  
> It cannot detect runtime errors like **Error 153** (Referrer-Policy misconfiguration) — those are server configuration issues, fixed separately in Helmet.

---

## 6. Server Configuration

**File:** `artifacts/api-server/src/app.ts`

Two Helmet settings are critical for YouTube music to work in production.

### 6a. Referrer-Policy

```ts
app.use(helmet({
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  // ...
}));
```

**Why this matters:**  
YouTube's embed server checks the `Referer` HTTP header to verify that the embedding page is on an allowed domain. Helmet's default policy is `no-referrer`, which strips the header completely. YouTube then rejects the embed with **Error 153** ("Video player configuration error"). Setting `strict-origin-when-cross-origin` sends the bare origin (e.g. `https://wedinstudio.com`) with every cross-origin request — exactly what YouTube needs.

### 6b. Content Security Policy (production only)

```ts
contentSecurityPolicy: process.env.NODE_ENV === "production"
  ? {
      directives: {
        scriptSrc: [
          "'self'",
          "https://www.youtube.com",          // ← YouTube IFrame API script
          "https://www.youtube-nocookie.com",
        ],
        frameSrc: [
          "https://www.youtube.com",           // ← YouTube player iframe
          "https://www.youtube-nocookie.com",
        ],
        mediaSrc: ["'self'", "blob:", "*"],    // ← direct audio URLs
      },
    }
  : false,  // CSP disabled in dev (Vite inline scripts need it off)
```

**Why each directive matters:**

| Directive | Without it |
|---|---|
| `scriptSrc: youtube.com` | `youtube.com/iframe_api` script blocked → `window.YT` never exists → silent music |
| `frameSrc: youtube.com` | YouTube player iframe blocked by browser → player never loads |
| `mediaSrc: *` | Direct MP3/OGG URLs from external hosts blocked by browser |

---

## 7. YouTube Autoplay — Full Flow

**File:** `artifacts/wedding-invite/src/pages/InvitationPage.tsx`

### Step 1: API script injection

When `youtubeVideoId` is detected, a `useEffect` injects the YouTube IFrame API script once:

```ts
useEffect(() => {
  if (!youtubeVideoId) return;

  // Chain existing global callback (safe for HMR / re-renders)
  const prevCb = window.onYouTubeIframeAPIReady;
  window.onYouTubeIframeAPIReady = () => {
    prevCb?.();
    initYtPlayer(youtubeVideoId);
  };

  // If API already loaded (e.g. page revisit), init immediately
  if (window.YT?.Player) {
    initYtPlayer(youtubeVideoId);
  } else if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    document.head.appendChild(script);
  }

  return () => { /* cleanup: destroy player, remove div */ };
}, [youtubeVideoId, initYtPlayer]);
```

### Step 2: Player initialisation (`initYtPlayer`)

```ts
const initYtPlayer = useCallback((videoId: string) => {
  if (ytPlayerRef.current || !window.YT?.Player) return;

  const div = document.createElement("div");
  div.id = "yt-bg-player";

  // ── CRITICAL: Player must be IN the viewport for autoplay to work ──
  // YouTube checks that the player element is visible in the viewport.
  // top:-400px (off-screen) prevents autoplay. top:0;left:0 keeps it
  // in the top-left corner of the screen but hidden via opacity:0 and z-index:-1.
  div.style.cssText =
    "position:fixed;top:0;left:0;" +
    "width:320px;height:180px;" +        // ← minimum 200×200 required by YouTube
    "opacity:0;pointer-events:none;z-index:-1;overflow:hidden;";

  document.body.appendChild(div);

  ytPlayerRef.current = new window.YT.Player(div, {
    videoId,
    playerVars: {
      autoplay: 1,         // ← start playing immediately on ready
      mute: 1,             // ← but start muted (iOS allows muted autoplay)
      loop: 1,
      playlist: videoId,   // ← required for loop to work with IFrame API
      controls: 0,         // no visible controls
      playsinline: 1,      // plays inline on iOS (not fullscreen)
      rel: 0,              // no related videos at end
      modestbranding: 1,
      origin: window.location.origin,  // ← must match registered YouTube domain
      enablejsapi: 1,
    },
    events: {
      onReady,        // fires when player is ready (see below)
      onStateChange,  // fires on play/pause/end/buffer state
      onError,        // fires on error codes
    },
  });
}, []);
```

**Key sizing rule:** YouTube's minimum player viewport is **200×200px**. A 1×1px player causes "Video player configuration error" (Error 153). We use 320×180px.

**Key visibility rule:** The player `div` must be **within the visible viewport** (not off-screen with `top:-400px`) for YouTube's autoplay to trigger. We hide it with `opacity:0; z-index:-1` instead of moving it off-screen.

### Step 3: onReady callback

```ts
onReady: (e: { target: YTPlayerInstance }) => {
  setYtStatus("ready");

  // If user tapped the envelope before the player was ready,
  // unmute + play now (still within browser's activation window).
  if (ytTapPendingRef.current) {
    e.target.unMute();
    e.target.setVolume(100);
    e.target.playVideo();
  }
  // Otherwise: player is muted and playing silently in background.
  // Waiting for user to tap envelope → ytPlay() will unmute it.
}
```

### Step 4: User taps envelope → `ytPlay()`

```ts
const ytPlay = useCallback(() => {
  if (!youtubeVideoId) return;

  if (ytPlayerRef.current) {
    // Player is ready and already playing silently.
    // Unmute synchronously INSIDE the gesture handler.
    ytPlayerRef.current.unMute();
    ytPlayerRef.current.setVolume(100);
    ytPlayerRef.current.playVideo(); // safety: ensures playing if autoplay was blocked
    setIsMuted(false);
  } else {
    // Player still loading — store intent.
    // onReady will unmute it as soon as it fires.
    ytTapPendingRef.current = true;
  }
}, [youtubeVideoId]);
```

`ytPlay()` is called from two envelope components:

- `EnvelopeDoors` — `onOpen` callback (fired on first panel interaction)
- `EnvelopeAnimation` — `onAnimationComplete` callback (fired when envelope animation ends)

Both fire **synchronously within the user gesture handler**.

---

## 8. iOS Safari Solution (Muted-Autoplay + Gesture-Unmute)

### Why iOS is different

iOS Safari enforces the strictest autoplay policy:

- **Regular `playVideo()`** called from a parent page into an iframe → **blocked** (cross-frame user-activation is not transferable on iOS)
- **Muted autoplay** (`autoplay:1 mute:1`) → **allowed** (same rule as `<video muted autoplay>`)
- **Unmuting already-playing muted media** inside a direct gesture handler → **allowed**

### Strategy

```
Page loads
    │
    ▼
YT.Player created with autoplay:1, mute:1
    │
    ▼
onReady fires → player plays silently (muted)
    │
    ▼ [guest taps envelope]
ytPlay() called SYNCHRONOUSLY in gesture handler
    │
    ▼
unMute() + setVolume(100) called
    │
    ▼
iOS allows this because:
  1. The media was already playing (muted)
  2. unMute() is called synchronously within the gesture
    │
    ▼
Music is now audible ✓
```

### What was tried before (and why it didn't work)

| Approach | Problem |
|---|---|
| `autoplay:0` then `playVideo()` in gesture | iOS blocks cross-frame `playVideo()` postMessage |
| Visible mini YouTube `<iframe>` player | Needed a separate tap on the mini-player ▶ button |
| Off-screen player (`top:-400px;left:-400px`) | YouTube's viewport check blocked `autoplay:1` |
| `youtube-nocookie.com` as `host` param | Interfered with origin/Referer matching → Error 153 |

### Timing edge case: user taps before player is ready

```
Page loads → script injected (takes ~1-2s)
    │
    ▼ [user taps envelope immediately]
ytPlay() called → ytPlayerRef.current is null
    │
    ▼
ytTapPendingRef.current = true   ← store intent
    │
    ▼ [1-2s later] onReady fires
ytTapPendingRef.current === true → unMute() + playVideo()
    │
    ▼
Music starts (browser activation window is ~5s, safe)
```

---

## 9. HTML5 Audio Flow (Non-YouTube URLs)

For direct audio URLs (MP3, OGG, etc.):

```ts
useEffect(() => {
  if (!musicUrl || isYouTubeMusic) return;

  const audio = new Audio(musicUrl);
  audio.loop    = true;
  audio.volume  = 0.35;
  audio.preload = "auto";
  audio.load();
  audioRef.current = audio;

  return () => { audio.pause(); audio.src = ""; };
}, [musicUrl, isYouTubeMusic]);
```

**Playing on envelope tap (`playAudioNow`):**

```ts
const playAudioNow = useCallback(() => {
  if (!audioRef.current || audioStartedRef.current) return;
  audioRef.current.play()
    .then(() => { audioStartedRef.current = true; })
    .catch(() => attachInteractionRetry()); // fallback: retry on next touch/click
}, [attachInteractionRetry]);
```

HTML5 `<audio>.play()` called synchronously from a gesture is universally allowed across all browsers including iOS. No special strategy needed.

**Fallback for no-envelope mode** (`openingAnimation="none"`):

```ts
useEffect(() => {
  if (!isOpened || !musicUrl || isYouTubeMusic) return;
  audioRef.current?.play()
    .catch(() => attachInteractionRetry());
}, [isOpened]);
```

---

## 10. Mute Toggle

A mute/unmute button appears in the top-left corner after the envelope opens (`isOpened && musicUrl`).

```tsx
{isOpened && musicUrl && (
  <motion.div className="fixed top-4 left-4 z-50">
    <button onClick={toggleMute}>
      {isMuted ? <VolumeX /> : <Volume2 />}
    </button>
  </motion.div>
)}
```

**Toggle logic:**

```ts
const toggleMute = useCallback(() => {
  if (isYouTubeMusic) {
    if (isMuted) {
      ytPlayerRef.current?.unMute();
      setIsMuted(false);
    } else {
      ytPlayerRef.current?.mute();
      setIsMuted(true);
    }
  } else {
    // HTML5 audio: toggle audio.muted via isMuted state
    setIsMuted(prev => !prev);
  }
}, [isMuted, isYouTubeMusic]);

// HTML5 audio muted state is synced separately:
useEffect(() => {
  if (audioRef.current) audioRef.current.muted = isMuted;
}, [isMuted]);
```

---

## 11. Player State Machine

**YouTube status (`ytStatus`):**

| Status | Meaning |
|---|---|
| `idle` | No video ID, player not created |
| `loading` | IFrame API script injected, waiting for `window.onYouTubeIframeAPIReady` |
| `ready` | `onReady` fired, player initialised, playing muted |
| `playing` | `onStateChange` data=1, music audible |
| `paused` | `onStateChange` data=2 |
| `blocked` | State -1 after `playVideo()` — browser's autoplay blocked (rare) |
| `error` | `onError` fired (see error codes below) |

**YouTube native state numbers** (`onStateChange.data`):

| Number | Meaning |
|---|---|
| -1 | Unstarted |
| 0 | Ended |
| 1 | Playing |
| 2 | Paused |
| 3 | Buffering |
| 5 | Video cued |

---

## 12. YouTube Error Codes

| Code | Meaning | Fix |
|---|---|---|
| 2 | Invalid parameter | Video ID is malformed |
| 5 | HTML5 player error | Browser cannot play this format |
| 100 | Video not found / private | Video deleted or set private |
| 101 | Embedding not allowed | Owner disabled embedding — pick another video |
| 150 | Embedding not allowed | Same as 101 |
| **153** | **Video player configuration error** | **Referrer-Policy is wrong** — must be `strict-origin-when-cross-origin`, not `no-referrer` |

### Error 153 root cause & fix

```
Guest opens invitation
    │
    ▼
Browser loads YT.Player iframe
    │
    ▼
YouTube server checks Referer header
    │
    ├── Referer: https://wedinstudio.com ✓ → player loads
    └── (no Referer header)             ✗ → Error 153
```

**Root cause:** Helmet default `Referrer-Policy: no-referrer` strips all Referer headers.

**Fix in `app.ts`:**
```ts
helmet({ referrerPolicy: { policy: "strict-origin-when-cross-origin" } })
```

**Verification:**
```bash
curl -sI https://wedinstudio.com/ | grep referrer
# referrer-policy: strict-origin-when-cross-origin ✓
```

---

## 13. File Map

```
artifacts/
├── api-server/
│   ├── src/
│   │   ├── app.ts                          Helmet config (Referrer-Policy + CSP)
│   │   └── routes/
│   │       └── music.ts                    GET /api/music/validate (oEmbed check)
│
└── wedding-invite/
    └── src/
        ├── lib/
        │   └── youtube.ts                  extractYouTubeId() URL parser
        ├── hooks/
        │   └── use-music-url-validation.ts Editor validation hook (calls /api/music/validate)
        ├── components/
        │   └── MusicUrlInput.tsx           Shared input with validation UI (used in 3 editors)
        └── pages/
            └── InvitationPage.tsx          Full music engine:
                                              - YT IFrame API loader
                                              - initYtPlayer()
                                              - ytPlay() (envelope tap handler)
                                              - playAudioNow() (HTML5 audio tap handler)
                                              - toggleMute()
                                              - Mute button UI
```

---

## 14. Common Problems & Fixes

| Symptom | Likely cause | Fix |
|---|---|---|
| Error 153 in browser console | `Referrer-Policy: no-referrer` | Set `strict-origin-when-cross-origin` in Helmet |
| No sound, no error, `window.YT` undefined | CSP blocks `scriptSrc: youtube.com` | Add `youtube.com` to `scriptSrc` in CSP |
| Player iframe blocked | CSP blocks `frameSrc: youtube.com` | Add `youtube.com` to `frameSrc` in CSP |
| Music silent on iOS only | Player was off-screen (`top:-400px`) | Move player to `top:0;left:0` (in viewport) |
| Music silent on iOS only | Using `playVideo()` directly from gesture | Switch to muted-autoplay + `unMute()` in gesture |
| "Video player configuration error" instantly | Player div is 1×1px (< 200×200 minimum) | Use `width:320px;height:180px` |
| Music plays but loops incorrectly | `playlist` param missing | Always set `playlist: videoId` alongside `loop: 1` |
| Error 101 or 150 | Owner disabled embedding on that video | Admin/buyer must choose a different video |
| oEmbed returns `unavailable` for a valid video | YouTube oEmbed was slow/down | Transient — editor doesn't block save, player will try anyway |
