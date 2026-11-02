// Integrations: outside services the owner can switch on in the website editor (site.json → integrations).
//
// Each one lists: the settings it needs (each checked against a strict pattern, because some values become part of a
// script address), and the outside addresses the Content-Security-Policy must allow while it is on. Nothing loads,
// and the security policy stays strict, for anything that is switched off.
//
// Used by: layout.mjs (security policy + browser settings), validate.mjs (checks), pages.mjs (Stripe buttons,
// Calendly), assets/site.js (loads the chat / tracking scripts), admin/admin.js (the Integrations screen).

export const INTEGRATION_DEFAULTS = {
  _help: "Connect outside services. Switch one on, fill in its details, then publish. Nothing loads on the website for services that are switched off.",
  stripe: { enabled: false, buttonLabel: "Pay now", note: "Secure checkout by Stripe" },
  chat: { enabled: false, provider: "tawk", tawkPropertyId: "", tawkWidgetId: "default", crispWebsiteId: "", tidioPublicKey: "", intercomAppId: "", hubspotPortalId: "" },
  calendly: { enabled: false, url: "", title: "Prefer to pick a time yourself?", text: "Choose a time below — it's added to our calendar instantly." },
  metaPixel: { enabled: false, pixelId: "" },
  clarity: { enabled: false, projectId: "" },
  webhooks: { enabled: false, urls: [] },
};

/** The site's integrations with any missing parts filled in from the defaults (older content may not have them). */
export function integrationsOf(site) {
  const i = site?.integrations ?? {};
  const out = {};
  for (const [k, def] of Object.entries(INTEGRATION_DEFAULTS)) out[k] = typeof def === "object" && !Array.isArray(def) ? { ...def, ...(i[k] ?? {}) } : i[k] ?? def;
  return out;
}

/* ------------------------------------------------------------------ live chat providers */

export const CHAT_PROVIDERS = {
  tawk: {
    label: "Tawk.to (free live chat + AI assistant)",
    fields: { tawkPropertyId: /^[a-f0-9]{16,32}$/i, tawkWidgetId: /^[a-z0-9]{1,32}$/i },
    csp: {
      script: ["https://embed.tawk.to", "https://cdn.jsdelivr.net"],
      connect: ["https://*.tawk.to", "wss://*.tawk.to"],
      frame: ["https://*.tawk.to"],
      img: ["https://*.tawk.to", "https://cdn.jsdelivr.net", "https://tawk.link"],
      font: ["https://*.tawk.to", "https://cdn.jsdelivr.net", "https://fonts.gstatic.com"],
      style: ["https://*.tawk.to", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com"],
      media: ["https://*.tawk.to"],
    },
  },
  crisp: {
    label: "Crisp (live chat + chatbot)",
    fields: { crispWebsiteId: /^[a-f0-9-]{36}$/i },
    csp: {
      script: ["https://client.crisp.chat", "https://settings.crisp.chat"],
      connect: ["https://*.crisp.chat", "wss://client.relay.crisp.chat", "wss://stream.relay.crisp.chat"],
      frame: ["https://game.crisp.chat"],
      img: ["https://*.crisp.chat"],
      font: ["https://client.crisp.chat"],
      style: ["https://client.crisp.chat"],
      media: ["https://client.crisp.chat"],
    },
  },
  tidio: {
    label: "Tidio (live chat + Lyro AI chatbot)",
    fields: { tidioPublicKey: /^[a-z0-9]{20,40}$/i },
    csp: {
      script: ["https://code.tidio.co", "https://*.tidio.co", "https://*.tidiochat.com"],
      connect: ["https://*.tidio.co", "wss://*.tidio.co", "https://*.tidiochat.com", "wss://*.tidiochat.com"],
      frame: ["https://*.tidio.co", "https://*.tidiochat.com"],
      img: ["https://*.tidio.co", "https://*.tidiochat.com"],
      font: ["https://*.tidiochat.com", "https://*.tidio.co"],
      style: ["https://*.tidiochat.com", "https://*.tidio.co"],
      media: ["https://*.tidiochat.com", "https://*.tidio.co"],
    },
  },
  intercom: {
    label: "Intercom (messenger + Fin AI agent)",
    fields: { intercomAppId: /^[a-z0-9]{6,12}$/i },
    csp: {
      script: ["https://widget.intercom.io", "https://js.intercomcdn.com"],
      connect: ["https://*.intercom.io", "wss://*.intercom.io", "https://*.intercomcdn.com", "https://uploads.intercomusercontent.com"],
      frame: ["https://intercom-sheets.com", "https://www.intercom-reporting.com", "https://www.youtube.com", "https://player.vimeo.com"],
      img: ["https://js.intercomcdn.com", "https://static.intercomassets.com", "https://downloads.intercomcdn.com", "https://uploads.intercomusercontent.com", "https://*.intercomcdn.com"],
      font: ["https://js.intercomcdn.com", "https://fonts.intercomcdn.com"],
      style: [],
      media: ["https://js.intercomcdn.com"],
    },
  },
  hubspot: {
    label: "HubSpot (chat + forms tracking)",
    fields: { hubspotPortalId: /^\d{4,12}$/ },
    csp: {
      script: ["https://js.hs-scripts.com", "https://*.hs-scripts.com", "https://*.hs-banner.com", "https://*.hs-analytics.net", "https://*.hscollectedforms.net", "https://*.usemessages.com", "https://*.hubspot.com", "https://*.hsadspixel.net"],
      connect: ["https://*.hubspot.com", "https://*.hubapi.com", "https://*.hs-banner.com", "https://*.hscollectedforms.net", "https://*.hsforms.com", "wss://*.hubspot.com"],
      frame: ["https://app.hubspot.com", "https://*.hubspot.com", "https://*.usemessages.com"],
      img: ["https://*.hubspot.com", "https://*.hsforms.com", "https://*.hubspotusercontent-na1.net", "https://*.hs-analytics.net"],
      font: ["https://*.hubspot.com"],
      style: ["https://*.hubspot.com"],
      media: [],
    },
  },
};

const FIELD_NAMES = { tawkPropertyId: "Property ID", tawkWidgetId: "Widget ID", crispWebsiteId: "Website ID", tidioPublicKey: "Public key", intercomAppId: "App ID", hubspotPortalId: "Hub ID" };

const META_PIXEL = { script: ["https://connect.facebook.net"], connect: ["https://www.facebook.com"], img: ["https://www.facebook.com"] };
const CLARITY = { script: ["https://www.clarity.ms", "https://*.clarity.ms"], connect: ["https://*.clarity.ms", "https://c.bing.com"], img: ["https://*.clarity.ms", "https://c.bing.com"] };
const CALENDLY = { frame: ["https://calendly.com"] };

export const PATTERNS = {
  metaPixel: /^\d{10,20}$/,
  clarity: /^[a-z0-9]{6,20}$/i,
  calendly: /^https:\/\/calendly\.com\/[A-Za-z0-9_\-/]+$/,
  https: /^https:\/\/[^\s"'<>]+$/,
};

/* ------------------------------------------------------------------ checks */

/** Plain-English problems with the integration settings (empty = all fine). Only switched-on ones are checked. */
export function integrationProblems(site) {
  const i = integrationsOf(site);
  const out = [];
  if (i.chat.enabled) {
    const p = CHAT_PROVIDERS[i.chat.provider];
    if (!p) out.push(`Live chat: choose a chat service.`);
    else for (const [field, re] of Object.entries(p.fields)) if (!re.test(String(i.chat[field] ?? "").trim())) out.push(`Live chat (${p.label.split(" (")[0]}): the ${FIELD_NAMES[field] ?? field} doesn't look right. Copy it again from your ${p.label.split(" (")[0]} account (see the help under the box).`);
  }
  if (i.metaPixel.enabled && !PATTERNS.metaPixel.test(String(i.metaPixel.pixelId).trim())) out.push("Meta (Facebook) Pixel: the Pixel ID should be a long number, e.g. 123456789012345.");
  if (i.clarity.enabled && !PATTERNS.clarity.test(String(i.clarity.projectId).trim())) out.push("Microsoft Clarity: the project ID should be letters and numbers, e.g. abcd1234ef.");
  if (i.calendly.enabled && !PATTERNS.calendly.test(String(i.calendly.url).trim())) out.push("Calendly: paste your scheduling link, e.g. https://calendly.com/your-name/30min");
  if (i.webhooks.enabled) {
    const urls = (i.webhooks.urls ?? []).map((u) => String(u).trim()).filter(Boolean);
    if (!urls.length) out.push("Zapier / Make webhooks: add at least one webhook address, or switch it off.");
    for (const u of urls) if (!PATTERNS.https.test(u)) out.push(`Zapier / Make webhooks: “${u}” must be a full https:// address.`);
  }
  if (i.stripe.enabled) {
    for (const pl of site.pages?.pricing?.plans ?? []) {
      const link = String(pl.paymentLink ?? "").trim();
      if (link && !PATTERNS.https.test(link)) out.push(`Stripe: the payment link for “${pl.name}” must be a full https:// address (from Stripe → Payment Links).`);
    }
  }
  return out;
}

/* ------------------------------------------------------------------ security policy and browser settings */

/** Extra addresses the security policy must allow for the switched-on integrations. */
export function integrationCsp(site) {
  const i = integrationsOf(site);
  const add = { script: [], connect: [], img: [], frame: [], font: [], style: [], media: [], inlineStyles: false };
  const merge = (src) => { for (const [k, v] of Object.entries(src)) add[k].push(...v); };
  if (i.chat.enabled && CHAT_PROVIDERS[i.chat.provider]) {
    merge(CHAT_PROVIDERS[i.chat.provider].csp);
    add.inlineStyles = true; // chat windows style themselves with inline styles
  }
  if (i.metaPixel.enabled) merge(META_PIXEL);
  if (i.clarity.enabled) merge(CLARITY);
  if (i.calendly.enabled) merge(CALENDLY);
  for (const k of Object.keys(add)) if (Array.isArray(add[k])) add[k] = [...new Set(add[k])];
  return add;
}

/** The (public) settings the browser needs to load the switched-on integrations. Never contains secrets. */
export function integrationClientConfig(site) {
  const i = integrationsOf(site);
  const out = {};
  if (i.chat.enabled && CHAT_PROVIDERS[i.chat.provider]) {
    const p = CHAT_PROVIDERS[i.chat.provider];
    out.chat = { provider: i.chat.provider, ...Object.fromEntries(Object.keys(p.fields).map((f) => [f, String(i.chat[f] ?? "").trim()])) };
  }
  if (i.metaPixel.enabled) out.metaPixel = String(i.metaPixel.pixelId).trim();
  if (i.clarity.enabled) out.clarity = String(i.clarity.projectId).trim();
  if (i.webhooks.enabled) out.webhooks = (i.webhooks.urls ?? []).map((u) => String(u).trim()).filter((u) => PATTERNS.https.test(u));
  return out;
}
