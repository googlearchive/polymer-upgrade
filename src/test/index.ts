/// <reference path="../../node_modules/@types/mocha/index.d.ts" />

import {assert} from 'chai';
import * as fs from 'fs';
import * as path from 'path';

import {upgrade} from '../index';

suite('upgrade()', function() {
  const fixturesDir = path.join(__dirname, 'fixtures');
  const dirnames = fs.readdirSync(fixturesDir);
  for (const dirname of dirnames) {
    test(`upgrades ${dirname}`, async() => {
      const fullDir = path.join(fixturesDir, dirname);
      const beforeDir = path.join(fullDir, 'before');
      for (const file of fs.readdirSync(beforeDir)) {
        const afterPath = path.join(fullDir, 'after', file);
        const contents = await upgrade(file, beforeDir);
        assert.deepEqual(contents, fs.readFileSync(afterPath, 'utf-8'));
      }
    });
  }
});
