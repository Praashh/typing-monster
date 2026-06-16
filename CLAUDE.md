# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Root (Turborepo)
bun install          # install all workspace dependencies
bun run dev          # start all dev servers (client + server) via turbo
bun run build        # production build all apps via turbo
bun run typecheck    # type-check all workspaces via turbo

# Client app only
bun run dev:client                     # start client dev server via turbo filter
cd apps/client && bun run dev          # Vite dev server (http://localhost:5173)
cd apps/client && bun run build        # production build to apps/client/dist/
cd apps/client && bun run preview      # serve the production build locally
cd apps/client && bun run typecheck    # type-check with project references (tsc -b)
cd apps/client && bun run doctor       # run react-doctor diagnostics

# Server app only
cd apps/server && bun run dev          # watch mode (bun --watch src/index.ts, http://localhost:3000)
cd apps/server && bun run format       # prettier format
```

No test runner or linter is configured.

## Architecture

**Turborepo monorepo** with Bun workspaces.

```
freetyping/
├── package.json                # Root workspace config (turbo, bun 1.2.15)
├── turbo.json                  # Pipeline: dev, build, typecheck, preview
├── tsconfig.json               # Extends @freetyping/typescript-config/base.json
├── apps/
│   ├── client/                 # MechBoard typing test SPA (React 18 + Vite 5 + Tailwind 4)
│   └── server/                 # Multiplayer WebSocket backend (Bun + Elysia)
└── packages/
    ├── ui/                     # @freetyping/ui — shared React components
    └── typescript-config/      # @freetyping/typescript-config — shared TS configs
```

Workspace dependencies use `workspace:*` protocol. Shared TS configs export `base.json`, `vite.json`, `node.json`, and `react-library.json`.

### Client app (`apps/client`)

**MechBoard** — single-page typing test with mechanical keyboard sounds, real-time stats, and performance charts.

- **Entry**: `src/main.tsx` → `<MechBoard />` orchestrator component
- **State**: `useReducer` in `state/typing-reducer.ts`. Actions: `TYPE_CHAR`, `BACKSPACE`, `TICK`, `RESET`, `SET_DURATION`. Stats (WPM, accuracy, time) derived during render. Snapshots captured every second for charting.
- **Sound**: Cherry MX Blue sprite preloaded at module level (`hooks/useKeySound.ts`). Web Audio API with per-key mappings via `data/sound-map.ts` (50+ keyboard codes). Decoded on first user interaction.
- **Keyboard layout**: `data/keyboard-layout.ts` — `KeyDef[][]` mapping `[label, event.code, width?]`. Auto-detects Mac vs PC for modifier keys.
- **Components**: `Passage.tsx` (text display + animated caret), `Results.tsx` (end-of-test overlay with chart), `Keyboard.tsx` (on-screen keyboard visualization)
- **Styling**: Tailwind CSS 4 (via `@tailwindcss/vite` plugin). CSS custom properties for theming (`--accent`, `--color-bg`, etc.). Responsive at 720px and 430px. Respects `prefers-reduced-motion`.
- **Fonts**: JetBrains Mono + Space Grotesk via Google Fonts `<link preconnect>` in `index.html`

### Server app (`apps/server`)

**Bun + Elysia** WebSocket backend for multiplayer typing rooms.

- **Entry**: `src/index.ts` — Elysia server on port 3000 with `/health` endpoint
- **WebSocket**: `src/routes/ws.ts` — `POST /ws/:roomId` for WebSocket upgrade. Max 2 clients per room, 30s idle timeout. Broadcasts `{ user, message, timeStamp }` via room channels.
- **Helpers**: `src/helper.ts` — room ID generation and occupancy tracking

### Shared UI package (`packages/ui`)

`@freetyping/ui` — React components consumed by the client:
- **Button** (primary/outline/ghost variants, active state)
- **Stat** (label + value display, accent color, md/lg sizes)
- **ProgressBar** (percentage-based, accent glow)
- **LineChart** (SVG chart with multiple lines, dashed lines, error dots, hover tooltips)
- **Card**, **Overlay**

Exported via `src/index.ts`. Uses `peerDependencies` for React 18.

### Key patterns

- **No global state library** — each component tree uses `useReducer` locally
- **Memoization** — `memo`, `useMemo`, `useCallback` used for render performance (especially `CharSpan` in Passage)
- **Derived stats** — WPM, raw WPM, accuracy, consistency (coefficient of variation) calculated at render time, not stored in state
- **TypeScript solution-style configs** — client uses project references (`tsconfig.app.json` + `tsconfig.node.json`), all extending shared configs from `@freetyping/typescript-config`
- **CI**: `.github/workflows/react-doctor.yml` runs React Doctor on PRs (advisory, non-blocking)
