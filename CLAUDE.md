# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun install          # install dependencies (bun.lock present; npm also works)
bun run dev          # start Vite dev server (usually http://localhost:5173)
bun run build        # production build to dist/
bun run preview      # serve the production build locally
bun run typecheck    # type-check with project references (tsc -b)
bun run doctor       # run react-doctor diagnostics
```

No test runner or linter is configured.

## Architecture

**MechBoard** is a single-page typing test app built with React 18 + TypeScript + Vite 5.

### File structure

```
src/
├── main.tsx                    # React entry point, renders <MechBoard />
├── index.css                   # Minimal global reset styles
├── MechBoard.tsx               # Main component (orchestrator)
├── MechBoard.css               # All component styles (Vite CSS pipeline)
├── vite-env.d.ts               # Vite client type reference
├── assets/
│   └── sounds/cherry-blue/     # Sound sprite (Vite asset import, content-hashed)
├── components/
│   ├── Keyboard.tsx             # On-screen keyboard visualization
│   ├── Passage.tsx              # Typing passage with cursor tracking
│   ├── ResultsOverlay.tsx       # End-of-test results card
│   └── Stat.tsx                 # Single stat display (wpm/acc/time)
├── data/
│   ├── words.ts                 # Word pool + makePassage()
│   ├── keyboard-layout.ts      # LAYOUT (KeyDef[][]) for keyboard rendering
│   └── sound-map.ts            # SOUND_DEFINES + CODE_TO_SCANCODE mappings
├── hooks/
│   └── useKeySound.ts          # Sound preloading + playback via Web Audio API
└── state/
    └── typing-reducer.ts       # useReducer state: TypingState + TypingAction
```

### Key internals

- **Typing state**: Managed via `useReducer` in `state/typing-reducer.ts`. Actions: `TYPE_CHAR`, `BACKSPACE`, `TICK`, `RESET`, `SET_DURATION`. Stats (wpm, accuracy, time) are derived during render.
- **Sound**: Cherry MX Blue sound sprite preloaded at module level via Vite asset import (`hooks/useKeySound.ts`). Decoded on first user interaction via Web Audio API.
- **Keyboard layout**: `LAYOUT` is a typed 2D array (`KeyDef[][]`) mapping `[label, event.code, width?]` per key row. Mac/PC detection for bottom row.
- **CSS**: Proper `.css` file processed by Vite (minified, content-hashed). Class prefix `mb-` avoids collisions. CSS custom properties for theming (`--accent`). Responsive breakpoints at 720px and 430px. Respects `prefers-reduced-motion`.
- **Fonts**: Google Fonts (JetBrains Mono, Space Grotesk) loaded via `<link>` in `index.html` with `preconnect` for early fetch.

### Config

- `tsconfig.json` uses project references: `tsconfig.app.json` (src) + `tsconfig.node.json` (vite.config.ts)
- `vite.config.ts` targets ES2020 for modern output
- `.github/workflows/react-doctor.yml` runs React Doctor on PRs (advisory mode)
