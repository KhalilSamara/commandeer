"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const C = require("./helpers/load-core")();
const { createStore } = C.storage;
const { createStateService } = C.stateService;
const { STORAGE_KEY } = C.config;

const memBackend = () => {
  const m = new Map();
  return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k) };
};

test("store degrades to memory when storage access throws", () => {
  const store = createStore(() => { throw new Error("SecurityError"); });
  assert.equal(store.ok, false);
  store.set("k", "v");
  assert.equal(store.get("k"), "v");
});

test("state round-trips through storage", () => {
  const backend = memBackend();
  const a = createStateService(createStore(() => backend));
  a.load();
  a.state.project = "X"; a.setScenarioCount(5); a.save();
  const b = createStateService(createStore(() => backend));
  b.load();
  assert.equal(b.state.project, "X");
  assert.equal(b.state.scnCount, 5);
  assert.equal(b.state.set.props.length, 5);
});

test("corrupt saved JSON falls back to defaults", () => {
  const backend = memBackend();
  backend.setItem(STORAGE_KEY, "{not json");
  const svc = createStateService(createStore(() => backend));
  assert.equal(svc.load().target, 2000);
});

test("invalid rounding mode is repaired", () => {
  const backend = memBackend();
  backend.setItem(STORAGE_KEY, JSON.stringify({ rounding: "weird" }));
  assert.equal(createStateService(createStore(() => backend)).load().rounding, "roundup");
});

test("setScenarioCount clamps to 1..50 and keeps custom names when shrinking", () => {
  const svc = createStateService(createStore(memBackend));
  svc.load();
  svc.state.set.props = ["A", "B", "C"];
  assert.equal(svc.setScenarioCount(99), 50);
  assert.equal(svc.setScenarioCount(0), 1);
  assert.equal(svc.state.pcts.length, 1);
  assert.deepEqual(svc.state.set.props.slice(0, 3), ["A", "B", "C"]);
});

test("resetSettings restores defaults without touching run inputs", () => {
  const svc = createStateService(createStore(memBackend));
  svc.load();
  svc.state.path = "a.jmx"; svc.state.set.inc = "7";
  svc.resetSettings();
  assert.equal(svc.state.set.inc, 250);
  assert.equal(svc.state.path, "a.jmx");
  assert.equal(svc.state.set.props.length, svc.state.scnCount);
});

test("DEFAULTS cannot be mutated by accident", () => {
  assert.throws(() => { "use strict"; C.config.DEFAULTS.inc = 1; });
});
