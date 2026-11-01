// The page shell: <head> (SEO, social cards, structured data, CSP), header with mobile menu, footer.

import { esc, icon, isPlaceholder } from "./html.mjs";

/** The logo mark: a call handset inside a rising bar chart. Decorative next to the visible wordmark text. */
export const logoMark = (cls = "logo-mark") => `<svg class="${cls}" viewBox="0 0 40 40" width="36" height="36" aria-hidden="true" focusable="false">
  <rect width="40" height="40" rx="10" fill="#12A150"/>
  <path d="M9 29h22" stroke="#0B1B33" stroke-width="2.4" stroke-linecap="round"/>
  <rect x="11" y="20" width="4" height="6" rx="1.2" fill="#0B1B33"/>
  <rect x="18" y="15" width="4" height="11" rx="1.2" fill="#0B1B33"/>
  <rect x="25" y="9" width="4" height="17" rx="1.2" fill="#0B1B33"/>
  <path d="M12.2 9.6l1.6.3.8 2.2-1.1.8a7 7 0 003.7 3.7l.8-1.1 2.2.8.3 1.6c0 .5-.4.9-.9.9A9.7 9.7 0 0111.3 10.5c0-.5.4-.9.9-.9z" fill="#fff"/>
</svg>`;

const wordmark = () => `<span class="wordmark"><span class="wm-1">Prospecting</span> <span class="wm-2">Call Tracker</span></span>`;

function navList(site, path, cls) {
  return `<ul class="${cls}">${site.nav
    .map((n) => {
      const active = n.href === path || (n.href !== "/" && path.startsWith(n.href + "/"));
      return `<li><a href="${esc(n.href)}"${active ? ' aria-current="page"' : ""}>${esc(n.label)}</a></li>`;
    })
    .join("")}</ul>`;
}

function header(site, path) {
  const cta = site.headerCta;
  return `<a class="skip-link" href="#main">Skip to main content</a>
<header class="site-header">
  <div class="container header-inner">
    <a class="brand" href="/" aria-label="Prospecting Call Tracker — home">${logoMark()}${wordmark()}</a>
    <nav class="nav-desktop" aria-label="Main">${navList(site, path, "nav-links")}</nav>
    <div class="header-actions">
      <a class="btn btn-primary btn-sm header-cta" href="${esc(cta.href)}" data-cta="${esc(cta.label)}">${esc(cta.label)}</a>
      <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="mobile-menu">${icon("menu", "menu-ic")}<span class="menu-label">Menu</span></button>
    </div>
  </div>
  <div class="mobile-menu" id="mobile-menu" hidden>
    <nav class="container" aria-label="Main menu">
      ${navList(site, path, "mobile-links")}
      <a class="btn btn-primary btn-block" href="${esc(cta.href)}" data-cta="${esc(cta.label)} (menu)">${esc(cta.label)}</a>
    </nav>
  </div>
</header>`;
}

function contactList(c) {
  const row = (label, value, href) =>
    isPlaceholder(value) ? `<li><span class="ph-inline">[${esc(label)} — add in site.json]</span></li>` : `<li><a href="${esc(href)}">${esc(value)}</a></li>`;
  return `<ul class="footer-contact">
    ${row("Email", c.email, `mailto:${c.email}`)}
    ${row("Phone", c.phone, `tel:${String(c.phone).replace(/[^\d+]/g, "")}`)}
    ${isPlaceholder(c.address) ? "" : `<li>${esc(c.address)}</li>`}
    ${c.hours ? `<li>${esc(c.hours)}</li>` : ""}
    <li><a href="/contact">Contact form</a></li>
  </ul>`;
}

function footer(site) {
  const year = new Date().getFullYear();
  const socials = site.social
    .map((s) => (isPlaceholder(s.url) ? `<li><span class="ph-inline">${esc(s.label)} [add link]</span></li>` : `<li><a href="${esc(s.url)}" rel="noopener" target="_blank">${esc(s.label)}<span class="sr-only"> (opens in a new tab)</span></a></li>`))
    .join("");
  return `<footer class="site-footer" id="site-footer">
  <div class="container footer-grid">
    <div class="footer-brand">
      <a class="brand brand-light" href="/" aria-label="Prospecting Call Tracker — home">${logoMark()}${wordmark()}</a>
      <p>${esc(site.site.brandStatement)}</p>
    </div>
    ${site.footer.columns
      .map((col) => `<nav class="footer-col" aria-label="${esc(col.title)}"><h2 class="footer-h">${esc(col.title)}</h2><ul>${col.links.map((l) => `<li><a href="${esc(l.href)}">${esc(l.label)}</a></li>`).join("")}</ul></nav>`)
      .join("")}
    <div class="footer-col"><h2 class="footer-h">Contact</h2>${contactList(site.contact)}</div>
    <div class="footer-col"><h2 class="footer-h">Follow</h2><ul>${socials}</ul></div>
  </div>
  <div class="container footer-bottom">
    <p class="disclaimer">${esc(site.footer.disclaimer)} ${esc(site.footer.providerNote)}</p>
    <div class="footer-legal">
      <p>© ${year} ${esc(site.site.name)}. All rights reserved.</p>
      <ul>${site.footer.legal.map((l) => `<li><a href="${esc(l.href)}">${esc(l.label)}</a></li>`).join("")}</ul>
    </div>
  </div>
</footer>`;
}

/** Content Security Policy for the <meta> tag, built from what site.json turns on (forms endpoint, analytics, video). */
export function contentSecurityPolicy(site) {
  const origin = (u) => {
    try {
      const x = new URL(u);
      return x.protocol === "https:" ? x.origin : "";
    } catch {
      return "";
    }
  };
  const script = ["'self'"];
  const connect = ["'self'"];
  const img = ["'self'", "data:"];
  const frame = [];
  const form = ["'self'"];
  const crm = /YOUR-CRM-DOMAIN/i.test(site.forms.endpoint) ? "" : origin(site.forms.endpoint);
  if (crm) connect.push(crm), form.push(crm);
  if (site.analytics.googleAnalyticsId) {
    script.push("https://www.googletagmanager.com");
    connect.push("https://*.google-analytics.com", "https://*.analytics.google.com", "https://www.googletagmanager.com");
    img.push("https://*.google-analytics.com", "https://www.googletagmanager.com");
  }
  if (site.analytics.plausibleDomain) {
    const p = origin(site.analytics.plausibleScript);
    if (p) script.push(p), connect.push(p);
  }
  const video = origin(site.media.demoVideo.embedUrl);
  if (video) frame.push(video);
  const fonts = site.site.googleFontsCss ? origin(site.site.googleFontsCss) : "";
  return [
    "default-src 'self'",
    `script-src ${script.join(" ")}`,
    `style-src 'self'${fonts ? ` ${fonts}` : ""}`,
    `font-src 'self'${fonts ? " https://fonts.gstatic.com" : ""}`,
    `img-src ${img.join(" ")}`,
    `connect-src ${connect.join(" ")}`,
    `frame-src ${frame.length ? frame.join(" ") : "'none'"}`,
    `form-action ${form.join(" ")}`,
    "base-uri 'self'",
    "object-src 'none'",
  ].join("; ");
}

/** Public, non-secret settings the browser script needs (read from a JSON data block, so no inline script runs). */
function clientConfig(site) {
  return {
    analytics: { ga: site.analytics.googleAnalyticsId || "", plausibleDomain: site.analytics.plausibleDomain || "", plausibleScript: site.analytics.plausibleScript || "" },
    requestTypes: Object.fromEntries(Object.entries(site.forms.requestTypes).map(([k, v]) => [k, { event: v.event, cta: v.cta, success: v.success }])),
    ctaSlugs: site.forms.ctaSlugs,
    thankYouPath: site.forms.thankYouPath,
    contactEmail: isPlaceholder(site.contact.email) ? "" : site.contact.email,
  };
}

const jsonScript = (obj, type = "application/ld+json", id = "") => `<script type="${type}"${id ? ` id="${id}"` : ""}>${JSON.stringify(obj).replace(/</g, "\\u003c")}</script>`;

export function page(site, { path, seo, body, jsonLd = [], noindex = false, version }) {
  const base = site.site.url.replace(/\/$/, "");
  const canonical = base + (path === "/" ? "/" : path);
  const ogImage = /^https?:/.test(site.site.ogImage) ? site.site.ogImage : base + site.site.ogImage;
  const org = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.site.name,
    url: base + "/",
    logo: base + "/assets/img/logo.svg",
    description: site.site.brandStatement,
    ...(site.social.some((s) => !isPlaceholder(s.url)) ? { sameAs: site.social.filter((s) => !isPlaceholder(s.url)).map((s) => s.url) } : {}),
    ...(!isPlaceholder(site.contact.email) || !isPlaceholder(site.contact.phone)
      ? { contactPoint: { "@type": "ContactPoint", contactType: "sales", ...(isPlaceholder(site.contact.email) ? {} : { email: site.contact.email }), ...(isPlaceholder(site.contact.phone) ? {} : { telephone: site.contact.phone }) } }
      : {}),
  };
  const fonts = site.site.googleFontsCss;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="${esc(contentSecurityPolicy(site))}">
<title>${esc(seo.title)}</title>
<meta name="description" content="${esc(seo.description)}">
<link rel="canonical" href="${esc(canonical)}">
${noindex ? '<meta name="robots" content="noindex, follow">' : ""}
<meta name="theme-color" content="${esc(site.site.themeColor)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(site.site.name)}">
<meta property="og:title" content="${esc(seo.title)}">
<meta property="og:description" content="${esc(seo.description)}">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:image" content="${esc(ogImage)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(site.site.ogImageAlt)}">
<meta property="og:locale" content="${esc(site.site.locale)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(seo.title)}">
<meta name="twitter:description" content="${esc(seo.description)}">
<meta name="twitter:image" content="${esc(ogImage)}">
${site.site.twitterHandle ? `<meta name="twitter:site" content="${esc(site.site.twitterHandle)}">` : ""}
<link rel="icon" href="/assets/img/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/assets/img/apple-touch-icon.png">
${fonts ? `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="${esc(fonts)}">` : ""}
<link rel="stylesheet" href="/assets/styles.css?v=${version}">
<script src="/assets/site.js?v=${version}" defer></script>
${jsonScript(clientConfig(site), "application/json", "site-config")}
${[org, ...jsonLd].filter(Boolean).map((j) => jsonScript(j)).join("\n")}
</head>
<body>
${header(site, path)}
<main id="main" tabindex="-1">
${body}
</main>
${footer(site)}
</body>
</html>
`;
}
