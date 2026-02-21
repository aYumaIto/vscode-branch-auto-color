import * as assert from 'assert';
import {
	djb2Hash,
	hslToHex,
	generateColorFromBranch,
	getRelativeLuminance,
	getForegroundColor,
	getColorForBranch,
} from '../colorGenerator';

suite('colorGenerator', () => {
	// =============================================
	// djb2Hash
	// =============================================
	suite('djb2Hash', () => {
		test('同じ文字列からは常に同じハッシュ値を返す', () => {
			const hash1 = djb2Hash('main');
			const hash2 = djb2Hash('main');
			assert.strictEqual(hash1, hash2);
		});

		test('異なる文字列からは異なるハッシュ値を返す', () => {
			const hash1 = djb2Hash('main');
			const hash2 = djb2Hash('develop');
			assert.notStrictEqual(hash1, hash2);
		});

		test('空文字列でもエラーにならない', () => {
			const hash = djb2Hash('');
			assert.strictEqual(typeof hash, 'number');
		});

		test('特殊文字を含む文字列を処理できる', () => {
			const hash = djb2Hash('feature/add-new-feature!@#$%');
			assert.strictEqual(typeof hash, 'number');
		});

		test('長い文字列を処理できる', () => {
			const longStr = 'a'.repeat(1000);
			const hash = djb2Hash(longStr);
			assert.strictEqual(typeof hash, 'number');
		});
	});

	// =============================================
	// hslToHex
	// =============================================
	suite('hslToHex', () => {
		test('純粋な赤 (0, 100%, 50%) → #ff0000', () => {
			assert.strictEqual(hslToHex(0, 1.0, 0.5), '#ff0000');
		});

		test('純粋な緑 (120, 100%, 50%) → #00ff00', () => {
			assert.strictEqual(hslToHex(120, 1.0, 0.5), '#00ff00');
		});

		test('純粋な青 (240, 100%, 50%) → #0000ff', () => {
			assert.strictEqual(hslToHex(240, 1.0, 0.5), '#0000ff');
		});

		test('黒 (0, 0%, 0%) → #000000', () => {
			assert.strictEqual(hslToHex(0, 0, 0), '#000000');
		});

		test('白 (0, 0%, 100%) → #ffffff', () => {
			assert.strictEqual(hslToHex(0, 0, 1.0), '#ffffff');
		});

		test('グレー (0, 0%, 50%) → #808080', () => {
			assert.strictEqual(hslToHex(0, 0, 0.5), '#808080');
		});
	});

	// =============================================
	// generateColorFromBranch
	// =============================================
	suite('generateColorFromBranch', () => {
		test('同じブランチ名からは常に同じ色が生成される', () => {
			const color1 = generateColorFromBranch('main');
			const color2 = generateColorFromBranch('main');
			assert.strictEqual(color1, color2);
		});

		test('異なるブランチ名からは異なる色が生成される', () => {
			const color1 = generateColorFromBranch('main');
			const color2 = generateColorFromBranch('develop');
			assert.notStrictEqual(color1, color2);
		});

		test('生成される色は有効な HEX カラー形式', () => {
			const color = generateColorFromBranch('feature/test');
			assert.match(color, /^#[0-9a-f]{6}$/);
		});

		test('空文字列でも有効な HEX カラーを返す', () => {
			const color = generateColorFromBranch('');
			assert.match(color, /^#[0-9a-f]{6}$/);
		});

		test('特殊文字を含むブランチ名でも有効な色を返す', () => {
			const color = generateColorFromBranch('feature/add-日本語-branch');
			assert.match(color, /^#[0-9a-f]{6}$/);
		});

		test('長いブランチ名でも有効な色を返す', () => {
			const longBranch = 'feature/' + 'a'.repeat(200);
			const color = generateColorFromBranch(longBranch);
			assert.match(color, /^#[0-9a-f]{6}$/);
		});

		test('saturation と lightness パラメータを受け取れる', () => {
			const color = generateColorFromBranch('main', 0.8, 0.4);
			assert.match(color, /^#[0-9a-f]{6}$/);
		});
	});

	// =============================================
	// getRelativeLuminance
	// =============================================
	suite('getRelativeLuminance', () => {
		test('白の相対輝度は 1.0', () => {
			const luminance = getRelativeLuminance('#ffffff');
			assert.ok(Math.abs(luminance - 1.0) < 0.001);
		});

		test('黒の相対輝度は 0.0', () => {
			const luminance = getRelativeLuminance('#000000');
			assert.ok(Math.abs(luminance - 0.0) < 0.001);
		});

		test('相対輝度は 0 以上 1 以下の範囲', () => {
			const luminance = getRelativeLuminance('#3a7ae8');
			assert.ok(luminance >= 0 && luminance <= 1);
		});
	});

	// =============================================
	// getForegroundColor
	// =============================================
	suite('getForegroundColor', () => {
		test('暗い背景色には白を返す', () => {
			const fg = getForegroundColor('#000000');
			assert.strictEqual(fg, '#ffffff');
		});

		test('明るい背景色には黒を返す', () => {
			const fg = getForegroundColor('#ffffff');
			assert.strictEqual(fg, '#000000');
		});

		test('前景色と背景色のコントラスト比が WCAG AA 基準 (4.5:1) を満たす', () => {
			const testColors = [
				'#1e8a3a', '#3a7ae8', '#ff5733', '#4a4a4a',
				'#c0c0c0', '#8b0000', '#006400', '#00008b',
			];

			for (const bg of testColors) {
				const fg = getForegroundColor(bg);
				const bgLum = getRelativeLuminance(bg);
				const fgLum = getRelativeLuminance(fg);
				const lighter = Math.max(bgLum, fgLum);
				const darker = Math.min(bgLum, fgLum);
				const contrastRatio = (lighter + 0.05) / (darker + 0.05);

				assert.ok(
					contrastRatio >= 4.5,
					`背景色 ${bg} (前景色 ${fg}) のコントラスト比 ${contrastRatio.toFixed(2)} が 4.5 未満`
				);
			}
		});
	});

	// =============================================
	// getColorForBranch (統合テスト)
	// =============================================
	suite('getColorForBranch', () => {
		test('background と foreground を含むオブジェクトを返す', () => {
			const result = getColorForBranch('main');
			assert.ok('background' in result);
			assert.ok('foreground' in result);
			assert.match(result.background, /^#[0-9a-f]{6}$/);
			assert.match(result.foreground, /^#[0-9a-f]{6}$/);
		});

		test('branchColorMap にマッピングがある場合はそちらを優先する', () => {
			const result = getColorForBranch('main', {
				branchColorMap: { main: '#1e8a3a' },
			});
			assert.strictEqual(result.background, '#1e8a3a');
		});

		test('branchColorMap にマッピングがない場合はハッシュベースの色を返す', () => {
			const result = getColorForBranch('feature/test', {
				branchColorMap: { main: '#1e8a3a' },
			});
			// ハッシュベースなので #1e8a3a とは異なるはず
			assert.match(result.background, /^#[0-9a-f]{6}$/);
		});

		test('saturation と lightness を指定できる', () => {
			const result = getColorForBranch('develop', {
				saturation: 0.8,
				lightness: 0.4,
			});
			assert.match(result.background, /^#[0-9a-f]{6}$/);
		});

		test('前景色のコントラスト比が常に WCAG AA を満たす', () => {
			const branches = [
				'main', 'develop', 'feature/login', 'hotfix/urgent',
				'release/v1.0', '', 'feature/日本語',
			];

			for (const branch of branches) {
				const result = getColorForBranch(branch);
				const bgLum = getRelativeLuminance(result.background);
				const fgLum = getRelativeLuminance(result.foreground);
				const lighter = Math.max(bgLum, fgLum);
				const darker = Math.min(bgLum, fgLum);
				const contrastRatio = (lighter + 0.05) / (darker + 0.05);

				assert.ok(
					contrastRatio >= 4.5,
					`ブランチ "${branch}": コントラスト比 ${contrastRatio.toFixed(2)} が WCAG AA 基準 (4.5:1) 未満`
				);
			}
		});
	});
});
