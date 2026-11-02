// Reusable page sections. Each function takes plain data (from site.json) and returns an HTML string.

import { esc, icon, isPlaceholder, join, slug } from "./html.mjs";
import { mockups } from "./mockups.mjs";
import { integrationClientConfig } from "./integrations.mjs";

/* ---------------------------------------------------------------- buttons and CTAs */

/** A call-to-action link. `c` is a key of site.json → ctas, or an object { label, href }. */
export function button(site, c, variant = "primary", extra = "") {
  const cta = typeof c === "string" ? site.ctas[c] : c;
  if (!cta) throw new Error(`site.json: unknown call-to-action "${c}" (add it under "ctas")`);
  const ic = cta.href.includes("#demo-video") ? icon("play", "btn-ic") : cta.href.includes("kpi") ? icon("download", "btn-ic") : "";
  return `<a class="btn btn-${variant}${extra ? ` ${extra}` : ""}" href="${esc(cta.href)}" data-cta="${esc(cta.label)}">${ic}${esc(cta.label)}</a>`;
}

/** First CTA is the primary button, the rest secondary. `onDark` switches the secondary style for navy sections. */
export function ctaRow(site, keys = [], { onDark = false } = {}) {
  if (!keys.length) return "";
  return `<div class="cta-row">${keys.map((k, i) => button(site, k, i === 0 ? "primary" : onDark ? "ghost-light" : "secondary")).join("")}</div>`;
}

/* ---------------------------------------------------------------- headings and lists */

export function sectionHead({ eyebrow, title, intro, id, center = false, level = 2 }) {
  return `<div class="section-head${center ? " center" : ""}">
  ${eyebrow ? `<p class="eyebrow">${esc(eyebrow)}</p>` : ""}
  <h${level}${id ? ` id="${esc(id)}"` : ""}>${esc(title)}</h${level}>
  ${intro ? `<p class="lead">${esc(intro)}</p>` : ""}
</div>`;
}

export const checklist = (items, cls = "") => `<ul class="checklist ${cls}">${items.map((t) => `<li>${icon("check", "check-ic")}<span>${esc(t)}</span></li>`).join("")}</ul>`;

/* ---------------------------------------------------------------- page hero */

export function pageHero(site, hero, { visual = "", compact = false } = {}) {
  return `<section class="hero${compact ? " hero-compact" : ""}${visual ? " has-visual" : ""}" aria-labelledby="page-title">
  <div class="container hero-grid">
    <div class="hero-copy">
      ${hero.eyebrow ? `<p class="eyebrow eyebrow-light">${esc(hero.eyebrow)}</p>` : ""}
      <h1 id="page-title">${esc(hero.title)}</h1>
      ${hero.subtitle ? `<p class="hero-sub">${esc(hero.subtitle)}</p>` : ""}
      ${ctaRow(site, hero.ctas ?? [], { onDark: true })}
      ${hero.points ? `<ul class="hero-points">${hero.points.map((p) => `<li>${icon("check", "check-ic")}${esc(p)}</li>`).join("")}</ul>` : ""}
    </div>
    ${visual ? `<div class="hero-visual">${visual}</div>` : ""}
  </div>
</section>`;
}

/* ---------------------------------------------------------------- final call to action band */

export function finalCta(site, f) {
  if (!f) return "";
  return `<section class="section final-cta" aria-labelledby="final-cta-title">
  <div class="container final-cta-inner">
    <h2 id="final-cta-title">${esc(f.title)}</h2>
    <p>${esc(f.text)}</p>
    ${ctaRow(site, f.ctas, { onDark: true })}
    <p class="final-cta-note">${esc(site.footer.disclaimer)}</p>
  </div>
</section>`;
}

/* ---------------------------------------------------------------- FAQ (native <details>: works without JS) */

export function faq(f, bg = "") {
  if (!f?.items?.length) return "";
  return `<section class="section ${bg}" aria-labelledby="faq-title">
  <div class="container narrow">
    ${sectionHead({ title: f.title, id: "faq-title", center: true })}
    <div class="faq">${f.items.map((it) => `<details><summary>${esc(it.q)}</summary><div class="faq-a"><p>${esc(it.a)}</p></div></details>`).join("")}</div>
  </div>
</section>`;
}

/** FAQPage structured data for the same questions. */
export const faqJsonLd = (f) =>
  f?.items?.length
    ? { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: f.items.map((it) => ({ "@type": "Question", name: it.q, acceptedAnswer: { "@type": "Answer", text: it.a } })) }
    : null;

/* ---------------------------------------------------------------- media placeholders */

export function mediaImage(img, { cls = "", width = 1200, height = 750, eager = false } = {}) {
  return `<figure class="media ${cls}${img.placeholder ? " is-placeholder" : ""}">
  <img src="${esc(img.src)}" alt="${esc(img.alt)}" width="${width}" height="${height}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">
  ${img.caption ? `<figcaption>${esc(img.caption)}</figcaption>` : ""}
</figure>`;
}

export function videoBlock(video) {
  if (video.embedUrl) {
    return `<div class="video-frame"><iframe src="${esc(video.embedUrl)}" title="${esc(video.title)}" loading="lazy" allow="encrypted-media; picture-in-picture; fullscreen" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>`;
  }
  return `<figure class="media is-placeholder video-placeholder">
  <img src="${esc(video.poster)}" alt="${esc(video.placeholderNote)}" width="1280" height="720" loading="lazy" decoding="async">
  <figcaption>${esc(video.placeholderNote)}</figcaption>
</figure>`;
}

/* ---------------------------------------------------------------- social proof placeholders */

export function testimonials(sp) {
  return `<div class="grid grid-3 testimonials">${sp.testimonials
    .map(
      (t) => `<figure class="card testimonial${t.placeholder ? " is-placeholder" : ""}">
  ${t.placeholder ? `<p class="ph-badge">Placeholder — replace with a real client quote</p>` : ""}
  <p class="t-type">${esc(t.type)}</p>
  <blockquote><p>${esc(t.quote)}</p></blockquote>
  <figcaption><strong>${esc(t.name)}</strong><span>${esc(t.role)}</span></figcaption>
</figure>`,
    )
    .join("")}</div>`;
}

export function metrics(list, { note = "" } = {}) {
  return `<div class="metrics">${list
    .map((m) => {
      const empty = isPlaceholder(m.value);
      return `<div class="metric${empty ? " is-placeholder" : ""}"><span class="metric-value">${empty ? "[—]" : esc(m.value)}</span><span class="metric-label">${esc(m.label)}</span>${empty && m.note ? `<span class="metric-note">${esc(m.note)}</span>` : ""}</div>`;
    })
    .join("")}</div>${note ? `<p class="small-note center">${esc(note)}</p>` : ""}`;
}

/* ---------------------------------------------------------------- feature rows (software page) */

export function featureRow(site, f, i) {
  const m = mockups[f.mockup];
  if (!m) throw new Error(`site.json: unknown mockup "${f.mockup}" for feature "${f.title}"`);
  return `<section class="feature${i % 2 ? " flip" : ""}" id="${esc(f.id ?? slug(f.title))}" aria-labelledby="${esc(f.id ?? slug(f.title))}-title">
  <div class="feature-copy">
    <p class="eyebrow">${esc(f.title)}</p>
    <h2 id="${esc(f.id ?? slug(f.title))}-title">${esc(f.benefit)}</h2>
    <p>${esc(f.text)}</p>
    ${button(site, "demo", "secondary", "btn-sm")}
  </div>
  <div class="feature-visual">${m()}</div>
</section>`;
}

/* ---------------------------------------------------------------- forms */

/**
 * The lead form. kind: "demo" (request-type picker), "kpi" (KPI tracker download) or "contact".
 * Posts JSON with fetch (assets/site.js); without JavaScript it falls back to a normal form POST to the same endpoint.
 */
export function leadForm(site, { kind, id, title, page }) {
  const F = site.forms;
  const configured = !/YOUR-CRM-DOMAIN/i.test(F.endpoint) && /^https:\/\//.test(F.endpoint);
  // Zapier / Make webhooks (Integrations) can receive the form even when no CRM address is set.
  const hooked = (integrationClientConfig(site).webhooks ?? []).length > 0;
  const fixedType = kind === "kpi" ? "kpi_download" : kind === "contact" ? "contact" : null;
  const types = Object.entries(F.requestTypes).filter(([k]) => k !== "kpi_download" && k !== "contact");
  const f = (name) => `${id}-${name}`;
  const err = (name) => `<p class="field-error" id="${f(name)}-err" hidden></p>`;
  const input = (name, label, type, { required = false, auto = "", hint = "", attrs = "" } = {}) => `<div class="field">
    <label for="${f(name)}">${esc(label)}${required ? ' <span class="req" aria-hidden="true">*</span>' : ' <span class="opt">(optional)</span>'}</label>
    ${hint ? `<p class="hint" id="${f(name)}-hint">${esc(hint)}</p>` : ""}
    <input id="${f(name)}" name="${name}" type="${type}"${required ? " required" : ""}${auto ? ` autocomplete="${auto}"` : ""} aria-describedby="${hint ? `${f(name)}-hint ` : ""}${f(name)}-err" ${attrs}>
    ${err(name)}
  </div>`;
  return `<div class="form-card" id="${id}-wrap">
  ${title ? `<h2 class="form-title" id="${id}-title">${esc(title)}</h2>` : ""}
  <form class="lead-form" id="${id}" ${configured ? `action="${esc(F.endpoint)}" ` : ""}method="post" novalidate data-endpoint="${configured ? esc(F.endpoint) : ""}"${hooked ? ' data-webhooks="1"' : ""} data-fixed-type="${fixedType ?? ""}"${title ? ` aria-labelledby="${id}-title"` : ""}>
    <div class="form-alert" id="${f("alert")}" role="alert" hidden></div>
    ${
      fixedType
        ? `<input type="hidden" name="requestType" value="${fixedType}">`
        : `<div class="field">
      <label for="${f("type")}">What would you like? <span class="req" aria-hidden="true">*</span></label>
      <select id="${f("type")}" name="requestType" required aria-describedby="${f("type")}-err">${types.map(([k, t]) => `<option value="${k}">${esc(t.label)}</option>`).join("")}</select>
      ${err("type")}
    </div>`
    }
    <input type="hidden" name="cta" value="${esc(F.requestTypes[fixedType ?? "demo"].cta)}">
    <input type="hidden" name="page" value="${esc(page)}">
    <input type="hidden" name="redirect" value="${esc(site.site.url.replace(/\/$/, "") + F.thankYouPath)}">
    <div class="field-grid">
      ${input("name", "Full name", "text", { required: true, auto: "name", attrs: 'maxlength="120"' })}
      ${input("email", "Email", "email", { required: true, auto: "email", attrs: 'maxlength="200" inputmode="email"' })}
      ${input("phone", "Mobile phone", "tel", { auto: "tel", attrs: 'maxlength="30" inputmode="tel"' })}
      ${input("brokerage", "Brokerage or team", "text", { auto: "organization", attrs: 'maxlength="160"' })}
      <div class="field">
        <label for="${f("agents")}">Number of agents <span class="opt">(optional)</span></label>
        <select id="${f("agents")}" name="agents" aria-describedby="${f("agents")}-err"><option value="">Choose…</option>${F.agentOptions.map((o) => `<option>${esc(o)}</option>`).join("")}</select>
        ${err("agents")}
      </div>
      ${input("crm", "Current CRM", "text", { attrs: 'maxlength="120" placeholder="e.g. spreadsheet, another CRM, none"' })}
    </div>
    <div class="field">
      <label for="${f("challenge")}">Biggest prospecting challenge <span class="opt">(optional)</span></label>
      <textarea id="${f("challenge")}" name="challenge" rows="4" maxlength="2000" aria-describedby="${f("challenge")}-err"></textarea>
      ${err("challenge")}
    </div>
    <fieldset class="field radios" aria-describedby="${f("interest")}-err">
      <legend>Interested in <span class="req" aria-hidden="true">*</span></legend>
      <div class="radio-row">${F.interestOptions.map((o, i) => `<label class="radio"><input type="radio" name="interest" value="${esc(o)}"${i === 0 ? " required" : ""}> <span>${esc(o)}</span></label>`).join("")}</div>
      ${err("interest")}
    </fieldset>
    <div class="field consent">
      <label class="check"><input type="checkbox" id="${f("consent")}" name="consent" value="yes" required aria-describedby="${f("consent")}-err"> <span>${esc(F.consentText)} See our <a href="/privacy">Privacy Policy</a>. <span class="req" aria-hidden="true">*</span></span></label>
      ${err("consent")}
    </div>
    <div class="hp" aria-hidden="true">
      <label for="${f("hp")}">Leave this field empty</label>
      <input id="${f("hp")}" name="hp_extra" type="text" tabindex="-1" autocomplete="off">
    </div>
    <button class="btn btn-primary btn-block" type="submit">${esc(kind === "kpi" ? "Send me the KPI Tracker" : kind === "contact" ? "Send message" : "Submit request")}</button>
    <p class="form-small"><span class="req" aria-hidden="true">*</span> Required. We never sell your information.</p>
  </form>
  <div class="form-success" id="${f("success")}" tabindex="-1" hidden>
    ${icon("check", "success-ic")}
    <h3>Request received</h3>
    <p class="success-text"></p>
    ${kind === "kpi" && site.media.kpiTrackerDownloadUrl ? `<p><a class="btn btn-primary" href="${esc(site.media.kpiTrackerDownloadUrl)}" download>${icon("download", "btn-ic")}Download the KPI Tracker</a></p>` : ""}
  </div>
</div>`;
}

export { join };
