/**
 * themeApplierCore — vscode 非依存の純粋関数群
 *
 * テスト容易性のため、vscode API に依存しないロジックをこのモジュールに分離する。
 */

import { HexColor } from './types';

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
export function removeManagedKeys(existing: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(existing).filter(
      ([key]) => !(MANAGED_COLOR_KEYS as readonly string[]).includes(key),
    ),
  );
}
