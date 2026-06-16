# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Root (Turborepo)
bun install          # install all workspace dependencies
bun run dev          # start all dev servers via turbo
bun run build        # production build all apps via turbo
bun run typecheck    # type-check all workspaces via turbo

# Client app only
bun run dev:client                     # start client dev server via turbo filter
cd apps/client && bun run dev          # start Vite dev server directly (http://localhost:5173)
cd apps/client && bun run build        # production build to apps/client/dist/
cd apps/client && bun run preview      # serve the production build locally
cd apps/client && bun run typecheck    # type-check with project references (tsc -b)
cd apps/client && bun run doctor       # run react-doctor diagnostics
```

No test runner or linter is configured.

## Architecture

This is a **Turborepo monorepo** with bun workspaces.

### Monorepo structure

```
freetyping/
├── package.json                # Root workspace config (turbo)
├── turbo.json                  # Turborepo pipeline definitions
├── tsconfig.json               # Shared base TypeScript config
├── apps/
│   └── client/                 # MechBoard typing test app
└── packages/                   # Shared packages (future)
```

### Client app (`apps/client`)

**MechBoard** is a single-page typing test app built with React 18 + TypeScript + Vite 5.

```
apps/client/
├── package.json                # @freetyping/client
├── tsconfig.json               # Solution-style (references app + node)
├── tsconfig.app.json           # Extends ../../tsconfig.json, adds jsx
├── tsconfig.node.json          # Extends ../../tsconfig.json, ES2022
├── vite.config.ts              # Vite config (react plugin, ES2020 target)
├── index.html                  # Entry HTML with Google Fonts
└── src/
    ├── main.tsx                # React entry point, renders <MechBoard />
    ├── index.css               # Minimal global reset styles
    ├── MechBoard.tsx           # Main component (orchestrator)
    ├── MechBoard.css           # All component styles (Vite CSS pipeline)
    ├── vite-env.d.ts           # Vite client type reference
    ├── assets/
    │   └── sounds/cherry-blue/ # Sound sprite (Vite asset import, content-hashed)
    ├── components/
    │   ├── Keyboard.tsx        # On-screen keyboard visualization
    │   ├── Passage.tsx         # Typing passage with cursor tracking
    │   ├── ResultsOverlay.tsx  # End-of-test results card
    │   └── Stat.tsx            # Single stat display (wpm/acc/time)
    ├── data/
    │   ├── words.ts            # Word pool + makePassage()
    │   ├── keyboard-layout.ts  # LAYOUT (KeyDef[][]) for keyboard rendering
    │   └── sound-map.ts        # SOUND_DEFINES + CODE_TO_SCANCODE mappings
    ├── hooks/
    │   └── useKeySound.ts      # Sound preloading + playback via Web Audio API
    └── state/
        └── typing-reducer.ts   # useReducer state: TypingState + TypingAction
```

### Key internals

- **Typing state**: Managed via `useReducer` in `state/typing-reducer.ts`. Actions: `TYPE_CHAR`, `BACKSPACE`, `TICK`, `RESET`, `SET_DURATION`. Stats (wpm, accuracy, time) are derived during render.
- **Sound**: Cherry MX Blue sound sprite preloaded at module level via Vite asset import (`hooks/useKeySound.ts`). Decoded on first user interaction via Web Audio API.
- **Keyboard layout**: `LAYOUT` is a typed 2D array (`KeyDef[][]`) mapping `[label, event.code, width?]` per key row. Mac/PC detection for bottom row.
- **CSS**: Proper `.css` file processed by Vite (minified, content-hashed). Class prefix `mb-` avoids collisions. CSS custom properties for theming (`--accent`). Responsive breakpoints at 720px and 430px. Respects `prefers-reduced-motion`.
- **Fonts**: Google Fonts (JetBrains Mono, Space Grotesk) loaded via `<link>` in `index.html` with `preconnect` for early fetch.

### Config

- Root `tsconfig.json` is a shared base config; app tsconfigs extend it
- `apps/client/tsconfig.json` uses project references: `tsconfig.app.json` (src) + `tsconfig.node.json` (vite.config.ts)
- `apps/client/vite.config.ts` targets ES2020 for modern output
- `turbo.json` defines pipelines for `dev`, `build`, `typecheck`, `preview`
- `.github/workflows/react-doctor.yml` runs React Doctor on PRs (advisory mode)
