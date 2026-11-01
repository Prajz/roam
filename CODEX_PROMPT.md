# Working on Roam

Read README.md, src/main.js, src/views.js, src/editor.js, src/planner.js, src/plan.js, src/style.css and examples/china-2026.json before changing the project.

Roam is a small personal Vite + plain JavaScript trip planner for two friends, hosted as static files on the owner's private site. Keep it simple. No backend, login, database, payments, tracking or API keys are needed.

Preserve the version 1 JSON schema and the `roam-personal-trip-v1` localStorage key. JSON snapshots are the transfer format, with explicit replacement confirmation; do not imply live sync. Keep the default trip blank and the sample optional. Avoid hiding or losing saved days when dates change.

Preserve mobile and desktop usability, touch/mouse drag with an editor alternative, labeled fields, keyboard focus management, and safe rendering of imported strings. Keep the established coral/off-white/slate styling.

Run `bun run test`, `bun run build` and `bun run test:e2e` after relevant changes. The browser suite checks the actual static build at desktop and mobile sizes. Upload the contents of dist/ for deployment; do not deploy unless requested.
