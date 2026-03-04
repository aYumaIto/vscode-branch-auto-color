import * as vscode from 'vscode';
import { applyBranchColors, applyThemeForBranch, resetTheme } from './themeApplier';
import { isEnabled, setEnabled, readAffectOptions, readThemeApplyOptions, saveBranchColor } from './config';
import type { HexColor } from './types';
import { isHexColor } from './types';
import { getForegroundColor } from './colorGenerator';
import type { API } from './git';

/** プリセットカラー定義 */
type PresetColor = {
  label: string;
  description: string;
  color: HexColor;
};

const PRESET_COLORS: PresetColor[] = [
  { label: '$(circle-filled) Red', description: '#cc3333', color: '#cc3333' as HexColor },
  { label: '$(circle-filled) Green', description: '#1e8a3a', color: '#1e8a3a' as HexColor },
  { label: '$(circle-filled) Blue', description: '#3a7ae8', color: '#3a7ae8' as HexColor },
  { label: '$(circle-filled) Purple', description: '#8a3aaa', color: '#8a3aaa' as HexColor },
  { label: '$(circle-filled) Orange', description: '#cc7a00', color: '#cc7a00' as HexColor },
  { label: '$(circle-filled) Teal', description: '#1a8a7a', color: '#1a8a7a' as HexColor },
];

const CUSTOM_HEX_LABEL = '$(edit) Custom HEX...';

/** Git API から現在のブランチ名を取得する */
function getCurrentBranchName(gitApi: API): string | undefined {
  const repo = gitApi.repositories[0];
  return repo?.state.HEAD?.name;
}

/**
 * 手動で色を選択して適用
 * QuickPick でプリセットカラー一覧を表示し、選択後にテーマを即時適用する。
 * 「Custom HEX...」を選ぶと InputBox で HEX 値を直接入力できる。
 * 選択した色は branchColorMap に保存される。
 */
export async function setColor(gitApi: API): Promise<void> {
  const items: vscode.QuickPickItem[] = [
    ...PRESET_COLORS.map((p) => ({ label: p.label, description: p.description })),
    { label: CUSTOM_HEX_LABEL, description: 'HEXカラーコードを直接入力' },
  ];

  const selected = await vscode.window.showQuickPick(items, {
    placeHolder: '色を選択してください',
  });
  if (!selected) {
    return;
  }

  let hexColor: HexColor;

  if (selected.label === CUSTOM_HEX_LABEL) {
    // #rrggbb, #rgb, #rrggbbaa 形式を受け付ける
    const input = await vscode.window.showInputBox({
      prompt: 'HEXカラーコードを入力 (#rgb, #rrggbb, #rrggbbaa)',
      validateInput: (value) =>
        isHexColor(value.trim()) || /^#[0-9a-fA-F]{3}$/.test(value.trim())
          ? undefined
          : '形式: #rgb, #rrggbb, #rrggbbaa',
    });
    if (!input) {
      return;
    }
    hexColor = input.trim() as HexColor;
  } else {
    const preset = PRESET_COLORS.find((p) => p.label === selected.label);
    if (!preset) {
      return;
    }
    hexColor = preset.color;
  }

  const bg = hexColor;
  const fg = getForegroundColor(bg);

  // branchColorMap に保存する対象ブランチを取得
  const branchName = getCurrentBranchName(gitApi);
  if (!branchName) {
    vscode.window.showErrorMessage(
      'Branch Painter: Gitリポジトリが開かれていないか、現在のブランチを特定できないため色を適用できません。',
    );
    return;
  }

  await saveBranchColor(branchName, bg);

  // テーマを即時適用（ユーザー設定に応じて対象 UI を制御）
  const { affectTitleBar, affectStatusBar, affectActivityBar } = readAffectOptions();

  await applyBranchColors({
    ...(affectTitleBar && { titleBar: bg, titleBarForeground: fg }),
    ...(affectStatusBar && { statusBar: bg, statusBarForeground: fg }),
    ...(affectActivityBar && { activityBar: bg, activityBarForeground: fg }),
  });

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
