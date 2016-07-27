/// <reference path="../../node_modules/@types/mocha/index.d.ts" />

import {upgrade} from '../index';

describe('the upgrade function', function() {
  it('resolves', function() { return upgrade(''); });
});
