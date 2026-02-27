import * as vscode from 'vscode';
import { applyBranchColors, applyThemeForBranch, resetTheme } from './themeApplier';
import type { HexColor } from './types';
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

  let hexColor: string;

  if (selected.label === CUSTOM_HEX_LABEL) {
    const input = await vscode.window.showInputBox({
      prompt: 'HEXカラーコードを入力 (#rrggbb)',
      validateInput: (value) =>
        /^#[0-9a-fA-F]{6}$/.test(value.trim()) ? undefined : '形式: #rrggbb',
    });
    if (!input) {
      return;
    }
    hexColor = input.trim();
  } else {
    const preset = PRESET_COLORS.find((p) => p.label === selected.label);
    if (!preset) {
      return;
    }
    hexColor = preset.color;
  }

  const bg = hexColor as HexColor;
  const fg = getForegroundColor(bg);

  // branchColorMap に保存
  const branchName = getCurrentBranchName(gitApi);
  if (branchName) {
    const config = vscode.workspace.getConfiguration('branchPainter');
    const colorMap = { ...config.get<Record<string, string>>('branchColorMap', {}) };
    colorMap[branchName] = bg;
    await config.update('branchColorMap', colorMap, vscode.ConfigurationTarget.Workspace);
  }

  // テーマを即時適用
  await applyBranchColors({
    titleBar: bg,
    titleBarForeground: fg,
    statusBar: bg,
    statusBarForeground: fg,
    activityBar: bg,
    activityBarForeground: fg,
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
  const config = vscode.workspace.getConfiguration('branchPainter');
  const enabled = config.get<boolean>('enabled', true);
  await config.update('enabled', !enabled, vscode.ConfigurationTarget.Workspace);

  if (enabled) {
    // 無効化時はテーマをリセットして元に戻す
    await resetTheme();
  } else {
    // 有効化時は即座に色を適用
    const branchName = getCurrentBranchName(gitApi);
    if (branchName) {
      await applyThemeForBranch(branchName);
    }
  }

  vscode.window.showInformationMessage(
    `Branch Painter: 自動色分けを${!enabled ? '有効' : '無効'}にしました`,
  );
}
