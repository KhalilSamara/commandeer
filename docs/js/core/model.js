/* ================================================================
   core/model.js — validate state, build the ladder, distribute users,
   produce the output. Pure: (state, now) -> model | { error }.
   ================================================================ */
(function (C) {
  "use strict";
  const { round2, parseList } = C.utils;
  const { distribute, distributeExact } = C.distribution;
  const { buildLadder, propNames } = C.ladder;
  const { runmeText, resolveFilename } = C.format;
  const { ROUNDING, FALLBACK_INCREMENT } = C.config;

  const sum = arr => arr.reduce((a,b)=>a+b,0);

  /** First blocking input problem, or null. */
  function validateInputs(s, target, active){
    if(!s.path) return "Add the script path in the top bar.";
    if(!Number.isFinite(target) || target<1) return "Set a valid target user count.";
    const pctSum = sum(active);
    if(Math.abs(pctSum-100) > 0.01) return `Distribution must sum to 100% (currently ${round2(pctSum)}%).`;
    const zeroAt = active.findIndex(v=>v<=0);
    if(s.scnCount > 1 && zeroAt !== -1) return `Scenario ${zeroAt+1} is 0% — give it a share or reduce the scenario count.`;
    return null;
  }

  // Feasibility depends on mode:
  //   exact   — sum must equal total (no overshoot allowed)
  //   roundup — sum may exceed total by at most 1
  function findInfeasibleRow(rows, mode){
    return rows.find(r => {
      const total = sum(r.parts);
      return mode === ROUNDING.EXACT ? total !== r.total : total > r.total + 1;
    });
  }

  function infeasibleMessage(bad, mode, scnCount){
    if(bad.debug){
      return `The ${bad.total}-user debug step can't cover ${scnCount} scenarios (needs ≥1 user each). Lower the scenario count or raise the debug value.`;
    }
    return mode === ROUNDING.EXACT
      ? `At ${bad.total} users, exact rounding can't fit ≥1 user per scenario without overshoot. Switch to Round-up mode, raise the smallest step, or reduce scenarios.`
      : `At ${bad.total} users a scenario's share rounds below 1 user, so the step can't stay within ${bad.total+1}. Raise the smallest step or rebalance the percentages.`;
  }

  /**
   * @param {object} state  app state (see config.initialState)
   * @param {Date}   [now]  injected clock for the metadata header
   * @returns {{error:string} | {rows, text, filename, target, mode, anyBump}}
   */
  function buildModel(state, now = new Date()){
    const s = state;
    const target = parseInt(s.target,10);
    const active = s.pcts.slice(0, s.scnCount).map(v=>parseFloat(v)||0);

    const inputError = validateInputs(s, target, active);
    if(inputError) return { error: inputError };

    const debug  = parseList(s.set.debug);
    const base   = parseList(s.set.ladder);
    const inc    = parseInt(s.set.inc,10) || FALLBACK_INCREMENT;
    if(!base.length) return { error:"Base ladder is empty — add at least one step." };

    const names  = propNames(s.scnCount, s.set.props);
    const ladder = buildLadder(target, debug, base, inc);
    const mode   = s.rounding === ROUNDING.EXACT ? ROUNDING.EXACT : ROUNDING.ROUNDUP;
    const split  = mode === ROUNDING.EXACT ? distributeExact : distribute;

    const rows = ladder.map(r=>{
      const {parts, bumped, bumpedAt} = split(r.total, active);
      return { total:r.total, debug:r.debug, parts, names, bumped, bumpedAt };
    });

    const bad = findInfeasibleRow(rows, mode);
    if(bad) return { error: infeasibleMessage(bad, mode, s.scnCount) };

    const text = runmeText({ state:s, rows, names, target, active, mode, now });
    return { rows, text, filename: resolveFilename(s), target, mode,
             anyBump: rows.some(r=>r.bumped) };
  }

  C.model = Object.freeze({ buildModel, validateInputs, findInfeasibleRow });
})(globalThis.Commandeer = globalThis.Commandeer || {});
