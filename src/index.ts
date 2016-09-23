/// <reference path="../custom_typings/main.d.ts" />

import * as clone from 'clone';
import * as cssbeautify from 'cssbeautify';
import * as dom5 from 'dom5';
import * as parse5 from 'parse5';
import {Analyzer} from 'polymer-analyzer';
import {ParsedCssDocument} from 'polymer-analyzer/lib/css/css-document';
import {ParsedHtmlDocument} from 'polymer-analyzer/lib/html/html-document';
import {ParsedDocument} from 'polymer-analyzer/lib/parser/document';
import {Severity, WarningCarryingException} from 'polymer-analyzer/lib/warning/warning';
import * as shadyCss from 'shady-css-parser';

const p = dom5.predicates;

export interface Options { upgradePasses: string[]; }

export class Upgrader {
  upgradePasses: UpgradePass<any>[];

  constructor(options: Options) {
    this.upgradePasses =
        Array.from(new UpgradePassRegistry().getPasses(options.upgradePasses));
  }

  async upgrade(rootFile: string, analyzer: Analyzer) {
    const contents = await analyzer.load(rootFile);
    const rootDoc = await analyzer.analyzeRoot(rootFile);

    const parsed = clone(rootDoc.parsedDocument);
    this._upgradeDoc(parsed);
    return this._stringify(parsed, contents);
  }

  /**
   * Mutates the given parsed document to upgrade it.
   */
  private _upgradeDoc(parsed: ParsedDocument<any, any>) {
    for (const pass of this.upgradePasses.filter(p => p.canUpgrade(parsed))) {
      pass.upgrade(parsed);
    }
  }

  private _stringify(
      parsed: ParsedDocument<any, any>, originalContents: string) {
    if (parsed instanceof ParsedHtmlDocument) {
      return stringifyHtml(parsed.ast, originalContents);
    }
    if (parsed instanceof ParsedCssDocument) {
      return stringifyCss(parsed.ast);
    }
    throw new Error(`Don't yet know how to stringify a ${parsed.type}`);
  }
}

const stringifier = new shadyCss.Stringifier();
function stringifyCss(node: shadyCss.Node): string {
  return cssbeautify(
      stringifier.stringify(node),
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


export abstract class UpgradePass<T extends ParsedDocument<any, any>> {
  code: string;
  documentClazz: any;

  constructor() {}

  canUpgrade(document: T) { return document instanceof this.documentClazz; }

  abstract upgrade(document: T): void;
}

abstract class HtmlUpgradePass extends UpgradePass<ParsedHtmlDocument> {
  constructor() { super(); }
  documentClazz = ParsedHtmlDocument;
}
abstract class CssUpgradePass extends UpgradePass<ParsedCssDocument> {
  constructor() { super(); }
  documentClazz = ParsedCssDocument;
}

export class UpgradePassCollection {
  constructor(public code: string, public passes: string[]) {}
}

export class UpgradePassRegistry {
  static singleton: UpgradePassRegistry;
  private _all = new Map<string, UpgradePass<any>|UpgradePassCollection>();
  constructor() {
    if (!UpgradePassRegistry.singleton) {
      UpgradePassRegistry.singleton = this;
    }

    return UpgradePassRegistry.singleton;
  }

  static register(pass: UpgradePass<any>|UpgradePassCollection) {
    new UpgradePassRegistry()._all.set(pass.code, pass);
  }

  static get allPassCodes() {
    const registry = new UpgradePassRegistry();
    return Array.from(registry._all.values())
        .filter(p => p instanceof UpgradePass)
        .map(p => p.code);
  }

  getPasses(passCodes: string[]): Set<UpgradePass<any>> {
    const results = new Set<UpgradePass<any>>();
    for (const code of passCodes) {
      const passOrCollection = this._all.get(code);
      if (passOrCollection == null) {
        throw new Error(`Could not find upgrade pass with code '${code}'`);
      } else if (passOrCollection instanceof UpgradePassCollection) {
        for (const pass of this.getPasses(passOrCollection.passes)) {
          results.add(pass);
        }
      } else {
        results.add(passOrCollection);
      }
    }
    return results;
  }
}

class MoveStyleIntoTemplate extends HtmlUpgradePass {
  code = 'style-into-template';

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



UpgradePassRegistry.register(new MoveStyleIntoTemplate());
UpgradePassRegistry.register(
    new FixVarStatementWithInvalidCustomPropFallback());