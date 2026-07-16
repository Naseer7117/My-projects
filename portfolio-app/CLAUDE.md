# portfolio-app

**Continuing prior work? Read [HANDOFF.md](./HANDOFF.md) FIRST** — it is the
session-continuity briefing: current state, the Maska Bhai mascot architecture
and its do-not-break invariants, the clip conversion pipeline, the verification
playbook, and the live work queue. Update it at the end of every working session.

Quick facts (details and rationale in HANDOFF.md):

- CRA + React 19 + TS + framer-motion. Dev `npm start` (port 3000);
  gates before "done": `npx tsc --noEmit`, `npx eslint src --ext .ts,.tsx
  --max-warnings=0`, `npm test -- --watchAll=false`, `npm run build`.
- `<LazyMotion strict>`: use `m.*` components, never `motion.*`.
- Site copy/content lives ONLY in `src/content/portfolio.ts`.
- Mascot ("Maska Bhai") sizes/zones: `src/lib/companionConfig.ts` +
  `companionZones.ts` — never hardcode sizes elsewhere; CSS has three
  hand-synced spots (see HANDOFF §3 invariant 6–7).
- Never attach CDP to port 9222 (owner's browser); use an isolated Chrome on
  9333 — templates in `scripts/verify/`.
- Don't push without the owner's go-ahead (push = live deploy). Never feature
  the sibling telegrambot project in site content.
