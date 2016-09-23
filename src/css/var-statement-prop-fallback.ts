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

import {UpgradePassRegistry} from '../registry';

import {CssUpgradePass} from './css-pass';

/**
 * Transforms the invalid expression:
 *
 *     var(--foo, --bar)
 *
 * Into:
 *
 *     var(--foo, var(--bar))
 */
class FixVarStatementWithInvalidCustomPropFallback extends CssUpgradePass {
  code = 'var-with-invalid-custom-prop-fallback';

  constructor() { super(); }

  upgrade(document: ParsedCssDocument) {
    document.visit([{
      visit(node: shadyCss.Node, _path: shadyCss.Node[]) {
        if (node.type === 'expression') {
          const badVarMatcher = /^\s*var\((--[\w-]+)\s*,\s*(--[\w-]+)\)\s*$/;
          const match = node.text.match(badVarMatcher);
          if (match) {
            node.text = `var(${match[1]}, var(${match[2]}))`;
          }
        }
      }
    }]);
  }
}

UpgradePassRegistry.register(
    new FixVarStatementWithInvalidCustomPropFallback());