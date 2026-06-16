# AGENTS.md

Compact guidance for OpenCode sessions working in **Moodly** (pnpm monorepo).

## Commands

- **Install (root):** `pnpm install` (pnpm workspace links packages/*).
- **Expo dev server:** `npx expo start` (add `--ios` / `--android` / `--web`).
- **WeChat Mini Program dev:** `cd packages/weapp && npm run dev:weapp` (taro watch → dist/).
- **WeChat Mini Program build:** `cd packages/weapp && npm run build:weapp`.
- **Open in WeChat DevTools:** import `packages/weapp/dist/`.
- **Tests:** `npm test` (root vitest, single run, excludes packages/*).
- **Weapp tests:** `cd packages/weapp && npm test`.
- **Typecheck root:** `npm run typecheck` (`tsc --noEmit`).
- **Typecheck weapp:** `cd packages/weapp && npm run typecheck`.
- **No lint / formatter / CI is configured.** Do not invent `npm run lint`; only `test` + `typecheck` are authoritative.

## Monorepo Layout

```
along/
├── packages/
│   ├── shared/       @moodly/shared — pure logic (no React deps)
│   │   ├── types, constants, utils, db adapters, vanilla store
│   └── weapp/        moodly-weapp — Taro 3.6.7 WeChat Mini Program
│       ├── src/       app.tsx, pages, components, hooks, db/database
│       ├── config/    Taro webpack config
│       └── dist/      build output (open in DevTools)
├── app/              Expo Router pages
├── src/              Expo app code (components, hooks, db)
└── __tests__/        root vitest tests (pure logic)
```

## Architecture

### Expo App (root)
```
app/_layout.tsx           # calls getDb() once on mount
app/(tabs)/index.tsx      # composes MoodCalendar + MoodButtonRow
src/components/           # RN-specific components
src/hooks/                # useCalendarData, useLongPress
src/db/                   # database.ts (Expo SQLite), sqliteAdapter.ts
```

### WeChat Mini Program (`packages/weapp/`)
```
src/app.tsx               # Taro app entry (init wxStorage db)
src/pages/index/          # single screen
src/components/           # Taro-specific components (Canvas 2D, etc.)
src/hooks/                # useCalendarData (local copy for Taro)
src/db/database.ts        # wxStorage-backed DbAdapter
```

### Shared (`packages/shared/`)
```
src/types.ts              # EmotionKey, MoodEntry, CalendarCell, CalendarMode
src/constants/emotions.ts # 8-key palette
src/utils/                # date, color, aggregate, resolveCellColor (pure functions)
src/db/                   # DbAdapter interface, repository, wxStorageAdapter, inMemoryAdapter
src/store/moodStore.ts    # vanilla zustand createStore (not a React hook)
```

- **Expo app** uses `@/*` → `./src/*`, **weapp** uses `@/*` → `./src/*` (local) + `@moodly/shared` for shared code.
- **DB** is platform-specific: Expo uses `expo-sqlite` (native) or `createInMemoryAdapter()` (web); WeChat uses `wx.getStorageSync` via `createWxStorageAdapter()`.
- **Zustand store** is vanilla in `@moodly/shared`; each app wraps it with `useStore(store, selector)` for React hooks.
- **Pure functions** (`tickProgress`, `hexToRgb`, etc.) live in `@moodly/shared`.

## Domain rules that are easy to break

- **8 emotions are fixed** (`happy`, `calm`, `grateful`, `excited`, `anxious`, `sad`, `angry`, `tired`). New ones require updating `EmotionKey` in `src/types.ts`, `EMOTIONS` in `src/constants/emotions.ts`, and the empty-per-emotion object in `src/utils/aggregate.ts`.
- **Tiebreak on calendar cells:** when two emotions have equal counts in a day, the one with the lower `order` in `EMOTIONS` wins.
- **Cell `count` is capped at 4** for display (alpha levels: 0, 0.18, 0.45, 0.78, 1.0 → defined in `src/utils/color.ts` `ALPHAS`).
- **Long press duration is 800ms** — the constant lives in `MoodButton.tsx`, not in a shared config. `useLongPress` ticks at 16ms; the pure `tickProgress(elapsed, duration)` helper is exported for tests.
- **Date keys are local-time `YYYY-MM-DD`** (`src/utils/date.ts`). Do not switch to UTC — it shifts entries across days for non-UTC users.
- **Haptics do not fire in iOS Simulator / Android Emulator** — verify on a real device. The call is wrapped in `.catch(() => {})` so it never throws.

## Testing conventions

- vitest config: `environment: 'node'`, `globals: true`. The `jsdom` devDep is for potential future component tests — current tests are pure-logic only and run in node.
- Two test layouts coexist:
  - `__tests__/*.test.ts` for cross-cutting utils (`aggregate`, `color`, `date`, `emotions`, `resolveCellColor`, `useLongPress`, `smoke`).
  - `src/**/__tests__/*.test.ts` colocated with the unit under test (`src/db/__tests__/`, `src/store/__tests__/`).
- **In-memory DB fixture:** `src/db/__tests__/inMemoryDb.ts` implements the `DbAdapter` interface for the exact two SQL strings the repository uses (`INSERT INTO mood_entries …`, `DELETE FROM mood_entries …`, `SELECT … BETWEEN ? AND ?`). Extend it if you add a new query.
- Style: `describe('thing')` blocks, `it('does X')` sentences, prefer testing pure functions over rendering. Hooks expose pure helpers (`tickProgress`) for this reason.
- README claims 54 tests — count is not load-bearing, but if you add tests, keep the "single behavior per `it`" style.

## Workflow

- Before committing: `npm test` then `npm run typecheck`. Both must pass.
- No pre-commit hook — you must run them yourself.
- Do not edit generated files (`expo-env.d.ts`, `.expo/`, `web-build/`, `android/`, `ios/`, `.tmp-export/` — all gitignored).
- DB schema lives inline in `sqliteAdapter.ts` `init()`. There is no migration system; a `CREATE TABLE IF NOT EXISTS` is the contract.

## Common gotchas

- `app/(tabs)/index.tsx` is the only route — adding new screens means adding new files under `app/` (expo-router file-based).
- `experiments.typedRoutes` is enabled in `app.json` — generated route types live in `.expo/types/`. If a route import breaks, run `npx expo customize tsconfig.json` or just `npx expo start` once to regenerate.
- Button row width: `Math.min(72, Math.floor((width - 32) / 8))` in `app/(tabs)/index.tsx`. On screens narrower than ~320pt the row scrolls horizontally — known limitation, not a bug.
- `useCalendarData().addEmotion` always writes to **today** (last element of `last30Days()`). It does not accept a date parameter.
- **Web in-memory adapter is process-local** — data is lost on page reload. Persist with `localStorage`/`IndexedDB` if web persistence is needed.
- **`app/_layout.tsx` installs a `console.warn` filter** at module top-level to silence `react-native-web`'s `Image: style.resizeMode is deprecated` warning (emitted by `expo-router`'s internal web render). All other warnings still print.
