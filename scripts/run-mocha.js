// Programmatic Mocha runner to ensure tests run under ts-node (CommonJS context)
const Mocha = require('mocha');
const glob = require('glob');
const path = require('path');

require('ts-node').register({ transpileOnly: true });
require('source-map-support').install();

const mocha = new Mocha({ ui: 'tdd' });

// Only run pure unit tests that do not require the VS Code environment
const testFiles = glob.sync('src/test/colorGenerator.test.ts', { absolute: true });
for (const file of testFiles) {
  mocha.addFile(file);
}

mocha.run((failures) => {
  process.exitCode = failures ? 1 : 0;
});
