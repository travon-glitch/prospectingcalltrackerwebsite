// Small HTML helpers shared by every template. Everything that comes from site.json goes through esc()/attr().

const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

/** Escapes text for HTML element content and attribute values. */
export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ESC[c]);

/** Joins template pieces, dropping false/null/undefined (so `cond && html` works). */
export const join = (parts, sep = "") => parts.filter((p) => p !== false && p !== null && p !== undefined && p !== "").join(sep);

/** Turns a heading into a URL-safe id. */
export const slug = (s) =>
  String(s ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");

/** Is this a value the owner still has to fill in? (empty, or written in [square brackets]) */
export const isPlaceholder = (s) => !String(s ?? "").trim() || /^\[.*\]$/.test(String(s).trim());

/** Small inline icons (decorative: always aria-hidden). */
export const icon = (name, cls = "icon") => {
  const paths = {
    check: '<path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
    x: '<path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
    arrow: '<path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
    phone: '<path d="M6.6 3.5l2.6.4 1.3 3.7-1.9 1.4a12 12 0 006.4 6.4l1.4-1.9 3.7 1.3.4 2.6c.1.9-.6 1.6-1.5 1.6A16.6 16.6 0 015 5c0-.9.7-1.6 1.6-1.5z" fill="currentColor"/>',
    chat: '<path d="M4 5.5A2.5 2.5 0 016.5 3h11A2.5 2.5 0 0120 5.5v8a2.5 2.5 0 01-2.5 2.5H10l-4.5 4v-4h0A2.5 2.5 0 014 13.5z" fill="currentColor"/>',
    mail: '<path d="M3.5 6.5A1.5 1.5 0 015 5h14a1.5 1.5 0 011.5 1.5v11A1.5 1.5 0 0119 19H5a1.5 1.5 0 01-1.5-1.5z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M4 7l8 6 8-6" fill="none" stroke="currentColor" stroke-width="2"/>',
    spark: '<path d="M12 2.5l2 6.2 6.5 1.3-5 4.3 1.5 6.7L12 17.5 7 21l1.5-6.7-5-4.3L10 8.7z" fill="currentColor"/>',
    clock: '<circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 7.5V12l3 2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    shield: '<path d="M12 3l7.5 3v5.5c0 4.6-3.2 8.3-7.5 9.5-4.3-1.2-7.5-4.9-7.5-9.5V6z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M8.5 12l2.4 2.4L15.8 9.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    list: '<path d="M9 6h11M9 12h11M9 18h11" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><circle cx="4.5" cy="6" r="1.5" fill="currentColor"/><circle cx="4.5" cy="12" r="1.5" fill="currentColor"/><circle cx="4.5" cy="18" r="1.5" fill="currentColor"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M21 20H3" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
    users: '<circle cx="9" cy="8" r="3.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M15.5 4.8a3.5 3.5 0 010 6.4M18 14.8c2 .7 3.2 2.4 3.5 5.2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
    play: '<circle cx="12" cy="12" r="10" fill="currentColor" opacity=".18"/><path d="M10 8.2v7.6L16 12z" fill="currentColor"/>',
    download: '<path d="M12 4v11M7 10.5l5 5 5-5M5 20h14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
  };
  return `<svg class="${cls}" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">${paths[name] ?? ""}</svg>`;
};
