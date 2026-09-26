/* ================================================================
   ui/scenario-table.js — Distribution rows (slider + stepper) and
   the Total % readout. Events are delegated once on the container,
   so re-rendering rows never re-binds listeners.
   ================================================================ */
(function (C) {
  "use strict";
  const { byId, fromTemplate } = C.dom;
  const { round2, clamp } = C.utils;
  const { propNames } = C.ladder;

  function setRangeFill(range, v){
    range.style.background =
      `linear-gradient(to right, var(--accent) ${v}%, var(--line-soft) ${v}%)`;
  }

  function buildRow(i, name, pct, single){
    const row = fromTemplate("tplDistRow");
    row.querySelector(".dist-tag").append(document.createTextNode(name));

    const range = row.querySelector(".slider");
    const num   = row.querySelector(".pct-num");
    const dec   = row.querySelector(".pct-dec");
    const inc   = row.querySelector(".pct-inc");
    [range, num, dec, inc].forEach(el => el.dataset.i = i);
    range.setAttribute("value", pct);
    num.setAttribute("value", pct);
    if(single){
      [range, dec, inc].forEach(el => el.disabled = true);
      num.readOnly = true;
      num.tabIndex = -1;
    }
    setRangeFill(range, pct);
    return row;
  }

  function render(app){
    const { state } = app;
    app.svc.enforceSingleScenario();
    const n = state.scnCount;
    const names = propNames(n, state.set.props);
    const rows = [];
    for(let i=0;i<n;i++) rows.push(buildRow(i, names[i], Math.round(state.pcts[i] ?? 0), n === 1));
    byId("scnTable").replaceChildren(...rows);
    updateSum(app);
  }

  function updateSum({ state }){
    const sum = state.pcts.slice(0,state.scnCount).reduce((a,b)=>a+(parseFloat(b)||0),0);
    const el = byId("pctSum");
    el.textContent = round2(sum) + "%";
    el.className = "val " + (Math.abs(sum-100)<0.01 ? "ok" : "bad");
  }

  /** Bind once. */
  function mount(app){
    const tbl = byId("scnTable");
    const rowOf = el => el.closest(".dist-row");

    const commit = (i, v, {syncRange=true, syncNum=true}={}) => {
      v = app.svc.setPct(i, v);
      const row = tbl.children[i];
      const range = row.querySelector(".slider");
      const num   = row.querySelector(".pct-num");
      if(syncRange){ range.value = v; }
      setRangeFill(range, v);
      if(syncNum){ num.value = v; }
      updateSum(app); app.refresh();
    };
    const idx = el => +el.dataset.i;
    const multi = () => app.state.scnCount > 1;

    tbl.addEventListener("input", e=>{
      const t = e.target;
      if(!multi()) return;
      if(t.matches(".slider")){
        commit(idx(t), +t.value, {syncRange:false});
      } else if(t.matches(".pct-num")){
        const raw = t.value;
        const v = raw === "" ? 0 : clamp(parseInt(raw,10) || 0, 0, 100);
        commit(idx(t), v, {syncNum:false});
        if(raw !== "" && String(v) !== raw) t.value = v;
      }
    });

    // focusout bubbles; blur does not.
    tbl.addEventListener("focusout", e=>{
      const t = e.target;
      if(multi() && t.matches(".pct-num") && t.value === "") t.value = app.state.pcts[idx(t)];
    });

    tbl.addEventListener("click", e=>{
      const b = e.target.closest(".pct-dec, .pct-inc");
      if(!b || !multi() || !rowOf(b)) return;
      const i = idx(b);
      commit(i, app.state.pcts[i] + (b.classList.contains("pct-inc") ? 1 : -1));
    });
  }

  C.ui = C.ui || {};
  C.ui.scenarioTable = Object.freeze({ mount, render, updateSum });
})(globalThis.Commandeer = globalThis.Commandeer || {});
