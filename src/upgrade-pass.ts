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

import {ParsedDocument} from 'polymer-analyzer/lib/parser/document';

/**
 * An upgrade pass. Can take a document and mutate it in order to transform it.
 */
export abstract class UpgradePass<T extends ParsedDocument<any, any>> {
  code: string;

  /**
   * The specific kind of ParsedDocument that this pass knows how to upgrade.
   *
   * Used by the default implementation of canUpgrade.
   */
  protected _documentClazz: any;

  constructor() {}

  canUpgrade(document: T) { return document instanceof this._documentClazz; }

  /**
   * Mutates the given ParsedDocument to apply the upgrade transformation.
   */
  abstract upgrade(document: T): void;
}

/**
 * A named collection of upgrade passes. Useful for giving names to sets of
 * passes, like passes which upgrade from Polymer v1 to v2, or passes which
 * are always safe to run and update from old specs to new ones.
 */
export class UpgradePassCollection {
  constructor(public code: string, public passes: string[]) {}
}
