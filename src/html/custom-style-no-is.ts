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
import * as parse5 from 'parse5';
import {ParsedHtmlDocument} from 'polymer-analyzer/lib/html/html-document';
import stripIndent = require('strip-indent');

import {registry} from '../registry';

import {HtmlUpgradePass} from './html-pass';

const p = dom5.predicates;

class CustomStyleDoesntUseIs extends HtmlUpgradePass {
  code = 'custom-style-no-is';
  description = stripIndent(`
      Transforms:

          <style is="custom-style">...</style>

      Into:

          <custom-style>
            <style>...</style>
          </custom-style>
      
      Because Polymer v2 is dropping support for is="" for the time being.
  `);
  constructor() { super(); }

  upgrade(document: ParsedHtmlDocument) {
    const isBadCustomStyle =
        p.AND(p.hasTagName('style'), p.hasAttrValue('is', 'custom-style'));
    for (const style of dom5.nodeWalkAll(document.ast, isBadCustomStyle)) {
      const customStyle =
          parse5.treeAdapters.default.createElement('custom-style', '', []);
      dom5.replace(style, customStyle);
      dom5.append(customStyle, style);

      dom5.removeAttribute(style, 'is');
      const include = dom5.getAttribute(style, 'include');
      if (include != null) {
        dom5.setAttribute(customStyle, 'include', include);
        dom5.removeAttribute(style, 'include');
      }
    }
  }
}

registry.register(new CustomStyleDoesntUseIs());
