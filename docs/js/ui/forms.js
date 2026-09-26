/* ================================================================
   ui/forms.js — plain field <-> state binding for the main form and
   the Preferences drawer, plus scenario count, rounding mode,
   runtime toggle and reset.

   Adding a simple text field = one line in MAIN_FIELDS/SETTINGS_FIELDS
   plus its <input> in index.html.
   ================================================================ */
(function (C) {
  "use strict";
  const { byId, toast } = C.dom;
  const { digitsOnly } = C.utils;
  const { SCENARIOS } = C.config;

  // id: element id · key: state key · numeric: digits-only sanitising
  // fallback: shown when the stored value is falsy
  const MAIN_FIELDS = [
    { id:"project",  key:"project" },
    { id:"path",     key:"path" },
    { id:"target",   key:"target",   numeric:true },
    { id:"rampup",   key:"rampup",   numeric:true, fallback:"" },
    { id:"duration", key:"duration", numeric:true, fallback:"" }
  ];
  const SETTINGS_FIELDS = [   // keys under state.set
    { id:"setDebug",        key:"debug" },
    { id:"setInc",          key:"inc",          numeric:true },
    { id:"setLadder",       key:"ladder" },
    { id:"setFilename",     key:"filename" },
    { id:"setTester",       key:"tester",        fallback:"" },
    { id:"setJmeter",       key:"jmeterVersion", fallback:"" },
    { id:"setRampupProp",   key:"rampupProp",    fallback:"rampup" },
    { id:"setDurationProp", key:"durationProp",  fallback:"duration" }
  ];

  const ROUNDING_HELP = {
    exact:   "Step totals stay exact. Small scenarios may round down.",
    roundup: "Keeps small scenarios near their share. Step totals may be 1 vUser over."
  };

  // ---- field binding -------------------------------------------------
  function fillFields(fields, target){
    fields.forEach(f=>{
      const v = target[f.key];
      byId(f.id).value = f.fallback !== undefined ? (v || f.fallback) : v;
    });
  }

  function bindFields(fields, getTarget, onChange){
    fields.forEach(f=>{
      byId(f.id).addEventListener("input", e=>{
        let v = e.target.value;
        if(f.numeric){
          const clean = digitsOnly(v);
          if(clean !== v) e.target.value = clean;
          v = clean;
        }
        getTarget()[f.key] = v;
        onChange();
      });
    });
  }

  // ---- renderers -----------------------------------------------------
  function fillMain({ state }){
    fillFields(MAIN_FIELDS, state);
    byId("scnCount").value = state.scnCount;
    renderScenarioHint(state);
  }

  function fillSettings({ state }){
    fillFields(SETTINGS_FIELDS, state.set);
    byId("setHeader").checked = !!state.set.header;
    byId("setRuntime").checked = !!state.set.runtime;
  }

  function renderScenarioHint(state){
    byId("scnHint").hidden = state.scnCount < SCENARIOS.HINT_AT;
  }

  function renderRuntimeVisibility({ state }){
    const on = !!state.set.runtime;
    byId("runtimeSection").hidden = !on;
    byId("runtimePropList").hidden = !on;
  }

  function renderRounding({ state }){
    document.querySelectorAll("#roundSeg .seg-btn").forEach(b=>{
      const active = b.dataset.mode === state.rounding;
      b.classList.toggle("on", active);
      b.setAttribute("aria-checked", active ? "true" : "false");
    });
    byId("roundHelp").textContent = state.rounding === "exact" ? ROUNDING_HELP.exact : ROUNDING_HELP.roundup;
  }

  function renderPersistNote(store){
    byId("persistNote").textContent = store.ok
      ? "Persists in this browser."
      : "Storage blocked — settings won't persist.";
  }

  // ---- wiring (bind once) --------------------------------------------
  function mount(app){
    const { svc, ui } = app;
    const refresh = () => app.refresh();

    bindFields(MAIN_FIELDS, () => app.state, refresh);
    bindFields(SETTINGS_FIELDS, () => app.state.set, refresh);

    // Scenario count stepper
    const scn = byId("scnCount");
    const setScn = v => {
      scn.value = svc.setScenarioCount(v);
      renderScenarioHint(app.state);
      ui.scenarioTable.render(app); ui.propertyList.render(app); refresh();
    };
    scn.addEventListener("input", e=> setScn(parseInt(e.target.value,10)||1));
    byId("scnPlus").addEventListener("click", ()=> setScn(app.state.scnCount+1));
    byId("scnMinus").addEventListener("click", ()=> setScn(app.state.scnCount-1));

    byId("evenBtn").addEventListener("click", ()=>{
      svc.evenSplit();
      ui.scenarioTable.render(app); refresh();
    });

    document.querySelectorAll("#roundSeg .seg-btn").forEach(b=>{
      b.addEventListener("click", ()=>{
        if(app.state.rounding === b.dataset.mode) return;
        app.state.rounding = b.dataset.mode;
        renderRounding(app); refresh();
      });
    });

    byId("setHeader").addEventListener("change", e=>{
      app.state.set.header = e.target.checked; refresh();
    });
    byId("setRuntime").addEventListener("change", e=>{
      app.state.set.runtime = e.target.checked;
      renderRuntimeVisibility(app);
      refresh();
    });

    byId("resetBtn").addEventListener("click", ()=>{
      svc.resetSettings();
      fillSettings(app);
      renderRuntimeVisibility(app);
      ui.scenarioTable.render(app); ui.propertyList.render(app); refresh();
      toast("Settings reset to defaults");
    });
  }

  C.ui = C.ui || {};
  C.ui.forms = Object.freeze({
    mount, fillMain, fillSettings, renderRuntimeVisibility, renderRounding, renderPersistNote
  });
})(globalThis.Commandeer = globalThis.Commandeer || {});
