import * as vscode from 'vscode';
import { applyThemeForBranch, resetTheme } from './core/themeApplier';
import { readThemeApplyOptions } from './core/config';
import { setColor, resetColor, toggleAutoColor } from './ui/commands';
import { BranchPainterStatusBar } from './ui/statusBarItem';
import { COMMAND_SET_COLOR, COMMAND_RESET_COLOR, COMMAND_TOGGLE_AUTO_COLOR, UNKNOWN_BRANCH } from './constants';
import type { API, APIState, Repository } from './git';

/**
 * Git 拡張から API を取得し、初期化を待機する。
 * Git 拡張が見つからない・有効化されていない場合は例外を投げる。
 * ユーザーが意図的に Git 拡張を無効にしている場合があるため、強制 activate はしない。
 */
async function getGitApi(): Promise<API> {
  const gitExt = vscode.extensions.getExtension('vscode.git');
  if (!gitExt) {
    throw new Error('Git拡張が見つかりません');
  }

  if (!gitExt.isActive) {
    // Git 拡張を強制的に activate しない。
    // ユーザーが意図的に無効にしている場合を考慮する。
    throw new Error('Git拡張が有効化されていません');
  }
  const gitApi: API = gitExt.exports.getAPI(1);

  if (gitApi.state !== 'initialized') {
    const TIMEOUT_MS = 10_000;
    await new Promise<void>((resolve, reject) => {
      let settled = false;

      function cleanup() {
        if (settled) {
          return;
        }
        settled = true;
        globalThis.clearTimeout(timer);
        disposable.dispose();
      }

      const timer = globalThis.setTimeout(() => {
        cleanup();
        reject(new Error('Git API initialization timed out'));
      }, TIMEOUT_MS);

      const disposable = gitApi.onDidChangeState((state: APIState) => {
        if (state === 'initialized') {
          cleanup();
          resolve();
        }
      });

      // リスナー登録前に initialized に遷移した場合に備え、登録後に再チェック
      if (gitApi.state === 'initialized') {
        cleanup();
        resolve();
      }
    });
  }

  return gitApi;
}

/** コマンドを登録する */
function registerCommands(
  context: vscode.ExtensionContext,
  gitApi: API,
): void {
  context.subscriptions.push(
    vscode.commands.registerCommand(COMMAND_SET_COLOR, () => setColor(gitApi)),
    vscode.commands.registerCommand(COMMAND_RESET_COLOR, resetColor),
    vscode.commands.registerCommand(COMMAND_TOGGLE_AUTO_COLOR, () =>
      toggleAutoColor(gitApi),
    ),
  );
}

/** リポジトリ検出・ブランチ変更のリスナーを登録する */
function registerRepoListeners(
  context: vscode.ExtensionContext,
  gitApi: API,
  statusBar: BranchPainterStatusBar,
): void {
  // テーマ適用処理を直列化するための Promise チェーン
  let lastApplyPromise: Promise<void> = Promise.resolve();

  /** リポジトリの現在ブランチに基づいてステータスバーとテーマ色を更新する */
  function updateBranchColor(repo: Repository) {
    const branch = repo.state.HEAD?.name || UNKNOWN_BRANCH;
    statusBar.update(repo);

    const options = readThemeApplyOptions();
    if (!options) {
      return;
    }

    lastApplyPromise = lastApplyPromise
      .then(() => applyThemeForBranch(branch, options))
      .catch((error) => {
        const message = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`Branch Painter: テーマ適用失敗 — ${message}`);
      });
  }

  /** リポジトリの初回テーマ適用とイベントリスナー登録を行う */
  function setupRepo(repo: Repository) {
    updateBranchColor(repo);
    context.subscriptions.push(
      repo.state.onDidChange(() => updateBranchColor(repo)),
      repo.onDidCheckout(() => updateBranchColor(repo)),
    );
  }

  // 既存リポジトリがあれば即処理、なければ最初の検出を待つ
  const repo = gitApi.repositories[0];
  if (repo) {
    setupRepo(repo);
  } else {
    const disposable = gitApi.onDidOpenRepository((newRepo: Repository) => {
      disposable.dispose();
      setupRepo(newRepo);
    });
    context.subscriptions.push(disposable);
  }
}

/** 設定変更のリスナーを登録する */
function registerConfigListeners(
  context: vscode.ExtensionContext,
  gitApi: API,
  statusBar: BranchPainterStatusBar,
): void {
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('branchPainter.enabled')) {
        const repo = gitApi.repositories[0];
        if (repo) {
          statusBar.update(repo);
        } else {
          statusBar.hide();
        }
      }
    }),
  );
}

/** ステータスバーアイテムを生成し、context に登録する */
function createStatusBar(context: vscode.ExtensionContext): BranchPainterStatusBar {
  const statusBar = new BranchPainterStatusBar();
  context.subscriptions.push(statusBar);
  return statusBar;
}

export async function activate(context: vscode.ExtensionContext) {
  const gitApi = await getGitApi().catch((error: unknown) => {
    return undefined;
  });
  if (!gitApi) {
    return;
  }

  const statusBar = createStatusBar(context);
  registerCommands(context, gitApi);
  registerRepoListeners(context, gitApi, statusBar);
  registerConfigListeners(context, gitApi, statusBar);
}

export async function deactivate(): Promise<void> {
  await resetTheme();
}
