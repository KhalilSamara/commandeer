/* ================================================================
   core/config.js — constants and defaults. No DOM, no side effects.
   ================================================================ */
(function (C) {
  "use strict";

  function deepFreeze(obj) {
    Object.values(obj).forEach(v => { if (v && typeof v === "object") deepFreeze(v); });
    return Object.freeze(obj);
  }

  /** User-tunable preferences (the drawer). Reset restores these. */
  const DEFAULTS = deepFreeze({
    debug: "15",
    inc: 250,
    ladder: "50,100,150,250,500,750,1000",
    filename: "{project}_RUNME.txt",
    header: true,
    tester: "",
    jmeterVersion: "",
    props: [],
    runtime: false,
    rampupProp: "rampup",
    durationProp: "duration"
  });

  C.config = Object.freeze({
    DEFAULTS,

    /** localStorage key. Changing it orphans every user's saved state. */
    STORAGE_KEY: "jmcg.state.v1",

    ROUNDING: Object.freeze({ ROUNDUP: "roundup", EXACT: "exact" }),

    SCENARIOS: Object.freeze({
      MIN: 1,
      MAX: 50,
      HINT_AT: 13            // show the "small shares" hint from this count up
    }),

    FALLBACK_INCREMENT: 250,
    FALLBACK_FILENAME: "{project}_RUNME.txt",

    MONTHS: Object.freeze(["January","February","March","April","May","June",
                           "July","August","September","October","November","December"]),

    /** Fresh top-level state. Key order is kept stable for the saved JSON. */
    initialState() {
      return {
        project: "", path: "", target: 2000, scnCount: 3,
        pcts: [50, 30, 20],
        rampup: "", duration: "",
        rounding: "roundup",   // "roundup" (allow N+1 to preserve minor scenarios) or "exact" (sum == N exactly)
        set: JSON.parse(JSON.stringify(DEFAULTS))
      };
    }
  });
})(globalThis.Commandeer = globalThis.Commandeer || {});
