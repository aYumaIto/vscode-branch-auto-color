# Branch Painter

Git ブランチ名に基づいて VS Code のタイトルバー・ステータスバー・アクティビティバーの色を自動変更し、タイトルにブランチ名を表示する拡張機能です。

Automatically changes the color of VS Code's title bar, status bar, and activity bar based on the Git branch name, and displays the branch name in the title.

## 機能 / Features

- ブランチ名のハッシュから色を自動生成 / Auto-generates colors from branch name hashes
- タイトルバー・ステータスバー・アクティビティバーの色を個別に制御 / Controls colors of title bar, status bar, and activity bar independently
- タイトルにブランチ名を表示 / Displays branch name in the window title
- 手動での色変更・リセットコマンド / Manual color change and reset commands
- ブランチ名と色の手動マッピング / Manual branch-to-color mapping

## コマンド / Commands

| コマンド / Command | 説明 / Description |
|---|---|
| `Branch Painter: Set Color` | 手動で色を選択 / Manually select a color |
| `Branch Painter: Reset Color` | 色をリセット / Reset colors to default |
| `Branch Painter: Toggle Auto Color` | 自動色分けの切り替え / Toggle automatic coloring |

## 設定 / Settings

| 設定 / Setting | 型 / Type | デフォルト / Default | 説明 / Description |
|---|---|---|---|
| `branchPainter.enabled` | `boolean` | `true` | 拡張機能の有効/無効 / Enable/disable the extension |
| `branchPainter.affectTitleBar` | `boolean` | `true` | タイトルバーの色変更 / Change title bar color |
| `branchPainter.affectStatusBar` | `boolean` | `true` | ステータスバーの色変更 / Change status bar color |
| `branchPainter.affectActivityBar` | `boolean` | `true` | アクティビティバーの色変更 / Change activity bar color |
| `branchPainter.showBranchInTitle` | `boolean` | `true` | タイトルにブランチ名表示 / Show branch name in title |
| `branchPainter.branchColorMap` | `object` | `{}` | ブランチ名と色のマッピング / Branch-to-color mapping |
| `branchPainter.saturation` | `number` | `0.6` | 自動生成色の彩度 / Saturation of auto-generated colors |
| `branchPainter.lightness` | `number` | `0.3` | 自動生成色の明度 / Lightness of auto-generated colors |

## 開発 / Development

```bash
npm install
npm run compile
# F5 で Extension Development Host を起動 / Press F5 to launch Extension Development Host
```

## ライセンス / License

MIT
