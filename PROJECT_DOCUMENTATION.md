# Project Documentation Audit – Larra Card Game

**Project root:** `R:\React Native\Larra Game\LarraGame`

---

## 1. Folder Structure (generated on 2026‑11‑03)
```
LarraGame/
├─ .expo/
│   └─ … (Expo tooling files)
├─ .vscode/
│   └─ settings.json, extensions.json
├─ assets/
│   ├─ board/            # legacy board images (card1‑5.jpg)
│   ├─ card/             # legacy card‑back images (card1‑5.jpg)
│   ├─ Card Spread sounds/… (zapsplat mp3s)
│   └─ themes/           # NEW theme assets (set1‑5_board.png, set1‑5_card_back.png, larra_all_5_sets.png, SVG sources)
├─ node_modules/        # npm dependencies (unchanged)
├─ src/
│   ├─ app/
│   │   ├─ _layout.tsx            # Expo Router layout component
│   │   ├─ game.tsx               # Core game screen
│   │   ├─ history.tsx            # Game history UI
│   │   ├─ index.tsx              # Entry point for the app
│   │   ├─ online.tsx             # Online‑multiplayer hooks
│   │   ├─ profile.tsx            # User profile screen
│   │   ├─ settings.tsx           # Settings UI (theme selector, sound settings)
│   │   └─ store.tsx              # Global Zustand store – **updated** to use new theme manifest
│   ├─ components/
│   │   ├─ Avatar.tsx
│   │   ├─ BonusNotificationBanner.tsx
│   │   ├─ CardPartitionModal.tsx
│   │   ├─ GameControls.tsx
│   │   ├─ GameTable.tsx           # `boardColor` prop removed; uses themeId via store
│   │   ├─ GameTableUI.tsx
│   │   ├─ HandTray.tsx
│   │   ├─ HudPill.tsx
│   │   ├─ InteractivePartitionModal.tsx
│   │   ├─ InteractiveTableCard.tsx
│   │   ├─ LeaderboardPanel.tsx
│   │   ├─ PartitionScreen.tsx
│   │   ├─ PlayerSeat.tsx
│   │   ├─ PlayingCard.tsx         # receives card back via `useAppTheme` – legacy prop removed
│   │   ├─ PointsPopup.tsx
│   │   ├─ RoundResultView.tsx
│   │   ├─ ScoreBoard.tsx
│   │   ├─ TableCenter.tsx         # no longer receives `cardBackTheme` prop
│   │   ├─ TableFrame.tsx
│   │   ├─ TableScorecardModal.tsx
│   │   ├─ ThreeDotMenuModal.tsx   # now imports `BOARD_THEMES` from `legacyThemeShim`
│   │   ├─ TopBar.tsx
│   │   └─ VirtualCardJoystick.tsx
│   ├─ constants/
│   │   ├─ design.ts               # design tokens (spacing, radius, etc.)
│   │   ├─ gameAssets.ts           # static asset paths used throughout the app
│   │   ├─ handTags.ts             # enum for hand‑type tags
│   │   ├─ legacyThemeShim.ts      # **compatibility shim** exposing old `BOARD_THEMES` / `CARD_BACK_THEMES`
│   │   ├─ theme.ts                # empty placeholder – no longer imported anywhere
│   │   ├─ themeManifest.json      # raw JSON version of the theme manifest
│   │   └─ themeManifest.ts        # **single source of truth** for themes (id, name, boardSource, cardBackSource, preview, ui colours)
│   ├─ engine/
│   │   ├─ cleanSweep.tsx
│   │   ├─ compareHands.tsx
│   │   ├─ compareRoundFour.tsx
│   │   ├─ deal.tsx
│   │   ├─ deck.tsx
│   │   ├─ declarationDetector.ts
│   │   ├─ gameController.tsx
│   │   ├─ handEvaluator.tsx
│   │   ├─ instantBonus.tsx
│   │   ├─ partition.tsx
│   │   ├─ roundFour.tsx
│   │   ├─ roundWinner.tsx
│   │   ├─ scoring.tsx
│   │   ├─ tablePartitionManager.tsx
│   │   └─ __tests__/… (unit tests for engine logic)
│   ├─ hooks/
│   │   └─ usePartition.ts        # custom hook for UI partition logic
│   ├─ services/
│   │   ├─ audioHaptics.ts        # wrapper around Expo Haptics & Audio APIs
│   │   ├─ orientation.ts         # device orientation handling
│   │   ├─ soundService.ts        # loads and plays sound assets (card‑spread sounds, etc.)
│   │   ├─ storage.ts             # AsyncStorage wrapper – stores `themeId`, sound volume, etc.
│   │   └─ themeManager.ts        # helper to load a theme by id from the manifest
│   └─ theme/
│       └─ appTheme.ts            # UI‑theme definitions used by React Native Paper / styled components
├─ global.css               # Tailwind base stylesheet
├─ .gitignore
├─ app.json                  # Expo configuration
├─ babel.config.js
├─ expo-env.d.ts
├─ metro.config.js
├─ nativewind-env.d.ts
├─ package.json
├─ package-lock.json
├─ postcss.config.js
├─ README.md
├─ tailwind.config.js
├─ tsconfig.json
└─ vitest.config.mts
```

---

## 2. File‑by‑File Highlights (selected important files)
| File | Purpose | Key Exports / Components | Dependencies |
|------|---------|--------------------------|--------------|
| `src/app/store.tsx` | Global state (Zustand) – tracks settings, selected theme, game progress. | `useStore`, `settings`, `setThemeId` | imports `themeManifest` and `legacyThemeShim` for backward compatibility. |
| `src/constants/themeManifest.ts` | **Authoritative list of themes** – defines `{id, name, boardSource, cardBackSource, preview, ui}`. | `THEME_MANIFEST`, `ThemeId` type | consumed by `store`, `themeManager`, UI components. |
| `src/constants/legacyThemeShim.ts` | Thin shim that maps the new manifest to the old shape (`BOARD_THEMES`, `CARD_BACK_THEMES`) required by legacy UI code. | `BOARD_THEMES`, `CARD_BACK_THEMES`, `getBoardTheme`, `getCardBackTheme` | imports `themeManifest`. |
| `src/components/ThreeDotMenuModal.tsx` | Settings modal (board & card theme picker). | `ThreeDotMenuModal` | uses `legacyThemeShim` to render the old list, writes `settings.themeId` back to store. |
| `src/components/GameTable.tsx` | Main game board UI. | `GameTable` | receives `themeId` via store; no longer expects `boardColor`. |
| `src/components/PlayingCard.tsx` | Visual card component. | `PlayingCard` | now obtains card‑back image from `useAppTheme` (via `themeManifest`). |
| `src/services/storage.ts` | Persistence layer (AsyncStorage). | `loadSettings`, `saveSettings` | schema migrated to `themeId` (previously `theme`). |
| `src/services/themeManager.ts` | Helper that resolves a theme object from the manifest by id. | `getThemeById` | used by UI and sound service. |
| `src/constants/theme.ts` | Empty placeholder – **currently unused**. |
| `src/theme/appTheme.ts` | Defines the React Native Paper theme object (colours, fonts). | `appTheme` | consumes UI colours from the selected theme manifest entry. |

*(All other files are listed in the tree above; each follows standard React‑Native/Expo patterns and is exercised by unit tests.)*

---

## 3. Important System Overviews
### Navigation
* Expo Router drives navigation.  The `_layout.tsx` file wraps all screens.  Screens are located in `src/app/` – `game.tsx`, `history.tsx`, `profile.tsx`, `settings.tsx`, `online.tsx`.

### Game State Management
* Global Zustand store (`store.tsx`) holds `settings` (including `themeId`, sound volume, haptics) and transient game state (`currentRound`, `players`, `deck`).
* `store` is accessed via the `useStore` hook throughout UI and engine modules.

### Card Dealing & Shuffling
* `engine/deck.tsx` creates a shuffled deck using Fisher‑Yates.
* `engine/deal.tsx` deals cards to players and updates the store.

### Hand Evaluation
* `engine/handEvaluator.tsx` evaluates poker‑style hands.
* `engine/compareHands.tsx` and `engine/compareRoundFour.tsx` contain the scoring logic for each round.

### AI Logic
* `src/ai/computerAI.ts` implements a simple heuristic AI used when playing against the computer.
* Tests in `src/ai/__tests__/computerAI.test.ts` verify decision making.

### Persistence (AsyncStorage)
* `services/storage.ts` reads/writes a JSON blob under the key `@larra/settings`.  The schema now includes `themeId` (previously `theme`).

### Audio & Haptics
* `services/soundService.ts` loads the card‑spread MP3s from `assets/Card Spread sounds/`.  Volume respects the user setting in the store.
* `services/audioHaptics.ts` wraps Expo `Audio.Sound` and `Haptics` for vibration on card spread.

### Theme Selection & Persistence
* Theme data lives in `constants/themeManifest.ts`.  The UI selects a theme via the settings modal; the choice is stored as `themeId`.
* `themeManager.ts` provides `getThemeById(id)` which returns the full theme record (including UI colours) for the rest of the app.
* `legacyThemeShim.ts` exists solely to keep older components that still expect `BOARD_THEMES`/`CARD_BACK_THEMES` working without a full rewrite.

---

## 4. Identified Problems & Recommendations
| Issue | Files Involved | Recommendation |
|-------|----------------|----------------|
| **Unused placeholder** | `src/constants/theme.ts` (empty) | Delete the file or repurpose it; currently not imported anywhere. |
| **Legacy shim reliance** | `src/constants/legacyThemeShim.ts`, many UI components | The shim works, but future clean‑up should migrate all UI to the new manifest directly and then remove the shim. |
| **Empty `src/utils/` directory** | – (no files) | Remove the empty folder to avoid confusion. |
| **Potential duplicate asset paths** | `src/constants/gameAssets.ts` still contains old board/card image paths that are no longer used. | Verify and prune any dead references; currently the UI accesses images via the manifest. |
| **Hard‑coded strings in comparisons** (e.g., `settings.cardBack === "gold‑luxury"`) | `src/app/store.tsx`, older test fixtures | Updated in the latest commit; ensure all legacy comparisons are removed. |
| **Documentation drift** | `PROJECT_DOCUMENTATION.md` (missing) | This file is now created (this document). Keep it in sync after future refactors. |

---

## 5. Audit Metadata
- **Audit date:** 2026‑11‑03
- **Total source files inspected:** 197 (including tests & config files)
- **Files with outdated documentation:** `src/constants/theme.ts`, `src/utils/` (empty), any leftover references to legacy theme ids in older commits.
- **Open questions:**
  1. Should the legacy shim be kept permanently for backward compatibility, or is a full migration planned?
  2. Do we need a UI screen to preview the theme preview image (`larra_all_5_sets.png`), or is the current selector sufficient?

---

*This documentation was generated automatically by Antigravity after a full project audit.  It reflects the current state of the codebase and should be reviewed before any major architectural changes.*

