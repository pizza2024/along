# Moodly WeChat Mini Program (Taro 3)

A Taro 3 port of [Moodly](../) targeting 微信小程序 (WeChat Mini Program). Shares the framework-agnostic domain layer with the Expo React Native app via the `@/*` path alias.

## What is shared with the root Expo project

- `src/utils/aggregate.ts` — calendar cell aggregation
- `src/utils/color.ts` — `hexToRgb`, `intensityToRGBA` (5-stop alpha)
- `src/utils/date.ts` — local-time `YYYY-MM-DD` keys
- `src/utils/month.ts` — month grid math
- `src/utils/resolveCellColor.ts` — aggregate/single-mode color resolution
- `src/utils/infiniteLoop.ts` — infinite-scroll helpers (RN only)
- `src/utils/scrollHaptic.ts` — scroll-haptic throttle helper
- `src/hooks/useLongPress.ts` — exports the pure `tickProgress(elapsed, duration)` helper
- `src/hooks/useCalendarData.ts` — uses an injected `getDb()` (overridden in Taro)
- `src/store/moodStore.ts` — zustand store
- `src/constants/emotions.ts` — 8-key palette
- `src/types.ts` — shared types
- `src/db/types.ts` — `DbAdapter` interface
- `src/db/repository.ts` — `addEntry` / `deleteEntry` / `getEntriesByDateRange`
- `src/db/inMemoryAdapter.ts` — used in tests
- `src/db/wxStorageAdapter.ts` — `wx.storage` implementation of `DbAdapter`
- All `__tests__/*.test.ts` — run from the root via `npm test`

## What is Taro-specific

Everything under `taro/src/` is Taro/小程序-specific:

- `taro/src/app.tsx` / `app.config.ts` — app entry
- `taro/src/pages/index/index.tsx` — single screen (header + calendar + emotion row)
- `taro/src/components/*` — Taro ports of `MoodButton`, `MoodButtonRow`, `MoodDayCell`, `MonthGrid`, `VirtualizedMoodCalendar`, `ProgressRing` (Canvas 2D)
- `taro/src/db/database.ts` — Taro-local `getDb()` returning `createWxStorageAdapter()` (overrides `src/db/database.ts` via babel + webpack alias)
- `taro/src/pages/index/index.config.ts` — page config (navigation bar, etc.)

The two `database.ts` files are **never loaded together**: the babel-plugin-module-resolver and Taro webpack alias both remap `@/db/database` to `taro/src/db/database.ts` when compiling this sub-project.

## Setup

```bash
cd taro
npm install
npm run dev:weapp   # watch mode — produces dist/ openable in 微信开发者工具
# or
npm run build:weapp # one-shot build
```

Open `taro/dist/` in 微信开发者工具 (微信开发者工具). The `project.config.json` declares `appid: "touristappid"` (tourist mode) — replace with your own appid before publishing.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev:weapp` | Taro watch build → `dist/` |
| `npm run build:weapp` | One-shot weapp build → `dist/` |
| `npm test` | vitest (Taro-local tests + node-runnable pure layer tests) |
| `npm run typecheck` | `tsc --noEmit` against the Taro sub-project's `tsconfig.json` |
| `npm run test:watch` | vitest watch |

## Architecture notes

### Storage

`wx.getStorageSync` / `setStorageSync` is used as a single 10MB JSON blob under the key `moodly:mood_entries`. Each `addEntry` rewrites the whole array; for a 30-day, 8-emotion usage this stays well below the 10MB quota.

### Long-press 800 ms with progress ring

`MoodButton` runs a 16ms `setInterval` starting on `onTouchStart`. The pure `tickProgress(elapsedMs, 800)` helper (in `src/hooks/useLongPress.ts`) returns `{ done, progress }`. The progress value drives a `<Canvas type="2d">` arc in `ProgressRing` that is redrawn via `Taro.requestAnimationFrame`. On completion, `addEmotion` is called and `Taro.vibrateShort({ type: 'medium' })` is fired.

### `useCalendarData` re-use

`useCalendarData` calls `getDb()` from `@/db/database`. In the Taro build the babel + webpack aliases resolve that import to `taro/src/db/database.ts`, which returns the `wxStorage`-backed adapter. The hook body itself is **unchanged** from the RN app.

### `View`-based grid spacing

The WeChat basic library < 3.0 does not support flex `gap`. Month rows and the emotion button row use `marginRight`/`marginLeft` for spacing instead.

## Verification

```bash
# from repo root
npm test          # 140 tests, includes wxStorageAdapter suite
npm run typecheck # must be clean

# from taro/
npm test          # Taro-local getDb tests
npm run typecheck # must be clean
```

## Publishing

1. `cd taro && npm run build:weapp`
2. Open `taro/dist/` in 微信开发者工具
3. Replace `appid` in `taro/project.config.json` with your real appid
4. Click "上传" in the dev tool, then submit for review in 微信公众平台
