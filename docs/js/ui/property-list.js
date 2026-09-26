/* ================================================================
   ui/property-list.js — per-scenario JMeter property names (drawer).
   ================================================================ */
(function (C) {
  "use strict";
  const { byId, fromTemplate } = C.dom;

  function render({ state }){
    const rows = [];
    for(let i=0;i<state.scnCount;i++){
      const row = fromTemplate("tplPropRow");
      row.querySelector(".k").textContent = `scenario ${i+1}`;
      const inp = row.querySelector("input");
      inp.dataset.i = i;
      inp.setAttribute("value", state.set.props[i] ?? "");
      rows.push(row);
    }
    byId("propList").replaceChildren(...rows);
  }

  /** Bind once. Renaming a property relabels the distribution rows. */
  function mount(app){
    byId("propList").addEventListener("input", e=>{
      const t = e.target;
      if(!t.matches("input[data-i]")) return;
      app.state.set.props[+t.dataset.i] = t.value;
      app.ui.scenarioTable.render(app); app.refresh();
    });
  }

  C.ui = C.ui || {};
  C.ui.propertyList = Object.freeze({ mount, render });
})(globalThis.Commandeer = globalThis.Commandeer || {});
