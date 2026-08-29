# dsh-session-rename

DSH host plugin registering the rename_session tool.

**What it does**: the agent finalizes the title of its *own* session - intended
for session wrap-up, right after the memory note is written. Format:
`[tag] [tag] one-line summary` (known tags: dsh / zmk / 計劃 / nixos / ha /
memory / bifrost / git; new tags allowed). 80 UTF-8 bytes max, pinned until
renamed again.

**How**: `ctx.sessionTitle.rename()` -> user-source `session/title` event in the
session log (supersedes in-flight auto title work; later prompts schedule
none).

**Mount**: dev-mount into `repos/dsh-flake` (devMounts + config/patch.yml
insert). The flake patch also disables the built-in first-prompt LLM title
provider (session-title-llm) - titles are only set by the agent at wrap-up.

**Build**: plain ESM JS in lib/index.js (no build step). If this ever gets
published, promote to TS + tsdown like dsh-web-ding.
