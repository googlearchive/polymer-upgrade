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

import {ParsedCssDocument} from 'polymer-analyzer/lib/css/css-document';
import * as shadyCss from 'shady-css-parser';
import stripIndent = require('strip-indent');

import {registry} from '../registry';

import {CssUpgradePass} from './css-pass';


class FixAtApplyWithInvalidParens extends CssUpgradePass {
  code = 'at-apply-not-function';
  description = stripIndent(`
      Transforms the invalid expression:
      
          @apply(--foo)
      
      Into the valid:
      
          @apply --foo;
  `);

  constructor() { super(); }

  upgrade(document: ParsedCssDocument) {
    document.visit([{
      visit(node: shadyCss.Node, _path: shadyCss.Node[]) {
        if (node.type === 'atRule' && node.name === 'apply') {
          const badApplyMatcher = /^\s*\((.*)\)\s*$/;
          const match = node.parameters.match(badApplyMatcher);
          if (match) {
            node.parameters = `${match[1]}`;
          }
        }
      }
    }]);
  }
}

registry.register(new FixAtApplyWithInvalidParens());