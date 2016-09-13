/// <reference path="../../node_modules/@types/mocha/index.d.ts" />

import {assert} from 'chai';
import * as fs from 'fs';
import * as path from 'path';

import {upgrade} from '../index';

suite('the upgrade function', function() {
  const fixturesDir = path.join(__dirname, 'fixtures');
  const dirnames = fs.readdirSync(fixturesDir);
  for (const dirname of dirnames) {
    test(`upgrades ${dirname}`, async() => {
      const fullDir = path.join(fixturesDir, dirname);
      const afterPath = path.join(fullDir, 'after', 'index.css');
      const contents = await upgrade('index.css', path.join(fullDir, 'before'));
      assert.equal(contents, fs.readFileSync(afterPath, 'utf-8'));
    });
  }
});
