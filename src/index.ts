/// <reference path="../custom_typings/main.d.ts" />

// import * as clone from 'clone';
import * as cssbeautify from 'cssbeautify';
import * as dom5 from 'dom5';
import * as parse5 from 'parse5';
import {Analyzer} from 'polymer-analyzer';
import {ParsedCssDocument, Visitor} from 'polymer-analyzer/lib/css/css-document';
import {ParsedHtmlDocument} from 'polymer-analyzer/lib/html/html-document';
import {FSUrlLoader} from 'polymer-analyzer/lib/url-loader/fs-url-loader';
import {Severity, WarningCarryingException} from 'polymer-analyzer/lib/warning/warning';
import * as shadyCss from 'shady-css-parser';

const p = dom5.predicates;

export async function upgrade(
    rootFile: string, baseDir: string): Promise<string> {
  const options = {urlLoader: new FSUrlLoader(baseDir)};
  const analyzer = new Analyzer(options);
  const contents = await analyzer.load(rootFile);
  const rootDoc = await analyzer.analyzeRoot(rootFile);

  const parsed = rootDoc.parsedDocument;
  if (parsed instanceof ParsedCssDocument) {
    upgradeCss(parsed);
    return stringifyCss(parsed.ast);
  }
  if (parsed instanceof ParsedHtmlDocument) {
    upgradeHtml(parsed);
    return stringifyHtml(parsed.ast, contents);
  }
  throw new Error(
      `Don't yet know how to upgrade a ${rootDoc.parsedDocument.type}`);
}

function upgradeCss(document: ParsedCssDocument) {
  document.visit([new ExpressionRewritingVisitor()]);
}

function upgradeHtml(document: ParsedHtmlDocument) {
  const outOfPlaceStyle =
      p.AND(p.hasTagName('style'), p.parentMatches(p.hasTagName('dom-module')));
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

function hasExactlyOneChildWithTagName(
    document: ParsedHtmlDocument, parentNode: parse5.ASTNode, tagName: string) {
  const children = parentNode.childNodes!.filter(p.hasTagName(tagName));
  if (children.length === 0) {
    throw new WarningCarryingException({
      code: 'required-node-missing',
      message: `Expected ${parentNode.nodeName} node to have a ${tagName
                                              } child but found none`,
      severity: Severity.ERROR,
      sourceRange: document.sourceRangeForNode(parentNode)
    });
  }
  if (children.length > 1) {
    throw new WarningCarryingException({
      code: 'extra-unique-nodes',
      message: `Expected ${parentNode
                   .nodeName} node to have exactly one ${tagName
                            } child but found ${children.length}`,
      severity: Severity.ERROR,
      sourceRange: document.sourceRangeForNode(children[1])
    });
  }
  return children[0]!;
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
