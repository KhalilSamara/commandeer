/* ================================================================
   ui/export.js — download the RUNME file, copy it to the clipboard.
   ================================================================ */
(function (C) {
  "use strict";
  const { toast } = C.dom;

  function download(model){
    if(!model) return;
    const blob = new Blob([model.text], {type:"text/plain;charset=utf-8"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = model.filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(url), 1000);
    toast("Downloaded " + model.filename);
  }

  function copy(model){
    if(!model) return;
    const t = model.text;
    const done = ()=>toast("Copied to clipboard");
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(t).then(done).catch(()=>fallbackCopy(t,done));
    } else fallbackCopy(t,done);
  }

  // Clipboard API is unavailable on file:// in some browsers.
  function fallbackCopy(t, cb){
    const ta = document.createElement("textarea");
    ta.value = t; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); cb(); } catch (e) { /* nothing else to try */ }
    ta.remove();
  }

  C.ui = C.ui || {};
  C.ui.exporter = Object.freeze({ download, copy });
})(globalThis.Commandeer = globalThis.Commandeer || {});
