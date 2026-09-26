/* ================================================================
   core/ladder.js — which load steps appear, and scenario prop names.

   CORRECTNESS-CRITICAL. buildLadder is byte-identical to v1.
   ================================================================ */
(function (C) {
  "use strict";

  // Rows = debug steps (in given order) + base steps <= target + fixed
  // increments after the last base step, always ending on `target`.
  function buildLadder(target, debug, base, inc){
    const rows = [];
    const seen = new Set();
    const push = (v, isDebug) => { if(v>0 && !seen.has(v)){ seen.add(v); rows.push({total:v, debug:isDebug}); } };
    debug.forEach(d => push(d, true));
    base.filter(v => v <= target).forEach(v => push(v, false));
    const last = base.length ? base[base.length-1] : 0;
    for(let v = last + inc; v <= target; v += inc) push(v, false);
    push(target, false);
    const dbg = rows.filter(r=>r.debug);
    const load = rows.filter(r=>!r.debug).sort((a,b)=>a.total-b.total);
    return [...dbg, ...load];
  }

  /** JMeter property name per scenario: custom name if set, else S1..Sn. */
  function propNames(n, custom){
    const out = [];
    for(let i=0;i<n;i++) out.push((custom && custom[i] && custom[i].trim()) ? custom[i].trim() : ("S"+(i+1)));
    return out;
  }

  C.ladder = Object.freeze({ buildLadder, propNames });
})(globalThis.Commandeer = globalThis.Commandeer || {});
