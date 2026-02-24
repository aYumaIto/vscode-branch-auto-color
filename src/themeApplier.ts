import * as vscode from 'vscode';
import { getColorForBranch } from './colorGenerator';
import {
  MANAGED_COLOR_KEYS,
  buildColorCustomizations,
  removeManagedKeys,
  formatBranchTitle,
} from './themeApplierCore';
import type { BranchColorOptions } from './themeApplierCore';
import type { HexColor } from './types';

// 純粋関数・型を re-export（既存の利用箇所との互換性のため）
export {
  MANAGED_COLOR_KEYS,
  buildColorCustomizations,
  removeManagedKeys,
  formatBranchTitle,
} from './themeApplierCore';
export type { BranchColorOptions } from './themeApplierCore';

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
 * - branchPainter.enabled が false なら何もしない
 * - branchColorMap を優先し、なければ colorGenerator で色を生成
 * - 設定に応じて titleBar, statusBar, activityBar を個別に制御
 * - showBranchInTitle が有効な場合、window.title にブランチ名を反映
 * - getColorForBranch が例外を投げた場合はエラーメッセージを表示し、既存設定を壊さない
 */
export async function applyThemeForBranch(branchName: string): Promise<void> {
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

  let background: HexColor;
  let foreground: HexColor;
  try {
    ({ background, foreground } = getColorForBranch(branchName, {
      branchColorMap,
      saturation,
      lightness,
    }));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    vscode.window.showErrorMessage(`Branch Painter: 色の生成に失敗しました — ${message}`);
    return;
  }

  await applyBranchColors({
    ...(affectTitleBar && { titleBar: background, titleBarForeground: foreground }),
    ...(affectStatusBar && { statusBar: background, statusBarForeground: foreground }),
    ...(affectActivityBar && { activityBar: background, activityBarForeground: foreground }),
  });

  if (showBranchInTitle) {
    const title = formatBranchTitle(titleFormat, branchName);
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
