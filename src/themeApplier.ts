import * as vscode from 'vscode';
import { HexColor } from './types';
import { getColorForBranch } from './colorGenerator';

/**
 * themeApplier が管理する colorCustomizations のキー一覧
 */
export const MANAGED_COLOR_KEYS = [
	'titleBar.activeBackground',
	'titleBar.inactiveBackground',
	'titleBar.activeForeground',
	'titleBar.inactiveForeground',
	'statusBar.background',
	'statusBar.foreground',
	'statusBar.noFolderBackground',
	'activityBar.background',
	'activityBar.foreground',
] as const;

/** applyBranchColors に渡す色の指定 */
export type BranchColorOptions = {
	titleBar?: HexColor;
	titleBarForeground?: HexColor;
	statusBar?: HexColor;
	statusBarForeground?: HexColor;
	activityBar?: HexColor;
	activityBarForeground?: HexColor;
};

/**
 * window.title のフォーマット文字列に ${branch} を埋め込む（純粋関数）
 */
export function formatBranchTitle(format: string, branchName: string): string {
	return format.replace(/\$\{branch\}/g, branchName);
}

/**
 * 既存の colorCustomizations に新しい色設定をマージする（純粋関数）
 * 管理キーは一旦削除してから新しい値を追加する
 */
export function buildColorCustomizations(
	existing: Record<string, string>,
	colors: BranchColorOptions,
): Record<string, string> {
	const cleaned = removeManagedKeys(existing);
	return {
		...cleaned,
		...(colors.titleBar && {
			'titleBar.activeBackground': colors.titleBar,
			'titleBar.inactiveBackground': colors.titleBar,
		}),
		...(colors.titleBarForeground && {
			'titleBar.activeForeground': colors.titleBarForeground,
			'titleBar.inactiveForeground': colors.titleBarForeground,
		}),
		...(colors.statusBar && {
			'statusBar.background': colors.statusBar,
			'statusBar.noFolderBackground': colors.statusBar,
		}),
		...(colors.statusBarForeground && {
			'statusBar.foreground': colors.statusBarForeground,
		}),
		...(colors.activityBar && {
			'activityBar.background': colors.activityBar,
		}),
		...(colors.activityBarForeground && {
			'activityBar.foreground': colors.activityBarForeground,
		}),
	};
}

/**
 * 管理キーを削除した colorCustomizations を返す（純粋関数）
 */
export function removeManagedKeys(
	existing: Record<string, string>,
): Record<string, string> {
	return Object.fromEntries(
		Object.entries(existing).filter(
			([key]) => !(MANAGED_COLOR_KEYS as readonly string[]).includes(key),
		),
	);
}

/**
 * workbench.colorCustomizations に色を適用する
 * 既存設定をマージし、タイトルバー・ステータスバー・アクティビティバーを個別制御
 */
export function applyBranchColors(colors: BranchColorOptions): void {
	const config = vscode.workspace.getConfiguration('workbench');
	const current = config.get<Record<string, string>>('colorCustomizations') || {};
	const merged = buildColorCustomizations(current, colors);
	config.update('colorCustomizations', merged, vscode.ConfigurationTarget.Workspace);
}

/**
 * 拡張機能が追加した色設定のみ削除
 */
export function resetBranchColors(): void {
	const config = vscode.workspace.getConfiguration('workbench');
	const current = config.get<Record<string, string>>('colorCustomizations') || {};
	const filtered = removeManagedKeys(current);
	config.update('colorCustomizations', filtered, vscode.ConfigurationTarget.Workspace);
}

/**
 * ブランチ名に基づいてテーマを適用する
 * - branchPainter.enabled が false なら何もしない
 * - branchColorMap を優先し、なければ colorGenerator で色を生成
 * - 設定に応じて titleBar, statusBar, activityBar を個別に制御
 * - showBranchInTitle が有効な場合、window.title にブランチ名を反映
 */
export function applyThemeForBranch(branchName: string): void {
	const config = vscode.workspace.getConfiguration('branchPainter');

	if (!config.get<boolean>('enabled', true)) {
		return;
	}

	const branchColorMap = config.get<Record<string, string>>('branchColorMap', {});
	const saturation = config.get<number>('saturation', 0.6);
	const lightness = config.get<number>('lightness', 0.3);

	const affectTitleBar = config.get<boolean>('affectTitleBar', true);
	const affectStatusBar = config.get<boolean>('affectStatusBar', true);
	const affectActivityBar = config.get<boolean>('affectActivityBar', true);
	const showBranchInTitle = config.get<boolean>('showBranchInTitle', true);
	const titleFormat = config.get<string>(
		'titleFormat',
		'[${branch}] ${folderName} ${separator} ${activeEditorShort}${dirty}',
	);

	const { background, foreground } = getColorForBranch(branchName, {
		branchColorMap,
		saturation,
		lightness,
	});

	applyBranchColors({
		...(affectTitleBar && { titleBar: background, titleBarForeground: foreground }),
		...(affectStatusBar && { statusBar: background, statusBarForeground: foreground }),
		...(affectActivityBar && { activityBar: background, activityBarForeground: foreground }),
	});

	if (showBranchInTitle) {
		const title = formatBranchTitle(titleFormat, branchName);
		vscode.workspace.getConfiguration('window').update(
			'title',
			title,
			vscode.ConfigurationTarget.Workspace,
		);
	}
}

/**
 * テーマをリセットする
 * - 拡張機能が追加した colorCustomizations のキーのみ削除
 * - window.title をリセット
 */
export function resetTheme(): void {
	resetBranchColors();
	vscode.workspace.getConfiguration('window').update(
		'title',
		undefined,
		vscode.ConfigurationTarget.Workspace,
	);
}
