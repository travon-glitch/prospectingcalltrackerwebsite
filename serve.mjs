#!/usr/bin/env node
// Local preview of dist/ that behaves like Vercel's cleanUrls: /software serves dist/software.html.
//   node serve.mjs            → http://localhost:4321
//   PORT=8080 node serve.mjs
// The website editor's API (api/admin.js) also runs here, so /admin works locally when ADMIN_PASSWORD, GITHUB_TOKEN
// and GITHUB_REPO are set in your shell (it edits the real GitHub repository, exactly like on Vercel).
import { createReadStream, existsSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const DIST = fileURLToPath(new URL("./dist/", import.meta.url));
const PORT = Number(process.env.PORT) || 4321;
// The same security headers Vercel adds (vercel.json), so the preview enforces the same Content-Security-Policy.
// upgrade-insecure-requests is left out locally: it would turn http://localhost asset requests into https ones.
const VERCEL = JSON.parse(readFileSync(new URL("./vercel.json", import.meta.url), "utf8"));
const SITE_HEADERS = Object.fromEntries(VERCEL.headers.find((h) => h.source === "/(.*)").headers.filter((h) => h.key !== "Strict-Transport-Security").map((h) => [h.key, h.value.replace(/;\s*upgrade-insecure-requests/, "")]));
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".xml": "application/xml", ".txt": "text/plain; charset=utf-8", ".json": "application/json", ".pdf": "application/pdf", ".ico": "image/x-icon", ".mp4": "video/mp4" };

function resolve(urlPath) {
  const clean = normalize(decodeURIComponent(urlPath)).replace(/^(\.\.[/\\])+/, "");
  const candidates = clean === "/" ? ["index.html"] : [clean.slice(1), `${clean.slice(1)}.html`, `${clean.slice(1)}/index.html`];
  for (const c of candidates) {
    const f = join(DIST, c);
    if (f.startsWith(DIST) && existsSync(f) && statSync(f).isFile()) return f;
  }
  return null;
}

createServer(async (req, res) => {
  const path = new URL(req.url, "http://x").pathname;
  if (path === "/api/admin") {
    const { default: admin } = await import("./api/admin.js");
    return admin(req, res);
  }
  if (path.endsWith(".html") && path !== "/404.html") {
    res.writeHead(308, { Location: path.replace(/(index)?\.html$/, "") || "/" });
    return res.end();
  }
  const file = resolve(path);
  const status = file ? 200 : 404;
  const f = file ?? join(DIST, "404.html");
  res.writeHead(status, { ...SITE_HEADERS, "Content-Type": TYPES[extname(f)] ?? "application/octet-stream", "Cache-Control": "no-store" });
  createReadStream(f).pipe(res);
}).listen(PORT, () => console.log(`Preview: http://localhost:${PORT}`));
