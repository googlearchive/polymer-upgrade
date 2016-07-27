/// <reference path="../../node_modules/@types/mocha/index.d.ts" />

import {upgrade} from '../index';

suite('the upgrade function', function() {
  test('resolves', function() { return upgrade(''); });
});
