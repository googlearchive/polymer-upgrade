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

import * as dom5 from 'dom5';
import {ParsedHtmlDocument} from 'polymer-analyzer/lib/html/html-document';
import * as stripIndent from 'strip-indent';

import {registry} from '../registry';

import {HtmlUpgradePass} from './html-pass';

const p = dom5.predicates;

class DomModuleNameOrIs extends HtmlUpgradePass {
  code = 'dom-module-invalid-attrs';
  description = stripIndent(`
      Transforms:

          <dom-module name="foo-elem">
          </dom-module>

      or

          <dom-module is="foo-elem">
          </dom-module>

      Into:

          <dom-module id="foo-elem">
          </dom-module>
  `);
  constructor() { super(); }

  upgrade(document: ParsedHtmlDocument) {
    const badModule = p.AND(
        p.hasTagName('dom-module'), p.OR(p.hasAttr('is'), p.hasAttr('name')));
    for (const domModule of dom5.nodeWalkAll(document.ast, badModule)) {
      const id = dom5.getAttribute(domModule, 'id') ||
          dom5.getAttribute(domModule, 'is') ||
          dom5.getAttribute(domModule, 'name')!;
      dom5.removeAttribute(domModule, 'is');
      dom5.removeAttribute(domModule, 'name');
      dom5.setAttribute(domModule, 'id', id);
    }
  }
}

registry.register(new DomModuleNameOrIs());
