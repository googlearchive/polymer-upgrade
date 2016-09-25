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
import * as stripIndent from 'strip-indent';

import {registry} from '../registry';

import {HtmlUpgradePass} from './html-pass';
import {hasExactlyOneChildWithTagName} from './util';

const p = dom5.predicates;

class MoveStyleIntoTemplate extends HtmlUpgradePass {
  code = 'style-into-template';
  description = stripIndent`
      Transforms:

          <dom-module>
            <style></style>
            <template>foo</template>
          <dom-module>

      Into:

          <dom-module>
            <template>
              <style></style>
              foo
            </template>
          <dom-module>
  `;
  constructor() { super(); }

  upgrade(document: ParsedHtmlDocument) {
    const outOfPlaceStyle = p.AND(
        p.hasTagName('style'), p.parentMatches(p.hasTagName('dom-module')));
    for (const outOfPlaceNode of dom5.nodeWalkAll(
             document.ast, outOfPlaceStyle)) {
      const domModule = outOfPlaceNode.parentNode!;
      const template =
          hasExactlyOneChildWithTagName(document, domModule, 'template');
      dom5.remove(outOfPlaceNode);
      ((template as any).content as parse5.ASTNode)
          .childNodes!.unshift(outOfPlaceNode);
    }
  }
}

registry.register(new MoveStyleIntoTemplate());
