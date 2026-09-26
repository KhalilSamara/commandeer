/* ================================================================
   core/distribution.js — splitting a step total across scenarios.

   CORRECTNESS-CRITICAL. Function bodies are byte-identical to the
   verified v1 single-file build. Any change here must keep
   tests/distribution.test.js and tests/golden.test.js green.
   ================================================================ */
(function (C) {
  "use strict";

  // Distribute `total` across percentages. Rules:
  //   - never round a scenario down without compensation; prefer rounding up
  //   - final sum is exactly `total` or `total`+1 (never under, never more than +1)
  //   - every scenario gets at least 1
  // Returns {parts, bumped, bumpedAt}
  //   bumped   = landed on total+1
  //   bumpedAt = scenario index that received the round-up (for preview flagging)
  function distribute(total, pcts){
    const n = pcts.length;
    if(n === 1) return { parts:[total], bumped:false, bumpedAt:null };

    const exact = pcts.map(p => total * p / 100);
    const base  = exact.map(Math.floor);
    const rem   = exact.map((x,i) => x - base[i]);
    const parts = base.slice();

    let deficit = total - parts.reduce((a,b)=>a+b,0);
    const order = [...Array(n).keys()].sort((a,b)=> rem[b]-rem[a] || a-b);
    const bumpedIdx = new Set();
    for(let k=0;k<deficit;k++){ const i=order[k%n]; parts[i]++; bumpedIdx.add(i); }

    let bumped = false;
    let bumpedAt = null;
    const loser = order.find(i => rem[i] > 1e-9 && !bumpedIdx.has(i));
    if(loser !== undefined){ parts[loser]++; bumped = true; bumpedAt = loser; }

    for(let i=0;i<n;i++) if(parts[i] < 1 && pcts[i] > 0) parts[i] = 1;
    return { parts, bumped, bumpedAt };
  }

  // Exact-total variant. Same largest-remainder fair-share fill, but no round-up
  // overshoot: sum equals `total` exactly. When a scenario's share rounds to 0,
  // steal from the largest donor (parts>1). If no donor exists, produce parts
  // whose sum exceeds `total` so buildModel's feasibility check refuses the step.
  function distributeExact(total, pcts){
    const n = pcts.length;
    if(n === 1) return { parts:[total], bumped:false, bumpedAt:null };

    const exact = pcts.map(p => total * p / 100);
    const base  = exact.map(Math.floor);
    const rem   = exact.map((x,i) => x - base[i]);
    const parts = base.slice();

    let deficit = total - parts.reduce((a,b)=>a+b,0);
    // On remainder ties, protect the SMALLER scenario: ascending pct wins the
    // fair-share user, so it's the larger one that rounds down.
    const order = [...Array(n).keys()].sort((a,b)=> rem[b]-rem[a] || pcts[a]-pcts[b] || a-b);
    for(let k=0;k<deficit;k++){ const i=order[k%n]; parts[i]++; }

    // min-1 rescue via STEAL from largest — keeps the total exact
    for(let i=0;i<n;i++){
      if(pcts[i] > 0 && parts[i] < 1){
        let donor = -1, max = -1;
        for(let j=0;j<n;j++){
          if(j !== i && parts[j] > 1 && parts[j] > max){ donor = j; max = parts[j]; }
        }
        if(donor === -1){ parts[i] = 1; }              // infeasible — will trip buildModel check
        else { parts[donor]--; parts[i]++; }
      }
    }
    return { parts, bumped:false, bumpedAt:null };
  }

  /** Whole-number even split summing to 100 (earlier scenarios take the remainder). */
  function evenPcts(n){
    const q = Math.floor(100 / n);
    const r = 100 - q*n;
    return Array.from({length:n}, (_,i) => i < r ? q+1 : q);
  }

  C.distribution = Object.freeze({ distribute, distributeExact, evenPcts });
})(globalThis.Commandeer = globalThis.Commandeer || {});
