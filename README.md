# Moodly · 极简情绪记录

> 上半屏是类 GitHub 贡献图风格的近 30 天日历,下半屏是 8 个情绪按钮,**长按 800ms** 触发记录,色块深度按打卡次数累计。

---

## 一眼看懂

```
┌──────────────────────────────┐
│ Moodly  ● 开心    ◧ 全部     │ ← 顶栏:标题 + 当前情绪 + 模式切换
├──────────────────────────────┤
│                              │
│  ▢▢▣▢▢▢▢▢▢▢▢▢▢▢▢▢▢▢▢▢▢▢▢▢▢▢▢│ ← 30 天日历网格
│  ▢▢▢▢▢▢▢▢▢▢▢▢▢▢▢▢▢▢▢▢▢▢▢▣▢▢▢│   (今日有黑边)
│  ▢▢▢▢▢▢▢▢▢▢▢▢▢▢▢▢▢▢▢▢▢▢▢▢▢▢▢│
│                              │
├──────────────────────────────┤
│  [▣][▣][▣][▣][▣][▣][▣][▣]    │ ← 8 个情绪按钮,长按进度环
└──────────────────────────────┘
```

## 8 种情绪 + 颜色

| Key | 中文 | 颜色 | Hex |
|---|---|---|---|
| `happy` | 开心 | 🟡 暖黄 | `#F5C518` |
| `calm` | 平静 | 🟢 薄荷绿 | `#7FBF7F` |
| `grateful` | 感恩 | 🌸 粉 | `#E89AAE` |
| `excited` | 兴奋 | 🟠 橙 | `#E89B4A` |
| `anxious` | 焦虑 | 🟣 紫 | `#8B6FBF` |
| `sad` | 难过 | 🔵 深蓝 | `#4A6FA5` |
| `angry` | 愤怒 | 🔴 番茄红 | `#D64545` |
| `tired` | 疲惫 | ⚪ 灰青 | `#8A9BA8` |

排序按"高愉悦高能量 → 低愉悦低能量":左上偏正向,右下偏负向。

## 交互规则

| 操作 | 结果 |
|---|---|
| **单击** 情绪按钮 | 切换顶部日历为**该情绪的单情绪模式**(只显示该情绪的分布),按钮浮起描边 |
| **长按 800ms** | 同色圆环进度条从 0° 走到 360°;满了松手 = 打卡成功(震动反馈) |
| 长按未满松手 | 取消,进度环归零 |
| **点击右上角 ◧/◨** | 切换日历模式:`全部`(每天取最多情绪)↔`仅此情绪`(当前选中情绪) |
| **今日格** | 在日历上有黑色边框,便于定位 |

**色块深度规则(打卡次数 → 透明度):**
- 0 次:空格 `#F2F2F2`
- 1 次:`α=0.18`
- 2 次:`α=0.45`
- 3 次:`α=0.78`
- ≥4 次:`α=1.0`(封顶)

## 技术栈

- **Expo SDK 52** + React Native 0.76 + TypeScript strict
- **expo-router** 单路由
- **expo-sqlite** 本地存储
- **expo-haptics** 中等震动反馈
- **zustand** 全局状态(选中情绪、日历模式)
- **react-native-svg** 圆环进度条
- **vitest** 单元测试(54 tests)

## 跑起来

```bash
npm install --legacy-peer-deps
npx expo start          # 启动 dev server
npx expo start --ios    # iOS Simulator
npx expo start --android # Android Emulator
npx expo start --web    # 浏览器预览
```

> 第一次用 Expo Go 跑可能需要 `npx expo prebuild` 来安装原生模块。

## 验证

```bash
npm test              # 54 个单元测试
npm run typecheck     # tsc --noEmit,0 错误
npx expo export --platform web  # 打包静态 web
```

## 项目结构

```
app/                       # expo-router 路由
├── _layout.tsx            # 初始化 SQLite
└── (tabs)/index.tsx       # 主页(唯一一页)

src/
├── components/            # MoodCalendar / MoodDayCell / MoodButton / ...
├── constants/emotions.ts  # 8 种情绪调色板
├── db/                    # SQLite adapter + repository (可注入 fake 测)
├── hooks/                 # useCalendarData / useLongPress
├── store/moodStore.ts     # zustand store
├── utils/                 # color / date / aggregate / resolveCellColor
└── types.ts               # EmotionKey / MoodEntry / CalendarCell

__tests__/                 # vitest 测试(54 个)
```

## 设计决策(已与产品方对齐)

| 选项 | 决策 |
|---|---|
| 跨平台实现 | Expo (TS + Expo Router) |
| 日历跨度 | 近 30 天 |
| 按钮排布 | 8 个一排,横向可滑动 |
| 长按时长 | 800ms |
| 平局处理 | 调色板顺序小的胜出 |
| 震动强度 | `Medium` |

## YAGNI(留给 v2)

- ❌ 锁屏小组件 / Apple Health 同步
- ❌ 删除/撤销某条记录
- ❌ 通知提醒打卡
- ❌ 月度/年度统计视图
- ❌ 导出数据

## 已知限制

- **iOS Simulator / Android Emulator 上震动不工作** —— 必须在真机验证震动反馈
- **8 个按钮在小屏手机(< 320pt 宽)会横向滚动** —— 大屏手机上一行放下

## License

MIT