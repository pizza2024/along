# AGENTS.md

Compact guidance for OpenCode sessions working in **Moodly** (Expo 54 / React Native 0.81 / React 19.1 / TypeScript strict).

## Commands

- **Install (required flag):** `npm install --legacy-peer-deps` — without it, peer-dep conflicts (e.g. React 19.1 vs RN 0.81 expectations) break install.
- **Dev server:** `npx expo start` (add `--ios` / `--android` / `--web` for a specific target).
- **First native run on a real device / Expo Go:** `npx expo prebuild` if the native module (expo-sqlite, expo-haptics, react-native-svg) is missing.
- **Static web export:** `npx expo export --platform web`.
- **Tests:** `npm test` (vitest, single run) or `npm run test:watch`.
- **Typecheck:** `npm run typecheck` (`tsc --noEmit`).
- **Single test file:** `npx vitest run __tests__/aggregate.test.ts` — pattern is filename-based.
- **No lint / formatter / CI is configured.** Do not invent `npm run lint`; only `test` + `typecheck` are authoritative.

## Architecture

Single-screen Expo Router app. Entry chain:

```
app/_layout.tsx           # calls getDb() once on mount (errors are logged, not thrown)
app/(tabs)/index.tsx      # the only screen — composes MoodCalendar + MoodButtonRow
src/components/           # MoodCalendar, MoodDayCell, MoodButton, MoodButtonRow, ProgressRing
src/hooks/                # useCalendarData (db I/O), useLongPress (gesture)
src/store/moodStore.ts    # zustand: selectedEmotion + mode ('aggregate' | 'single')
src/db/                   # DbAdapter interface + createSqliteAdapter (native) + createInMemoryAdapter (web + tests)
src/utils/                # date, color, aggregate, resolveCellColor (pure, fully unit-tested)
src/constants/emotions.ts # 8-key palette with `order` (tiebreak uses lower order)
src/types.ts              # EmotionKey, MoodEntry, CalendarCell, CalendarMode
```

- **Path alias:** `@/*` → `./src/*`. Defined in both `tsconfig.json` and `vitest.config.ts` — keep them in sync if you change it.
- **DB is a singleton** (`src/db/database.ts`). For unit tests, use `__setAdapter(createInMemoryDb())` from the same file, or pass the in-memory adapter directly into repository functions (`addEntry(db, …)`, `getEntriesByDateRange(db, …)`).
- **Platform-conditional DB selection** in `getDb()`: `Platform.OS === 'web'` → `createInMemoryAdapter()`; otherwise → lazy `require('expo-sqlite')` + `createSqliteAdapter`. The lazy `require` keeps `expo-sqlite` from being evaluated at module load on web, which would throw `Cannot find native module 'ExpoSQLite'`.
- **Test in-memory fixture** (`src/db/__tests__/inMemoryDb.ts`) is a thin re-export of the production `createInMemoryAdapter` from `src/db/inMemoryAdapter.ts` — keep them in sync, or just extend the production one.

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
