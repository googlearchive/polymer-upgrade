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
import {Severity, WarningCarryingException} from 'polymer-analyzer/lib/warning/warning';

const p = dom5.predicates;

/**
 * If the parentNode has exactly one child matching the given tagName, then
 * that child is returned. Otherwise we throw a WarningCarryingException.
 */
export function checkExactlyOneChildWithTagName(
    document: ParsedHtmlDocument, parentNode: parse5.ASTNode, tagName: string) {
  const children = parentNode.childNodes!.filter(p.hasTagName(tagName));
  if (children.length === 0) {
    throw new WarningCarryingException({
      code: 'required-node-missing',
      message: `Expected ${parentNode.nodeName} node to have a ${tagName}` +
          ` child but found none`,
      severity: Severity.ERROR,
      sourceRange: document.sourceRangeForNode(parentNode)
    });
  }
  if (children.length > 1) {
    throw new WarningCarryingException({
      code: 'extra-unique-nodes',
      message: `Expected ${parentNode.nodeName} node to have exactly one ` +
          ` ${tagName} child but found ${children.length}`,
      severity: Severity.ERROR,
      sourceRange: document.sourceRangeForNode(children[1])
    });
  }
  return children[0]!;
}