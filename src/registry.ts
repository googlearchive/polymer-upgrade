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

import {UpgradePass, UpgradePassCollection} from './upgrade-pass';

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
      // Special case the code named 'all'
      if (code === 'all') {
        for (const pass of this._all.values()) {
          if (pass instanceof UpgradePass) {
            results.add(pass);
          }
        }
        continue;
      }
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
