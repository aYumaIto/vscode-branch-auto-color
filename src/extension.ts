import * as vscode from 'vscode';
import { applyThemeForBranch, resetTheme } from './themeApplier';
import { setColor, resetColor, toggleAutoColor } from './commands';
import type { API, Repository } from './git';

export async function activate(context: vscode.ExtensionContext) {
	// Git拡張API取得
	const gitExt = vscode.extensions.getExtension('vscode.git');
	if (!gitExt) {
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

	// ブランチ名取得・テーマ適用
	function updateBranchColor(repo: Repository) {
		const branch = repo.state.HEAD?.name || 'unknown';
		applyThemeForBranch(branch);
	}

	// リポジトリにリスナーを登録し Disposable を返す
	function registerRepoListeners(repo: Repository): vscode.Disposable[] {
		return [
			repo.state.onDidChange(() => updateBranchColor(repo)),
			repo.onDidCheckout(() => updateBranchColor(repo)),
		];
	}

	// 既存リポジトリにリスナー登録
	for (const repo of gitApi.repositories) {
		updateBranchColor(repo);
		context.subscriptions.push(...registerRepoListeners(repo));
	}

	// 新規リポジトリにもリスナー登録
	context.subscriptions.push(
		gitApi.onDidOpenRepository((repo: Repository) => {
			updateBranchColor(repo);
			context.subscriptions.push(...registerRepoListeners(repo));
		}),
	);

	// コマンド登録
	context.subscriptions.push(
		vscode.commands.registerCommand('branchPainter.setColor', setColor),
		vscode.commands.registerCommand('branchPainter.resetColor', resetColor),
		vscode.commands.registerCommand('branchPainter.toggleAutoColor', toggleAutoColor)
	);
}

export async function deactivate(): Promise<void> {
	await resetTheme();
}
