/// <reference path="../node_modules/@types/mocha/index.d.ts" />

import {Polyup} from 'polymer-upgrade';

describe('Can construct a Polyup instance', function() {
  new Polyup('hello world', 10);
});
