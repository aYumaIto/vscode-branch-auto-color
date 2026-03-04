/**
 * constants — 複数モジュールで共有される定数
 */

/** コマンドID */
export const COMMAND_SET_COLOR = 'branchAutoColor.setColor';
export const COMMAND_RESET_COLOR = 'branchAutoColor.resetColor';
export const COMMAND_TOGGLE_AUTO_COLOR = 'branchAutoColor.toggleAutoColor';

/** ブランチ名が取得できない場合のフォールバック値 */
export const UNKNOWN_BRANCH = 'unknown';

/** デフォルトの彩度 (0-1) */
export const DEFAULT_SATURATION = 0.6;

/** デフォルトの明度 (0-1) */
export const DEFAULT_LIGHTNESS = 0.3;
