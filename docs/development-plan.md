# VS Code Branch Auto Color 開発プラン

Git ブランチ名に基づいてタイトルバー・ステータスバー・アクティビティバーの色を自動変更し、タイトルにブランチ名を表示する VS Code 拡張機能を TypeScript で新規開発する。
ブランチ名のハッシュから色を自動生成するほか、手動での色変更コマンドも提供する。

## 1. プロジェクトの初期化

- `yo code` (Yeoman VS Code Extension Generator) で TypeScript ベースの拡張機能テンプレートを生成
- プロジェクト名: `vscode-branch-auto-color`
- `package.json` にアクティベーションイベントを設定: `workspaceContains:**/.git` + `onStartupFinished`

## 2. package.json — コマンドと設定の定義

### コマンド登録

| コマンド ID                     | 説明                                                         |
| ------------------------------- | ------------------------------------------------------------ |
| `branchAutoColor.setColor`        | 手動で色を選択する（カラーピッカーまたはプリセットから選択） |
| `branchAutoColor.resetColor`      | 色をリセットしてデフォルトに戻す                             |
| `branchAutoColor.toggleAutoColor` | 自動色分けの有効/無効を切り替え                              |

### 設定 (`contributes.configuration`)

| 設定キー                          | 型        | デフォルト値                                                            | 説明                                                                                |
| --------------------------------- | --------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `branchAutoColor.enabled`           | `boolean` | `true`                                                                  | 拡張機能の有効/無効                                                                 |
| `branchAutoColor.affectTitleBar`    | `boolean` | `true`                                                                  | タイトルバーの色を変更するか                                                        |
| `branchAutoColor.affectStatusBar`   | `boolean` | `true`                                                                  | ステータスバーの色を変更するか                                                      |
| `branchAutoColor.affectActivityBar` | `boolean` | `true`                                                                  | アクティビティバーの色を変更するか                                                  |
| `branchAutoColor.showBranchInTitle` | `boolean` | `true`                                                                  | タイトルバーにブランチ名を表示するか                                                |
| `branchAutoColor.titleFormat`       | `string`  | `"[${branch}] ${folderName} ${separator} ${activeEditorShort}${dirty}"` | タイトル表示のフォーマット                                                          |
| `branchAutoColor.branchColorMap`    | `object`  | `{}`                                                                    | ブランチ名と色の手動マッピング（例: `{ "main": "#1e8a3a", "develop": "#3a7ae8" }`） |
| `branchAutoColor.saturation`        | `number`  | `0.6`                                                                   | 自動生成色の彩度                                                                    |
| `branchAutoColor.lightness`         | `number`  | `0.3`                                                                   | 自動生成色の明度                                                                    |

## 3. src/extension.ts — エントリーポイント

### `activate()`

1. Git 拡張 API を取得（`vscode.extensions.getExtension('vscode.git')` → `getAPI(1)`）
2. API の `state` が `'initialized'` になるまで待機
3. リポジトリのブランチを取得して初回の色適用
4. `repository.onDidCheckout` でブランチ変更を監視し、色を再適用
5. `api.onDidOpenRepository` で新規リポジトリにもリスナーを登録
6. コマンドを登録

### `deactivate()`

- 変更した `colorCustomizations` と `window.title` を元に戻す（オプション）

## 4. src/colorGenerator.ts — ブランチ名からの色生成

- ブランチ名の文字列ハッシュ（djb2 等の簡易ハッシュ）→ HSL の Hue 値 (0-360) に変換
- 設定の `saturation` と `lightness` と組み合わせて HSL → HEX に変換
- `branchColorMap` にマッピングがあればそちらを優先
- 背景色からコントラスト比を計算して適切な前景色（白/黒）を自動選択

## 5. src/themeApplier.ts — テーマ適用ロジック

- `workbench.colorCustomizations` を取得し、既存設定とマージして更新
- 設定に応じて `titleBar.*`, `statusBar.*`, `activityBar.*` を個別に制御
- `window.title` にブランチ名を含むフォーマットを適用
- 色変更は `vscode.ConfigurationTarget.Workspace` で `.vscode/settings.json` に保存 → **即時反映、リロード不要**

## 6. src/commands.ts — 手動コマンド

| コマンド          | 実装内容                                                                                                |
| ----------------- | ------------------------------------------------------------------------------------------------------- |
| `setColor`        | `vscode.window.showQuickPick` でプリセットカラーの一覧を表示、または `showInputBox` で HEX 値を直接入力 |
| `resetColor`      | 拡張機能が追加した `colorCustomizations` のキーのみ削除して元に戻す                                     |
| `toggleAutoColor` | 自動色分けのオン/オフ                                                                                   |

## 7. テスト

- `src/test/` に単体テストを配置
  - `colorGenerator.test.ts` — 同じブランチ名からは常に同じ色が生成されることを検証
  - `colorGenerator.test.ts` — コントラスト比が WCAG AA 基準を満たすことを検証
- VS Code Extension Testing フレームワーク (`@vscode/test-electron`) を使用

## 8. 追加機能の提案

- **ステータスバーアイテム**: ステータスバーに現在のブランチ名と適用色を表示する `StatusBarItem` を追加。クリックで手動色変更コマンドを起動
- **worktree 検出**: ワークスペースが worktree であることを検出し、ステータスバーに "worktree" バッジを表示（メインリポジトリとの区別）

## 検証手順

1. `npm run compile` でビルドエラーがないことを確認
2. `F5` で Extension Development Host を起動し、Git リポジトリで以下を検証:
   - ブランチに応じてタイトルバー・ステータスバーの色が自動変更される
   - ブランチを切り替えると色が即座に変わる
   - タイトルバーにブランチ名が表示される
   - コマンドパレットから手動で色変更・リセットができる
3. `npm test` で単体テストがパスすることを確認

## 設計判断

| 判断事項                | 選択                                                       | 理由                                                                     |
| ----------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------ |
| 色生成方式              | ブランチ名ハッシュ → HSL                                   | RGB ランダム生成よりも彩度・明度を制御しやすく、読みやすい色が生成できる |
| 設定保存先              | `ConfigurationTarget.Workspace`（`.vscode/settings.json`） | worktree ごとに独立した設定になる                                        |
| 既存設定の保護          | `colorCustomizations` を取得してマージ                     | ユーザーの他のカスタマイズを破壊しない                                   |
| deactivate 時のリセット | オプションとして提供（デフォルト: リセットしない）         | 次回起動時に色がすぐ反映されるため                                       |

## 技術スタック

| 項目                    | 技術                             |
| ----------------------- | -------------------------------- |
| 言語                    | TypeScript                       |
| ビルド                  | esbuild / tsc                    |
| テスト                  | @vscode/test-electron            |
| VS Code API             | Git Extension API (`vscode.git`) |
| 最小 VS Code バージョン | ^1.74.0                          |
