import * as vscode from 'vscode';
import { applyBranchColors, resetTheme } from './themeApplier';
import { HexColor } from './types';
import { getForegroundColor } from './colorGenerator';

/**
 * 手動で色を選択して適用
 */
export async function setColor() {
  const color = await vscode.window.showInputBox({
    prompt: 'HEXカラーコードを入力 (#rrggbb)',
    validateInput: (value) => /^#[0-9a-fA-F]{6}$/.test(value.trim()) ? undefined : '形式: #rrggbb',
  });
  if (color) {
    const bg = color.trim() as HexColor;
    const fg = getForegroundColor(bg);
    await applyBranchColors({
      titleBar: bg,
      titleBarForeground: fg,
      statusBar: bg,
      statusBarForeground: fg,
      activityBar: bg,
      activityBarForeground: fg,
    });
    vscode.window.showInformationMessage(`Branch Painter: 色を適用しました (${color})`);
  }
}

/**
 * 拡張機能が追加した色設定のみリセット
 */
export async function resetColor() {
  await resetTheme();
  vscode.window.showInformationMessage('Branch Painter: 色設定をリセットしました');
}

/**
 * 自動色分けの有効/無効を切り替え（設定値をトグル）
 */
export async function toggleAutoColor() {
  const config = vscode.workspace.getConfiguration('branchPainter');
  const enabled = config.get<boolean>('enabled', true);
  await config.update('enabled', !enabled, vscode.ConfigurationTarget.Workspace);

  // 無効化時はテーマをリセットして元に戻す
  if (enabled) {
    await resetTheme();
  }

  vscode.window.showInformationMessage(`Branch Painter: 自動色分けを${!enabled ? '有効' : '無効'}にしました`);
}
