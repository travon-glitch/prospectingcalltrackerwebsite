#!/usr/bin/env node
// One-time (and safe to re-run) setup of Directus for this website:
//   - creates the collections and fields (from content/site.json)
//   - imports the current website content and images (only into collections that are still empty)
//   - creates a "Website editor" role for the people who edit the site, and a read-only "Website build" user + token
//     for Vercel
//   - creates a Flow that rebuilds the website on Vercel whenever content is saved
//
// Run it from the website folder (Node 20+, nothing to install):
//
//   DIRECTUS_URL=https://cms.yourdomain.com \
//   DIRECTUS_ADMIN_TOKEN=<an admin user's static token> \
//   VERCEL_DEPLOY_HOOK=https://api.vercel.com/v1/integrations/deploy/... \
//   node cms/setup.mjs
//
// Options:  --reimport   overwrite the content in Directus with content/site.json (careful: replaces edits made in Directus)
//           --new-token  create a new build token (then update DIRECTUS_TOKEN in Vercel)

import { randomBytes } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ALL_COLLECTIONS, EXTRA_PAGE_TEMPLATE, EXTRA_PAGES, SINGLETONS, client, fieldDefs, flatten, singletonValue } from "./directus.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = new Set(process.argv.slice(2));
const URL_ = process.env.DIRECTUS_URL;
const TOKEN = process.env.DIRECTUS_ADMIN_TOKEN;
const HOOK = process.env.VERCEL_DEPLOY_HOOK || "";
const BUILD_EMAIL = process.env.DIRECTUS_BUILD_EMAIL || "website-build@example.com";

if (!URL_ || !TOKEN) {
  console.error("Set DIRECTUS_URL and DIRECTUS_ADMIN_TOKEN first (see the comments at the top of cms/setup.mjs or cms/README.md).");
  process.exit(1);
}
const api = client(URL_, TOKEN);
const site = JSON.parse(readFileSync(join(ROOT, "content", "site.json"), "utf8"));
const ctx = { ctaChoices: Object.entries(site.ctas).map(([value, c]) => ({ value, text: `${c.label} → ${c.href}` })) };
const log = (...a) => console.log(...a);

/* ------------------------------------------------------------------ helpers */

async function exists(path) {
  try {
    return await api.call("GET", path);
  } catch (err) {
    if (err.status === 403 || err.status === 404) return null;
    throw err;
  }
}

async function ensureFolder(collection, label, icon, sort) {
  if (await exists(`/collections/${collection}`)) return;
  await api.call("POST", "/collections", { collection, meta: { icon, sort, collapse: "open", translations: [{ language: "en-US", translation: label }] }, schema: null });
  log(`+ folder ${label}`);
}

async function ensureCollection(collection, { label, icon, note, singleton, folder, sort, sortField = false }) {
  if (!(await exists(`/collections/${collection}`))) {
    await api.call("POST", "/collections", {
      collection,
      meta: { icon, note, singleton, group: folder, sort, translations: [{ language: "en-US", translation: label }], ...(sortField ? { sort_field: "sort" } : {}), archive_field: null },
      schema: {},
      fields: [
        { field: "id", type: "integer", meta: { hidden: true, readonly: true, interface: "input" }, schema: { is_primary_key: true, has_auto_increment: true } },
        ...(sortField ? [{ field: "sort", type: "integer", meta: { hidden: true, interface: "input" }, schema: {} }] : []),
      ],
    });
    log(`+ collection ${label}`);
  }
}

async function ensureFields(collection, defs) {
  const have = new Set((await api.call("GET", `/fields/${collection}`)).map((f) => f.field));
  let added = 0;
  for (const d of defs) {
    if (have.has(d.field)) continue;
    const { file, ...def } = d;
    if (def.type !== "alias") def.schema = { ...(def.schema || {}) };
    if (def.field.length > 60) throw new Error(`Field name too long for the database: ${def.field}`);
    await api.call("POST", `/fields/${collection}`, def);
    if (file) await api.call("POST", "/relations", { collection, field: def.field, related_collection: "directus_files", schema: { on_delete: "SET NULL" }, meta: { sort_field: null } });
    added++;
  }
  if (added) log(`  ${collection}: ${added} field(s) added`);
}

const uploaded = new Map();
async function uploadLocal(path) {
  if (!path || typeof path !== "string" || !path.startsWith("/assets/")) return null;
  if (uploaded.has(path)) return uploaded.get(path);
  const file = join(ROOT, path);
  if (!existsSync(file)) return null;
  const type = { svg: "image/svg+xml", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", gif: "image/gif", pdf: "application/pdf" }[path.split(".").pop().toLowerCase()] || "application/octet-stream";
  const form = new FormData();
  form.append("title", basename(path));
  form.append("file", new Blob([readFileSync(file)], { type }), basename(path));
  const res = await api.call("POST", "/files", form);
  uploaded.set(path, res.id);
  log(`  uploaded ${path}`);
  return res.id;
}

/** Replace website paths in file fields with uploaded Directus file ids. */
async function withFiles(values, defs) {
  const out = { ...values };
  for (const d of defs) if (d.file && typeof out[d.field] === "string") out[d.field] = (await uploadLocal(out[d.field])) ?? null;
  return out;
}

const isEmpty = (item) => !item || Object.entries(item).every(([k, v]) => k === "id" || v === null || v === "" || (Array.isArray(v) && !v.length));

/* ------------------------------------------------------------------ run */

log(`Setting up Directus at ${api.base}\n`);
await ensureFolder("website", "Website", "public", 1);
await ensureFolder("website_pages", "Pages", "auto_stories", 2);

let order = 1;
for (const def of SINGLETONS) {
  const value = singletonValue(def, site);
  const defs = fieldDefs(value, { ...ctx, area: def.root ?? def.collection });
  await ensureCollection(def.collection, { label: def.label, icon: def.icon, note: defs.helpNote ?? def.note, singleton: true, folder: def.page ? "website_pages" : "website", sort: order++ });
  await ensureFields(def.collection, defs);
  const current = await api.call("GET", `/items/${def.collection}`);
  if (isEmpty(current) || args.has("--reimport")) {
    await api.call("PATCH", `/items/${def.collection}`, await withFiles(flatten(value), defs));
    log(`  ${def.label}: content imported`);
  }
}

const extraDefs = fieldDefs(EXTRA_PAGE_TEMPLATE, ctx);
await ensureCollection(EXTRA_PAGES, { label: "Extra pages", icon: "note_add", note: "Pages you add yourself (guides, landing pages…). Each gets its own web address. Add them to the top menu under Menu & buttons.", singleton: false, folder: "website_pages", sort: order++, sortField: true });
await ensureFields(EXTRA_PAGES, extraDefs.map((d) => (d.field === "slug" ? { ...d, schema: { is_unique: true, is_nullable: false } } : d)));
await api.call("PATCH", `/collections/${EXTRA_PAGES}`, { meta: { display_template: "{{title}} — /{{slug}}" } });
const extraCount = (await api.call("GET", `/items/${EXTRA_PAGES}?aggregate[count]=*`))?.[0]?.count;
if (Number(extraCount) === 0 && (site.customPages ?? []).length) {
  for (const [i, p] of site.customPages.entries()) await api.call("POST", `/items/${EXTRA_PAGES}`, { ...flatten(p), sort: i + 1 });
  log(`  Extra pages: ${site.customPages.length} imported`);
}

/* ---------------- access: editors and the read-only build user */

async function ensurePolicy(name, body, perms) {
  const found = (await api.call("GET", `/policies?filter[name][_eq]=${encodeURIComponent(name)}&limit=1`))[0];
  if (found) return found.id;
  const p = await api.call("POST", "/policies", { name, ...body });
  await api.call("POST", "/permissions", perms.map((x) => ({ policy: p.id, fields: ["*"], permissions: {}, validation: {}, ...x })));
  log(`+ access policy ${name}`);
  return p.id;
}
async function ensureRole(name, icon, description, policyId) {
  const found = (await api.call("GET", `/roles?filter[name][_eq]=${encodeURIComponent(name)}&limit=1`))[0];
  if (found) return found.id;
  const r = await api.call("POST", "/roles", { name, icon, description, policies: { create: [{ policy: policyId }] } });
  log(`+ role ${name}`);
  return r.id;
}

const editAll = ALL_COLLECTIONS.flatMap((collection) => [
  { collection, action: "read" },
  { collection, action: "update" },
  ...(collection === EXTRA_PAGES ? [{ collection, action: "create" }, { collection, action: "delete" }] : []),
]);
const files = ["create", "read", "update", "delete"].map((action) => ({ collection: "directus_files", action }));
const editorPolicy = await ensurePolicy("Website editing", { icon: "edit_note", description: "Edit all website content and upload files.", app_access: true, admin_access: false }, [...editAll, ...files, { collection: "directus_folders", action: "read" }]);
await ensureRole("Website editor", "edit_note", "People who edit the website. Invite them under User Directory.", editorPolicy);

const buildPolicy = await ensurePolicy("Website build (read-only)", { icon: "build", description: "Used by Vercel to read the content when it builds the website.", app_access: false, admin_access: false }, [
  ...ALL_COLLECTIONS.map((collection) => ({ collection, action: "read" })),
  { collection: "directus_files", action: "read" },
]);
const buildRole = await ensureRole("Website build", "build", "Read-only access for the website build (Vercel).", buildPolicy);

let buildToken = null;
const buildUser = (await api.call("GET", `/users?filter[email][_eq]=${encodeURIComponent(BUILD_EMAIL)}&limit=1`))[0];
if (!buildUser) {
  buildToken = randomBytes(24).toString("base64url");
  await api.call("POST", "/users", { email: BUILD_EMAIL, first_name: "Website", last_name: "Build (Vercel)", role: buildRole, status: "active", token: buildToken, password: randomBytes(24).toString("base64url") });
  log(`+ user ${BUILD_EMAIL} (read-only)`);
} else if (args.has("--new-token")) {
  buildToken = randomBytes(24).toString("base64url");
  await api.call("PATCH", `/users/${buildUser.id}`, { token: buildToken });
  log("~ new build token created");
}

/* ---------------- rebuild the website on Vercel when content changes */

const FLOW = "Rebuild website on Vercel";
const flow = (await api.call("GET", `/flows?filter[name][_eq]=${encodeURIComponent(FLOW)}&limit=1`))[0];
if (!flow && HOOK) {
  const f = await api.call("POST", "/flows", {
    name: FLOW, icon: "rocket_launch", color: "#12A150", status: "active", trigger: "event", accountability: "all",
    description: "When website content is saved, Vercel rebuilds the site (about a minute).",
    options: { type: "action", scope: ["items.create", "items.update", "items.delete"], collections: ALL_COLLECTIONS },
  });
  const op = await api.call("POST", "/operations", { flow: f.id, name: "Call Vercel deploy hook", key: "vercel", type: "request", position_x: 19, position_y: 1, options: { method: "POST", url: HOOK, headers: [], body: "" } });
  await api.call("PATCH", `/flows/${f.id}`, { operation: op.id });
  log(`+ flow ${FLOW}`);
} else if (!flow) {
  log("! No VERCEL_DEPLOY_HOOK given: saving in Directus won't rebuild the site automatically yet. Re-run with it set.");
}

log("\nDone.");
if (buildToken) {
  log(`\nAdd these in Vercel → your website project → Settings → Environment Variables, then redeploy:\n`);
  log(`  DIRECTUS_URL   = ${api.base}`);
  log(`  DIRECTUS_TOKEN = ${buildToken}`);
  log(`\n(This token can only READ website content. It is shown once; run with --new-token to make another.)`);
}
log(`\nEditors: in Directus → User Directory → Invite User, choose the role "Website editor".`);
