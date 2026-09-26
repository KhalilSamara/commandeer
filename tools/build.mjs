#!/usr/bin/env node
/* ================================================================
   tools/build.mjs — inline docs/ into ONE self-contained HTML file.

   Why: docs/index.html already runs as-is (open it, no build needed).
   This just produces dist/commandeer.html — a single file that is
   easier to carry onto air-gapped / IT-restricted client machines.

   Zero dependencies. Usage:  node tools/build.mjs
   ================================================================ */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const src  = join(root, "docs");
const out  = join(root, "dist", "commandeer.html");

const read = rel => readFileSync(join(src, rel), "utf8").replace(/\s+$/, "");
let html = readFileSync(join(src, "index.html"), "utf8");

// All <link rel="stylesheet"> -> one <style> block at the first link's position.
const cssLinks = [...html.matchAll(/^<link rel="stylesheet" href="([^"]+)">\n/gm)];
if (!cssLinks.length) throw new Error("build: no stylesheet links found");
const css = cssLinks.map(m => `/* ---- ${m[1]} ---- */\n${read(m[1])}`).join("\n\n");
html = html.replace(cssLinks[0][0], `<style>\n${css}\n</style>\n`);
cssLinks.slice(1).forEach(m => { html = html.replace(m[0], ""); });

// Each <script src> -> inline <script>, same order.
html = html.replace(/^<script src="([^"]+)"><\/script>$/gm, (_, p) => {
  const js = read(p);
  if (/<\/script/i.test(js)) throw new Error(`build: ${p} contains "</script"`);
  return `<script>\n/* ---- ${p} ---- */\n${js}\n</script>`;
});

// Guard the hard constraint: nothing may load from anywhere.
const external = html.match(/<(?:script|link)\b[^>]*\b(?:src|href)="(?!data:)[^"]+"/gi);
if (external) throw new Error("build: external reference left:\n" + external.join("\n"));

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, html);
console.log(`built ${out} (${(Buffer.byteLength(html) / 1024).toFixed(1)} KB)`);
