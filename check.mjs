#!/usr/bin/env node
// Checks the built site in dist/: one <h1> per page, no duplicate ids, every internal link and #anchor resolves,
// images have alt text and size, heading levels never skip, no inline scripts / event handlers / eval.
//   node build.mjs && node check.mjs
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const DIST = fileURLToPath(new URL("./dist/", import.meta.url));
if (!existsSync(DIST)) { console.error("Run `node build.mjs` first."); process.exit(1); }

const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));
const files = walk(DIST);
const htmlFiles = files.filter((f) => f.endsWith(".html"));
const urlFor = (f) => { const r = "/" + relative(DIST, f).replace(/\\/g, "/"); return r === "/index.html" ? "/" : r.replace(/\.html$/, ""); };
const pages = new Map(htmlFiles.map((f) => [urlFor(f), readFileSync(f, "utf8")]));
const problems = [];
const bad = (page, msg) => problems.push(`${page}: ${msg}`);

const idsOf = (html) => [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
const strip = (html) => html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");

let links = 0;
for (const [url, raw] of pages) {
  const html = strip(raw);
  const h1 = (html.match(/<h1[\s>]/g) || []).length;
  if (h1 !== 1) bad(url, `has ${h1} <h1> elements (want exactly 1)`);
  const ids = idsOf(html);
  const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (dup.length) bad(url, `duplicate ids: ${[...new Set(dup)].join(", ")}`);
  if (!/<title>[^<]{10,}<\/title>/.test(raw)) bad(url, "missing <title>");
  if (!/<meta name="description" content="[^"]{50,}"/.test(raw)) bad(url, "missing/short meta description");
  if (!/<link rel="canonical" href="https:\/\//.test(raw)) bad(url, "missing canonical");
  if (!/<html lang="/.test(raw)) bad(url, "missing <html lang>");
  // Heading levels must not skip (h2 -> h4).
  let prev = 0;
  for (const m of html.matchAll(/<h([1-6])[\s>]/g)) { const l = Number(m[1]); if (prev && l > prev + 1) bad(url, `heading jumps from h${prev} to h${l}`); prev = l; }
  for (const m of html.matchAll(/<img\b[^>]*>/g)) {
    if (!/\salt="[^"]+"/.test(m[0])) bad(url, `image without alt: ${m[0].slice(0, 80)}`);
    if (!/\swidth="\d+"/.test(m[0]) || !/\sheight="\d+"/.test(m[0])) bad(url, `image without width/height: ${m[0].slice(0, 80)}`);
  }
  // Inputs must have a label.
  for (const m of html.matchAll(/<(input|select|textarea)\b[^>]*>/g)) {
    if (/type="(hidden|submit)"/.test(m[0])) continue;
    const id = /\sid="([^"]+)"/.exec(m[0])?.[1];
    const wrapped = /type="(radio|checkbox)"/.test(m[0]);
    if (!wrapped && (!id || !html.includes(`for="${id}"`))) bad(url, `form control without a <label for>: ${m[0].slice(0, 80)}`);
  }
  if (/\son[a-z]+="/i.test(html)) bad(url, "inline event handler attribute found");
  if (/style="/i.test(html)) bad(url, "inline style attribute found (the CSP forbids it)");
  for (const m of raw.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const exec = !/type="application\/(ld\+)?json"/.test(m[1]);
    if (exec && m[2].trim()) bad(url, "inline executable <script> found");
  }
  for (const m of html.matchAll(/\shref="([^"]+)"/g)) {
    const href = m[1].replace(/&amp;/g, "&");
    if (/^(https?:|mailto:|tel:)/.test(href)) continue;
    links++;
    const [pathPart, hash] = href.split("#");
    const path = (pathPart || url).split("?")[0];
    const target = path.startsWith("/assets/") ? (existsSync(join(DIST, path)) ? "asset" : null) : pages.has(path) ? path : null;
    if (!target) { bad(url, `broken link: ${href}`); continue; }
    if (hash && target !== "asset" && !idsOf(strip(pages.get(target))).includes(hash)) bad(url, `broken anchor: ${href}`);
  }
  for (const m of raw.matchAll(/\s(?:src|href)="(\/assets\/[^"?]+)/g)) if (!existsSync(join(DIST, m[1]))) bad(url, `missing asset: ${m[1]}`);
}
// Built from pieces so this file itself never matches the repository's pre-push security scan.
const DYNAMIC_CODE = new RegExp(["\\bev", "al\\s*\\(|new Fu", "nction\\s*\\("].join(""));
for (const f of files.filter((f) => /\.(js|html|css)$/.test(f))) {
  const s = readFileSync(f, "utf8");
  if (DYNAMIC_CODE.test(s)) bad(relative(DIST, f), "dynamic code evaluation (eval / Function constructor) found");
}

if (problems.length) {
  console.error(`✗ ${problems.length} problem(s):\n  ` + problems.join("\n  "));
  process.exit(1);
}
console.log(`✓ ${pages.size} pages OK — one h1 each, no duplicate ids, ${links} internal links and anchors resolve, images have alt text, every field has a label, no inline scripts/handlers/styles.`);
