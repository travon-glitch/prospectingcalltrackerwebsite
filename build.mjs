#!/usr/bin/env node
// Builds the static website into dist/. Node built-ins only — no npm install needed.
//
//   node build.mjs          build dist/
//
// All copy comes from content/site.json (edit it at /admin, or directly on GitHub). Templates live in templates/. Static files (CSS, JS, images) in assets/.

import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { page, themeCss } from "./templates/layout.mjs";
import { setMockupNote } from "./templates/mockups.mjs";
import { allPages } from "./templates/pages.mjs";
import { parseContent, validateSite } from "./templates/validate.mjs";
import { pullSite } from "./cms/directus.mjs";
import { pullSupabase } from "./cms/supabase.mjs";

const ROOT = dirname(fileURLToPath(import.meta.url));
const DIST = join(ROOT, "dist");

function loadContent() {
  const { site, error } = parseContent(readFileSync(join(ROOT, "content", "site.json"), "utf8"));
  if (error) {
    console.error(`\n${error}\n`);
    process.exit(1);
  }
  return site;
}

// Content source, in this order:
//   1. Supabase  when SUPABASE_URL + SUPABASE_ANON_KEY are set (see supabase/README.md)
//   2. Directus  when DIRECTUS_URL + DIRECTUS_TOKEN are set (see cms/README.md)
//   3. content/site.json
let site = loadContent();
let cmsFiles = null;
let sbFiles = null;
const SB_URL = process.env.SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
if (SB_URL && SB_KEY) {
  try {
    const pulled = await pullSupabase({ url: SB_URL, key: SB_KEY, fallback: site });
    site = pulled.site;
    sbFiles = pulled.files;
    console.log(pulled.fromSupabase ? `Content loaded from Supabase (version ${pulled.version}, ${pulled.files.length} uploaded file(s)).` : "Supabase has no content yet (open /admin once to import it); using content/site.json.");
  } catch (err) {
    console.error(`\nCould not load the content from Supabase: ${err.message}\nThe live website stays as it is until this is fixed.\n`);
    process.exit(1);
  }
} else if (process.env.DIRECTUS_URL && process.env.DIRECTUS_TOKEN) {
  try {
    const pulled = await pullSite({ url: process.env.DIRECTUS_URL, token: process.env.DIRECTUS_TOKEN, fallback: site });
    site = pulled.site;
    cmsFiles = pulled;
    console.log(`Content loaded from Directus (${process.env.DIRECTUS_URL}).`);
  } catch (err) {
    console.error(`\nCould not load the content from Directus: ${err.message}\nThe live website stays as it is until this is fixed.\n`);
    process.exit(1);
  }
}
const problems = validateSite(site);
if (problems.length) {
  console.error(`\ncontent/site.json can't be built yet:\n  - ${problems.join("\n  - ")}\n`);
  process.exit(1);
}
setMockupNote(site.mockupNote);

// Cache-busting version for the CSS and JS, so browsers fetch the new file after every change.
const version = createHash("sha256")
  .update(readFileSync(join(ROOT, "assets", "styles.css")))
  .update(readFileSync(join(ROOT, "assets", "site.js")))
  .update(themeCss(site))
  .digest("hex")
  .slice(0, 10);

if (existsSync(DIST)) rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });
cpSync(join(ROOT, "assets"), join(DIST, "assets"), { recursive: true });
if (sbFiles?.length) {
  mkdirSync(join(DIST, "assets", "media"), { recursive: true });
  for (const f of sbFiles) writeFileSync(join(DIST, "assets", "media", f.name), f.bytes);
}
if (cmsFiles) {
  mkdirSync(join(DIST, "assets", "cms"), { recursive: true });
  for (const [id, f] of cmsFiles.files) {
    const res = await cmsFiles.download(id);
    writeFileSync(join(DIST, f.path), Buffer.from(await res.arrayBuffer()));
  }
}
if (themeCss(site)) writeFileSync(join(DIST, "assets", "theme.css"), themeCss(site));
// The website editor (password protected; its API lives in api/admin.js).
cpSync(join(ROOT, "admin"), join(DIST, "admin"), { recursive: true });
// List of the site's own images, for the editor's media library.
const listAssets = (dir) => (existsSync(join(ROOT, dir)) ? readdirSync(join(ROOT, dir)).filter((f) => !f.startsWith(".")).map((f) => ({ path: `/${dir}/${f}`, name: f, folder: dir })) : []);
writeFileSync(join(DIST, "admin", "assets.json"), JSON.stringify(["assets/img", "assets/uploads", "assets/downloads", "assets/placeholders"].flatMap(listAssets)));

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
writeFileSync(join(DIST, "robots.txt"), `User-agent: *\nAllow: /\nDisallow: /thank-you\nDisallow: /admin\n\nSitemap: ${base}/sitemap.xml\n`);

console.log(`Built ${pages.length} pages into dist/ (assets v${version}).`);
if (/YOUR-CRM-DOMAIN/i.test(site.forms.endpoint)) console.log("Note: forms.endpoint is still the placeholder — forms will say they are not connected yet.");
