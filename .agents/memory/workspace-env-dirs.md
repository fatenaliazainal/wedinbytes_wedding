---
name: Workspace env dirs are load-bearing
description: Deleting workspace-root .cache/.upm breaks the shell toolchain PATH (node/pnpm vanish).
---

Never delete `.cache` or `.upm` at the workspace root when cleaning up temporary files.

**Why:** Removing them mid-session made `node`, `pnpm`, and `corepack` disappear from the shell PATH; builds failed with "command not found" even though workflows kept running. Recovery required invoking the Nix store binaries by full path.

**How to apply:** When cleaning up after temporary tooling (e.g. one-off Python PDF checks), remove only what you created (`.agents/scripts`, `.agents/outputs`, generated project files). If the toolchain PATH ever breaks, workflows still work — use the full `/nix/store/...-nodejs*/bin` and `...-pnpm*/bin` paths for one-off shell builds instead of reinstalling anything.
