/* ================================================================
   ui/highlight.js — RUNME text -> syntax-coloured HTML. Pure string.
   ================================================================ */
(function (C) {
  "use strict";
  const { esc } = C.utils;

  // Colorize: totals, numeric args, +1 flags. rowIdx tracks which model row
  // we're inside; the "# NvUsers" header advances it, and the jmeter line that
  // follows shares that row's flag state so the specific overshooting arg goes red.
  function highlight(text, model){
    const rows = (model && model.rows) || [];
    let rowIdx = -1;
    return text.split("\n").map(line=>{
      if(/^# \d+vUsers/.test(line)){
        rowIdx++;
        const r = rows[rowIdx];
        const cls = (r && r.bumped) ? "t-flag" : "t-total";
        return `<span class="${cls}">${esc(line)}</span>`;
      }
      if(/^jmeter/.test(line)){
        const r = rows[rowIdx];
        let l = esc(line);
        let argIdx = 0;
        l = l.replace(/(-J[\w.\-]+=)(\d+)/g, (_,a,b)=>{
          const flagThis = r && r.bumped && argIdx === r.bumpedAt;
          argIdx++;
          const numCls = flagThis ? "t-flag" : "t-num";
          return `<span class="t-dim">${a}</span><span class="${numCls}">${b}</span>`;
        });
        l = l.replace(/^(jmeter -n -t )(&quot;.*?&quot;)/, `<span class="t-dim">$1</span><span class="t-str">$2</span>`);
        return l;
      }
      if(/^#/.test(line)){
        return `<span class="t-dim">${esc(line)}</span>`;
      }
      return esc(line);
    }).join("\n");
  }

  C.highlight = Object.freeze({ highlight });
})(globalThis.Commandeer = globalThis.Commandeer || {});
