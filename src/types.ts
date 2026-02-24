/**
 * types — 共通型定義
 */

/**
 * HEX カラーを表す branded type。
 * `#rrggbb` または `#rrggbbaa` 形式の文字列。
 */
export type HexColor = string & { readonly __brand: 'HexColor' };

/** HEX カラー文字列の正規表現パターン */
const HEX_COLOR_PATTERN = /^#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

/**
 * 文字列が有効な HEX カラーかどうかを判定する型ガード。
 */
export function isHexColor(value: string): value is HexColor {
  return HEX_COLOR_PATTERN.test(value);
}

/** getColorForBranch のオプション */
export type ColorOptions = {
  branchColorMap?: Record<string, string>;
  saturation?: number;
  lightness?: number;
};

/** getColorForBranch の戻り値 */
export type BranchColor = {
  background: HexColor;
  foreground: HexColor;
};
