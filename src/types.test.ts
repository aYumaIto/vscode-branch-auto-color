import * as assert from 'assert';
import { isHexColor } from './types';

suite('types', () => {
  suite('isHexColor', () => {
    // =============================================
    // 有効な形式
    // =============================================
    test('#rrggbb 形式を受け付ける', () => {
      assert.ok(isHexColor('#ff0000'));
      assert.ok(isHexColor('#00ff00'));
      assert.ok(isHexColor('#0000ff'));
      assert.ok(isHexColor('#000000'));
      assert.ok(isHexColor('#ffffff'));
      assert.ok(isHexColor('#abcdef'));
    });

    test('#rgb 形式を受け付ける', () => {
      assert.ok(isHexColor('#f00'));
      assert.ok(isHexColor('#0f0'));
      assert.ok(isHexColor('#abc'));
      assert.ok(isHexColor('#000'));
      assert.ok(isHexColor('#fff'));
    });

    test('#rrggbbaa 形式を受け付ける', () => {
      assert.ok(isHexColor('#ff000080'));
      assert.ok(isHexColor('#00ff00ff'));
      assert.ok(isHexColor('#0000ff00'));
    });

    test('大文字・小文字を区別しない', () => {
      assert.ok(isHexColor('#AABBCC'));
      assert.ok(isHexColor('#AaBbCc'));
      assert.ok(isHexColor('#ABC'));
      assert.ok(isHexColor('#AABBCCDD'));
    });

    // =============================================
    // 無効な形式
    // =============================================
    test('# なしは無効', () => {
      assert.ok(!isHexColor('ff0000'));
      assert.ok(!isHexColor('abc'));
    });

    test('空文字列は無効', () => {
      assert.ok(!isHexColor(''));
    });

    test('# のみは無効', () => {
      assert.ok(!isHexColor('#'));
    });

    test('桁数が不正な場合は無効', () => {
      assert.ok(!isHexColor('#f'));           // 1桁
      assert.ok(!isHexColor('#ff'));          // 2桁
      assert.ok(!isHexColor('#ffff'));        // 4桁
      assert.ok(!isHexColor('#fffff'));       // 5桁
      assert.ok(!isHexColor('#fffffff'));     // 7桁
      assert.ok(!isHexColor('#fffffffff'));   // 9桁
    });

    test('16進数以外の文字を含む場合は無効', () => {
      assert.ok(!isHexColor('#gggggg'));
      assert.ok(!isHexColor('#xyz'));
      assert.ok(!isHexColor('#12345g'));
    });

    test('前後にスペースがある場合は無効', () => {
      assert.ok(!isHexColor(' #ff0000'));
      assert.ok(!isHexColor('#ff0000 '));
    });

    test('CSS色名は無効', () => {
      assert.ok(!isHexColor('red'));
      assert.ok(!isHexColor('blue'));
    });
  });
});
