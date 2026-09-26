/* ================================================================
   ui/drawer.js — Preferences slide-over: open/close, scrim, Esc.
   ================================================================ */
(function (C) {
  "use strict";
  const { byId } = C.dom;

  const FOCUS_DELAY_MS = 240;   // after the .22s slide-in transition
  const FIRST_FIELD_ID = "setDebug";

  function mount(){
    const drawer = byId("drawer");
    const scrim  = byId("drawerScrim");
    const opener = byId("drawerOpen");
    const closer = byId("drawerClose");

    const setOpen = on => {
      drawer.classList.toggle("open", on);
      scrim.classList.toggle("open", on);
      opener.classList.toggle("active", on);
    };
    const open = () => {
      setOpen(true);
      setTimeout(()=>{
        const first = document.getElementById(FIRST_FIELD_ID);
        if(first) first.focus();
      }, FOCUS_DELAY_MS);
    };
    const close = () => setOpen(false);

    opener.addEventListener("click", open);
    closer.addEventListener("click", close);
    scrim.addEventListener("click", close);
    document.addEventListener("keydown", e=>{
      if(e.key === "Escape" && drawer.classList.contains("open")) close();
    });
  }

  C.ui = C.ui || {};
  C.ui.drawer = Object.freeze({ mount });
})(globalThis.Commandeer = globalThis.Commandeer || {});
