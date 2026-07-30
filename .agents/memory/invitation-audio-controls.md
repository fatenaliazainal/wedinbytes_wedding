---
name: Invitation audio controls
description: Guest-facing audio control treatment on public invitations.
---

Public invitations expose only one fixed mute/unmute toggle after the invitation opens; the replay/restart control is intentionally not shown.

**Why:** Guests should have a simple, non-destructive audio control matching the compact reference UI without an option to restart the invitation animation.

**How to apply:** Keep the toggle driven by the invitation's existing `isMuted` state and use Volume2/VolumeX states for audio and YouTube playback.