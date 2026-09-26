/* Domain rules for splitting a step total across scenarios, checked
   over many generated splits rather than a handful of examples. */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const C = require("./helpers/load-core")();
const { distribute, distributeExact, evenPcts } = C.distribution;

const sum = a => a.reduce((x, y) => x + y, 0);

// Deterministic PRNG so failures are reproducible.
function* splits(count, seed = 42) {
  let s = seed;
  const r = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  for (let k = 0; k < count; k++) {
    const n = 2 + Math.floor(r() * 12);
    const p = Array.from({ length: n }, () => 1 + Math.floor(r() * 50));
    const t = sum(p);
    const pcts = p.map(v => Math.max(1, Math.floor(v * 100 / t)));
    pcts[pcts.indexOf(Math.max(...pcts))] += 100 - sum(pcts);
    yield { pcts, total: 1 + Math.floor(r() * 3000) };
  }
}

test("round-up: total is N or N+1, never under", () => {
  for (const { pcts, total } of splits(5000)) {
    const { parts } = distribute(total, pcts);
    const s = sum(parts);
    // min-1 rescue can push further over; buildModel rejects those steps.
    if (parts.some((v, i) => v === 1 && total * pcts[i] / 100 < 1)) continue;
    assert.ok(s === total || s === total + 1, `${total} ${pcts} -> ${parts}`);
  }
});

test("round-up: bumped flag and bumpedAt match an N+1 result", () => {
  for (const { pcts, total } of splits(5000)) {
    const r = distribute(total, pcts);
    if (r.bumped) {
      assert.equal(typeof r.bumpedAt, "number");
      assert.ok(r.parts[r.bumpedAt] > Math.floor(total * pcts[r.bumpedAt] / 100));
    } else {
      assert.equal(r.bumpedAt, null);
    }
  }
});

test("round-up: no scenario is ever rounded down", () => {
  for (const { pcts, total } of splits(5000)) {
    const { parts } = distribute(total, pcts);
    parts.forEach((v, i) => assert.ok(v >= Math.floor(total * pcts[i] / 100)));
  }
});

test("both modes: every nonzero share gets at least 1 user", () => {
  for (const { pcts, total } of splits(5000)) {
    for (const f of [distribute, distributeExact]) {
      f(total, pcts).parts.forEach((v, i) => { if (pcts[i] > 0) assert.ok(v >= 1); });
    }
  }
});

test("exact: sum equals N whenever N >= scenario count", () => {
  for (const { pcts, total } of splits(5000)) {
    if (total < pcts.length) continue;
    assert.equal(sum(distributeExact(total, pcts).parts), total, `${total} ${pcts}`);
  }
});

test("single scenario gets the whole total", () => {
  assert.deepEqual(distribute(37, [100]), { parts: [37], bumped: false, bumpedAt: null });
  assert.deepEqual(distributeExact(37, [100]), { parts: [37], bumped: false, bumpedAt: null });
});

test("evenPcts sums to 100 and differs by at most 1", () => {
  for (let n = 1; n <= 50; n++) {
    const p = evenPcts(n);
    assert.equal(p.length, n);
    assert.equal(sum(p), 100);
    assert.ok(Math.max(...p) - Math.min(...p) <= 1);
  }
});
