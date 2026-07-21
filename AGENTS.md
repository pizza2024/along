# AGENTS.md

Compact guidance for OpenCode sessions working in **Moodly** (Expo 54 / React Native 0.81 / React 19.1 / TypeScript strict, pnpm monorepo).

## Commands

- **Install (Expo app, root):** `npm install --legacy-peer-deps` — the root app resolves from `package-lock.json` and does **not** depend on `@moodly/shared`, so npm works. Without the flag, peer-dep conflicts (React 19.1 vs RN 0.81) break install.
- **Install (weapp work):** `pnpm install` at repo root — pnpm workspace links `@moodly/shared` into `packages/weapp`. npm cannot resolve the `workspace:*` protocol used inside `packages/*`.
- **Do not alternate npm/pnpm installs at the root casually** — `pnpm install` converts root `node_modules` to pnpm's symlinked layout; to go back, rerun `npm install --legacy-peer-deps`. Both package managers manage the same `node_modules` directory and will prune each other's layout.
- **Expo dev server:** `npx expo start` (add `--ios` / `--android` / `--web`).
- **First native run on a real device / Expo Go:** `npx expo prebuild` if the native module (expo-sqlite, expo-haptics, react-native-svg) is missing.
- **Static web export:** `npx expo export --platform web`.
- **WeChat Mini Program dev:** `cd packages/weapp && pnpm dev:weapp` (taro watch → `dist/`). Build: `pnpm build:weapp`. Then import `packages/weapp/dist/` in WeChat DevTools.
- **Tests (root):** `npm test` (vitest, single run, excludes `packages/**`) or `npm run test:watch`. Single file: `npx vitest run __tests__/month.test.ts`.
- **Tests (weapp):** `cd packages/weapp && pnpm test`.
- **Typecheck (root):** `npm run typecheck` (`tsc --noEmit`, excludes `packages/`). Weapp: `cd packages/weapp && pnpm typecheck`.
- **No lint / formatter / CI is configured.** Do not invent `npm run lint`; only `test` + `typecheck` are authoritative.

## Monorepo Layout

```
along/
├── app/                    Expo Router pages (single screen)
├── src/                    Expo app code (components, hooks, db, store, utils)
├── __tests__/              root vitest tests (pure logic)
├── packages/
│   ├── shared/             @moodly/shared — pure logic (no React), consumed ONLY by weapp
│   └── weapp/              moodly-weapp — Taro 3.6.7 WeChat Mini Program port
│       ├── src/            app.tsx, pages/index, components, hooks, db/database
│       ├── config/         Taro webpack config
│       └── dist/           build output (open in WeChat DevTools)
├── package-lock.json       root Expo app lockfile (npm)
└── pnpm-lock.yaml          workspace lockfile (pnpm, for packages/*)
```

## Architecture

### Expo app (root)

```
app/_layout.tsx               # calls getDb() once on mount (errors logged, not thrown);
                              # installs a console.warn filter for react-native-web (module-init time)
app/(tabs)/index.tsx          # the only screen — header (title + selected-emotion chip + mode toggle)
                              # + VirtualizedMoodCalendar + MoodPickerSheet

src/components/
  VirtualizedMoodCalendar.tsx # FlatList of full months; snapToInterval; floating "今天" button
                              # with direction arrow when activeIndex !== todayIndex
  MonthGrid.tsx               # one month: header + fixed 6×7 = 42-slot grid (null-padded)
  MoodDayCell.tsx             # day tile; reads mode/selectedEmotion from the store
  MoodPickerSheet.tsx         # bottom sheet: 2×4 emotion grid, single tap records, drag-to-dismiss
  MoodButton.tsx / MoodButtonRow.tsx / ProgressRing.tsx
                              # LEGACY — not rendered by any screen (long-press bottom bar,
                              # replaced by MoodPickerSheet). Kept because their pure helpers
                              # (tickProgress, infiniteLoop, scrollHaptic) still have tests.

src/hooks/
  useCalendarData.ts          # blocks: MonthBlock[] + extendPast/extendFuture; exposes raw entries;
                              # addEmotion(emotion, date?) — date defaults to today;
                              # removeEmotion(id) — deletes one entry (deleteEntry + refresh)
  useLongPress.ts             # legacy (only used by MoodButton); exports pure tickProgress

src/store/moodStore.ts        # zustand: selectedEmotion + mode ('aggregate' | 'single')
src/db/                       # DbAdapter interface; see "DB selection" below
src/utils/                    # date, color, aggregate, resolveCellColor, month, infiniteLoop, scrollHaptic
src/constants/emotions.ts     # 8-key palette with `order` (tiebreak uses lower order)
src/types.ts                  # EmotionKey, MoodEntry, CalendarCell, CalendarMode
```

- **Path alias:** `@/*` → `./src/*`, defined in both `tsconfig.json` and `vitest.config.ts` — keep them in sync.
- **DB selection:** web bundlers resolve `src/db/database.web.ts` (in-memory) instead of `src/db/database.ts`; `database.ts` also keeps a `Platform.OS === 'web'` check + lazy `require('expo-sqlite')` as a fallback so `expo-sqlite` is never evaluated on web.
- **DB is a singleton** (`getDb()`). For unit tests, use `__setAdapter(createInMemoryAdapter())` or pass the in-memory adapter directly into repository functions.
- `src/db/wxStorageAdapter.ts` exists at root only for parity/tests — the Expo runtime never uses it; the real consumer is `packages/weapp` via `@moodly/shared`.

### WeChat Mini Program (`packages/weapp/`)

Same interaction model as the Expo app (full-screen month calendar + `MoodPickerSheet`), re-implemented with Taro components. Imports pure logic from `@moodly/shared`; DB is `wx.getStorageSync`-backed (`createWxStorageAdapter`). Its `MoodButtonRow`/`MoodButton`/`ProgressRing` are equally unused.

### Shared (`packages/shared/`)

Types, constants, utils, db adapters, and a vanilla zustand `createStore`. **Consumed only by weapp — the Expo app keeps its own copies under `src/`.** Changes to shared logic (emotions, aggregate, month, color…) must be mirrored in both places by hand; there is no build step keeping them in sync.

## Domain rules that are easy to break

- **8 emotions are fixed** (`happy`, `calm`, `grateful`, `excited`, `anxious`, `sad`, `angry`, `tired`). New ones require updating `EmotionKey`, `EMOTIONS`, and the empty-per-emotion object in `utils/aggregate.ts` — in BOTH `src/` and `packages/shared/src/`.
- **Tiebreak on calendar cells:** equal counts → lower `order` in `EMOTIONS` wins.
- **Cell `count` is capped at 4** for display (alpha levels in `src/utils/color.ts` `ALPHAS`).
- **Recording is single-tap now:** day press opens `MoodPickerSheet`; tapping an emotion writes immediately (haptic + auto-close). The sheet also lists that day's existing entries as chips — each chip's × deletes it via `removeEmotion(id)` without closing the sheet. The 800ms long-press flow survives only in the legacy `MoodButton` component.
- **Date keys are local-time `YYYY-MM-DD`** (`src/utils/date.ts`). Do not switch to UTC — it shifts entries across days for non-UTC users.
- **Calendar is a virtualized month list.** `useCalendarData()` exposes `blocks` + `extendPast`/`extendFuture` (12 months per call, edge threshold 3). The prepend path uses a `useLayoutEffect` in `VirtualizedMoodCalendar` to compensate `scrollOffset` synchronously — **do not** add months mid-`onScroll` without that compensation.
- **MonthGrid slot layout is always 42 slots** (6 rows × 7), `null`-padded before `firstWeekday`. `VirtualizedMoodCalendar` derives a fixed `monthHeight` from `ROW_COUNT = 6` — keep that invariant.
- **Today button** appears when `activeIndex !== todayIndex`; tap → `scrollToIndex` back to current month (`onScrollToIndexFailed` rAF retry).
- **Haptics do not fire in iOS Simulator / Android Emulator / Web** — verify on a real device. Expo call sites (all `Platform.OS !== 'web'`-gated + `.catch(() => {})`): day press in `app/(tabs)/index.tsx` (`selectionAsync`), month change in `VirtualizedMoodCalendar` (`selectionAsync`, throttled via `shouldFireScrollHaptic`), record/delete in `MoodPickerSheet` (`impactAsync` Medium/Light). weapp mirrors these with `Taro.vibrateShort` (light/medium) wrapped in try/catch, except month change (page-scroll vibration feels bad).

## Testing conventions

- vitest config: `environment: 'node'`, `globals: true`; root config excludes `packages/**`.
- Two test layouts coexist:
  - `__tests__/*.test.ts` for cross-cutting utils (`aggregate`, `color`, `date`, `emotions`, `resolveCellColor`, `useLongPress`, `infiniteLoop`, `month`, `scrollHaptic`, `smoke`).
  - `src/**/__tests__/*.test.ts` colocated with the unit under test (`src/db/__tests__/`, `src/store/__tests__/`).
- **In-memory DB fixture:** `src/db/__tests__/inMemoryDb.ts` re-exports the production `createInMemoryAdapter`, which implements only the exact SQL strings the repository uses. Extend the production adapter if you add a query.
- Style: `describe('thing')` blocks, `it('does X')` sentences, prefer testing pure functions over rendering. Pure helpers (`tickProgress`, `computeInfiniteWrap`, `buildInfiniteRows`, `shouldFireScrollHaptic`, `getMonthMeta`, `getMonthDays`, `getMonthsRange`, `getMonthSpanDateRange`, `findMonthIndex`) exist for this reason.
- Test count is not load-bearing — just keep the "single behavior per `it`" style.

## Workflow

- Before committing: `npm test` then `npm run typecheck`. Both must pass. If you touched `packages/`, also run that package's `test` + `typecheck`.
- No pre-commit hook — you must run them yourself.
- Do not edit generated files (`expo-env.d.ts`, `.expo/`, `web-build/`, `android/`, `ios/`, `.tmp-export/`, `packages/weapp/dist/` — all gitignored).
- DB schema lives inline in `sqliteAdapter.ts` `init()`. There is no migration system; a `CREATE TABLE IF NOT EXISTS` is the contract.

## Common gotchas

- `app/(tabs)/index.tsx` is the only route — new screens mean new files under `app/` (expo-router file-based).
- `experiments.typedRoutes` is enabled in `app.json` — generated route types live in `.expo/types/`. If a route import breaks, run `npx expo start` once to regenerate.
- `expo-sqlite` is listed in `app.json` `plugins`. Removing it silently breaks `npx expo prebuild` for native.
- **Web in-memory adapter is process-local** — data is lost on page reload. Persist with `localStorage`/`IndexedDB` if web persistence is needed.
- **Duplicate logic drift:** `src/utils`, `src/constants`, `src/types.ts`, `src/store/moodStore.ts` and parts of `src/db/` are manually mirrored in `packages/shared/src/`. When fixing a bug in one, fix the other.
- **`pnpm-workspace.yaml` uses `onlyBuiltDependencies`** to allow build scripts (@swc/core, core-js, esbuild). Don't re-add the old placeholder `allowBuilds` block — it was invalid junk.
