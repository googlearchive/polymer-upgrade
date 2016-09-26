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

import * as cssbeautify from 'cssbeautify';
import * as parse5 from 'parse5';
import {ParsedCssDocument} from 'polymer-analyzer/lib/css/css-document';
import {ParsedHtmlDocument} from 'polymer-analyzer/lib/html/html-document';
import {ParsedDocument} from 'polymer-analyzer/lib/parser/document';
import * as shadyCss from 'shady-css-parser';

/**
 * Knows how to pretty print any parsed document. We need the original contents
 * in order to try and preserve the original formatting as much as possible.
 *
 * Moving upstream in analyzer, see
 * https://github.com/Polymer/polymer-analyzer/pull/316
 *
 * Delete this file once that's released.
 */
export function stringify(
    parsed: ParsedDocument<any, any>, originalContents: string) {
  if (parsed instanceof ParsedHtmlDocument) {
    return stringifyHtml(parsed.ast, originalContents);
  }
  if (parsed instanceof ParsedCssDocument) {
    return stringifyCss(parsed.ast);
  }
  throw new Error(`Don't yet know how to stringify a ${parsed.type}`);
}

const shadyStringifier = new shadyCss.Stringifier();
function stringifyCss(node: shadyCss.Node): string {
  return cssbeautify(
      shadyStringifier.stringify(node),
      {indent: '  ', autosemicolon: true, openbrace: 'end-of-line'});
}

function stringifyHtml(node: parse5.ASTNode, beforeContents: string): string {
  let result = parse5.serialize(node);

  // Strip out inferred boilerplate nodes that are injected.
  let m = result.match(/^<html>([^]*)?<\/html>$/);
  if (m && !beforeContents.includes('<html')) {
    result = m[1];
  }
  if (result.startsWith('<head></head>') && !beforeContents.includes('<head')) {
    result = result.substring('<head></head>'.length);
  }
  m = result.match(/^<body>([^]*)?<\/body>$/);
  if (m && !beforeContents.includes('<body')) {
    result = m[1];
  }

  return result;
}