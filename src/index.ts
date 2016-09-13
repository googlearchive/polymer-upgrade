/// <reference path="../custom_typings/main.d.ts" />

import * as cssbeautify from 'cssbeautify';
import * as hydrolysis from 'polymer-analyzer';
import {ParsedCssDocument, Visitor} from 'polymer-analyzer/lib/css/css-document';
import {FSUrlLoader} from 'polymer-analyzer/lib/url-loader/fs-url-loader';
import * as shadyCss from 'shady-css-parser';


export async function upgrade(
    rootFile: string, baseDir: string): Promise<string> {
  const options = {urlLoader: new FSUrlLoader(baseDir)};
  const analyzer = new hydrolysis.Analyzer(options);
  const rootDoc = await analyzer.analyzeRoot(rootFile);

  if (rootDoc.parsedDocument instanceof ParsedCssDocument) {
    const clone = rootDoc.parsedDocument.clone();
    upgradeCss(clone);
    return stringifyCss(clone.ast);
  }
  throw new Error(
      `Don't yet know how to upgrade a ${rootDoc.parsedDocument.type}`);
}

function upgradeCss(document: ParsedCssDocument) {
  document.visit([new ExpressionRewritingVisitor()]);
}

const stringifier = new shadyCss.Stringifier();
function stringifyCss(node: shadyCss.Node): string {
  return cssbeautify(
      stringifier.stringify(node),
      {indent: '  ', autosemicolon: true, openbrace: 'end-of-line'});
}

class ExpressionRewritingVisitor implements Visitor {
  visit(node: shadyCss.Node, _path: shadyCss.Node[]) {
    if (node.type === 'expression') {
      const badVarMatcher = /^\s*var\((--[\w-]+)\s*,\s*(--[\w-]+)\)\s*$/;
      const match = node.text.match(badVarMatcher);
      if (match) {
        node.text = `var(${match[1]}, var(${match[2]}))`;
      }
      // console.log(`Expression text: ${node.text}`);
    }
  }
}