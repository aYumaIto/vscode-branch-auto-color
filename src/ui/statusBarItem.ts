import * as vscode from 'vscode';
import type { Repository } from '../git';
import { isEnabled } from '../core/config';
import { COMMAND_SET_COLOR, UNKNOWN_BRANCH } from '../constants';

/**
 * ステータスバーにブランチ名・適用色・worktree バッジを表示する。
 * クリックで branchAutoColor.setColor コマンドを起動する。
 */
export class BranchAutoColorStatusBar implements vscode.Disposable {
  private readonly statusBarItem: vscode.StatusBarItem;

  constructor() {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      100,
    );
    this.statusBarItem.command = COMMAND_SET_COLOR;
    this.statusBarItem.tooltip = 'Branch Auto Color: クリックで色を変更';
  }

  /**
   * リポジトリの状態に基づいてステータスバーを更新する。
   * branchAutoColor.enabled が false の場合は非表示にする。
   */
  update(repo: Repository): void {
    if (!isEnabled()) {
      this.statusBarItem.hide();
      return;
    }

    const branchName = repo.state.HEAD?.name || UNKNOWN_BRANCH;
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
