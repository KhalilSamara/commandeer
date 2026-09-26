/* ================================================================
   app.js — composition root. Creates services, wires UI modules,
   owns the refresh cycle: state -> model -> preview -> save.
   Loaded last.
   ================================================================ */
(function (C) {
  "use strict";
  const { buildModel } = C.model;
  const { createStore } = C.storage;
  const { createStateService } = C.stateService;
  const ui = C.ui;

  const store = createStore();
  const svc   = createStateService(store);
  const state = svc.load();

  const app = {
    state, svc, store, ui,
    lastModel: null,

    /** Recompute everything derived from state. Call after any change. */
    refresh(){
      const model = buildModel(state);
      app.lastModel = model.error ? null : model;
      ui.preview.render(state, model);
      svc.save();
    }
  };

  // Initial paint (order matters: inputs, then derived lists, then preview)
  ui.forms.fillMain(app);
  ui.forms.fillSettings(app);
  ui.forms.renderRuntimeVisibility(app);
  ui.scenarioTable.render(app);
  ui.propertyList.render(app);
  ui.forms.renderRounding(app);

  // Bind events once
  ui.forms.mount(app);
  ui.scenarioTable.mount(app);
  ui.propertyList.mount(app);
  ui.drawer.mount();
  document.getElementById("genBtn").addEventListener("click", ()=> ui.exporter.download(app.lastModel));
  document.getElementById("copyBtn").addEventListener("click", ()=> ui.exporter.copy(app.lastModel));

  ui.forms.renderPersistNote(store);
  app.refresh();

  C.app = app;   // handy for debugging in the console
})(globalThis.Commandeer = globalThis.Commandeer || {});
