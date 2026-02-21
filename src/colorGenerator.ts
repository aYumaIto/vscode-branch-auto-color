/**
 * colorGenerator — ブランチ名からの色生成モジュール
 *
 * ブランチ名の文字列ハッシュから HSL カラーを生成し、
 * 適切な前景色（白/黒）を自動選択する。
 */

import { HexColor, ColorOptions, BranchColor } from './types';

/**
 * HEX カラー文字列を正規化する。
 * - `#rrggbb` はそのまま（小文字化して）返す
 * - `#rgb` は `#rrggbb` 形式に展開する
 * - `#rrggbbaa` はそのまま返す（アルファ値は輝度計算では無視される）
 * - それ以外はエラーとする
 */
function normalizeHexColor(hex: string): HexColor {
	const trimmed = hex.trim();

	// `#rrggbb` 形式
	if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) {
		return trimmed.toLowerCase() as HexColor;
	}

	// `#rgb` 形式を `#rrggbb` に展開
	if (/^#[0-9a-fA-F]{3}$/.test(trimmed)) {
		const r = trimmed.charAt(1);
		const g = trimmed.charAt(2);
		const b = trimmed.charAt(3);
		return `#${r}${r}${g}${g}${b}${b}`.toLowerCase() as HexColor;
	}

	// `#rrggbbaa` 形式
	if (/^#[0-9a-fA-F]{8}$/.test(trimmed)) {
		return trimmed.toLowerCase() as HexColor;
	}

	throw new Error(
		`Invalid HEX color: "${hex}". Expected formats are "#rrggbb", "#rgb", or "#rrggbbaa".`,
	);
}

/**
 * djb2 ハッシュアルゴリズムで文字列をハッシュ化する。
 * 同一入力に対して常に同一の数値を返す（決定的）。
 */
export function djb2Hash(str: string): number {
	let hash = 5381;
	for (let i = 0; i < str.length; i++) {
		// hash * 33 + charCode (djb2), 常に 32 ビット範囲に収める
		hash = ((hash * 33) + str.charCodeAt(i)) >>> 0;
	}
	return hash;
}

/**
 * HSL 値を HEX カラー文字列に変換する。
 * @param h Hue (0-360)
 * @param s Saturation (0-1, 範囲外は clamp される)
 * @param l Lightness (0-1, 範囲外は clamp される)
 * @returns HEX カラー文字列 (例: "#ff0000")
 */
export function hslToHex(h: number, s: number, l: number): HexColor {
	// h を 0-360 の範囲に正規化
	h = ((h % 360) + 360) % 360;
	// s, l を 0-1 の範囲に clamp
	s = Math.max(0, Math.min(1, s));
	l = Math.max(0, Math.min(1, l));

	const c = (1 - Math.abs(2 * l - 1)) * s;
	const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
	const m = l - c / 2;

	let r: number, g: number, b: number;

	if (h < 60) {
		[r, g, b] = [c, x, 0];
	} else if (h < 120) {
		[r, g, b] = [x, c, 0];
	} else if (h < 180) {
		[r, g, b] = [0, c, x];
	} else if (h < 240) {
		[r, g, b] = [0, x, c];
	} else if (h < 300) {
		[r, g, b] = [x, 0, c];
	} else {
		[r, g, b] = [c, 0, x];
	}

	const toHex = (value: number): string => {
		const hex = Math.round((value + m) * 255).toString(16);
		return hex.padStart(2, '0');
	};

	return `#${toHex(r)}${toHex(g)}${toHex(b)}` as HexColor;
}

/**
 * ブランチ名からハッシュベースで HEX カラーを生成する。
 * @param branchName ブランチ名
 * @param saturation 彩度 (0-1, デフォルト: 0.6)
 * @param lightness 明度 (0-1, デフォルト: 0.3)
 * @returns HEX カラー文字列
 */
export function generateColorFromBranch(
	branchName: string,
	saturation: number = 0.6,
	lightness: number = 0.3,
): HexColor {
	const hash = djb2Hash(branchName);
	const hue = hash % 360;
	return hslToHex(hue, saturation, lightness);
}

/**
 * HEX カラーの相対輝度を計算する (WCAG 2.0)。
 * 入力は `#rrggbb` / `#rgb` / `#rrggbbaa` 形式を受け付ける。
 * 不正な形式の場合はエラーをスローする。
 * @see https://www.w3.org/TR/WCAG20/#relativeluminancedef
 */
export function getRelativeLuminance(hex: string): number {
	const normalized = normalizeHexColor(hex);
	const r = parseInt(normalized.slice(1, 3), 16) / 255;
	const g = parseInt(normalized.slice(3, 5), 16) / 255;
	const b = parseInt(normalized.slice(5, 7), 16) / 255;

	const linearize = (channel: number): number =>
		channel <= 0.03928
			? channel / 12.92
			: Math.pow((channel + 0.055) / 1.055, 2.4);

	return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

/**
 * 背景色に対して適切な前景色（白 or 黒）を返す。
 * 入力は有効な HEX カラー文字列であること。
 * 不正な形式の場合はエラーをスローする。
 * コントラスト比がより高い方（白または黒）を選択する。
 */
export function getForegroundColor(backgroundHex: string): HexColor {
	const luminance = getRelativeLuminance(backgroundHex);
	// 白と黒それぞれとのコントラスト比を比較
	const contrastWithWhite = (1.0 + 0.05) / (luminance + 0.05);
	const contrastWithBlack = (luminance + 0.05) / (0.0 + 0.05);

	return (contrastWithWhite >= contrastWithBlack ? '#ffffff' : '#000000') as HexColor;
}

/**
 * ブランチ名から背景色と前景色のペアを返す。
 * branchColorMap にマッピングがあればそちらを優先する。
 */
export function getColorForBranch(
	branchName: string,
	options: ColorOptions = {},
): BranchColor {
	const { branchColorMap, saturation = 0.6, lightness = 0.3 } = options;

	// branchColorMap にマッピングがある場合はそちらを優先
	const background: HexColor =
		branchColorMap?.[branchName]
			? normalizeHexColor(branchColorMap[branchName])
			: generateColorFromBranch(branchName, saturation, lightness);

	const foreground = getForegroundColor(background);

	return { background, foreground };
}
