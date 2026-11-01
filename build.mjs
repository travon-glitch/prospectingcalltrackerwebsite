#!/usr/bin/env node
// Builds the static website into dist/. Node built-ins only — no npm install needed.
//
//   node build.mjs          build dist/
//
// All copy comes from content/site.json. Templates live in templates/. Static files (CSS, JS, images) in assets/.

import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { page } from "./templates/layout.mjs";
import { setMockupNote } from "./templates/mockups.mjs";
import { allPages } from "./templates/pages.mjs";

const ROOT = dirname(fileURLToPath(import.meta.url));
const DIST = join(ROOT, "dist");

function loadContent() {
  const file = join(ROOT, "content", "site.json");
  const raw = readFileSync(file, "utf8");
  try {
    return JSON.parse(raw);
  } catch (err) {
    // Point non-programmers at the line with the typo (usually a missing comma or quote).
    const pos = Number(/position (\d+)/.exec(err.message)?.[1]);
    const line = Number.isFinite(pos) ? raw.slice(0, pos).split("\n").length : "?";
    console.error(`\ncontent/site.json has a formatting mistake near line ${line}.\nCheck for a missing comma, quote or bracket.\n(${err.message})\n`);
    process.exit(1);
  }
}

function check(site) {
  const need = ["site.name", "site.url", "forms.endpoint", "forms.requestTypes", "ctas", "nav", "footer.disclaimer", "pages.home", "pages.software", "pages.consulting", "pages.howItWorks", "pages.about", "pages.resources", "pages.pricing", "pages.demo", "pages.contact", "pages.privacy", "pages.terms", "pages.thankYou", "pages.notFound"];
  const missing = need.filter((p) => p.split(".").reduce((o, k) => (o == null ? o : o[k]), site) == null);
  if (missing.length) {
    console.error(`\ncontent/site.json is missing: ${missing.join(", ")}\n`);
    process.exit(1);
  }
  if (!/^https:\/\/[^/]+/.test(site.site.url)) {
    console.error("\ncontent/site.json → site.url must be your full https:// address, e.g. https://www.prospectingcalltracker.com\n");
    process.exit(1);
  }
}

const site = loadContent();
check(site);
setMockupNote(site.mockupNote);

// Cache-busting version for the CSS and JS, so browsers fetch the new file after every change.
const version = createHash("sha256")
  .update(readFileSync(join(ROOT, "assets", "styles.css")))
  .update(readFileSync(join(ROOT, "assets", "site.js")))
  .digest("hex")
  .slice(0, 10);

if (existsSync(DIST)) rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });
cpSync(join(ROOT, "assets"), join(DIST, "assets"), { recursive: true });

const pages = allPages(site);
for (const p of pages) writeFileSync(join(DIST, p.file), page(site, { ...p, version }));

const base = site.site.url.replace(/\/$/, "");
const today = new Date().toISOString().slice(0, 10);
const indexed = pages.filter((p) => !p.noindex);
writeFileSync(
  join(DIST, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${indexed
    .map((p) => `  <url><loc>${base}${p.path === "/" ? "/" : p.path}</loc><lastmod>${today}</lastmod><priority>${p.path === "/" ? "1.0" : "0.8"}</priority></url>`)
    .join("\n")}\n</urlset>\n`,
);
writeFileSync(join(DIST, "robots.txt"), `User-agent: *\nAllow: /\nDisallow: /thank-you\n\nSitemap: ${base}/sitemap.xml\n`);

console.log(`Built ${pages.length} pages into dist/ (assets v${version}).`);
if (/YOUR-CRM-DOMAIN/i.test(site.forms.endpoint)) console.log("Note: forms.endpoint is still the placeholder — forms will say they are not connected yet.");
