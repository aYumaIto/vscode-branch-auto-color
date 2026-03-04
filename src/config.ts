/**
 * config — branchPainter 設定の読み取りヘルパー
 *
 * vscode.workspace.getConfiguration の呼び出しを集約し、
 * 各モジュールが直接設定を読み取らないようにする。
 */

import * as vscode from 'vscode';
import type { HexColor, ThemeApplyOptions } from './types';

const DEFAULT_TITLE_FORMAT =
  '[${branch}] ${folderName} ${separator} ${activeEditorShort}${dirty}';

/** branchPainter の設定オブジェクトを取得する（内部ヘルパー） */
function getConfig() {
  return vscode.workspace.getConfiguration('branchPainter');
}

/** branchPainter.enabled の現在値を返す */
export function isEnabled(): boolean {
  return getConfig().get<boolean>('enabled', true);
}

/** enabled 設定を書き込む */
export async function setEnabled(value: boolean): Promise<void> {
  await getConfig().update('enabled', value, vscode.ConfigurationTarget.Workspace);
}

/** タイトルバー・ステータスバー・アクティビティバーへの色適用を制御するオプション */
export type AffectOptions = {
  affectTitleBar: boolean;
  affectStatusBar: boolean;
  affectActivityBar: boolean;
};

/**
 * `branchPainter.affect*` 設定を読み取り、各バーへの色適用フラグを返す。
 *
 * @returns 各バーへの色適用を有効にするかどうかのフラグ（デフォルトはすべて `true`）
 */
export function readAffectOptions(): AffectOptions {
  const config = getConfig();
  return {
    affectTitleBar: config.get<boolean>('affectTitleBar', true),
    affectStatusBar: config.get<boolean>('affectStatusBar', true),
    affectActivityBar: config.get<boolean>('affectActivityBar', true),
  };
}

/** branchColorMap にブランチの色を保存する */
export async function saveBranchColor(branchName: string, color: HexColor): Promise<void> {
  const config = getConfig();
  const colorMap = { ...config.get<Record<string, string>>('branchColorMap', {}) };
  colorMap[branchName] = color;
  await config.update('branchColorMap', colorMap, vscode.ConfigurationTarget.Workspace);
}

/**
 * branchPainter 設定からテーマ適用オプションを読み取る。
 * enabled が false の場合は null を返す。
 */
export function readThemeApplyOptions(): ThemeApplyOptions | null {
  if (!isEnabled()) {
    return null;
  }

  const config = getConfig();
  const affect = readAffectOptions();

  return {
    branchColorMap: config.get<Record<string, string>>('branchColorMap', {}),
    saturation: config.get<number>('saturation', 0.6),
    lightness: config.get<number>('lightness', 0.3),
    showBranchInTitle: config.get<boolean>('showBranchInTitle', true),
    titleFormat: config.get<string>('titleFormat', DEFAULT_TITLE_FORMAT),
    ...affect,
  };
}
