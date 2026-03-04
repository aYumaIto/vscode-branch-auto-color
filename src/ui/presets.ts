/**
 * presets — QuickPick に表示するプリセットカラーの定義
 */

import type { HexColor } from '../types';

/** プリセットカラー定義 */
export type PresetColor = {
  label: string;
  description: string;
  color: HexColor;
};

/** QuickPick に表示するプリセットカラー一覧 */
export const PRESET_COLORS: PresetColor[] = [
  { label: '$(circle-filled) Red', description: '#cc3333', color: '#cc3333' as HexColor },
  { label: '$(circle-filled) Green', description: '#1e8a3a', color: '#1e8a3a' as HexColor },
  { label: '$(circle-filled) Blue', description: '#3a7ae8', color: '#3a7ae8' as HexColor },
  { label: '$(circle-filled) Purple', description: '#8a3aaa', color: '#8a3aaa' as HexColor },
  { label: '$(circle-filled) Orange', description: '#cc7a00', color: '#cc7a00' as HexColor },
  { label: '$(circle-filled) Teal', description: '#1a8a7a', color: '#1a8a7a' as HexColor },
];

/** カスタム HEX 入力オプションの QuickPick ラベル */
export const CUSTOM_HEX_LABEL = '$(edit) Custom HEX...';
