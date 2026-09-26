/* ================================================================
   ui/preview.js — right-hand RUNME preview, meta strip, and the
   enabled state of Copy / Generate.
   ================================================================ */
(function (C) {
  "use strict";
  const { byId } = C.dom;
  const { highlight } = C.highlight;
  const { resolveFilename } = C.format;
  const { ROUNDING } = C.config;

  function showError(state, message){
    byId("pvBody").hidden = true;
    byId("pvEmpty").hidden = false;
    byId("pvEmptyMsg").textContent = message;
    byId("pvMeta").textContent = "";
    byId("pvName").textContent = resolveFilename(state);
    setActionsEnabled(false);
  }

  function showModel(model){
    const body = byId("pvBody");
    body.hidden = false;
    byId("pvEmpty").hidden = true;
    body.innerHTML = highlight(model.text, model);
    byId("pvName").textContent = model.filename;

    const parts = [
      `${model.rows.length} steps`,
      `reach ${model.target}`,
      model.mode === ROUNDING.EXACT ? "exact" : "round-up"
    ];
    if(model.anyBump) parts.push(`<span class="flag">+1 flagged</span>`);
    byId("pvMeta").innerHTML = parts.map(p => `<span>${p}</span>`).join(" · ");
    byId("lgFlag").hidden = model.mode === ROUNDING.EXACT;
    setActionsEnabled(true);
  }

  function setActionsEnabled(on){
    byId("genBtn").disabled = !on;
    byId("copyBtn").disabled = !on;
  }

  /** @param model result of core.model.buildModel */
  function render(state, model){
    if(model.error) showError(state, model.error);
    else showModel(model);
  }

  C.ui = C.ui || {};
  C.ui.preview = Object.freeze({ render });
})(globalThis.Commandeer = globalThis.Commandeer || {});
