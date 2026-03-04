import * as vscode from 'vscode';
import { applyThemeForBranch, resetTheme } from '../core/themeApplier';
import { isEnabled, setEnabled, readThemeApplyOptions, saveBranchColor } from '../core/config';
import type { HexColor } from '../types';
import { isHexColor } from '../types';
import { PRESET_COLORS, CUSTOM_HEX_LABEL } from './presets';
import type { API } from '../git';

/** Git API から現在のブランチ名を取得する */
function getCurrentBranchName(gitApi: API): string | undefined {
  const repo = gitApi.repositories[0];
  return repo?.state.HEAD?.name;
}

/**
 * QuickPick でプリセットまたはカスタム HEX から色を選択させる。
 * キャンセル時は undefined を返す。
 */
async function pickColor(): Promise<HexColor | undefined> {
  const items: vscode.QuickPickItem[] = [
    ...PRESET_COLORS.map((p) => ({ label: p.label, description: p.description })),
    { label: CUSTOM_HEX_LABEL, description: 'HEXカラーコードを直接入力' },
  ];

  const selected = await vscode.window.showQuickPick(items, {
    placeHolder: '色を選択してください',
  });
  if (!selected) {
    return undefined;
  }

  if (selected.label === CUSTOM_HEX_LABEL) {
    return pickCustomHexColor();
  }

  const preset = PRESET_COLORS.find((p) => p.label === selected.label);
  return preset?.color;
}

/**
 * InputBox でカスタム HEX カラーコードを入力させる。
 * #rgb, #rrggbb, #rrggbbaa 形式を受け付ける。キャンセル時は undefined を返す。
 */
async function pickCustomHexColor(): Promise<HexColor | undefined> {
  const input = await vscode.window.showInputBox({
    prompt: 'HEXカラーコードを入力 (#rgb, #rrggbb, #rrggbbaa)',
    validateInput: (value) =>
      isHexColor(value.trim()) ? undefined : '形式: #rgb, #rrggbb, #rrggbbaa',
  });
  if (!input) {
    return undefined;
  }
  return input.trim() as HexColor;
}

/**
 * 手動で色を選択して適用する。
 * QuickPick でプリセットカラー一覧を表示し、選択後にテーマを即時適用する。
 * 「Custom HEX...」を選ぶと InputBox で HEX 値を直接入力できる。
 * 選択した色は branchColorMap に保存される。
 */
export async function setColor(gitApi: API): Promise<void> {
  const hexColor = await pickColor();
  if (!hexColor) {
    return;
  }

  const branchName = getCurrentBranchName(gitApi);
  if (!branchName) {
    vscode.window.showErrorMessage(
      'Branch Painter: Gitリポジトリが開かれていないか、現在のブランチを特定できないため色を適用できません。',
    );
    return;
  }

  await saveBranchColor(branchName, hexColor);
  const options = readThemeApplyOptions();
  if (options) {
    await applyThemeForBranch(branchName, options);
  }
  vscode.window.showInformationMessage(`Branch Painter: 色を適用しました (${hexColor})`);
}

/**
 * 拡張機能が追加した色設定のみリセット
 */
export async function resetColor(): Promise<void> {
  await resetTheme();
  vscode.window.showInformationMessage('Branch Painter: 色設定をリセットしました');
}

/**
 * 自動色分けの有効/無効を切り替え（設定値をトグル）
 * 有効化時は即座に色を適用、無効化時はリセットする。
 */
export async function toggleAutoColor(gitApi: API): Promise<void> {
  const enabled = isEnabled();
  await setEnabled(!enabled);

  if (enabled) {
    // 無効化時はテーマをリセットして元に戻す
    await resetTheme();
  } else {
    // 有効化時は即座に色を適用
    const branchName = getCurrentBranchName(gitApi);
    if (!branchName) {
      vscode.window.showErrorMessage(
        'Branch Painter: Gitリポジトリが開かれていないか、現在のHEADがブランチに紐付いていません。自動色分けを適用できませんでした。',
      );
      return;
    }
    const options = readThemeApplyOptions();
    if (options) {
      await applyThemeForBranch(branchName, options);
    }
  }

  vscode.window.showInformationMessage(
    `Branch Painter: 自動色分けを${!enabled ? '有効' : '無効'}にしました`,
  );
}
