/* ================================================================
   services/storage.js — localStorage that never throws.
   Falls back to an in-memory map when storage is blocked
   (sandboxed iframes, some file:// policies, locked-down browsers).
   ================================================================ */
(function (C) {
  "use strict";

  /**
   * @param {() => Storage} [getBackend]  injectable for tests. Accessing
   *        localStorage can itself throw, so it is resolved inside try.
   */
  function createStore(getBackend = () => globalThis.localStorage){
    let backend = null;
    try {
      const b = getBackend();
      const k = "__t"; b.setItem(k, "1"); b.removeItem(k);
      backend = b;
    } catch (e) { backend = null; }

    const mem = {};
    const ok = backend !== null;
    return Object.freeze({
      ok,
      get(k){ try { return ok ? backend.getItem(k) : mem[k]; } catch (e) { return mem[k]; } },
      set(k, v){ try { ok ? backend.setItem(k, v) : (mem[k] = v); } catch (e) { mem[k] = v; } }
    });
  }

  C.storage = Object.freeze({ createStore });
})(globalThis.Commandeer = globalThis.Commandeer || {});
