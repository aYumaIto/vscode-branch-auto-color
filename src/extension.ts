import * as vscode from 'vscode';
import { applyThemeForBranch, resetTheme } from './themeApplier';
import { setColor, resetColor, toggleAutoColor } from './commands';
import { BranchPainterStatusBar } from './statusBarItem';
import type { API, APIState, Repository } from './git';

export async function activate(context: vscode.ExtensionContext) {
  console.log('[BranchPainter] activate() called');

  // Git拡張API取得
  const gitExt = vscode.extensions.getExtension('vscode.git');
  if (!gitExt) {
    console.log('[BranchPainter] Git extension not found');
    vscode.window.showErrorMessage('Branch Painter: Git拡張が見つかりません');
    return;
  }

  let gitApi: API;
  try {
    if (!gitExt.isActive) {
      await gitExt.activate();
    }
    gitApi = gitExt.exports.getAPI(1);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    vscode.window.showErrorMessage(`Branch Painter: Git API取得失敗 — ${message}`);
    return;
  }

  console.log(`[BranchPainter] Git API state: ${gitApi.state}, repositories: ${gitApi.repositories.length}`);

  // ステータスバーアイテム
  const statusBar = new BranchPainterStatusBar();
  context.subscriptions.push(statusBar);

  // テーマ適用処理を直列化するための Promise チェーン
  let lastApplyPromise: Promise<void> = Promise.resolve();

  // ブランチ名取得・テーマ適用（直列化して競合を防止）
  function updateBranchColor(repo: Repository) {
    const branch = repo.state.HEAD?.name || 'unknown';
    console.log(`[BranchPainter] updateBranchColor: branch="${branch}", rootUri="${repo.rootUri.toString()}"`);
    statusBar.update(repo);
    lastApplyPromise = lastApplyPromise
      .then(() => applyThemeForBranch(branch))
      .catch((error) => {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`[BranchPainter] テーマ適用失敗: ${message}`);
        vscode.window.showErrorMessage(`Branch Painter: テーマ適用失敗 — ${message}`);
      });
  }

  // リポジトリにリスナーを登録し Disposable を返す
  function registerRepoListeners(repo: Repository): vscode.Disposable[] {
    return [
      repo.state.onDidChange(() => updateBranchColor(repo)),
      repo.onDidCheckout(() => updateBranchColor(repo)),
    ];
  }

  // レースコンディション防止: 初期化待機の前にリスナーを登録し、
  // 待機中に検出されたリポジトリも確実に処理する
  const processedRepos = new Set<string>();

  function processRepo(repo: Repository) {
    const key = repo.rootUri.toString();
    if (processedRepos.has(key)) {
      console.log(`[BranchPainter] processRepo: skip (already processed) ${key}`);
      return;
    }
    processedRepos.add(key);
    console.log(`[BranchPainter] processRepo: new repo ${key}, kind=${repo.kind}`);
    updateBranchColor(repo);
    context.subscriptions.push(...registerRepoListeners(repo));
  }

  // 新規リポジトリのリスナーを初期化待機前に登録
  context.subscriptions.push(
    gitApi.onDidOpenRepository((repo: Repository) => {
      console.log(`[BranchPainter] onDidOpenRepository fired: ${repo.rootUri.toString()}`);
      processRepo(repo);
    }),
  );

  // APIが初期化済みでなければ初期化を待機（タイムアウト付き）
  if (gitApi.state !== 'initialized') {
    console.log('[BranchPainter] Waiting for Git API initialization...');
    const TIMEOUT_MS = 10_000;
    await new Promise<void>((resolve, reject) => {
      const timer = globalThis.setTimeout(() => {
        disposable.dispose();
        reject(new Error('Git API initialization timed out'));
      }, TIMEOUT_MS);
      const disposable = gitApi.onDidChangeState((state: APIState) => {
        if (state === 'initialized') {
          console.log('[BranchPainter] Git API initialized via event');
          globalThis.clearTimeout(timer);
          disposable.dispose();
          resolve();
        }
      });
      // リスナー登録前に initialized に遷移した場合に備え、登録後に再チェック
      if (gitApi.state === 'initialized') {
        console.log('[BranchPainter] Git API already initialized (race check)');
        globalThis.clearTimeout(timer);
        disposable.dispose();
        resolve();
      } else {
        context.subscriptions.push(disposable);
      }
    }).catch((error) => {
      const message = error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(`Branch Painter: ${message}`);
      return;
    });
  } else {
    console.log('[BranchPainter] Git API already initialized');
  }

  // 初期化完了後、既存リポジトリを処理（待機中に検出済みのものは重複スキップ）
  console.log(`[BranchPainter] Post-init repositories: ${gitApi.repositories.length}`);
  for (const repo of gitApi.repositories) {
    processRepo(repo);
  }

  // 設定変更時にステータスバーを更新
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

  // コマンド登録
  context.subscriptions.push(
    vscode.commands.registerCommand('branchPainter.setColor', () => setColor(gitApi)),
    vscode.commands.registerCommand('branchPainter.resetColor', resetColor),
    vscode.commands.registerCommand('branchPainter.toggleAutoColor', () =>
      toggleAutoColor(gitApi),
    ),
  );
}

export async function deactivate(): Promise<void> {
  await resetTheme();
}
