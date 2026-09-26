"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const C = require("./helpers/load-core")();
const { buildLadder, propNames } = C.ladder;
const totals = rows => rows.map(r => r.total);

const BASE = [50, 100, 150, 250, 500, 750, 1000];

test("debug rows first, then ascending load steps ending on target", () => {
  const rows = buildLadder(1600, [15], BASE, 250);
  assert.deepEqual(totals(rows), [15, 50, 100, 150, 250, 500, 750, 1000, 1250, 1500, 1600]);
  assert.deepEqual(rows.map(r => r.debug), [true, ...Array(10).fill(false)]);
});

test("target below the base ladder trims it and still reaches target", () => {
  assert.deepEqual(totals(buildLadder(120, [15], BASE, 250)), [15, 50, 100, 120]);
});

test("no duplicates; debug value equal to a step stays a debug row", () => {
  const rows = buildLadder(100, [50, 50], BASE, 250);
  assert.deepEqual(totals(rows), [50, 100]);
  assert.equal(rows[0].debug, true);
});

test("propNames: custom (trimmed) or S<n> fallback", () => {
  assert.deepEqual(propNames(4, [" Login ", "", "  "]), ["Login", "S2", "S3", "S4"]);
});
