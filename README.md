# MahjongBump

Godot 4 棋牌休闲小游戏版本。目标是 2.5D 立体麻将对对碰，面向后续微信小游戏导出。

## 1. Godot 项目结构

```text
project/
├── project.godot
├── scenes/
│   ├── Main.tscn
│   ├── Board.tscn
│   ├── Tile.tscn
│   └── UI.tscn
├── scripts/
│   ├── board.gd
│   ├── tile.gd
│   ├── match.gd
│   ├── effects.gd
│   ├── ui.gd
│   └── game_manager.gd
├── assets/
│   ├── tiles/
│   ├── particles/
│   ├── sounds/
│   └── ui/
├── shaders/
│   └── tile_glow.gdshader
└── autoload/
    └── Global.gd
```

## 2. 场景结构

```text
Main
├── Background
├── Board
├── UI
├── Effects
└── Audio
```

- `Main.tscn`：游戏主场景，挂载 `game_manager.gd`。
- `Board.tscn`：棋盘容器，自动生成麻将布局。
- `Tile.tscn`：单张 2.5D 麻将牌，支持点击、选中、消除。
- `UI.tscn`：分数、倒计时、Combo、剩余数量、洗牌/提示/重来按钮。

## 3. 核心脚本

- `scripts/game_manager.gd`：游戏流程、关卡、分数、倒计时、Combo、广告预留调用。
- `scripts/board.gd`：棋盘生成、Tile 对象池、动态布局、洗牌和提示。
- `scripts/tile.gd`：2.5D 麻将牌外观、点击反馈、选中发光、消除 Tween。
- `scripts/match.gd`：最多 2 次转折的连连看路径算法。
- `scripts/effects.gd`：连线、粒子、错误红闪、抖动、Combo UI 动画。
- `scripts/ui.gd`：现代化大按钮、大字体 HUD、半透明棋牌风 UI。
- `autoload/Global.gd`：关卡配置、全局常量、激励广告接口预留。

## 4. UI 方案

- 深绿色棋牌桌渐变背景。
- 顶部半透明信息面板：分数、时间、剩余麻将数、Combo。
- 底部大按钮：洗牌、提示、重来。
- 按钮使用代码生成的圆角渐变风格，避免默认 Godot 按钮观感。
- 字号偏大，适合中老年用户阅读和触摸。

## 5. 动效方案

- 点击麻将：`Tween` 放大到 1.08，再回弹。
- 选中麻将：`Tween` 弹起、放大、发光描边。
- 连线成功：`Line2D` 发光路径线。
- 消除：麻将缩小、fade out，并在两张牌位置触发 `CPUParticles2D` 粒子爆开。
- 连击：显示 `COMBO xN`，UI 轻微弹动。
- 错误点击：背景红闪，棋盘轻微抖动。

## 6. 性能方案

- 棋盘使用对象池，不频繁销毁和重建 Tile。
- 动画集中使用 `Tween`、`Line2D`、`CPUParticles2D`。
- 不使用大量 `_process` 手写硬动画。
- 资源沿用压缩 PNG，后续微信小游戏导出时可继续压缩和分包。
- 棋盘规模由关卡配置控制，方便低端手机调参。

## 7. 关卡系统

已预置：

- Level 1：5 x 6，10 种牌。
- Level 2：6 x 6，12 种牌。
- Level 3：7 x 6，16 种牌。

后续可在 `autoload/Global.gd` 的 `LEVELS` 中继续扩展。

## 8. 商业化预留

`Global.request_rewarded_ad(reason)` 已预留：

- `hint`：提示按钮可接激励视频。
- `shuffle`：洗牌按钮可接激励视频。
- `revive`：失败复活可接激励视频。

当前不会接入 SDK，只保留结构。

## 9. 微信小游戏导出注意事项

- 当前工程按 Godot 4 移动端渲染设置建立。
- 后续导出微信小游戏建议走 Godot 微信小游戏适配工具链，例如 `godot-love-wechat` 方向。
- 避免引入原生插件和不兼容 API。
- 控制 PNG、音频和粒子资源体积，必要时将资源分包。
- 保持竖屏 720 x 1280 设计，触摸优先。
- 导出前需要在 Godot 中打开项目，让 `.godot/` 导入缓存生成后再测试。

## 运行

用 Godot 4 打开本目录：

```text
/Users/sweetwater77/Documents/MahjongBump
```

主场景：

```text
res://scenes/Main.tscn
```
