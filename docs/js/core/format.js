/* ================================================================
   core/format.js — RUNME text output.

   OUTPUT FORMAT IS A CONTRACT — preserve byte-for-byte:
     # <total>vUsers
     jmeter -n -t "<path>" -JS1=<n> -JS2=<n> ...
   Optional metadata header: '#' lines, then exactly one blank line.
   ================================================================ */
(function (C) {
  "use strict";
  const { sanitize } = C.utils;
  const { MONTHS, FALLBACK_FILENAME, ROUNDING } = C.config;

  /** " -Jrampup=60 -Jduration=3600" or "" when runtime is off / values empty. */
  function runtimeArgs(state){
    const s = state;
    let extras = "";
    if(s.set.runtime){
      const rp = (s.set.rampupProp||"rampup").trim() || "rampup";
      const dp = (s.set.durationProp||"duration").trim() || "duration";
      const rv = String(s.rampup||"").trim();
      const dv = String(s.duration||"").trim();
      if(rv) extras += ` -J${rp}=${rv}`;
      if(dv) extras += ` -J${dp}=${dv}`;
    }
    return extras;
  }

  function commandBlocks(rows, names, path, extras){
    return rows.map(r=>{
      const args = r.parts.map((v,i)=>`-J${names[i]}=${v}`).join(" ");
      return `# ${r.total}vUsers\njmeter -n -t "${path}" ${args}${extras}`;
    }).join("\n") + "\n";
  }

  /** "07 March 2026" */
  function formatDate(d){
    return `${String(d.getDate()).padStart(2,"0")} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  }

  function metadataHeader({ state, target, names, active, mode, now }){
    const s = state;
    const dist = names.map((nm,i)=>`${nm} ${active[i]}%`).join("  ");
    const meta = [];
    const add = (k,v)=> meta.push(`# ${(k+":").padEnd(15)}${v}`);
    add("Project", s.project || "(unnamed)");
    add("Generated", formatDate(now));
    add("Max vUsers", target);
    add("Scenarios", `${s.scnCount} (${dist})`);
    add("Rounding", mode === ROUNDING.EXACT ? "exact total" : "round-up (+1)");
    if((s.set.tester||"").trim())        add("Tester", s.set.tester.trim());
    if((s.set.jmeterVersion||"").trim()) add("JMeter", s.set.jmeterVersion.trim());
    const bar = "# " + "=".repeat(48);
    return [bar, ...meta, bar].join("\n");
  }

  /** Full RUNME text: optional header + blank line + command blocks. */
  function runmeText(ctx){
    const { state, rows, names } = ctx;
    const body = commandBlocks(rows, names, state.path, runtimeArgs(state));
    return state.set.header ? metadataHeader(ctx) + "\n\n" + body : body;
  }

  /** Download filename from the pattern; {project} is sanitised. */
  function resolveFilename(state){
    return (state.set.filename || FALLBACK_FILENAME)
      .replace(/\{project\}/g, sanitize(state.project || "project"));
  }

  C.format = Object.freeze({ runtimeArgs, commandBlocks, formatDate, metadataHeader, runmeText, resolveFilename });
})(globalThis.Commandeer = globalThis.Commandeer || {});
