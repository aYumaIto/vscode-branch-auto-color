import * as assert from 'assert';
import {
  formatBranchTitle,
  buildColorCustomizations,
  removeManagedKeys,
  MANAGED_COLOR_KEYS,
} from './themeApplierCore';
import { HexColor } from '../types';

suite('themeApplier', () => {
  // =============================================
  // formatBranchTitle
  // =============================================
  suite('formatBranchTitle', () => {
    test('${branch} をブランチ名に置換する', () => {
      const result = formatBranchTitle(
        '[${branch}] MyProject ${separator} ${activeEditorShort}',
        'feature/login',
      );
      assert.strictEqual(result, '[feature/login] MyProject ${separator} ${activeEditorShort}');
    });

    test('複数の ${branch} を全て置換する', () => {
      const result = formatBranchTitle('${branch} - ${branch}', 'main');
      assert.strictEqual(result, 'main - main');
    });

    test('${branch} がない場合はそのまま返す', () => {
      const result = formatBranchTitle('MyProject', 'main');
      assert.strictEqual(result, 'MyProject');
    });

    test('空文字列のブランチ名を処理できる', () => {
      const result = formatBranchTitle('[${branch}]', '');
      assert.strictEqual(result, '[]');
    });

    test('特殊文字を含むブランチ名を処理できる', () => {
      const result = formatBranchTitle('[${branch}]', 'feature/add-new!@#');
      assert.strictEqual(result, '[feature/add-new!@#]');
    });

    test('デフォルトの titleFormat パターンで正しく動作する', () => {
      const defaultFormat = '[${branch}] ${folderName} ${separator} ${activeEditorShort}${dirty}';
      const result = formatBranchTitle(defaultFormat, 'develop');
      assert.strictEqual(
        result,
        '[develop] ${folderName} ${separator} ${activeEditorShort}${dirty}',
      );
    });
  });

  // =============================================
  // buildColorCustomizations
  // =============================================
  suite('buildColorCustomizations', () => {
    test('既存設定を保持しつつ新しい色をマージする', () => {
      const existing = { 'editor.background': '#ffffff' };
      const result = buildColorCustomizations(existing, {
        titleBar: '#123456' as HexColor,
      });
      assert.strictEqual(result['editor.background'], '#ffffff');
      assert.strictEqual(result['titleBar.activeBackground'], '#123456');
      assert.strictEqual(result['titleBar.inactiveBackground'], '#123456');
    });

    test('titleBar の背景色と前景色が正しく設定される', () => {
      const result = buildColorCustomizations(
        {},
        {
          titleBar: '#123456' as HexColor,
          titleBarForeground: '#ffffff' as HexColor,
        },
      );
      assert.strictEqual(result['titleBar.activeBackground'], '#123456');
      assert.strictEqual(result['titleBar.inactiveBackground'], '#123456');
      assert.strictEqual(result['titleBar.activeForeground'], '#ffffff');
      assert.strictEqual(result['titleBar.inactiveForeground'], '#ffffff');
    });

    test('statusBar の背景色と前景色が正しく設定される', () => {
      const result = buildColorCustomizations(
        {},
        {
          statusBar: '#654321' as HexColor,
          statusBarForeground: '#000000' as HexColor,
        },
      );
      assert.strictEqual(result['statusBar.background'], '#654321');
      assert.strictEqual(result['statusBar.noFolderBackground'], '#654321');
      assert.strictEqual(result['statusBar.foreground'], '#000000');
    });

    test('activityBar の背景色と前景色が正しく設定される', () => {
      const result = buildColorCustomizations(
        {},
        {
          activityBar: '#abcdef' as HexColor,
          activityBarForeground: '#000000' as HexColor,
        },
      );
      assert.strictEqual(result['activityBar.background'], '#abcdef');
      assert.strictEqual(result['activityBar.foreground'], '#000000');
    });

    test('指定しないパーツは色が設定されない', () => {
      const result = buildColorCustomizations(
        {},
        {
          titleBar: '#123456' as HexColor,
        },
      );
      assert.strictEqual(result['statusBar.background'], undefined);
      assert.strictEqual(result['activityBar.background'], undefined);
      assert.strictEqual(result['statusBar.foreground'], undefined);
      assert.strictEqual(result['activityBar.foreground'], undefined);
    });

    test('空の colors の場合、既存の非管理キーのみ返す', () => {
      const existing = { 'editor.background': '#ffffff' };
      const result = buildColorCustomizations(existing, {});
      assert.deepStrictEqual(result, { 'editor.background': '#ffffff' });
    });

    test('既存の管理キーは新しい値で上書きされる', () => {
      const existing = {
        'titleBar.activeBackground': '#oldold',
        'editor.background': '#ffffff',
      };
      const result = buildColorCustomizations(existing, {
        titleBar: '#new123' as HexColor,
      });
      assert.strictEqual(result['titleBar.activeBackground'], '#new123');
      assert.strictEqual(result['editor.background'], '#ffffff');
    });

    test('既存の管理キーは colors で指定しない場合に削除される', () => {
      const existing = {
        'titleBar.activeBackground': '#oldold',
        'statusBar.background': '#oldold',
        'editor.background': '#ffffff',
      };
      // titleBar のみ指定し、statusBar は指定しない
      const result = buildColorCustomizations(existing, {
        titleBar: '#new123' as HexColor,
      });
      assert.strictEqual(result['titleBar.activeBackground'], '#new123');
      assert.strictEqual(result['statusBar.background'], undefined);
      assert.strictEqual(result['editor.background'], '#ffffff');
    });

    test('全パーツの背景色と前景色を一度に設定できる', () => {
      const result = buildColorCustomizations(
        {},
        {
          titleBar: '#111111' as HexColor,
          titleBarForeground: '#ffffff' as HexColor,
          statusBar: '#222222' as HexColor,
          statusBarForeground: '#ffffff' as HexColor,
          activityBar: '#333333' as HexColor,
          activityBarForeground: '#ffffff' as HexColor,
        },
      );
      assert.strictEqual(result['titleBar.activeBackground'], '#111111');
      assert.strictEqual(result['titleBar.activeForeground'], '#ffffff');
      assert.strictEqual(result['statusBar.background'], '#222222');
      assert.strictEqual(result['statusBar.foreground'], '#ffffff');
      assert.strictEqual(result['activityBar.background'], '#333333');
      assert.strictEqual(result['activityBar.foreground'], '#ffffff');
    });
  });

  // =============================================
  // removeManagedKeys
  // =============================================
  suite('removeManagedKeys', () => {
    test('管理キーのみ削除し、他のキーは保持する', () => {
      const existing = {
        'titleBar.activeBackground': '#123456',
        'titleBar.inactiveBackground': '#123456',
        'statusBar.background': '#654321',
        'editor.background': '#ffffff',
        'editor.foreground': '#000000',
      };
      const result = removeManagedKeys(existing);
      assert.deepStrictEqual(result, {
        'editor.background': '#ffffff',
        'editor.foreground': '#000000',
      });
    });

    test('管理キーがない場合はそのまま返す', () => {
      const existing = { 'editor.background': '#ffffff' };
      const result = removeManagedKeys(existing);
      assert.deepStrictEqual(result, { 'editor.background': '#ffffff' });
    });

    test('空のオブジェクトの場合は空を返す', () => {
      const result = removeManagedKeys({});
      assert.deepStrictEqual(result, {});
    });

    test('全ての MANAGED_COLOR_KEYS が削除される', () => {
      const existing: Record<string, string> = {};
      for (const key of MANAGED_COLOR_KEYS) {
        existing[key] = '#123456';
      }
      existing['editor.background'] = '#ffffff';
      const result = removeManagedKeys(existing);
      assert.deepStrictEqual(result, { 'editor.background': '#ffffff' });
    });

    test('foreground キーも削除される', () => {
      const existing = {
        'titleBar.activeForeground': '#ffffff',
        'titleBar.inactiveForeground': '#ffffff',
        'statusBar.foreground': '#ffffff',
        'activityBar.foreground': '#ffffff',
        'editor.background': '#000000',
      };
      const result = removeManagedKeys(existing);
      assert.deepStrictEqual(result, {
        'editor.background': '#000000',
      });
    });
  });

  // =============================================
  // MANAGED_COLOR_KEYS
  // =============================================
  suite('MANAGED_COLOR_KEYS', () => {
    test('foreground キーが含まれている', () => {
      const keys = MANAGED_COLOR_KEYS as readonly string[];
      assert.ok(keys.includes('titleBar.activeForeground'));
      assert.ok(keys.includes('titleBar.inactiveForeground'));
      assert.ok(keys.includes('statusBar.foreground'));
      assert.ok(keys.includes('activityBar.foreground'));
    });

    test('background キーが含まれている', () => {
      const keys = MANAGED_COLOR_KEYS as readonly string[];
      assert.ok(keys.includes('titleBar.activeBackground'));
      assert.ok(keys.includes('titleBar.inactiveBackground'));
      assert.ok(keys.includes('statusBar.background'));
      assert.ok(keys.includes('statusBar.noFolderBackground'));
      assert.ok(keys.includes('activityBar.background'));
    });

    test('合計 9 キーが管理されている', () => {
      assert.strictEqual(MANAGED_COLOR_KEYS.length, 9);
    });
  });
});
