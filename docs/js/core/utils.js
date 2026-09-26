/* ================================================================
   core/utils.js — small pure helpers shared by core and UI.
   ================================================================ */
(function (C) {
  "use strict";

  /** Escape text for insertion into HTML element content. */
  function esc(t) {
    return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function round2(n) { return Math.round(n * 100) / 100; }

  /** Filesystem-safe token; never empty. */
  function sanitize(t) {
    return String(t).replace(/[^\w.\-]+/g, "_").replace(/^_+|_+$/g, "") || "project";
  }

  /** "50, 100,x,150" -> [50,100,150] (positive integers only). */
  function parseList(str) {
    return String(str).split(",").map(s => parseInt(s.trim(), 10)).filter(v => Number.isFinite(v) && v > 0);
  }

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  /** Deep copy for plain JSON data. */
  function clone(obj) { return JSON.parse(JSON.stringify(obj)); }

  /** Strip everything but digits (numeric text inputs). */
  function digitsOnly(s) { return String(s).replace(/[^\d]/g, ""); }

  C.utils = Object.freeze({ esc, round2, sanitize, parseList, clamp, clone, digitsOnly });
})(globalThis.Commandeer = globalThis.Commandeer || {});
