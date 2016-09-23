/// <reference path="../../node_modules/@types/mocha/index.d.ts" />

import {assert} from 'chai';
import * as fs from 'fs';
import * as path from 'path';
import {Analyzer} from 'polymer-analyzer';
import {FSUrlLoader} from 'polymer-analyzer/lib/url-loader/fs-url-loader';

import {UpgradePassRegistry, Upgrader} from '../index';

suite('upgrade()', function() {
  const fixturesDir = path.join(__dirname, 'fixtures');
  const dirnames = fs.readdirSync(fixturesDir);
  for (const dirname of dirnames) {
    const upgrader =
        new Upgrader({upgradePasses: UpgradePassRegistry.allPassCodes});
    test(`upgrades ${dirname}`, async() => {
      const fullDir = path.join(fixturesDir, dirname);
      const beforeDir = path.join(fullDir, 'before');
      const analyzer = new Analyzer({urlLoader: new FSUrlLoader(beforeDir)});

      for (const file of fs.readdirSync(beforeDir)) {
        const afterPath = path.join(fullDir, 'after', file);
        const contents = await upgrader.upgrade(file, analyzer);
        assert.deepEqual(contents, fs.readFileSync(afterPath, 'utf-8'));
      }
    });
  }
});
