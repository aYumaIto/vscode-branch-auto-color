# AGENTS.md

このファイルは AI エージェント（Claude、Copilot 等）がこのプロジェクトで作業する際のガイドラインです。

## プロジェクト概要

VS Code 拡張機能「Branch Auto Color」— Git ブランチ名に基づいてタイトルバー・ステータスバー・アクティビティバーの色を自動変更し、タイトルにブランチ名を表示する。

## 技術スタック

- **言語**: TypeScript (strict モード)
- **ランタイム**: VS Code Extension Host
- **ビルド**: `tsc` (`npm run compile`)
- **リント**: ESLint (`npm run lint`)
- **テスト**: `@vscode/test-electron` + Mocha (`npm test`)
- **最小 VS Code バージョン**: ^1.109.0
- **主要依存 API**: Git Extension API (`vscode.git`)

## プロジェクト構造

```
src/
  extension.ts          # エントリーポイント（activate / deactivate）
  colorGenerator.ts     # ブランチ名 → 色生成（純粋関数）
  themeApplier.ts       # workbench.colorCustomizations への適用
  commands.ts           # 手動コマンド（setColor, resetColor, toggleAutoColor）
  test/                 # テストファイル
docs/
  development-plan.md   # 開発プラン（設計の正式な仕様）
```

## 開発コマンド

```bash
npm run compile   # TypeScript コンパイル
npm run watch     # ウォッチモード
npm run lint      # ESLint 実行
npm test          # テスト実行（要: npm run compile 事前実行）
```

## コーディング規約

- TypeScript strict モードを維持すること
- ESLint ルールに従うこと（`curly`, `eqeqeq`, `semi` 等）
- import の命名は camelCase または PascalCase
- VS Code API の型は `@types/vscode` から取得（`vscode` モジュールを直接 import）
- 設定の保存先は `ConfigurationTarget.Workspace`（`.vscode/settings.json`）

## 設計原則

- **既存設定の保護**: `workbench.colorCustomizations` は取得 → マージ → 更新。ユーザーの他のカスタマイズを破壊しない
- **即時反映**: 色変更はワークスペース設定に書き込み、リロード不要
- **決定的な色生成**: 同じブランチ名からは常に同じ色を生成（djb2 ハッシュ → HSL）
- **アクセシビリティ**: 前景色はコントラスト比（WCAG AA 基準 4.5:1）を満たすよう自動選択

## Git ワークフロー

- デフォルトブランチ: `main`
- 機能ブランチ: `feature/<issue番号>-<説明>` （例: `feature/1-package-json`）
- worktree を使用して並行開発
- コミットメッセージは具体的かつ簡潔に
- PR は `gh` コマンドで作成

## テストに関する方針

- `colorGenerator` は純粋関数のため、通常の単体テストで検証可能
- 同一入力に対する決定性、コントラスト比、エッジケース（空文字・特殊文字）をカバー
- テーマ適用やコマンドは VS Code Extension Testing フレームワークを使用

## 重要な注意事項

- `personal_workspace/` は gitignore 対象。個人的な作業メモ・下書きの保存先
- `docs/development-plan.md` が設計の正式な仕様。変更時は事前に確認すること
- `package.json` の `contributes` セクションが拡張機能の宣言的定義。コマンド ID は `branchAutoColor.*` を使用

## 指摘事項（追記していく）

- `interface` ではなく `type` を使用すること
