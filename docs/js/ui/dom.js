/* ================================================================
   ui/dom.js — DOM lookups, templates, toast.
   ================================================================ */
(function (C) {
  "use strict";

  function byId(id){
    const el = document.getElementById(id);
    if(!el) throw new Error(`Commandeer: missing #${id} in index.html`);
    return el;
  }

  /** First element of a <template id="..."> as a fresh clone. */
  function fromTemplate(id){
    return byId(id).content.firstElementChild.cloneNode(true);
  }

  let toastTimer = null;
  function toast(msg){
    const t = byId("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(()=>t.classList.remove("show"), 1800);
  }

  C.dom = Object.freeze({ byId, fromTemplate, toast });
})(globalThis.Commandeer = globalThis.Commandeer || {});
