// Checks content/site.json before anything is built or published.
// Used by build.mjs and by the website editor (api/admin.js), so a change that would break the site is refused before it
// ever reaches GitHub, and the old site stays online.

import { page } from "./layout.mjs";
import { setMockupNote } from "./mockups.mjs";
import { allPages } from "./pages.mjs";

const REQUIRED = ["site.name", "site.url", "forms.endpoint", "forms.requestTypes", "ctas", "nav", "footer.disclaimer", "pages.home", "pages.software", "pages.consulting", "pages.howItWorks", "pages.about", "pages.resources", "pages.pricing", "pages.demo", "pages.contact", "pages.privacy", "pages.terms", "pages.thankYou", "pages.notFound"];

const get = (obj, path) => path.split(".").reduce((o, k) => (o == null ? o : o[k]), obj);

/** Turns the raw text of site.json into an object, or explains (in plain English) where the typo is. */
export function parseContent(raw) {
  try {
    return { site: JSON.parse(raw) };
  } catch (err) {
    const pos = Number(/position (\d+)/.exec(err.message)?.[1]);
    const line = Number.isFinite(pos) ? raw.slice(0, pos).split("\n").length : "?";
    return { error: `content/site.json has a formatting mistake near line ${line}. Check for a missing comma, quote or bracket. (${err.message})` };
  }
}

export const HEX_COLOR = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

/** Returns a list of problems (empty when the site is safe to build). Renders every page to catch template errors. */
export function validateSite(site) {
  if (!site || typeof site !== "object" || Array.isArray(site)) return ["The content must be a JSON object."];
  const missing = REQUIRED.filter((p) => get(site, p) == null);
  if (missing.length) return [`These required parts are missing: ${missing.join(", ")}`];
  const problems = [];
  if (!/^https:\/\/[^/]+/.test(site.site.url)) problems.push("Site settings → url must be your full https:// address, e.g. https://www.prospectingcalltracker.com");
  for (const [k, v] of Object.entries(site.theme ?? {})) {
    if (k.startsWith("_")) continue;
    if (v && !HEX_COLOR.test(v)) problems.push(`Theme colors → ${k} must be a color like #12A150 (got “${v}”).`);
  }
  if (problems.length) return problems;
  try {
    setMockupNote(site.mockupNote);
    for (const p of allPages(site)) page(site, { ...p, version: "check" });
  } catch (err) {
    problems.push(String(err.message || err).replace(/^site\.json: /, ""));
  }
  return problems;
}
