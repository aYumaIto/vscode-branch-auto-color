import * as vscode from 'vscode';
import { getColorForBranch } from './colorGenerator';
import type { HexColor, ThemeApplyOptions, BranchColorOptions } from '../types';

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

/**
 * window.title のフォーマット文字列に ${branch} を埋め込む
 */
export function formatBranchTitle(format: string, branchName: string): string {
  return format.replace(/\$\{branch\}/g, branchName);
}

/**
 * 既存の colorCustomizations に新しい色設定をマージする
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
 * 管理キーを削除した colorCustomizations を返す
 */
export function removeManagedKeys(existing: Record<string, string>): Record<string, string> {
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
export async function applyBranchColors(colors: BranchColorOptions): Promise<void> {
  const config = vscode.workspace.getConfiguration('workbench');
  const current = config.get<Record<string, string>>('colorCustomizations') || {};
  const merged = buildColorCustomizations(current, colors);
  await config.update('colorCustomizations', merged, vscode.ConfigurationTarget.Workspace);
}

/**
 * 拡張機能が追加した色設定のみ削除
 */
export async function resetBranchColors(): Promise<void> {
  const config = vscode.workspace.getConfiguration('workbench');
  const current = config.get<Record<string, string>>('colorCustomizations') || {};
  const filtered = removeManagedKeys(current);
  await config.update('colorCustomizations', filtered, vscode.ConfigurationTarget.Workspace);
}

/**
 * ブランチ名に基づいてテーマを適用する
 * - branchColorMap を優先し、なければ colorGenerator で色を生成
 * - 設定に応じて titleBar, statusBar, activityBar を個別に制御
 * - showBranchInTitle が有効な場合、window.title にブランチ名を反映
 * - getColorForBranch が例外を投げた場合はエラーメッセージを表示し、既存設定を壊さない
 *
 * 注意: enabled チェックは呼び出し元の責務。
 */
export async function applyThemeForBranch(
  branchName: string,
  options: ThemeApplyOptions,
): Promise<void> {
  let background: HexColor;
  let foreground: HexColor;
  try {
    ({ background, foreground } = getColorForBranch(branchName, {
      branchColorMap: options.branchColorMap,
      saturation: options.saturation,
      lightness: options.lightness,
    }));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    vscode.window.showErrorMessage(`Branch Painter: 色の生成に失敗しました — ${message}`);
    return;
  }

  await applyBranchColors({
    ...(options.affectTitleBar && { titleBar: background, titleBarForeground: foreground }),
    ...(options.affectStatusBar && { statusBar: background, statusBarForeground: foreground }),
    ...(options.affectActivityBar && { activityBar: background, activityBarForeground: foreground }),
  });

  if (options.showBranchInTitle) {
    const title = formatBranchTitle(options.titleFormat, branchName);
    await vscode.workspace
      .getConfiguration('window')
      .update('title', title, vscode.ConfigurationTarget.Workspace);
  }
}

/**
 * テーマをリセットする
 * - 拡張機能が追加した colorCustomizations のキーのみ削除
 * - window.title をリセット
 */
export async function resetTheme(): Promise<void> {
  await resetBranchColors();
  await vscode.workspace
    .getConfiguration('window')
    .update('title', undefined, vscode.ConfigurationTarget.Workspace);
}
