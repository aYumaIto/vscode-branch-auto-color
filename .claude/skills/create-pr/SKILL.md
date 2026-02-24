---
name: create-pr
description: Pull Request作成を支援するスキル。差分確認後、PRテンプレートに沿ってPRを作成する。 トリガー：「PR作成」「create pr」「プルリクエスト作成」「PRを作成」
---

# Create Pull Request

作業ブランチからベースブランチ（master）へのPull Requestを作成する。

## 手順

### 1. ブランチ情報の取得

- 現在のブランチ名を取得する

### 2. 差分の確認

- `git diff master...HEAD` でベースブランチとの差分を確認する
- `git log master..HEAD --oneline` でコミット履歴を確認する
- 変更内容を把握し、PRの概要・変更内容セクションに記載する内容を整理する

### 3. リモートへのプッシュ

- 未プッシュのコミットがある場合は `git push` を実行する

### 4. PRの作成

- `gh pr create` コマンドを使用してPRを直接作成する（`--web` オプションは使用しない）
- PRテンプレート（`.github/PULL_REQUEST_TEMPLATE.md`）の形式に従う
- タイトル: Conventional Commits 形式で日本語で記述する
  - 形式: `<type>: <変更の要約>` （例: `fix: Dependabotセキュリティアラート対応`）
  - `<type>` は変更の主目的に応じて選択する（`feat`, `fix`, `chore`, `refactor`, `docs`, `test`, `ci` 等）
  - スコープは明確な場合のみ付与する（例: `feat(auth):`, `fix(ci):`）
  - 破壊的変更にはtypeの後に感嘆符を付与する（例: `feat!: 認証APIのレスポンス形式を変更`、`refactor!: 非推奨APIを削除`）
- 本文: 一時ファイルにPR説明を書き出し、`--body-file` オプションで指定する（`--body` オプションはシェルのエスケープ問題が起きやすいため使用しない）
  - 例: テンプレートに沿った内容を一時ファイルに書き出し、`gh pr create --title "..." --body-file /tmp/pr-body.md` のように実行する
  - PR作成後、一時ファイルは削除する
- 作成成功後、返されたPR URLを `open <url>` でブラウザを開く

## 注意事項

- 差分が大きい場合は、変更内容を適切に要約すること。
