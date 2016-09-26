/**
 * @license
 * Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

/// <reference path="../../node_modules/@types/mocha/index.d.ts" />

import {assert} from 'chai';
import * as fs from 'fs';
import * as path from 'path';
import {Analyzer} from 'polymer-analyzer';
import {FSUrlLoader} from 'polymer-analyzer/lib/url-loader/fs-url-loader';

import {Upgrader} from '../upgrader';

suite('upgrade()', function() {
  const fixturesDir = path.join(__dirname, 'fixtures');
  const dirnames = fs.readdirSync(fixturesDir);
  for (const dirname of dirnames) {
    const upgrader = new Upgrader({upgradePasses: ['all']});
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
