/**
 * colorGenerator — ブランチ名からの色生成モジュール
 *
 * ブランチ名の文字列ハッシュから HSL カラーを生成し、
 * 適切な前景色（白/黒）を自動選択する。
 */

/**
 * djb2 ハッシュアルゴリズムで文字列をハッシュ化する。
 * 同一入力に対して常に同一の数値を返す（決定的）。
 */
export function djb2Hash(str: string): number {
	let hash = 5381;
	for (let i = 0; i < str.length; i++) {
		// hash * 33 + charCode
		hash = (hash * 33) ^ str.charCodeAt(i);
	}
	// 符号なし 32 ビット整数に変換
	return hash >>> 0;
}

/**
 * HSL 値を HEX カラー文字列に変換する。
 * @param h Hue (0-360)
 * @param s Saturation (0-1)
 * @param l Lightness (0-1)
 * @returns HEX カラー文字列 (例: "#ff0000")
 */
export function hslToHex(h: number, s: number, l: number): string {
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

	return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
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
): string {
	const hash = djb2Hash(branchName);
	const hue = hash % 360;
	return hslToHex(hue, saturation, lightness);
}

/**
 * HEX カラーの相対輝度を計算する (WCAG 2.0)。
 * @see https://www.w3.org/TR/WCAG20/#relativeluminancedef
 */
export function getRelativeLuminance(hex: string): number {
	const r = parseInt(hex.slice(1, 3), 16) / 255;
	const g = parseInt(hex.slice(3, 5), 16) / 255;
	const b = parseInt(hex.slice(5, 7), 16) / 255;

	const linearize = (channel: number): number =>
		channel <= 0.03928
			? channel / 12.92
			: Math.pow((channel + 0.055) / 1.055, 2.4);

	return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

/**
 * 背景色に対して適切な前景色（白 or 黒）を返す。
 * WCAG AA 基準 (4.5:1) を満たすコントラスト比を保証する。
 */
export function getForegroundColor(backgroundHex: string): string {
	const luminance = getRelativeLuminance(backgroundHex);
	// 白と黒それぞれとのコントラスト比を比較
	const contrastWithWhite = (1.0 + 0.05) / (luminance + 0.05);
	const contrastWithBlack = (luminance + 0.05) / (0.0 + 0.05);

	return contrastWithWhite >= contrastWithBlack ? '#ffffff' : '#000000';
}

/** getColorForBranch のオプション */
export interface ColorOptions {
	branchColorMap?: Record<string, string>;
	saturation?: number;
	lightness?: number;
}

/** getColorForBranch の戻り値 */
export interface BranchColor {
	background: string;
	foreground: string;
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
	const background =
		branchColorMap?.[branchName] ??
		generateColorFromBranch(branchName, saturation, lightness);

	const foreground = getForegroundColor(background);

	return { background, foreground };
}
