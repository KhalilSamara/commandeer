/* ================================================================
   services/state.js — the single mutable app state, its persistence,
   and every state transition that is more than "set one field".
   UI modules call these instead of reshaping state themselves.
   ================================================================ */
(function (C) {
  "use strict";
  const { DEFAULTS, STORAGE_KEY, ROUNDING, SCENARIOS, initialState } = C.config;
  const { clone, clamp } = C.utils;
  const { evenPcts } = C.distribution;

  function createStateService(store){
    const state = initialState();

    /** Merge saved state over defaults, then repair invariants. */
    function load(){
      const raw = store.get(STORAGE_KEY);
      if(raw){
        try {
          const s = JSON.parse(raw);
          Object.assign(state, s);
          state.set = Object.assign(clone(DEFAULTS), s.set || {});
        } catch (e) { /* corrupt JSON: keep defaults */ }
      }
      if(state.rounding !== ROUNDING.EXACT && state.rounding !== ROUNDING.ROUNDUP) state.rounding = ROUNDING.ROUNDUP;
      if(!state.set.props || state.set.props.length < state.scnCount){
        state.set.props = Array(state.scnCount).fill("").map((_,i)=> (state.set.props && state.set.props[i]) || "");
      }
      return state;
    }

    function save(){ store.set(STORAGE_KEY, JSON.stringify(state)); }

    /** Clamp to [MIN,MAX]; grow/trim pcts; grow (never trim) custom prop names. */
    function setScenarioCount(v){
      v = clamp(v|0, SCENARIOS.MIN, SCENARIOS.MAX);
      state.scnCount = v;
      while(state.pcts.length < v) state.pcts.push(0);
      state.pcts = state.pcts.slice(0, v);
      while(state.set.props.length < v) state.set.props.push("");
      return v;
    }

    /** A single scenario always owns 100%. */
    function enforceSingleScenario(){
      if(state.scnCount === 1) state.pcts = [100];
    }

    function setPct(i, v){ state.pcts[i] = clamp(v, 0, 100); return state.pcts[i]; }

    function evenSplit(){ state.pcts = evenPcts(state.scnCount).slice(); }

    function resetSettings(){
      state.set = clone(DEFAULTS);
      state.set.props = Array(state.scnCount).fill("");
    }

    return Object.freeze({ state, load, save, setScenarioCount, enforceSingleScenario, setPct, evenSplit, resetSettings });
  }

  C.stateService = Object.freeze({ createStateService });
})(globalThis.Commandeer = globalThis.Commandeer || {});
