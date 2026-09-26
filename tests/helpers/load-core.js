/* Loads the browser-style core scripts (same order as index.html) into
   this test process and returns the Commandeer namespace. Runs in the
   main realm so assert.deepEqual sees ordinary Arrays/Objects.
   node --test runs each test file in its own process: no leakage. */
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const SRC = path.join(__dirname, "..", "..", "docs", "js");
const CORE = [
  "core/config.js", "core/utils.js", "core/distribution.js",
  "core/ladder.js", "core/format.js", "core/model.js",
  "services/storage.js", "services/state.js", "ui/highlight.js"
];

module.exports = function loadCore() {
  delete globalThis.Commandeer;
  for (const f of CORE) vm.runInThisContext(fs.readFileSync(path.join(SRC, f), "utf8"), { filename: f });
  return globalThis.Commandeer;
};
