# AGENTS.md

Compact guidance for OpenCode sessions working in **Moodly** (Expo 54 / React Native 0.81 / React 19.1 / TypeScript strict).

## Commands

- **Install (required flag):** `npm install --legacy-peer-deps` — without it, peer-dep conflicts (e.g. React 19.1 vs RN 0.81 expectations) break install.
- **Dev server:** `npx expo start` (add `--ios` / `--android` / `--web` for a specific target).
- **First native run on a real device / Expo Go:** `npx expo prebuild` if the native module (expo-sqlite, expo-haptics, react-native-svg) is missing.
- **Static web export:** `npx expo export --platform web`.
- **Tests:** `npm test` (vitest, single run) or `npm run test:watch`.
- **Typecheck:** `npm run typecheck` (`tsc --noEmit`).
- **Single test file:** `npx vitest run __tests__/infiniteLoop.test.ts` — pattern is filename-based.
- **No lint / formatter / CI is configured.** Do not invent `npm run lint`; only `test` + `typecheck` are authoritative.

## Architecture

Single-screen Expo Router app. Entry chain:

```
app/_layout.tsx               # calls getDb() once on mount (errors are logged, not thrown)
                              # also installs a console.warn filter for react-native-web
app/(tabs)/index.tsx          # the only screen — composes VirtualizedMoodCalendar + MoodButtonRow

src/components/
  VirtualizedMoodCalendar.tsx # FlatList of full months; snaps + centervsnap;
                              # exposes a floating "今天" button when off-current
  MonthGrid.tsx               # one month: header + 6×7 cell grid (uses MoodDayCell)
  MoodDayCell.tsx             # day tile; takes size + showDayNumber; reads mode/selectedEmotion
  MoodButton.tsx              # one emotion button; 800ms long press → record
  MoodButtonRow.tsx           # horizontal FlatList with bidirectional infinite wrap
  ProgressRing.tsx            # SVG ring, draws long-press progress

src/hooks/
  useCalendarData.ts          # months/blocks + extendPast/extendFuture; addEmotion writes to today
  useLongPress.ts             # exports pure tickProgress(elapsed, duration) for tests

src/store/moodStore.ts        # zustand: selectedEmotion + mode ('aggregate' | 'single')
src/db/                       # DbAdapter interface; sqliteAdapter (native) + inMemoryAdapter (web + tests)
src/utils/                    # date, color, aggregate, resolveCellColor, month, infiniteLoop, scrollHaptic
src/constants/emotions.ts     # 8-key palette with `order` (tiebreak uses lower order)
src/types.ts                  # EmotionKey, MoodEntry, CalendarCell, CalendarMode
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
- **Calendar is a virtualized month list**, not the old 30-day grid. `useCalendarData()` returns `blocks: MonthBlock[]` (each block = month meta + its `CalendarCell[]`) and exposes `extendPast` / `extendFuture` for the FlatList to call when within `EDGE_THRESHOLD` (3) of either end. Each call adds 12 months; the prepend path uses a `useLayoutEffect` to compensate `scrollOffset` synchronously so the user does not see a jump. **Do not** add to the array mid-`onScroll` without that compensation.
- **Infinite scroll in MoodButtonRow uses wrap-to-center.** Data is `REPEATS=5` copies of the 8 emotions; the FlatList starts in the middle copy. On `onMomentumScrollEnd`, if the user has scrolled into the edge copies, the offset silently jumps ±`copyLen * 2` items. The pure `computeInfiniteWrap(offsetX, copyLen, step, padding)` helper is exported from `src/utils/infiniteLoop.ts` and is what tests cover. Do not implement edge detection inside the FlatList's `onScroll` — let momentum settle first.
- **Today button** appears in the bottom-right of `VirtualizedMoodCalendar` whenever `activeIndex !== todayIndex`. Tap scrolls back to the current month (`scrollToIndex`, with an `onScrollToIndexFailed` rAF retry).
- **Haptics do not fire in iOS Simulator / Android Emulator / Web** — verify on a real native device. The button-row scroll-haptic (`Haptics.selectionAsync`) is additionally gated by `Platform.OS !== 'web'` in `MoodButtonRow.tsx`. Both call sites are wrapped in `.catch(() => {})` so they never throw.
- **MoodButton blocks the web context menu** via a `Platform.OS === 'web'`-only `onContextMenu` prop on the underlying `Pressable`. Removing the platform check will surface a no-op warning on native.

## Testing conventions

- vitest config: `environment: 'node'`, `globals: true`. The `jsdom` devDep is for potential future component tests — current tests are pure-logic only and run in node.
- Two test layouts coexist:
  - `__tests__/*.test.ts` for cross-cutting utils (`aggregate`, `color`, `date`, `emotions`, `resolveCellColor`, `useLongPress`, `infiniteLoop`, `month`, `scrollHaptic`, `smoke`).
  - `src/**/__tests__/*.test.ts` colocated with the unit under test (`src/db/__tests__/repository.test.ts`, `src/store/__tests__/moodStore.test.ts`).
- **In-memory DB fixture:** `src/db/__tests__/inMemoryDb.ts` re-exports the production `createInMemoryAdapter` from `src/db/inMemoryAdapter.ts`. The adapter implements only the exact two SQL strings the repository uses (`INSERT INTO mood_entries …`, `DELETE FROM mood_entries …`, `SELECT … BETWEEN ? AND ?`). Extend the production adapter if you add a new query.
- Style: `describe('thing')` blocks, `it('does X')` sentences, prefer testing pure functions over rendering. Hooks and infinite-scroll logic expose pure helpers (`tickProgress`, `computeInfiniteWrap`, `buildInfiniteRows`, `shouldFireScrollHaptic`, `getMonthMeta`, `getMonthDays`, `getMonthsRange`, `getMonthSpanDateRange`, `findMonthIndex`) for this reason.
- Test count is not load-bearing. The README number is a snapshot — do not chase it; just keep the "single behavior per `it`" style.

## Workflow

- Before committing: `npm test` then `npm run typecheck`. Both must pass.
- No pre-commit hook — you must run them yourself.
- Do not edit generated files (`expo-env.d.ts`, `.expo/`, `web-build/`, `android/`, `ios/`, `.tmp-export/` — all gitignored).
- DB schema lives inline in `sqliteAdapter.ts` `init()`. There is no migration system; a `CREATE TABLE IF NOT EXISTS` is the contract.

## Common gotchas

- `app/(tabs)/index.tsx` is the only route — adding new screens means adding new files under `app/` (expo-router file-based).
- `experiments.typedRoutes` is enabled in `app.json` — generated route types live in `.expo/types/`. If a route import breaks, run `npx expo customize tsconfig.json` or just `npx expo start` once to regenerate.
- `expo-sqlite` is listed in `app.json` `plugins` (added in the SDK 52→54 upgrade). Removing it silently breaks `npx expo prebuild` for native.
- Button row width: `Math.min(64, Math.floor((width - 24) / 8))` in `app/(tabs)/index.tsx`. The 64 cap is deliberate — it forces horizontal overflow on common phone widths so the infinite-scroll loop is reachable. Do not "fix" it back up to 88 / 72.
- `useCalendarData().addEmotion` always writes to **today** via `toDateKey(new Date())` — it does not accept a date parameter.
- **Web in-memory adapter is process-local** — data is lost on page reload. Persist with `localStorage`/`IndexedDB` if web persistence is needed.
- **`app/_layout.tsx` installs a `console.warn` filter** at module top-level to silence `react-native-web`'s `Image: style.resizeMode is deprecated` warning (emitted by `expo-router`'s internal web render). All other warnings still print. Reload the dev server after editing — the filter is module-init time.
- **FlatList + wrap-to-center** means `keyExtractor` must produce unique keys per copy (the row does `copyN-emotionKey`). Reusing the same key across copies will make the wrap jump look like a delete+insert and flicker.
- **MonthGrid slot layout** is always 42 slots (6 rows × 7), filled with `null` before the month's `firstWeekday`. If you refactor `MonthGrid`, keep `total = 42` invariant — `VirtualizedMoodCalendar` sizes each month to a fixed `monthHeight` derived from `ROW_COUNT = 6`.
