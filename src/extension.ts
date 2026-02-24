
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
	const gitApi: API = gitExt.isActive ? gitExt.exports.getAPI(1) : await gitExt.activate().then(() => gitExt.exports.getAPI(1));
	if (!gitApi) {
		vscode.window.showErrorMessage('Branch Painter: Git API取得失敗');
		return;
	}

	// ブランチ名取得・テーマ適用
	function updateBranchColor(repo: Repository) {
		const branch = repo.state.HEAD?.name || 'unknown';
		applyThemeForBranch(branch);
	}

	// 既存リポジトリにリスナー登録
	gitApi.repositories.forEach((repo: Repository) => {
		updateBranchColor(repo);
		repo.state.onDidChange(() => updateBranchColor(repo));
		repo.onDidCheckout(() => updateBranchColor(repo));
	});

	// 新規リポジトリにもリスナー登録
	gitApi.onDidOpenRepository((repo: Repository) => {
		updateBranchColor(repo);
		repo.state.onDidChange(() => updateBranchColor(repo));
		repo.onDidCheckout(() => updateBranchColor(repo));
	});

	// コマンド登録
	context.subscriptions.push(
		vscode.commands.registerCommand('branchPainter.setColor', setColor),
		vscode.commands.registerCommand('branchPainter.resetColor', resetColor),
		vscode.commands.registerCommand('branchPainter.toggleAutoColor', toggleAutoColor)
	);
}

export function deactivate() {
	resetTheme();
}
