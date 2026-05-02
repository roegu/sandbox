# Minesweeper Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Build a fully playable Minesweeper game as a Vite + TypeScript web app with keyboard navigation, scoring, and tests — delivered incrementally via PRs per milestone.

**Architecture:** Pure TypeScript game engine (no framework), DOM-based rendering in `main.ts`, CSS grid for the board. Engine is decoupled from UI — all game logic lives in `GameEngine.ts` with pure state transitions. UI reads state and renders. Keyboard + mouse input both supported via the `playerPos` / `Direction` types already defined.

**Tech Stack:** TypeScript, Vite 8, Vitest 4, vanilla DOM API

---

## Milestone 1: Game Engine Core (PR: `feat/minesweeper-engine`)
Core game logic — grid creation, mine placement, reveal, flood-fill, flags, win/loss detection. No UI.

### Task 1: Implement GameEngine class skeleton + grid initialization
- Create `src/engine/GameEngine.ts` with a `GameEngine` class
- Constructor takes `GameConfig`, initializes empty grid (all cells hidden, no mines)
- Method `initGrid()`: creates the 2D `Cell[][]` array
- Method `getState(): GameState` — returns current game state snapshot

### Task 2: Mine placement + adjacent mine counting
- Method `placeMines(safeRow, safeCol)`: randomly place mines, avoiding first-click cell and its neighbors
- Method `calculateAdjacent()`: count adjacent mines for each non-mine cell
- First click safety: the clicked cell and its 8 neighbors are always mine-free

### Task 3: Cell reveal + flood-fill
- Method `reveal(row, col)`: reveal a cell — if mine → game over; if zero adjacent → flood-fill reveal all connected zeros; otherwise reveal single cell
- Flood-fill uses BFS/DFS to expand through all connected zero cells and their borders
- Updates `cellsRevealed` counter

### Task 4: Flag toggling + flag counting
- Method `toggleFlag(row, col)`: toggle hidden cell between flagged/hidden; can't flag revealed cells
- Track `flagsPlaced` in game state

### Task 5: Win/loss detection + game status transitions
- After each reveal: check if all safe cells are revealed → set `GameStatus.Won`
- If mine is revealed → set `GameStatus.Lost`, record `endTime`
- Method `newGame(config?)`: reset to fresh game, optionally with new config

### Task 6: Timer tracking + elapsed time
- On first reveal (status Idle→Playing): record `startTime = Date.now()`
- On win/loss: record `endTime = Date.now()`
- Getter `elapsedSeconds` computes `(endTime || now - startTime) / 1000`

### Task 7: Keyboard cursor movement
- Method `moveCursor(direction: Direction)`: update `playerPos` based on direction deltas, clamped to grid bounds

### Task 8: Write engine unit tests
- Create `src/engine/GameEngine.test.ts`
- Test: grid initialization with correct dimensions
- Test: mine placement respects safe zone and count
- Test: reveal flood-fill expands correctly
- Test: flag toggling and flag counting
- Test: win detection when all safe cells revealed
- Test: loss detection on mine click
- Test: cursor movement clamping

---

## Milestone 2: Game UI (PR: `feat/minesweeper-ui`)
Replace Vite boilerplate with playable Minesweeper board.

### Task 9: Replace main.ts + style.css with game shell
- Remove all Vite boilerplate from `main.ts` (hero, counter, docs links)
- Create game container structure: header (title + difficulty selector), board area, status bar (mine count, timer, face button)
- New `style.css`: CSS grid for the board, cell styling (hidden/revealed/flagged/mine states), color scheme

### Task 10: Render the game board from engine state
- Create `src/renderer.ts` — reads `GameState` and renders DOM elements
- Each cell is a div with data attributes for row/col, styled by state
- Revealed cells show adjacent mine count (1-8 colors); mines show 💣; flags show 🚩

### Task 11: Wire mouse input to engine
- Left click on hidden cell → `engine.reveal(row, col)`
- Right click on hidden cell → `engine.toggleFlag(row, col)`
- After each action: re-render board + check game status

### Task 12: Wire keyboard input to engine
- Arrow keys / WASD → `engine.moveCursor(direction)` — move cursor highlight
- Space/Enter → reveal cell at cursor
- F key → toggle flag at cursor
- Cursor highlighted with distinct CSS class on the player position cell

### Task 13: Status bar (mine counter, timer, new game button)
- Mine counter: total mines − flags placed
- Timer: shows `elapsedSeconds`, updates every second during play
- New game / face button: resets to idle state

---

## Milestone 3: Polish & High Scores (PR: `feat/minesweeper-polish`)
Scoring, difficulty presets, localStorage persistence, UX polish.

### Task 14: Difficulty preset selector
- Dropdown/buttons for easy/medium/hard using `PRESET_CONFIGS`
- Changing difficulty calls `engine.newGame(config)` and re-renders

### Task 15: High score tracking with localStorage
- On win: save `{ time, date, config }` to `localStorage` key `'minesweeper-high-scores'`
- Per-difficulty leaderboard (top 10)
- Display high scores in a modal/panel

### Task 16: UX polish — animations, colors, responsive layout
- Cell reveal animation (brief transition)
- Mine explosion effect on loss (staggered reveal)
- Responsive: board scales for mobile screens
- Number colors matching classic Minesweeper (1=blue, 2=green, etc.)

---

## PR Strategy

Each milestone = one feature branch + one PR merged into `main`:
1. `feat/minesweeper-engine` → PR #2 → merge to main
2. `feat/minesweeper-ui` → PR #3 → merge to main  
3. `feat/minesweeper-polish` → PR #4 → merge to main

Each branch branches off the previous milestone's merged result (sequential, not parallel — each depends on the prior).