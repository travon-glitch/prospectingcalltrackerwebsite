// One function per page. Each returns { path, file, seo, body, jsonLd, noindex }.

import { button, checklist, ctaRow, faq, faqJsonLd, featureRow, finalCta, leadForm, mediaImage, metrics, pageHero, sectionHead, testimonials, videoBlock } from "./components.mjs";
import { esc, icon, isPlaceholder } from "./html.mjs";
import { mockups } from "./mockups.mjs";

const stepsList = (steps, { details = false } = {}) => `<ol class="steps">${steps
  .map(
    (s, i) => `<li class="step">
  <span class="step-num" aria-hidden="true">${i + 1}</span>
  <div><h3><span class="sr-only">Step ${i + 1}: </span>${esc(s.title)}</h3><p>${esc(s.text)}</p>${details && s.details ? checklist(s.details, "compact") : ""}</div>
</li>`,
  )
  .join("")}</ol>`;

/* ================================================================ Home */

function home(site) {
  const p = site.pages.home;
  const steps = site.pages.howItWorks.steps;
  const body = `
${pageHero(site, p.hero, { visual: mockups.hero() })}

<section class="band" aria-labelledby="audience-title">
  <div class="container band-inner">
    <h2 class="band-title" id="audience-title">${esc(p.audience.title)}</h2>
    <ul class="pill-list">${p.audience.items.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
  </div>
</section>

<section class="section" aria-labelledby="problem-title">
  <div class="container">
    ${sectionHead({ eyebrow: p.problem.eyebrow, title: p.problem.title, intro: p.problem.intro, id: "problem-title", center: true })}
    <div class="grid grid-4 problems">${p.problem.items.map((it) => `<div class="card problem"><span class="problem-ic">${icon("x", "icon")}</span><h3>${esc(it.title)}</h3><p>${esc(it.text)}</p></div>`).join("")}</div>
  </div>
</section>

<section class="section bg-soft" aria-labelledby="solution-title">
  <div class="container">
    ${sectionHead({ eyebrow: p.solution.eyebrow, title: p.solution.title, intro: p.solution.intro, id: "solution-title", center: true })}
    <div class="grid grid-3 services">${p.solution.services
      .map(
        (s, i) => `<article class="card service">
  <span class="service-num" aria-hidden="true">0${i + 1}</span>
  <h3>${esc(s.title)}</h3>
  <p>${esc(s.text)}</p>
  ${checklist(s.items, "compact")}
  <div class="card-cta">${button(site, s.cta, "secondary", "btn-sm")}</div>
</article>`,
      )
      .join("")}</div>
  </div>
</section>

<section class="section" aria-labelledby="leadtypes-title">
  <div class="container">
    ${sectionHead({ title: p.leadTypes.title, id: "leadtypes-title", center: true })}
    <ul class="pill-list pill-list-center pill-green">${p.leadTypes.items.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
  </div>
</section>

<section class="section bg-soft" aria-labelledby="showcase-title">
  <div class="container">
    ${sectionHead({ eyebrow: p.showcase.eyebrow, title: p.showcase.title, id: "showcase-title", center: true })}
    <div class="grid grid-3 showcase">${p.showcase.items
      .map((s) => `<div class="showcase-item">${mockups[s.mockup]()}<h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></div>`)
      .join("")}</div>
    <div class="center mt-lg">${ctaRow(site, ["seeCrm", "watchDemo"])}</div>
  </div>
</section>

<section class="section" aria-labelledby="steps-title">
  <div class="container">
    ${sectionHead({ eyebrow: p.steps.eyebrow, title: p.steps.title, id: "steps-title", center: true })}
    ${stepsList(steps)}
    <div class="center mt-lg">${ctaRow(site, [p.steps.cta, "seeCrm"])}</div>
  </div>
</section>

${socialProof(site, p.socialProof)}

<section class="section" aria-labelledby="kpi-band-title">
  <div class="container split-band">
    <div>
      <h2 id="kpi-band-title">${esc(site.pages.resources.kpi.title)}</h2>
      <p>${esc(site.pages.resources.kpi.text)}</p>
    </div>
    <div class="cta-row">${button(site, "kpi", "primary")}${button(site, "foundingTeam", "secondary")}</div>
  </div>
</section>

${faq(p.faq, "bg-soft")}
${finalCta(site, p.finalCta)}`;
  return { path: "/", file: "index.html", seo: p.seo, body, jsonLd: [faqJsonLd(p.faq)] };
}

function socialProof(site, sp) {
  return `<section class="section bg-navy" aria-labelledby="proof-title">
  <div class="container">
    ${sectionHead({ eyebrow: sp.eyebrow, title: sp.title, intro: sp.intro, id: "proof-title", center: true })}
    ${testimonials(sp)}
    <h3 class="metrics-title">Results we'll share with permission</h3>
    ${metrics(sp.metrics)}
    <div class="card case-study is-placeholder"><p class="ph-badge">Placeholder — replace with a real case study</p><h3>${esc(sp.caseStudy.title)}</h3><p>${esc(sp.caseStudy.text)}</p></div>
  </div>
</section>`;
}

/* ================================================================ Software */

function software(site) {
  const p = site.pages.software;
  const toc = p.features.map((f) => `<li><a href="#${esc(f.id)}">${esc(f.title)}</a></li>`).join("");
  const body = `
${pageHero(site, p.hero, { visual: mockups.leadList() })}

<nav class="section-sm toc-wrap" aria-label="Features on this page">
  <div class="container"><ul class="toc">${toc}</ul></div>
</nav>

<div class="container features">
${p.features.map((f, i) => featureRow(site, f, i)).join("\n")}
</div>

<section class="section bg-soft" id="demo-video" aria-labelledby="video-title">
  <div class="container narrow">
    ${sectionHead({ title: p.videoSection.title, intro: p.videoSection.text, id: "video-title", center: true })}
    ${videoBlock(site.media.demoVideo)}
  </div>
</section>

<section class="section" aria-labelledby="shots-title">
  <div class="container">
    ${sectionHead({ title: p.screenshotsSection.title, intro: p.screenshotsSection.text, id: "shots-title", center: true })}
    <div class="grid grid-3">${site.media.screenshots.map((s) => mediaImage(s)).join("")}</div>
  </div>
</section>

${finalCta(site, p.finalCta)}`;
  const app = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: site.site.name,
    applicationCategory: "BusinessApplication",
    applicationSubCategory: "Real estate prospecting CRM",
    operatingSystem: "Web browser (desktop and mobile)",
    url: site.site.url.replace(/\/$/, "") + "/software",
    description: p.seo.description,
    featureList: p.features.map((f) => f.title),
    publisher: { "@type": "Organization", name: site.site.name },
  };
  return { path: "/software", file: "software.html", seo: p.seo, body, jsonLd: [app] };
}

/* ================================================================ Consulting */

function consulting(site) {
  const p = site.pages.consulting;
  const body = `
${pageHero(site, p.hero, { visual: mockups.kpis() })}

<section class="section" aria-labelledby="services-title">
  <div class="container">
    ${sectionHead({ title: p.servicesTitle, id: "services-title", center: true })}
    <div class="grid grid-3 consult">${p.services.map((s) => `<div class="card consult-item"><span class="consult-ic">${icon("check", "icon")}</span><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></div>`).join("")}</div>
  </div>
</section>

<section class="section bg-soft" aria-labelledby="who-title">
  <div class="container two-col">
    <div>
      <h2 id="who-title">${esc(p.whoTitle)}</h2>
      ${checklist(p.who, "large")}
    </div>
    <div class="card note-card">
      <h3>${esc(p.notFor.title)}</h3>
      <p>${esc(p.notFor.text)}</p>
      ${ctaRow(site, ["audit"])}
    </div>
  </div>
</section>

${faq(p.faq)}
${finalCta(site, p.finalCta)}`;
  const svc = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: `${site.site.name} — Prospecting Consulting`,
    url: site.site.url.replace(/\/$/, "") + "/consulting",
    description: p.seo.description,
    image: site.site.url.replace(/\/$/, "") + site.site.ogImage,
    ...(isPlaceholder(site.contact.phone) ? {} : { telephone: site.contact.phone }),
    ...(isPlaceholder(site.contact.email) ? {} : { email: site.contact.email }),
    hasOfferCatalog: { "@type": "OfferCatalog", name: "Consulting services", itemListElement: p.services.map((s) => ({ "@type": "Offer", itemOffered: { "@type": "Service", name: s.title, description: s.text } })) },
  };
  return { path: "/consulting", file: "consulting.html", seo: p.seo, body, jsonLd: [svc, faqJsonLd(p.faq)] };
}

/* ================================================================ How it works */

function howItWorks(site) {
  const p = site.pages.howItWorks;
  const visuals = ["roi", "smartPlan", "permissions", "scoreboard"];
  const body = `
${pageHero(site, p.hero, { compact: true })}
<section class="section" aria-labelledby="hiw-title">
  <h2 class="sr-only" id="hiw-title">The four steps</h2>
  <div class="container features">
    ${p.steps
      .map(
        (s, i) => `<section class="feature${i % 2 ? " flip" : ""}" aria-labelledby="hiw-${i + 1}">
  <div class="feature-copy">
    <p class="eyebrow">Step ${i + 1}</p>
    <h3 class="h2" id="hiw-${i + 1}">${esc(s.title)}</h3>
    <p>${esc(s.text)}</p>
    ${checklist(s.details, "compact")}
  </div>
  <div class="feature-visual">${mockups[visuals[i]]()}</div>
</section>`,
      )
      .join("")}
  </div>
</section>
${finalCta(site, p.finalCta)}`;
  return { path: "/how-it-works", file: "how-it-works.html", seo: p.seo, body };
}

/* ================================================================ About */

function about(site) {
  const p = site.pages.about;
  const name = isPlaceholder(p.founderName) ? "" : p.founderName;
  const body = `
${pageHero(site, p.hero, { compact: true })}
<section class="section" aria-labelledby="story-title">
  <div class="container founder">
    <div class="founder-photo">${mediaImage(site.media.founderPhoto, { width: 800, height: 1000, cls: "portrait" })}${site.media.founderPhoto.placeholder ? `<p class="small-note">Photo placeholder — replace in site.json → media.founderPhoto</p>` : ""}</div>
    <div class="founder-story">
      <h2 id="story-title">The story behind Prospecting Call Tracker</h2>
      ${p.story.map((t) => `<p>${esc(t)}</p>`).join("")}
      <p class="founder-sig"><strong>${esc(name || "[Founder name]")}</strong><span>${esc(p.founderTitle)}</span></p>
    </div>
  </div>
</section>
<section class="section bg-soft" aria-labelledby="stats-title">
  <div class="container">
    ${sectionHead({ title: p.statsTitle, id: "stats-title", center: true })}
    <div class="about-metrics">${metrics(p.stats.map((s) => ({ ...s, note: "" })), { note: p.statsNote })}</div>
  </div>
</section>
<section class="section" aria-labelledby="values-title">
  <div class="container">
    ${sectionHead({ title: p.valuesTitle, id: "values-title", center: true })}
    <div class="grid grid-4">${p.values.map((v) => `<div class="card"><h3>${esc(v.title)}</h3><p>${esc(v.text)}</p></div>`).join("")}</div>
  </div>
</section>
${finalCta(site, p.finalCta)}`;
  const person = name ? { "@context": "https://schema.org", "@type": "Person", name, jobTitle: "Founder", worksFor: { "@type": "Organization", name: site.site.name } } : null;
  return { path: "/about", file: "about.html", seo: p.seo, body, jsonLd: [person] };
}

/* ================================================================ Resources */

function resources(site) {
  const p = site.pages.resources;
  const body = `
${pageHero(site, p.hero, { compact: true })}
<section class="section" aria-labelledby="library-title">
  <div class="container">
    ${sectionHead({ title: "Resource library", id: "library-title", center: true })}
    <div class="grid grid-4 resources">${p.items
      .map(
        (r) => `<article class="card resource">
  <p class="resource-tag">${esc(r.tag)}</p>
  <h3>${r.href ? `<a href="${esc(r.href)}">${esc(r.title)}</a>` : esc(r.title)}</h3>
  <p>${esc(r.text)}</p>
  ${r.status ? `<p class="resource-status">${icon("clock", "m-ic")}${esc(r.status)}</p>` : ""}
</article>`,
      )
      .join("")}</div>
  </div>
</section>
<section class="section bg-soft" id="kpi-tracker" aria-labelledby="kpi-title">
  <div class="container two-col form-layout">
    <div>
      <p class="eyebrow">Free download</p>
      <h2 id="kpi-title">${esc(p.kpi.title)}</h2>
      <p class="lead">${esc(p.kpi.text)}</p>
      ${checklist(p.kpi.bullets, "large")}
      <div class="kpi-visual">${mockups.kpis()}</div>
    </div>
    ${leadForm(site, { kind: "kpi", id: "kpi-form", title: "Where should we send it?", page: "/resources" })}
  </div>
</section>
${finalCta(site, site.pages.home.finalCta)}`;
  return { path: "/resources", file: "resources.html", seo: p.seo, body };
}

/* ================================================================ Pricing */

function pricing(site) {
  const p = site.pages.pricing;
  const body = `
${pageHero(site, p.hero, { compact: true })}
<section class="section" aria-labelledby="plans-title">
  <h2 class="sr-only" id="plans-title">Packages</h2>
  <div class="container">
    <div class="plans">${p.plans
      .map(
        (pl) => `<article class="card plan${pl.featured ? " featured" : ""}"${pl.id ? ` id="${esc(pl.id)}"` : ""} aria-labelledby="plan-${esc(pl.name.toLowerCase().replace(/[^a-z]+/g, "-"))}">
  ${pl.badge ? `<p class="plan-badge">${esc(pl.badge)}</p>` : ""}
  <h3 id="plan-${esc(pl.name.toLowerCase().replace(/[^a-z]+/g, "-"))}">${esc(pl.name)}</h3>
  <p class="plan-for">${esc(pl.for)}</p>
  <p class="plan-price">${esc(pl.price)}</p>
  ${pl.priceNote ? `<p class="plan-note ph-inline">${esc(pl.priceNote)}</p>` : ""}
  ${checklist(pl.items, "compact")}
  <div class="card-cta">${button(site, pl.cta, pl.featured ? "primary" : "secondary", "btn-block")}</div>
</article>`,
      )
      .join("")}</div>
    <div class="footnotes">${p.footnotes.map((f) => `<p>${esc(f)}</p>`).join("")}</div>
  </div>
</section>
${faq(p.faq, "bg-soft")}
${finalCta(site, p.finalCta)}`;
  return { path: "/pricing", file: "pricing.html", seo: p.seo, body, jsonLd: [faqJsonLd(p.faq)] };
}

/* ================================================================ Demo / strategy call */

function demo(site) {
  const p = site.pages.demo;
  const body = `
${pageHero(site, p.hero, { compact: true })}
<section class="section" aria-label="Request form">
  <div class="container two-col form-layout">
    <div>
      <h2>${esc(p.expectTitle)}</h2>
      ${checklist(p.expect, "large")}
      <div class="kpi-visual">${mockups.leadCard()}</div>
      <p class="small-note">${esc(site.contact.responseNote)}</p>
    </div>
    ${leadForm(site, { kind: "demo", id: "demo-form", title: p.formTitle, page: "/demo" })}
  </div>
</section>`;
  return { path: "/demo", file: "demo.html", seo: p.seo, body };
}

/* ================================================================ Contact */

function contact(site) {
  const p = site.pages.contact;
  const c = site.contact;
  const item = (label, value, href) => `<li><span class="c-label">${esc(label)}</span>${isPlaceholder(value) ? `<span class="ph-inline">[Add ${esc(label.toLowerCase())} in site.json]</span>` : `<a href="${esc(href)}">${esc(value)}</a>`}</li>`;
  const body = `
${pageHero(site, p.hero, { compact: true })}
<section class="section" aria-label="Contact details and form">
  <div class="container two-col form-layout">
    <div>
      <h2>Reach us directly</h2>
      <ul class="contact-list">
        ${item("Email", c.email, `mailto:${c.email}`)}
        ${item("Phone", c.phone, `tel:${String(c.phone).replace(/[^\d+]/g, "")}`)}
        ${isPlaceholder(c.address) ? "" : `<li><span class="c-label">Office</span>${esc(c.address)}</li>`}
        ${c.hours ? `<li><span class="c-label">Hours</span>${esc(c.hours)}</li>` : ""}
      </ul>
      <p class="small-note">${esc(c.responseNote)}</p>
      <div class="card note-card"><h3>Want a demo or strategy call?</h3><p>The booking form gets you on the calendar fastest.</p>${ctaRow(site, ["strategyCall", "demo"])}</div>
    </div>
    ${leadForm(site, { kind: "contact", id: "contact-form", title: p.formTitle, page: "/contact" })}
  </div>
</section>`;
  return { path: "/contact", file: "contact.html", seo: p.seo, body };
}

/* ================================================================ Legal, thank-you, 404 */

function legal(site, key, path) {
  const p = site.pages[key];
  const body = `
<section class="hero hero-compact" aria-labelledby="page-title"><div class="container"><h1 id="page-title">${esc(p.title)}</h1><p class="hero-sub">Effective date: ${esc(p.updated)}</p></div></section>
<section class="section"><div class="container narrow prose">
  ${p.draftNote ? `<p class="draft-note" role="note">${esc(p.draftNote)}</p>` : ""}
  ${p.sections.map((s) => `<h2>${esc(s.h)}</h2>${s.p.map((t) => `<p>${esc(t)}</p>`).join("")}`).join("\n")}
</div></section>`;
  return { path, file: `${path.slice(1)}.html`, seo: p.seo, body };
}

function simple(site, key, path, file, noindex) {
  const p = site.pages[key];
  const body = `
<section class="hero hero-compact simple-page" aria-labelledby="page-title"><div class="container narrow center">
  ${key === "thankYou" ? icon("check", "success-ic big") : ""}
  <h1 id="page-title">${esc(p.title)}</h1>
  <p class="hero-sub">${esc(p.text)}</p>
  ${ctaRow(site, p.ctas, { onDark: true })}
  ${key === "notFound" ? `<ul class="pill-list pill-list-center on-dark">${site.nav.map((n) => `<li><a href="${esc(n.href)}">${esc(n.label)}</a></li>`).join("")}</ul>` : ""}
</div></section>`;
  return { path, file, seo: p.seo, body, noindex };
}

/* ================================================================ Extra pages (added in the website editor) */

const paragraphs = (text) =>
  String(text ?? "")
    .split(/\n\s*\n/)
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => `<p>${esc(t).replace(/\n/g, "<br>")}</p>`)
    .join("");

function customPage(site, cp, taken) {
  const slug = String(cp.slug ?? "").trim().replace(/^\/+|\/+$/g, "");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error(`site.json: extra page “${cp.title || "(untitled)"}” needs a web address made of lowercase letters, numbers and dashes, e.g. open-house-guide`);
  if (taken.has("/" + slug)) throw new Error(`site.json: the web address /${slug} is already used by another page`);
  taken.add("/" + slug);
  const title = String(cp.title ?? "").trim() || slug;
  const sections = (cp.sections ?? [])
    .map((s, i) => {
      const img = s.image?.src ? mediaImage({ src: s.image.src, alt: s.image.alt || title, caption: s.image.caption || "" }, { cls: "cp-image" }) : "";
      const btn = s.button?.label && s.button?.href ? `<div class="cta-row">${button(site, { label: s.button.label, href: s.button.href }, i % 2 ? "secondary" : "primary")}</div>` : "";
      if (!s.heading && !s.text && !img && !btn) return "";
      return `<section class="section${i % 2 ? " bg-soft" : ""}"${s.heading ? ` aria-labelledby="cp-${i}"` : ""}>
  <div class="container${img ? " two-col cp-split" : " narrow"}">
    <div class="prose">${s.heading ? `<h2 id="cp-${i}">${esc(s.heading)}</h2>` : ""}${paragraphs(s.text)}${btn}</div>
    ${img}
  </div>
</section>`;
    })
    .join("\n");
  const hero = { eyebrow: cp.eyebrow, title, subtitle: cp.subtitle, ctas: (cp.heroButtons ?? []).filter((k) => site.ctas[k]) };
  const description = cp.seo?.description || cp.subtitle || site.site.brandStatement;
  const body = `
${pageHero(site, hero, { compact: true })}
${sections}
${cp.showFinalCta === false ? "" : finalCta(site, site.pages.home.finalCta)}`;
  return { path: "/" + slug, file: `${slug}.html`, seo: { title: cp.seo?.title || `${title} | ${site.site.name}`, description }, body };
}

export function allPages(site) {
  const pages = [
    home(site),
    software(site),
    consulting(site),
    howItWorks(site),
    about(site),
    resources(site),
    pricing(site),
    demo(site),
    contact(site),
    legal(site, "privacy", "/privacy"),
    legal(site, "terms", "/terms"),
    simple(site, "thankYou", "/thank-you", "thank-you.html", true),
    simple(site, "notFound", "/404", "404.html", true),
  ];
  const taken = new Set([...pages.map((p) => p.path), "/admin", "/api", "/assets", "/index"]);
  for (const cp of site.customPages ?? []) if (cp.published !== false) pages.push(customPage(site, cp, taken));
  return pages;
}
