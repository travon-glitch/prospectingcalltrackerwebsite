// Directus connection for the website. Node built-ins only (fetch), no npm packages.
//
// How the content is laid out in Directus (created by cms/setup.mjs from content/site.json):
//   - one SINGLETON collection per area: Website settings, Contact & social, Menu & buttons, Footer, Forms, Photos & video,
//     and one per page (Page: Home, Page: Software, …)
//   - a normal collection "Extra pages" for pages you add yourself
// Nested parts become collapsible groups (field names joined with "__", e.g. hero__title), lists become repeaters,
// and images are Directus files. pullSite() turns it all back into the exact shape content/site.json has, so the page
// templates don't change.

/* ------------------------------------------------------------------ collections */

export const PAGES = [
  ["home", "Home"], ["software", "Software"], ["consulting", "Consulting"], ["howItWorks", "How It Works"],
  ["about", "About the Founder"], ["resources", "Resources"], ["pricing", "Pricing"], ["demo", "Book a Demo"],
  ["contact", "Contact"], ["privacy", "Privacy Policy"], ["terms", "Terms of Service"], ["thankYou", "Thank-you page"],
  ["notFound", "Page not found (404)"],
];

const snake = (s) => s.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase();

/** Singletons: which top-level keys of site.json each one holds. `root` = the singleton IS that object. */
export const SINGLETONS = [
  { collection: "website_settings", label: "Website settings", icon: "settings", keys: ["site", "theme", "analytics", "mockupNote"], note: "Business name, web address, brand colors, analytics." },
  { collection: "contact_social", label: "Contact & social", icon: "contact_phone", keys: ["contact", "social"], note: "Email, phone, address, hours and social media links." },
  { collection: "menu_buttons", label: "Menu & buttons", icon: "menu", keys: ["nav", "headerCta", "ctas"], note: "Top menu, the corner button, and every button used across the site." },
  { collection: "site_footer", label: "Footer", icon: "call_to_action", root: "footer", note: "Links and small print at the bottom of every page." },
  { collection: "site_forms", label: "Forms", icon: "assignment", root: "forms", note: "Where form submissions go and the form questions." },
  { collection: "site_media", label: "Photos & video", icon: "photo_library", root: "media", note: "Founder photo, screenshots, demo video and the KPI Tracker download." },
  ...PAGES.map(([key, label]) => ({ collection: `page_${snake(key)}`, label: `Page: ${label}`, icon: "article", page: key, note: `Everything on the ${label} page.` })),
];
export const EXTRA_PAGES = "extra_pages";
export const ALL_COLLECTIONS = [...SINGLETONS.map((s) => s.collection), EXTRA_PAGES];

/** The value a singleton stores, taken from site.json. */
export function singletonValue(def, site) {
  if (def.page) return site.pages[def.page];
  if (def.root) return site[def.root];
  return Object.fromEntries(def.keys.filter((k) => site[k] !== undefined).map((k) => [k, site[k]]));
}

/** Shape of a new extra page (also used to create the Extra pages fields). */
export const EXTRA_PAGE_TEMPLATE = {
  slug: "new-page",
  published: true,
  title: "New page",
  eyebrow: "",
  subtitle: "",
  heroButtons: ["strategyCall"],
  sections: [{ heading: "", text: "", image: { src: "", alt: "" }, button: { label: "", href: "" } }],
  showFinalCta: true,
  seo: { title: "", description: "" },
};

/* ------------------------------------------------------------------ flatten / unflatten */

const SEP = "__";
const SAFE_KEY = /^[A-Za-z][A-Za-z0-9]*(?:_[A-Za-z0-9]+)*$/; // no "__", no dashes
const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const keysSafe = (o) => Object.keys(o).every((k) => k === "_help" || SAFE_KEY.test(k));
/** Lists of plain text are stored as [{ value }] so the Directus repeater can show them. */
const isStringList = (a) => Array.isArray(a) && a.length > 0 && a.every((x) => typeof x === "string");

/** Turns a nested object into flat Directus columns: { hero: { title } } → { hero__title }. */
export function flatten(obj, prefix = "", out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    if (k === "_help") continue;
    const key = prefix + k;
    if (isObj(v) && keysSafe(v)) flatten(v, key + SEP, out);
    else out[key] = toStored(v);
  }
  return out;
}
function toStored(v) {
  if (isStringList(v)) return v.map((value) => ({ value }));
  if (Array.isArray(v)) return v.map((x) => (isObj(x) && keysSafe(x) ? flatten(x) : x));
  return v;
}

/** The reverse of flatten(), applied recursively (also inside repeater items). */
export function unflatten(flat) {
  const out = {};
  for (const [key, raw] of Object.entries(flat)) {
    const parts = key.split(SEP);
    let o = out;
    for (let i = 0; i < parts.length - 1; i++) o = o[parts[i]] ??= {};
    o[parts[parts.length - 1]] = fromStored(raw);
  }
  return out;
}
function fromStored(v) {
  if (Array.isArray(v)) {
    if (v.length && v.every((x) => isObj(x) && Object.keys(x).length === 1 && "value" in x)) return v.map((x) => x.value ?? "");
    return v.map((x) => (isObj(x) ? unflatten(x) : x));
  }
  return v ?? "";
}

/* ------------------------------------------------------------------ field definitions */

const LABELS = {
  seo: "Google listing", hero: "Top of the page", finalCta: "Call-to-action band at the bottom", faq: "Frequently asked questions",
  href: "Link", url: "Web address", src: "Image", poster: "Cover image", alt: "Image description", h: "Heading", p: "Paragraphs",
  q: "Question", a: "Answer", cta: "Button", ctas: "Buttons", heroButtons: "Buttons at the top", eyebrow: "Small heading above the title",
  subtitle: "Text under the title", embedUrl: "Video embed link", ogImage: "Image shown when the site is shared", ogImageAlt: "Description of that image",
  placeholder: "Still a placeholder (yellow outline)", featured: "Highlight this card", priceNote: "Small text under the price", for: "Who it's for",
  mockup: "Illustration", draftNote: "Draft warning at the top", updated: "Effective date", themeColor: "Phone browser bar color",
  accentColor: "Main accent (buttons, highlights)", accentDarkColor: "Accent when hovered", darkColor: "Dark backgrounds",
  darkColor2: "Cards on dark backgrounds", footerColor: "Footer background", slug: "Web address", published: "Show this page on the website",
  showFinalCta: "Show the call-to-action band at the bottom", endpoint: "Form destination (your CRM address)", nav: "Top menu",
  headerCta: "Button in the top corner", benefit: "Headline", kpiTrackerDownloadUrl: "KPI Tracker download file", mockupNote: "Caption under dashboard illustrations",
  value: "Text", id: "Link name (for #links)",
};
const NOTES = {
  "seo.title": "The blue headline in Google and the browser tab. Aim for 50–60 characters.",
  "seo.description": "The grey text under it in Google. Aim for 120–160 characters.",
  alt: "Describe what's in the picture, for blind visitors and Google.",
  embedUrl: "YouTube: Share → Embed, copy the address inside src=\"…\" (https://www.youtube-nocookie.com/embed/…).",
  slug: "Lowercase letters, numbers and dashes, e.g. open-house-guide → yoursite.com/open-house-guide",
  endpoint: "Your CRM address + /api/public/website-lead.",
  text: "Leave an empty line between paragraphs.",
  id: "Used in links like /software#this-name. Change only if you also change those links.",
  src: "Upload in the File Library, open the file and copy its ID (or paste a website path like /assets/img/logo.svg).",
};
const LONG = new Set(["text", "intro", "subtitle", "a", "quote", "description", "brandStatement", "consentText", "disclaimer", "providerNote", "draftNote", "placeholderNote", "p", "story"]);
export const MOCKUPS = ["hero", "leadList", "leadCard", "followups", "pipeline", "scoreboard", "aiDraft", "listImport", "assignment", "dialer", "texting", "emailCenter", "smartPlan", "kpis", "roi", "permissions", "coaching"];
const FILE_KEYS = new Set(["ogImage", "src", "poster", "kpiTrackerDownloadUrl"]);

export const humanize = (k) =>
  LABELS[k] ?? String(k).replace(/_/g, " ").replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/^./, (c) => c.toUpperCase());
const label = (k) => [{ language: "en-US", translation: humanize(k).slice(0, 60) }];

/** Directus "meta" for one value: which editing widget to show. `inRepeater` fields can't be file pickers. */
function widget(key, value, ctx, { inRepeater = false, parentKey = "" } = {}) {
  const note = NOTES[`${parentKey}.${key}`] ?? NOTES[key] ?? null;
  if (typeof value === "boolean") return { type: "boolean", meta: { interface: "boolean", special: ["cast-boolean"], note } };
  if (typeof value === "number") return { type: "float", meta: { interface: "input", note } };
  if (!inRepeater && FILE_KEYS.has(key)) return { type: "uuid", file: true, meta: { interface: key === "kpiTrackerDownloadUrl" ? "file" : "file-image", special: ["file"], note: key === "kpiTrackerDownloadUrl" ? "PDF or spreadsheet visitors download after the KPI form." : null } };
  if (/Color$/.test(key)) return { type: "string", meta: { interface: "select-color", note } };
  if (key === "mockup") return { type: "string", meta: { interface: "select-dropdown", options: { choices: MOCKUPS.map((m) => ({ text: humanize(m), value: m })) }, note } };
  if (key === "cta" && ctx.ctaChoices && ctx.area !== "forms") return { type: "string", meta: { interface: "select-dropdown", options: { choices: ctx.ctaChoices, allowOther: true }, note: "Pick a button from Menu & buttons → Buttons." } };
  const long = LONG.has(key) || LONG.has(parentKey) || (typeof value === "string" && (value.length > 90 || value.includes("\n")));
  return { type: "text", meta: { interface: long ? "input-multiline" : "input", note } };
}

/** Repeater (Directus "list" interface) sub-fields for the items of an array. */
function repeaterFields(arr, key, ctx) {
  if (arr.length === 0 || isStringList(arr) || arr.every((x) => typeof x === "string")) {
    const ctaList = (key === "ctas" || key === "heroButtons") && ctx.ctaChoices;
    const meta = ctaList
      ? { interface: "select-dropdown", options: { choices: ctx.ctaChoices, allowOther: true } }
      : { interface: LONG.has(key) || arr.some((s) => String(s).length > 90) ? "input-multiline" : "input" };
    return [{ field: "value", name: ctaList ? "Button" : "Text", type: ctaList ? "string" : "text", meta: { field: "value", width: "full", ...meta } }];
  }
  // Union of the keys of all items, so optional keys (e.g. a resource link) get a field too.
  const shape = {};
  for (const item of arr) for (const [k, v] of Object.entries(flatten(item))) if (!(k in shape) || shape[k] === "" || shape[k] == null) shape[k] = v;
  const unflat = unflatten(shape);
  const fields = [];
  (function walk(obj, prefix, parentKey) {
    for (const [k, v] of Object.entries(obj)) {
      const name = prefix + k;
      if (isObj(v)) { walk(v, name + SEP, k); continue; }
      if (Array.isArray(v)) {
        fields.push({ field: name, name: humanize(k), type: "json", meta: { field: name, width: "full", interface: "list", options: { fields: repeaterFields(v, k, ctx), template: listTemplate(v) } } });
        continue;
      }
      const w = widget(k, v, ctx, { inRepeater: true, parentKey });
      fields.push({ field: name, name: (prefix ? humanize(prefix.split(SEP).slice(-2, -1)[0]) + " → " : "") + humanize(k), type: w.type, meta: { field: name, width: w.meta.interface === "input-multiline" ? "full" : "half", ...w.meta } });
    }
  })(unflat, "", key);
  return fields;
}
function listTemplate(arr) {
  if (!arr.length || typeof arr[0] !== "object") return "{{value}}";
  const first = flatten(arr[0]);
  const k = ["title", "label", "name", "q", "h", "heading", "benefit", "slug", "tag", "caption"].find((x) => x in first) ?? Object.keys(first).find((x) => typeof first[x] === "string");
  return k ? `{{${k}}}` : "Item";
}

/**
 * Field definitions (for POST /fields) for one object. Nested objects become groups, arrays become repeaters.
 * Returns [{ field, type, meta, schema, file? }] in display order.
 */
export function fieldDefs(obj, ctx, prefix = "", group = null, out = [], parentKey = "") {
  const help = obj._help;
  for (const [k, v] of Object.entries(obj)) {
    if (k === "_help") continue;
    const name = prefix + k;
    const base = { field: name, meta: { translations: label(k), group, sort: out.length + 1, width: "full" } };
    if (isObj(v) && keysSafe(v)) {
      out.push({ ...base, type: "alias", meta: { ...base.meta, interface: "group-detail", special: ["alias", "no-data", "group"], options: { start: "open" }, note: v._help ?? null } });
      fieldDefs(v, ctx, name + SEP, name, out, k);
    } else if (isObj(v)) {
      out.push({ ...base, type: "json", meta: { ...base.meta, interface: "input-code", options: { language: "json" }, special: ["cast-json"], note: "Advanced setting (JSON)." } });
    } else if (Array.isArray(v)) {
      out.push({ ...base, type: "json", meta: { ...base.meta, interface: "list", special: ["cast-json"], options: { fields: repeaterFields(v, k, ctx), template: listTemplate(v), addLabel: "Add" } } });
    } else {
      const w = widget(k, v, ctx, { parentKey });
      out.push({ ...base, type: w.type, file: w.file, meta: { ...base.meta, ...w.meta, note: w.meta.note ?? null } });
    }
  }
  if (help && !group) out.helpNote = help;
  return out;
}

/* ------------------------------------------------------------------ API client */

export function client(url, token) {
  const base = String(url || "").replace(/\/$/, "");
  async function call(method, path, body, { raw = false, headers = {} } = {}) {
    const res = await fetch(base + path, {
      method,
      headers: { Authorization: `Bearer ${token}`, ...(body && !(body instanceof FormData) ? { "Content-Type": "application/json" } : {}), ...headers },
      body: body ? (body instanceof FormData ? body : JSON.stringify(body)) : undefined,
    });
    if (raw) {
      if (!res.ok) throw new Error(`Directus ${method} ${path}: HTTP ${res.status}`);
      return res;
    }
    const text = await res.text();
    let json = null;
    try { json = text ? JSON.parse(text) : null; } catch { json = null; }
    if (!res.ok) {
      const msg = json?.errors?.map((e) => e.message).join("; ") || res.statusText;
      const err = new Error(`Directus ${method} ${path}: ${msg}`);
      err.status = res.status;
      throw err;
    }
    return json?.data ?? json;
  }
  return { base, call };
}

/* ------------------------------------------------------------------ pull (used by build.mjs) */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EXT = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif", "image/svg+xml": "svg", "image/avif": "avif", "application/pdf": "pdf", "text/csv": "csv", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx", "application/vnd.ms-excel": "xls", "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx", "video/mp4": "mp4" };

/**
 * Reads all website content from Directus and returns { site, files } where `site` has the content/site.json shape
 * and `files` maps each Directus file id used by the site to its new path under /assets/cms/.
 * `fallback` (the current site.json) fills in anything Directus doesn't have yet.
 */
export async function pullSite({ url, token, fallback }) {
  const api = client(url, token);
  const site = { ...fallback, pages: { ...fallback.pages } };
  for (const def of SINGLETONS) {
    let item;
    try {
      item = await api.call("GET", `/items/${def.collection}?fields=*`);
    } catch (err) {
      if (err.status === 403 || err.status === 404) throw new Error(`Directus collection "${def.collection}" is missing or not readable. Run node cms/setup.mjs and check the build token's permissions. (${err.message})`);
      throw err;
    }
    if (!item) continue;
    delete item.id;
    const value = unflatten(item);
    const old = singletonValue(def, fallback) ?? {};
    // Keep help texts and any keys the schema doesn't store (e.g. JSON-only parts already handled by unflatten).
    const merged = mergeKeep(old, value);
    if (def.page) site.pages[def.page] = merged;
    else if (def.root) site[def.root] = merged;
    else for (const k of def.keys) if (k in merged) site[k] = merged[k];
  }
  const extra = await api.call("GET", `/items/${EXTRA_PAGES}?fields=*&sort=sort,id&limit=-1`).catch((err) => {
    if (err.status === 403 || err.status === 404) return [];
    throw err;
  });
  site.customPages = (extra || []).map((it) => {
    const { id, sort, ...rest } = it;
    void id; void sort;
    return unflatten(rest);
  });

  // Files: every Directus file id (or Directus asset URL) becomes /assets/cms/<id>.<ext>.
  const files = new Map();
  const assetUrl = new RegExp(`^${api.base.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/assets/([0-9a-f-]{36})`, "i");
  const ids = new Set();
  (function scan(v) {
    if (typeof v === "string") {
      const m = UUID.test(v) ? v : assetUrl.exec(v)?.[1];
      if (m) ids.add(m.toLowerCase());
    } else if (Array.isArray(v)) v.forEach(scan);
    else if (isObj(v)) Object.values(v).forEach(scan);
  })(site);
  for (const id of ids) {
    const meta = await api.call("GET", `/files/${id}?fields=id,type,filename_download`).catch(() => null);
    if (!meta) continue;
    const ext = EXT[meta.type] ?? (String(meta.filename_download).split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
    files.set(id, { path: `/assets/cms/${id}.${ext}`, type: meta.type });
  }
  const replaced = (function swap(v) {
    if (typeof v === "string") {
      const m = (UUID.test(v) ? v : assetUrl.exec(v)?.[1])?.toLowerCase();
      return m && files.has(m) ? files.get(m).path : v;
    }
    if (Array.isArray(v)) return v.map(swap);
    if (isObj(v)) return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, swap(x)]));
    return v;
  })(site);
  // Empty image/file fields come back as null → "".
  return { site: replaced, files, download: (id) => api.call("GET", `/assets/${id}`, null, { raw: true }) };
}

/** New values win; keys only present in the old object (like _help) are kept. */
function mergeKeep(old, fresh) {
  if (!isObj(old) || !isObj(fresh)) return fresh;
  const out = { ...fresh };
  for (const [k, v] of Object.entries(old)) {
    if (!(k in out)) out[k] = v;
    else if (isObj(v) && isObj(out[k])) out[k] = mergeKeep(v, out[k]);
  }
  // Keep the original key order where possible (nicer diffs, same JSON-LD order).
  const ordered = {};
  for (const k of Object.keys(old)) if (k in out) ordered[k] = out[k];
  for (const k of Object.keys(out)) if (!(k in ordered)) ordered[k] = out[k];
  return ordered;
}
