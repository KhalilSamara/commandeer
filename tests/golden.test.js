/* Byte-for-byte regression against output captured from the verified
   v1 single-file build. If this fails, output format or rounding changed.
   Only regenerate fixtures for an INTENDED behaviour change. */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const C = require("./helpers/load-core")();
const { now, cases } = require("./fixtures/golden-v1.json");
const [y, m, d] = now.split("-").map(Number);
const NOW = new Date(y, m - 1, d);

for (const c of cases) {
  test(`golden: ${c.name}`, () => {
    const model = C.model.buildModel(structuredClone(c.state), NOW);
    if (c.expected.error) {
      assert.equal(model.error, c.expected.error);
      return;
    }
    assert.equal(model.error, undefined);
    assert.equal(model.text, c.expected.text);
    assert.equal(model.filename, c.expected.filename);
    assert.equal(model.mode, c.expected.mode);
    assert.equal(model.anyBump, c.expected.anyBump);
    assert.deepEqual(
      model.rows.map(({ total, debug, parts, bumped, bumpedAt }) => ({ total, debug, parts, bumped, bumpedAt })),
      c.expected.rows);
    assert.equal(C.highlight.highlight(model.text, model), c.expected.highlight);
  });
}
