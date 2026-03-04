import * as vscode from 'vscode';
import type { Repository } from './git';
import { isEnabled } from './config';

/**
 * ステータスバーにブランチ名・適用色・worktree バッジを表示する。
 * クリックで branchPainter.setColor コマンドを起動する。
 */
export class BranchPainterStatusBar implements vscode.Disposable {
  private readonly statusBarItem: vscode.StatusBarItem;

  constructor() {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      100,
    );
    this.statusBarItem.command = 'branchPainter.setColor';
    this.statusBarItem.tooltip = 'Branch Painter: クリックで色を変更';
  }

  /**
   * リポジトリの状態に基づいてステータスバーを更新する。
   * branchPainter.enabled が false の場合は非表示にする。
   */
  update(repo: Repository): void {
    if (!isEnabled()) {
      this.statusBarItem.hide();
      return;
    }

    const branchName = repo.state.HEAD?.name || 'unknown';
    const worktreeBadge = repo.kind === 'worktree' ? ' $(git-branch) worktree' : '';

    this.statusBarItem.text = `$(paintcan) ${branchName}${worktreeBadge}`;
    this.statusBarItem.show();
  }

  /** ステータスバーアイテムを非表示にする */
  hide(): void {
    this.statusBarItem.hide();
  }

  /** ステータスバーアイテムを破棄する */
  dispose(): void {
    this.statusBarItem.dispose();
  }
}
