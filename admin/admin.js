/* Website editor for Prospecting Call Tracker.
   Loads content/site.json through /api/admin, shows every value as a form, and publishes changes as a GitHub commit
   (Vercel then rebuilds the site). Plain JavaScript: no frameworks, no inline styles or handlers (the CSP forbids them). */
(function () {
  "use strict";

  /* ================================================================ labels and structure */

  var PAGES = [
    ["home", "Home", "/"],
    ["software", "Software", "/software"],
    ["consulting", "Consulting", "/consulting"],
    ["howItWorks", "How It Works", "/how-it-works"],
    ["about", "About the Founder", "/about"],
    ["resources", "Resources", "/resources"],
    ["pricing", "Pricing", "/pricing"],
    ["demo", "Book a Demo", "/demo"],
    ["contact", "Contact", "/contact"],
    ["privacy", "Privacy Policy", "/privacy"],
    ["terms", "Terms of Service", "/terms"],
    ["thankYou", "Thank-you page", "/thank-you"],
    ["notFound", "Page not found (404)", "/404"],
  ];

  var SITEWIDE = [
    { id: "site", label: "Site settings", keys: ["site"], intro: "Your business name, web address, and how the site looks when it's shared on social media or in Google." },
    { id: "contact", label: "Contact details", keys: ["contact"], intro: "Shown in the footer and on the Contact page. Leave a box empty to hide it." },
    { id: "social", label: "Social media links", keys: ["social"], intro: "Paste the full link to each profile, e.g. https://www.facebook.com/yourpage. Leave empty to hide." },
    { id: "menu", label: "Menu & buttons", keys: ["nav", "headerCta", "ctas"], intro: "The top menu, the button in the top corner, and the buttons used throughout the site. Changing a button here changes it everywhere it appears." },
    { id: "footer", label: "Footer", keys: ["footer"], intro: "The links and small print at the bottom of every page." },
    { id: "media", label: "Photos & video", keys: ["media"], intro: "Founder photo, CRM screenshots, demo video and the KPI Tracker download." },
    { id: "theme", label: "Brand colors", keys: ["theme"], intro: "Colors used across the whole website. Changes show after you publish." },
    { id: "forms", label: "Forms", keys: ["forms"], intro: "Where form submissions are sent and the questions on the forms." },
    { id: "integrations", label: "Integrations (payments, chat…)", keys: ["integrations", "analytics"] },
  ];
  var HIDDEN_TOP = { _readme: 1, pages: 1, customPages: 1, integrations: 1, analytics: 1 };

  var MOCKUPS = ["hero", "leadList", "leadCard", "followups", "pipeline", "scoreboard", "aiDraft", "listImport", "assignment", "dialer", "texting", "emailCenter", "smartPlan", "kpis", "roi", "permissions", "coaching"];

  var LABELS = {
    seo: "Google listing", hero: "Top of the page", finalCta: "Call-to-action band at the bottom", faq: "Frequently asked questions",
    href: "Link", url: "Web address", src: "Image", poster: "Cover image", alt: "Image description", caption: "Caption",
    h: "Heading", p: "Paragraphs", q: "Question", a: "Answer", cta: "Button", ctas: "Buttons", heroButtons: "Buttons at the top",
    eyebrow: "Small heading above the title", subtitle: "Text under the title", intro: "Intro text", points: "Bullet points",
    embedUrl: "Video embed link", ogImage: "Image shown when the site is shared", ogImageAlt: "Description of that image",
    placeholder: "This is still a placeholder (shows a yellow dashed outline)", featured: "Highlight this card", badge: "Badge text",
    price: "Price", priceNote: "Small text under the price", for: "Who it's for", items: "Items", mockup: "Illustration",
    draftNote: "Draft warning at the top", updated: "Effective date", themeColor: "Phone browser bar color",
    googleFontsCss: "Font stylesheet link", locale: "Language code", twitterHandle: "X (Twitter) handle", brandStatement: "Brand statement",
    accentColor: "Main accent (buttons, highlights)", accentDarkColor: "Accent when hovered", darkColor: "Dark backgrounds",
    darkColor2: "Cards on dark backgrounds", footerColor: "Footer background",
    slug: "Web address", published: "Show this page on the website", showFinalCta: "Show the call-to-action band at the bottom",
    heading: "Heading", text: "Text", image: "Image", button: "Button", sections: "Sections", label: "Text", title: "Title",
    name: "Name", value: "Value", note: "Note", endpoint: "Form destination (your CRM address)",
    googleAnalyticsId: "Google Analytics ID", plausibleDomain: "Plausible domain", plausibleScript: "Plausible script link",
    enabled: "Switched on", buttonLabel: "Button text", paymentLink: "Stripe payment link", tawkPropertyId: "Property ID", tawkWidgetId: "Widget ID",
    crispWebsiteId: "Website ID", tidioPublicKey: "Public key", intercomAppId: "App ID", hubspotPortalId: "Hub ID", pixelId: "Pixel ID",
    projectId: "Project ID", urls: "Webhook addresses",
    founderName: "Founder name", founderTitle: "Founder title", kpiTrackerDownloadUrl: "KPI Tracker download file",
    mockupNote: "Caption under the dashboard illustrations", nav: "Top menu", headerCta: "Button in the top corner",
    benefit: "Headline", id: "Link name (for #links)", consentText: "Consent checkbox text", thankYouPath: "Page shown after sending a form",
    agentOptions: "“Number of agents” choices", interestOptions: "“Interested in” choices", requestTypes: "Request types", ctaSlugs: "Button → request type",
    disclaimer: "Disclaimer", providerNote: "Provider note", legal: "Legal links", columns: "Link columns", links: "Links",
    responseNote: "Reply-time note", hours: "Office hours", address: "Office address", phone: "Phone", email: "Email",
    tagline: "Tagline", demoVideo: "Demo video", founderPhoto: "Founder photo", screenshots: "Screenshots",
  };
  var HINTS = {
    "seo.title": "The blue headline in Google results and the browser tab. Aim for 50–60 characters.",
    "seo.description": "The grey text under it in Google. Aim for 120–160 characters.",
    alt: "Describe what's in the picture, for blind visitors and Google.",
    embedUrl: "On YouTube: Share → Embed, then copy the address inside src=\"…\" (it starts with https://www.youtube-nocookie.com/embed/ or https://www.youtube.com/embed/).",
    slug: "Lowercase letters, numbers and dashes only, e.g. open-house-guide → yoursite.com/open-house-guide",
    endpoint: "Your CRM address + /api/public/website-lead. Until this is set, forms say they aren't connected yet.",
    url: "The full address starting with https://",
    text: "Leave an empty line between paragraphs.",
    id: "Used in links like /software#this-name. Change it only if you also change those links.",
    value: "Only real, verifiable numbers. Leave empty to show [—].",
    googleAnalyticsId: "Looks like G-XXXXXXXXXX.",
    heroButtons: "Pick from the buttons you set up under Menu & buttons.",
  };
  var COUNTERS = { "seo.title": 60, "seo.description": 160 };
  var LONG_KEYS = { text: 1, intro: 1, subtitle: 1, a: 1, quote: 1, description: 1, brandStatement: 1, consentText: 1, disclaimer: 1, providerNote: 1, story: 1, p: 1, draftNote: 1, placeholderNote: 1, benefit: 0 };
  var NEEDS_WHEN_EMPTY = { email: 1, phone: 1, founderName: 1, embedUrl: 1 };

  var TEMPLATES = {
    customPages: function () {
      return {
        slug: "new-page", published: true, eyebrow: "", title: "New page", subtitle: "", heroButtons: ["strategyCall"],
        sections: [{ heading: "", text: "", image: { src: "", alt: "" }, button: { label: "", href: "" } }],
        showFinalCta: true, seo: { title: "", description: "" },
      };
    },
    "customPages.*.sections": function () {
      return { heading: "", text: "", image: { src: "", alt: "" }, button: { label: "", href: "" } };
    },
  };

  /* ================================================================ state */

  var S = { site: null, sha: null, saved: "", section: "todo", repo: "", branch: "", media: null, previews: {}, open: {}, uid: 0, sideOpen: false, publishing: null };
  var DRAFT_KEY = "pct-admin-draft";
  var app = document.getElementById("app");

  /* ================================================================ tiny helpers */

  function h(tag, attrs) {
    var el = document.createElement(tag);
    if (attrs) {
      for (var k in attrs) {
        var v = attrs[k];
        if (v === undefined || v === null || v === false) continue;
        if (k === "text") el.textContent = v;
        else if (k === "class") el.className = v;
        else if (k.slice(0, 2) === "on") el.addEventListener(k.slice(2), v);
        else if (k === "value") el.value = v;
        else if (k === "checked") el.checked = !!v;
        else el.setAttribute(k, v === true ? "" : v);
      }
    }
    for (var i = 2; i < arguments.length; i++) add(el, arguments[i]);
    return el;
  }
  function add(el, c) {
    if (c === undefined || c === null || c === false) return;
    if (Array.isArray(c)) c.forEach(function (x) { add(el, x); });
    else el.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  }
  function uid() { return "f" + ++S.uid; }
  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function getAt(path) { return path.reduce(function (o, k) { return o == null ? o : o[k]; }, S.site); }
  function setAt(path, v) {
    var o = S.site;
    for (var i = 0; i < path.length - 1; i++) o = o[path[i]];
    o[path[path.length - 1]] = v;
    changed();
  }
  function humanize(key) {
    if (LABELS[key]) return LABELS[key];
    var s = String(key).replace(/[_-]+/g, " ").replace(/([a-z0-9])([A-Z])/g, "$1 $2").trim();
    return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  }
  function isPlaceholderText(v) { return typeof v === "string" && /\[[^\]]*\]/.test(v); }
  function needsInfo(key, v) {
    if (typeof v !== "string") return false;
    if (isPlaceholderText(v)) return true;
    if (/YOUR-CRM-DOMAIN/i.test(v)) return true;
    return !v.trim() && !!NEEDS_WHEN_EMPTY[key];
  }
  function pathStr(path) { return path.join("."); }
  function genericPath(path) { return path.map(function (k) { return typeof k === "number" ? "*" : k; }).join("."); }
  function itemTitle(v, i) {
    if (v && typeof v === "object") {
      var keys = ["title", "label", "name", "q", "h", "heading", "benefit", "slug", "tag", "caption", "alt", "src"];
      for (var j = 0; j < keys.length; j++) if (typeof v[keys[j]] === "string" && v[keys[j]].trim()) return v[keys[j]];
      for (var k in v) if (typeof v[k] === "string" && v[k].trim()) return v[k];
    }
    if (typeof v === "string" && v.trim()) return v;
    return "Item " + (i + 1);
  }
  function singular(key) {
    var map = { items: "item", features: "feature", services: "service", sections: "section", plans: "plan", steps: "step", stats: "number", values: "value", testimonials: "testimonial", metrics: "number", nav: "menu link", links: "link", columns: "column", legal: "link", social: "link", screenshots: "screenshot", footnotes: "footnote", customPages: "page", story: "paragraph", p: "paragraph", points: "point", who: "line", expect: "line", details: "detail", heroButtons: "button", ctas: "button", urls: "webhook address" };
    return map[key] || "item";
  }
  function toast(msg, kind, ms) {
    var box = document.querySelector(".toasts");
    if (!box) { box = h("div", { class: "toasts", role: "status", "aria-live": "polite" }); document.body.appendChild(box); }
    var t = h("div", { class: "toast" + (kind ? " " + kind : ""), text: msg });
    box.appendChild(t);
    setTimeout(function () { t.remove(); }, ms || 5000);
  }
  function fmtDate(d) {
    try { return new Date(d).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }); } catch (e) { return d; }
  }

  /* ================================================================ server */

  function apiCall(action, opts, token) {
    var init = { method: opts.body !== undefined ? "POST" : "GET", credentials: "same-origin", headers: {} };
    if (token) init.headers.Authorization = "Bearer " + token;
    if (opts.body !== undefined) {
      init.headers["Content-Type"] = "application/json";
      init.headers["X-PCT-Admin"] = "1";
      init.body = JSON.stringify(opts.body);
    }
    return fetch("/api/admin?action=" + action + (opts.query || ""), init).catch(function () {
      throw new Error("Couldn't reach the website. Check your internet connection and try again.");
    }).then(function (res) {
      return res.json().catch(function () { return null; }).then(function (data) {
        if (!res.ok || !data) {
          var err = new Error((data && data.error) || serverProblem(res));
          err.status = res.status;
          throw err;
        }
        return data;
      });
    });
  }

  function api(action, opts) {
    opts = opts || {};
    var ended = "Your session has ended. Please log in again — your unpublished changes are kept.";
    if (!S.sb) {
      return apiCall(action, opts, null).catch(function (err) {
        if (err.status === 401 && action !== "login") showLogin(ended);
        throw err;
      });
    }
    // Supabase mode: send the login token; if it has just expired, renew it once and retry.
    return sbToken().then(function (t) {
      if (!t && action !== "session") { showSbLogin(ended); throw Object.assign(new Error(ended), { status: 401 }); }
      return apiCall(action, opts, t).catch(function (err) {
        if (err.status !== 401 || action === "session") throw err;
        return sbRefresh().then(function (t2) {
          if (!t2) throw err;
          return apiCall(action, opts, t2);
        }).catch(function (e2) {
          if (e2.status === 401 || e2 === err) showSbLogin(ended);
          throw e2;
        });
      });
    });
  }

  /* ================================================================ Supabase login */

  var AUTH_KEY = "pct-admin-auth";
  function sbStore(v) {
    try {
      if (v === undefined) return JSON.parse(localStorage.getItem(AUTH_KEY) || "null");
      if (v === null) localStorage.removeItem(AUTH_KEY);
      else localStorage.setItem(AUTH_KEY, JSON.stringify(v));
    } catch (e) { return null; }
    return v;
  }
  function sbSave(d) {
    var saved = { access_token: d.access_token, refresh_token: d.refresh_token, expires_at: d.expires_at || Math.floor(Date.now() / 1000) + Number(d.expires_in || 3600), email: (d.user && d.user.email) || d.email || (sbStore() || {}).email || "" };
    sbStore(saved);
    return saved;
  }
  function friendlyAuth(msg) {
    msg = String(msg || "");
    if (/invalid login credentials|invalid grant/i.test(msg)) return "That email or password isn't right.";
    if (/email not confirmed/i.test(msg)) return "Please confirm your email address first — check your inbox for the confirmation link.";
    if (/rate limit|too many/i.test(msg)) return "Too many tries. Please wait a few minutes and try again.";
    if (/password should be|weak password|at least/i.test(msg)) return "Please choose a longer password (at least 8 characters, ideally 12+).";
    if (/expired|invalid.*(otp|link|token)/i.test(msg)) return "That email link has expired or was already used. Use “Forgot password?” to get a new one.";
    return msg || "Something went wrong. Please try again.";
  }
  /** Talks to Supabase Auth directly (login, password reset). */
  function sbAuth(path, opts) {
    opts = opts || {};
    var headers = { apikey: S.sb.key, "Content-Type": "application/json" };
    if (opts.token) headers.Authorization = "Bearer " + opts.token;
    return fetch(S.sb.url + "/auth/v1/" + path, { method: opts.method || "POST", headers: headers, body: opts.body ? JSON.stringify(opts.body) : undefined })
      .catch(function () { throw new Error("Couldn't reach Supabase. Check your internet connection. If the Supabase project is paused (free plan), restore it at supabase.com."); })
      .then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (d) {
          if (!res.ok) { var e = new Error(friendlyAuth(d.error_description || d.msg || d.message || d.error)); e.status = res.status; throw e; }
          return d;
        });
      });
  }
  var refreshing = null;
  function sbRefresh() {
    var cur = sbStore();
    if (!cur || !cur.refresh_token) return Promise.resolve(null);
    refreshing = refreshing || sbAuth("token?grant_type=refresh_token", { body: { refresh_token: cur.refresh_token } })
      .then(function (d) { return sbSave(d).access_token; })
      .catch(function () { sbStore(null); return null; })
      .finally(function () { refreshing = null; });
    return refreshing;
  }
  function sbToken() {
    var cur = sbStore();
    if (!cur || !cur.access_token) return Promise.resolve(null);
    if (cur.expires_at * 1000 - 60000 > Date.now()) return Promise.resolve(cur.access_token);
    return sbRefresh();
  }
  /** Tokens arriving from an email link (#access_token=…&type=recovery|invite|signup|magiclink, or #error=…). */
  function readAuthHash() {
    var hash = location.hash.slice(1);
    if (!/(^|&)(access_token|error_description|error)=/.test(hash)) return null;
    var p = new URLSearchParams(hash);
    history.replaceState(null, "", location.pathname + location.search);
    if (p.get("error") || p.get("error_description")) return { error: friendlyAuth((p.get("error_description") || p.get("error") || "").replace(/\+/g, " ")) };
    sbSave({ access_token: p.get("access_token"), refresh_token: p.get("refresh_token"), expires_in: p.get("expires_in") || 3600, expires_at: Number(p.get("expires_at")) || 0 });
    return { type: p.get("type") || "" };
  }
  function doLogout(message) {
    if (!S.sb) { api("logout", { body: {} }).finally(function () { showLogin(message || ""); }); return; }
    var cur = sbStore();
    sbStore(null);
    (cur && cur.access_token ? sbAuth("logout", { token: cur.access_token }) : Promise.resolve()).catch(function () {}).finally(function () { showSbLogin(message || ""); });
  }

  function card(children) {
    app.className = "login";
    app.replaceChildren(h("div", { class: "login-card" },
      h("div", { class: "login-brand" }, h("img", { src: "/assets/img/favicon.svg", alt: "" }), "Prospecting Call Tracker"),
      children, versionLine()));
  }

  function showSbLogin(message, isInfo) {
    var note = h("p", { class: "banner " + (isInfo ? "banner-ok" : "banner-error"), role: isInfo ? "status" : "alert", hidden: !message, text: message || "" });
    var email = h("input", { type: "email", id: "email", autocomplete: "username", required: true, value: (sbStore() || {}).email || "" });
    var pw = h("input", { type: "password", id: "pw", autocomplete: "current-password", required: true });
    var btn = h("button", { class: "b b-primary", type: "submit", text: "Log in" });
    function say(text, ok) { note.textContent = text; note.className = "banner " + (ok ? "banner-ok" : "banner-error"); note.setAttribute("role", ok ? "status" : "alert"); note.hidden = false; }
    var forgot = h("button", { class: "b b-ghost b-sm", type: "button", text: "Forgot password?", onclick: function () {
      if (!email.value.trim()) { say("Type your email address first, then click “Forgot password?” again."); email.focus(); return; }
      forgot.disabled = true;
      sbAuth("recover?redirect_to=" + encodeURIComponent(location.origin + "/admin"), { body: { email: email.value.trim() } })
        .then(function () { say("If " + email.value.trim() + " has an editor account, we've emailed a link to set a new password. It can take a minute — check spam too.", true); })
        .catch(function (x) { say(x.message); })
        .finally(function () { forgot.disabled = false; });
    } });
    var form = h("form", { onsubmit: function (e) {
      e.preventDefault();
      btn.disabled = true; btn.textContent = "Logging in…"; note.hidden = true;
      sbAuth("token?grant_type=password", { body: { email: email.value.trim(), password: pw.value } }).then(function (d) {
        sbSave(d); pw.value = ""; start();
      }).catch(function (x) { say(x.message); btn.disabled = false; btn.textContent = "Log in"; pw.select(); });
    } },
      note,
      h("div", { class: "field" }, h("label", { for: "email", text: "Email" }), email),
      h("div", { class: "field" }, h("label", { for: "pw", text: "Password" }), pw),
      btn,
      h("div", { class: "row" }, forgot));
    card([h("h1", { text: "Website editor" }), h("p", { class: "hint", text: "Log in with the email address your account was created with." }), form]);
    (email.value ? pw : email).focus();
  }

  function showSetPassword(kind) {
    var note = h("p", { class: "banner banner-error", role: "alert", hidden: true });
    var pw = h("input", { type: "password", id: "pw-new", autocomplete: "new-password", required: true, minlength: "8" });
    var pw2 = h("input", { type: "password", id: "pw-new2", autocomplete: "new-password", required: true, minlength: "8" });
    var btn = h("button", { class: "b b-primary", type: "submit", text: "Save password and continue" });
    var form = h("form", { onsubmit: function (e) {
      e.preventDefault();
      note.hidden = true;
      if (pw.value.length < 8) { note.textContent = "Please use at least 8 characters (12 or more is better)."; note.hidden = false; return; }
      if (pw.value !== pw2.value) { note.textContent = "The two passwords don't match."; note.hidden = false; return; }
      btn.disabled = true; btn.textContent = "Saving…";
      sbToken().then(function (t) {
        if (!t) throw new Error("That email link has expired. Use “Forgot password?” to get a new one.");
        return sbAuth("user", { method: "PUT", token: t, body: { password: pw.value } });
      }).then(function (d) {
        var cur = sbStore() || {}; cur.email = d.email || cur.email; sbStore(cur);
        toast("Password saved.", "ok"); start();
      }).catch(function (x) { note.textContent = x.message; note.hidden = false; btn.disabled = false; btn.textContent = "Save password and continue"; });
    } },
      note,
      h("div", { class: "field" }, h("label", { for: "pw-new", text: "New password" }), h("p", { class: "hint", text: "At least 8 characters. A short sentence is easy to remember and hard to guess." }), pw),
      h("div", { class: "field" }, h("label", { for: "pw-new2", text: "Type it again" }), pw2),
      btn);
    card([h("h1", { text: kind === "invite" ? "Welcome! Choose your password" : "Choose a new password" }), form]);
    pw.focus();
  }

  /** Explains a response that isn't from the editor's server (a Vercel error page) in plain English. */
  function serverProblem(res) {
    var code = res.headers.get("x-vercel-error") || "";
    if (res.status === 404) return "The editor's server part isn't on this deployment (" + (code || "404") + "). The live deployment is probably older than the editor: in Vercel → Deployments, redeploy the newest commit to Production.";
    if (code === "FUNCTION_INVOCATION_TIMEOUT" || res.status === 504) return "The editor's server took too long to answer (" + (code || res.status) + "). Please try again.";
    if (/^FUNCTION_|^NO_RESPONSE/.test(code) || res.status >= 500) return "The editor's server hit an error (" + (code || res.status) + "). In Vercel → your project → Logs, look for “[website editor]” to see why, or try again in a minute.";
    if (res.status === 401 || res.status === 403) return "Vercel blocked the request (" + (code || res.status) + "). If Deployment Protection is on for this address, turn it off for Production in Vercel → Settings → Deployment Protection.";
    return "Something went wrong (" + (code || res.status) + "). Please try again.";
  }

  /* ================================================================ dirty state and drafts */

  var draftTimer = null;
  function changed() {
    updateStatus();
    clearTimeout(draftTimer);
    draftTimer = setTimeout(function () {
      var json = JSON.stringify(S.site);
      try {
        if (json !== S.saved) localStorage.setItem(DRAFT_KEY, JSON.stringify({ sha: S.sha, json: json, at: Date.now() }));
        else localStorage.removeItem(DRAFT_KEY);
      } catch (e) { /* storage full or blocked: drafts are a convenience only */ }
      updateCounts();
    }, 400);
  }
  function isDirty() { return S.site && JSON.stringify(S.site) !== S.saved; }
  function updateStatus() {
    var pill = document.getElementById("status");
    var pub = document.getElementById("publish");
    if (!pill) return;
    var dirty = isDirty();
    if (pub) pub.disabled = !dirty;
    if (dirty) { pill.className = "status dirty"; pill.textContent = "Unpublished changes"; return; }
    if (S.publishing === "pending") { pill.className = "status busy"; pill.textContent = "Publishing… (about a minute)"; return; }
    if (S.publishing === "live") { pill.className = "status live"; pill.textContent = "Live ✓"; return; }
    if (S.publishing === "failed") { pill.className = "status failed"; pill.textContent = "Website build failed"; return; }
    pill.className = "status"; pill.textContent = "All changes published";
  }
  window.addEventListener("beforeunload", function (e) {
    if (isDirty()) { e.preventDefault(); e.returnValue = ""; }
  });

  /* ================================================================ login */

  function showLogin(message, configured) {
    var err = h("p", { class: "banner banner-error", role: "alert", hidden: !message, text: message || "" });
    var pw = h("input", { type: "password", id: "pw", autocomplete: "current-password", required: true });
    var btn = h("button", { class: "b b-primary", type: "submit", text: "Log in" });
    var missing = configured ? [["password", "ADMIN_PASSWORD"], ["token", "GITHUB_TOKEN"], ["repo", "GITHUB_REPO"]].filter(function (x) { return !configured[x[0]]; }).map(function (x) { return x[1]; }) : [];
    var setup = missing.length
      ? h("div", { class: "banner banner-warn" },
          h("p", null, "The editor isn't set up yet. This " + (S.deployment ? S.deployment + " " : "") + "deployment can't see " + (missing.length > 1 ? "these settings:" : "this setting:")),
          h("ul", null, missing.map(function (m) { return h("li", null, h("b", { text: m })); })),
          h("p", null, "In Vercel → your project → Settings → Environment Variables, add " + (missing.length > 1 ? "them" : "it") + " with ", h("b", { text: "Production" }), " ticked, then redeploy to Production. The README explains each step."))
      : null;
    var form = h("form", {
      onsubmit: function (e) {
        e.preventDefault();
        btn.disabled = true; btn.textContent = "Logging in…"; err.hidden = true;
        api("login", { body: { password: pw.value } }).then(function () { pw.value = ""; start(); }).catch(function (x) {
          err.textContent = x.message; err.hidden = false; btn.disabled = false; btn.textContent = "Log in"; pw.select();
        });
      },
    }, err, h("div", { class: "field" }, h("label", { for: "pw", text: "Password" }), pw), btn);
    app.className = "login";
    app.replaceChildren(h("div", { class: "login-card" },
      h("div", { class: "login-brand" }, h("img", { src: "/assets/img/favicon.svg", alt: "" }), "Prospecting Call Tracker"),
      h("h1", { text: "Website editor" }),
      h("p", { class: "hint", text: "Change any text, price, link, photo or color on your website, then publish." }),
      setup, form, versionLine()));
    pw.focus();
  }

  function showDirectus(url) {
    app.className = "login";
    app.replaceChildren(h("div", { class: "login-card" },
      h("div", { class: "login-brand" }, h("img", { src: "/assets/img/favicon.svg", alt: "" }), "Prospecting Call Tracker"),
      h("h1", { text: "This website is edited in Directus" }),
      h("p", { text: "Your content now lives in Directus. Make your changes there; the website rebuilds automatically about a minute after you save." }),
      h("a", { class: "b b-primary", href: url + "/admin", text: "Open Directus →" })));
  }

  /* ================================================================ boot */

  function boot() {
    api("session").then(function (s) {
      S.repo = s.repo; S.branch = s.branch; S.deployment = s.deployment || ""; S.version = s.version || "";
      if (s.mode === "supabase") {
        S.sb = { url: s.supabaseUrl, key: s.supabaseKey };
        var link = readAuthHash();
        if (link && link.error) return showSbLogin(link.error);
        if (link && /recovery|invite/.test(link.type)) return showSetPassword(link.type);
        return sbToken().then(function (t) { if (t) start(); else showSbLogin(""); });
      }
      if (s.directus) return showDirectus(s.directus);
      if (s.loggedIn) start();
      else showLogin("", s.configured);
    }).catch(function (e) {
      showProblem("The editor couldn't start.", e.message, false);
    });
  }

  function start() {
    app.className = "boot";
    app.textContent = "Loading your website content…";
    api("content").then(function (d) {
      if (!d.content) {
        showProblem("Your website content file has a formatting mistake, so the editor can't open it.", d.error || "");
        return;
      }
      ensureIntegrations(d.content);
      S.site = d.content; S.sha = d.sha; S.saved = JSON.stringify(d.content);
      shell();
      var draft = null;
      try { draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null"); } catch (e) { draft = null; }
      if (draft && draft.json && draft.json !== S.saved) offerDraft(draft);
      go(firstSection());
      // Quietly confirm publishing will work (e.g. a read-only token), and warn now rather than at Publish time.
      api("check").then(function (r) {
        var bad = r.steps.filter(function (x) { return !x.ok; });
        if (!bad.length) return;
        document.getElementById("notices").appendChild(h("div", { class: "banner banner-error", role: "alert" },
          h("p", null, h("b", { text: "Heads up: " }), bad[0].fix || "Check failed: " + bad[0].name + ".")));
      }).catch(function () { /* the check is a convenience only */ });
    }).catch(function (e) {
      if (e.status !== 401) showProblem("You're logged in, but the editor couldn't load your website content.", e.message, e.status !== 403);
    });
  }

  /** Friendly error screen with a step-by-step connection check and a "Try again" button. */
  function showProblem(title, detail, runCheck) {
    var steps = h("div", { class: "check-list", "aria-live": "polite" }, runCheck ? h("p", { class: "hint", text: "Running a connection check…" }) : null);
    app.className = "login";
    app.replaceChildren(h("div", { class: "login-card wide" },
      h("div", { class: "login-brand" }, h("img", { src: "/assets/img/favicon.svg", alt: "" }), "Prospecting Call Tracker"),
      h("h1", { text: "Almost there" }),
      h("p", { text: title }),
      detail ? h("p", { class: "banner banner-error", role: "alert", text: detail }) : null,
      steps,
      h("div", { class: "row" },
        h("button", { class: "b b-primary", type: "button", text: "Try again", onclick: function () { start(); } }),
        h("button", { class: "b", type: "button", text: "Log out", onclick: function () { doLogout(""); } })),
      versionLine()));
    if (!runCheck) return;
    api("check").then(function (r) {
      steps.replaceChildren(h("h2", { text: "Connection check" }), h("ul", { class: "checks" }, r.steps.map(function (x) {
        return h("li", { class: x.ok ? "ok" : "bad" }, h("span", { class: "check-mark", "aria-hidden": "true", text: x.ok ? "✓" : "✕" }), h("div", null,
          h("b", { text: x.name }), h("span", { class: "sr-only", text: x.ok ? " — OK" : " — needs fixing" }), x.fix && x.fix !== detail ? h("p", { class: "hint", text: x.fix }) : null));
      })));
    }).catch(function (x) { steps.replaceChildren(h("p", { class: "hint", text: "Connection check couldn't run: " + x.message })); });
  }

  function versionLine() {
    var bits = [S.version ? "Version " + S.version : "", S.deployment || ""].filter(Boolean);
    return bits.length ? h("p", { class: "version", text: bits.join(" · ") }) : null;
  }
  function firstSection() { return location.hash.length > 1 ? decodeURIComponent(location.hash.slice(1)) : "todo"; }

  function offerDraft(draft) {
    var stale = draft.sha !== S.sha;
    var bar = h("div", { class: "banner banner-warn", role: "status" },
      h("p", null, h("b", { text: "You have unpublished changes from " + fmtDate(draft.at) + "." }), stale ? " The live website was changed since then; restoring will replace those newer changes." : ""),
      h("div", { class: "row" },
        h("button", { class: "b b-primary b-sm", type: "button", text: "Restore my changes", onclick: function () {
          try { S.site = JSON.parse(draft.json); } catch (e) { return; }
          bar.remove(); changed(); render(); toast("Your changes are back. Click Publish when you're ready.", "ok");
        } }),
        h("button", { class: "b b-sm", type: "button", text: "Discard them", onclick: function () {
          try { localStorage.removeItem(DRAFT_KEY); } catch (e) { /* ignore */ }
          bar.remove();
        } })));
    document.getElementById("notices").appendChild(bar);
  }

  /* ================================================================ shell */

  function shell() {
    app.className = "app";
    var publish = h("button", { id: "publish", class: "b b-primary", type: "button", text: "Publish changes", disabled: true, onclick: openPublish });
    var menuBtn = h("button", { class: "b b-dark menu-btn", type: "button", "aria-expanded": "false", "aria-controls": "sidebar", text: "☰ Sections", onclick: function () {
      S.sideOpen = !S.sideOpen; side.classList.toggle("open", S.sideOpen); menuBtn.setAttribute("aria-expanded", String(S.sideOpen));
    } });
    var side = h("nav", { class: "sidebar", id: "sidebar", "aria-label": "Editor sections" });
    app.replaceChildren(
      h("header", { class: "topbar" },
        menuBtn,
        h("a", { class: "topbar-brand", href: "/admin" }, h("img", { src: "/assets/img/favicon.svg", alt: "" }), "Website editor", h("small", { text: S.sb ? "· " + ((sbStore() || {}).email || "") : S.repo ? "· " + S.repo : "" })),
        h("span", { id: "status", class: "status", role: "status", text: "All changes published" }),
        h("a", { class: "b b-dark", href: "/", target: "_blank", rel: "noopener", text: "View website ↗" }),
        publish,
        h("button", { class: "b b-dark", type: "button", text: "Log out", onclick: function () {
          if (isDirty() && !confirm("You have unpublished changes. They'll be kept on this computer as a draft. Log out?")) return;
          doLogout("You're logged out.");
        } })),
      h("div", { class: "layout" }, side, h("main", { class: "main", id: "main", tabindex: "-1" }, h("div", { class: "main-inner" }, h("div", { id: "notices" }), h("div", { id: "view" })))));
    buildSidebar();
    document.addEventListener("keydown", function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); if (isDirty()) openPublish(); }
    });
    window.addEventListener("hashchange", function () { var s = firstSection(); if (s !== S.section) go(s); });
  }

  function sections() {
    var list = [{ group: "Start here" }, { id: "todo", label: "To-do: needs your info", count: true }];
    list.push({ group: "Pages" });
    PAGES.forEach(function (p) { if (S.site.pages && S.site.pages[p[0]]) list.push({ id: "page:" + p[0], label: p[1] }); });
    list.push({ id: "custom", label: "Extra pages (+ add a page)" });
    list.push({ group: "Whole website" });
    SITEWIDE.forEach(function (s) { if (s.keys.some(function (k) { return S.site[k] !== undefined; })) list.push(s); });
    if (otherKeys().length) list.push({ id: "other", label: "Other settings" });
    list.push({ group: "Tools" }, { id: "library", label: "Media library (images & files)" }, { id: "history", label: "History & undo" });
    return list;
  }
  function otherKeys() {
    var used = {};
    SITEWIDE.forEach(function (s) { s.keys.forEach(function (k) { used[k] = 1; }); });
    return Object.keys(S.site).filter(function (k) { return !used[k] && !HIDDEN_TOP[k]; });
  }

  function buildSidebar() {
    var side = document.getElementById("sidebar");
    var nodes = [h("button", { class: "b b-sm side-close", type: "button", text: "✕ Close", onclick: closeSide })];
    var ul = null;
    sections().forEach(function (s) {
      if (s.group) {
        ul = h("ul", { class: "side-list" });
        nodes.push(h("div", { class: "side-group" }, h("p", { class: "side-h", text: s.group }), ul));
        return;
      }
      ul.appendChild(h("li", null, h("button", { class: "side-link", type: "button", "data-section": s.id, onclick: function () { go(s.id); } },
        h("span", { text: s.label }), s.count ? h("span", { class: "count", id: "todo-count", text: "" }) : null)));
    });
    side.replaceChildren.apply(side, nodes);
    updateCounts();
  }
  function closeSide() {
    var side = document.getElementById("sidebar");
    var btn = document.querySelector(".menu-btn");
    if (!side || !S.sideOpen) return;
    S.sideOpen = false; side.classList.remove("open");
    if (btn) { btn.setAttribute("aria-expanded", "false"); btn.focus(); }
  }
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeSide(); });

  function updateCounts() {
    var c = document.getElementById("todo-count");
    if (!c || !S.site) return;
    var n = todoList().length;
    c.textContent = n ? String(n) : "✓";
    c.className = "count" + (n ? "" : " zero");
  }

  function go(id) {
    S.section = id;
    if (location.hash.slice(1) !== encodeURIComponent(id)) history.replaceState(null, "", "#" + encodeURIComponent(id));
    document.querySelectorAll(".side-link").forEach(function (b) { b.setAttribute("aria-current", b.getAttribute("data-section") === id ? "true" : "false"); });
    closeSide();
    render();
    var main = document.getElementById("main");
    if (main) { main.scrollTop = 0; }
  }

  /* ================================================================ views */

  function render() {
    var view = document.getElementById("view");
    if (!view) return;
    var id = S.section;
    var out;
    if (id === "todo") out = todoView();
    else if (id === "library") out = libraryView();
    else if (id === "history") out = historyView();
    else if (id === "custom") out = customView();
    else if (id === "integrations") out = integrationsView();
    else if (id === "other") out = keysView("Other settings", "Small settings that don't belong anywhere else.", otherKeys());
    else if (id.indexOf("page:") === 0) out = pageView(id.slice(5));
    else {
      var s = SITEWIDE.filter(function (x) { return x.id === id; })[0];
      out = s ? keysView(s.label, s.intro, s.keys) : todoView();
    }
    view.replaceChildren(out);
    updateStatus();
  }

  /* ================================================================ integrations */

  // Same shape as templates/integrations.mjs → INTEGRATION_DEFAULTS.
  var INTEGRATION_DEFAULTS = {
    _help: "Connect outside services. Switch one on, fill in its details, then publish. Nothing loads on the website for services that are switched off.",
    stripe: { enabled: false, buttonLabel: "Pay now", note: "Secure checkout by Stripe" },
    chat: { enabled: false, provider: "tawk", tawkPropertyId: "", tawkWidgetId: "default", crispWebsiteId: "", tidioPublicKey: "", intercomAppId: "", hubspotPortalId: "" },
    calendly: { enabled: false, url: "", title: "Prefer to pick a time yourself?", text: "Choose a time below — it's added to our calendar instantly." },
    metaPixel: { enabled: false, pixelId: "" },
    clarity: { enabled: false, projectId: "" },
    webhooks: { enabled: false, urls: [] },
  };
  function ensureIntegrations(site) {
    site.integrations = site.integrations || {};
    Object.keys(INTEGRATION_DEFAULTS).forEach(function (k) {
      var d = INTEGRATION_DEFAULTS[k];
      if (typeof d !== "object") { if (site.integrations[k] === undefined) site.integrations[k] = d; return; }
      site.integrations[k] = Object.assign(clone(d), site.integrations[k] || {});
    });
    site.analytics = site.analytics || { googleAnalyticsId: "", plausibleDomain: "", plausibleScript: "https://plausible.io/js/script.js" };
  }

  var CHAT = {
    tawk: { label: "Tawk.to", note: "Free live chat, with an optional AI assistant.", fields: { tawkPropertyId: /^[a-f0-9]{16,32}$/i, tawkWidgetId: /^[a-z0-9]{1,32}$/i },
      help: "In tawk.to: Administration (gear icon) → Channels → Chat Widget. The widget code contains https://embed.tawk.to/PROPERTY_ID/WIDGET_ID — copy the two parts into the boxes above.", link: "https://www.tawk.to" },
    crisp: { label: "Crisp", note: "Live chat with a chatbot and shared inbox.", fields: { crispWebsiteId: /^[a-f0-9-]{36}$/i },
      help: "In Crisp: Settings → Workspace settings → Setup & integrations → copy the Website ID (looks like 1a2b3c4d-…).", link: "https://crisp.chat" },
    tidio: { label: "Tidio", note: "Live chat with the Lyro AI chatbot.", fields: { tidioPublicKey: /^[a-z0-9]{20,40}$/i },
      help: "In Tidio: Settings → Developer → copy the Public key.", link: "https://www.tidio.com" },
    intercom: { label: "Intercom", note: "Messenger with the Fin AI agent.", fields: { intercomAppId: /^[a-z0-9]{6,12}$/i },
      help: "In Intercom: Settings → Installation → Web → your App ID (shown as app_id in the code, e.g. abc12345).", link: "https://www.intercom.com" },
    hubspot: { label: "HubSpot", note: "HubSpot chat, plus visitor tracking for your HubSpot CRM.", fields: { hubspotPortalId: /^\d{4,12}$/ },
      help: "In HubSpot: Settings → Tracking & Analytics → Tracking code. Copy the number in js.hs-scripts.com/NUMBER.js (your Hub ID).", link: "https://www.hubspot.com" },
  };
  var RE = { metaPixel: /^\d{10,20}$/, clarity: /^[a-z0-9]{6,20}$/i, calendly: /^https:\/\/calendly\.com\/[A-Za-z0-9_\-/]+$/, https: /^https:\/\/\S+$/, ga: /^G-[A-Z0-9]+$/i };

  /** "on" (switched on and filled in), "needs" (switched on, details missing or wrong) or "off". */
  function integrationState(key) {
    var i = S.site.integrations, a = S.site.analytics || {};
    var v = function (x) { return String(x || "").trim(); };
    switch (key) {
      case "stripe": return !i.stripe.enabled ? "off" : (S.site.pages.pricing.plans || []).some(function (p) { return RE.https.test(v(p.paymentLink)); }) ? "on" : "needs";
      case "chat": {
        if (!i.chat.enabled) return "off";
        var p = CHAT[i.chat.provider];
        return p && Object.keys(p.fields).every(function (f) { return p.fields[f].test(v(i.chat[f])); }) ? "on" : "needs";
      }
      case "calendly": return !i.calendly.enabled ? "off" : RE.calendly.test(v(i.calendly.url)) ? "on" : "needs";
      case "metaPixel": return !i.metaPixel.enabled ? "off" : RE.metaPixel.test(v(i.metaPixel.pixelId)) ? "on" : "needs";
      case "clarity": return !i.clarity.enabled ? "off" : RE.clarity.test(v(i.clarity.projectId)) ? "on" : "needs";
      case "webhooks": {
        if (!i.webhooks.enabled) return "off";
        var urls = (i.webhooks.urls || []).map(v).filter(Boolean);
        return urls.length && urls.every(function (u) { return RE.https.test(u); }) ? "on" : "needs";
      }
      case "ga": return v(a.googleAnalyticsId) ? (RE.ga.test(v(a.googleAnalyticsId)) ? "on" : "needs") : "off";
      case "plausible": return v(a.plausibleDomain) ? "on" : "off";
    }
    return "off";
  }
  var STATE_TEXT = { on: "Connected", needs: "Needs details", off: "Off" };

  function integrationsView() {
    ensureIntegrations(S.site);
    var i = S.site.integrations;
    var wrap = h("div", { class: "integrations" }, head("Integrations", "Connect payments, live chat, booking, tracking and other apps. Switch one on, fill in its details, then click Publish — it's on your website about a minute later."));
    wrap.appendChild(h("p", { class: "help", text: "Good to know: chat and tracking tools (Meta Pixel, Clarity, Google Analytics, HubSpot) collect visitor information. Mention the ones you use in your Privacy Policy (Pages → Privacy Policy)." }));

    function cardFor(key, title, desc, buildBody, link) {
      var pill = h("span", { class: "int-state", "data-int": key });
      var body = h("div", { class: "panel-body" });
      var ps = "int:" + key;
      var d = h("details", { class: "panel int-card", open: S.open[ps] !== undefined ? S.open[ps] : integrationState(key) !== "off" },
        h("summary", null, h("span", { class: "int-title" }, h("b", { text: title }), h("span", { class: "int-desc", text: desc })), pill), body);
      d.addEventListener("toggle", function () { S.open[ps] = d.open; });
      buildBody(body);
      if (link) body.appendChild(h("p", { class: "hint" }, "Don't have an account? ", h("a", { href: link, target: "_blank", rel: "noopener", text: "Sign up here ↗" })));
      return d;
    }
    var path = function () { return Array.prototype.slice.call(arguments); };

    wrap.appendChild(cardFor("stripe", "Stripe — card payments", "Let visitors pay by card from your pricing page.", function (b) {
      b.appendChild(field(path("integrations", "stripe", "enabled"), i.stripe.enabled, "enabled", i.stripe));
      b.appendChild(h("p", { class: "help", text: "How it works: in Stripe, create a Payment Link for each package (Stripe → Payment Links → New → choose the product and price → Create link) and paste it below. Visitors click “" + (i.stripe.buttonLabel || "Pay now") + "” on that pricing card and pay on Stripe's secure page — no card details ever touch your website. In the payment link's settings, under “After payment”, you can send people to your /thank-you page." }));
      var plans = S.site.pages.pricing.plans || [];
      var fs = h("fieldset", { class: "group" }, h("legend", { text: "Payment link for each pricing package (leave empty for no Pay button)" }));
      plans.forEach(function (pl, n) { fs.appendChild(field(path("pages", "pricing", "plans", n, "paymentLink"), pl.paymentLink || "", "paymentLink", pl)); fs.lastChild.querySelector("label").textContent = pl.name; });
      b.appendChild(fs);
      b.appendChild(field(path("integrations", "stripe", "buttonLabel"), i.stripe.buttonLabel, "buttonLabel", i.stripe));
      b.appendChild(field(path("integrations", "stripe", "note"), i.stripe.note, "note", i.stripe));
      b.appendChild(h("p", { class: "hint", text: "Need a pay button somewhere else? Go to Menu & buttons → Buttons, add a button and use the Stripe payment link as its Link." }));
    }, "https://dashboard.stripe.com/register"));

    wrap.appendChild(cardFor("chat", "Live chat & AI chatbot", "A chat bubble on every page so visitors can message you (or your chatbot).", function (b) {
      b.appendChild(field(path("integrations", "chat", "enabled"), i.chat.enabled, "enabled", i.chat));
      var pid = uid();
      var sel = h("select", { id: pid }, Object.keys(CHAT).map(function (k) { return h("option", { value: k, text: CHAT[k].label + " — " + CHAT[k].note, selected: k === i.chat.provider }); }));
      var holder = h("div", { class: "panel-body flush" });
      function drawProvider() {
        var p = CHAT[i.chat.provider] || CHAT.tawk;
        holder.replaceChildren();
        Object.keys(p.fields).forEach(function (f) { holder.appendChild(field(path("integrations", "chat", f), i.chat[f] || "", f, i.chat)); });
        holder.appendChild(h("p", { class: "help" }, p.help + " ", h("a", { href: p.link, target: "_blank", rel: "noopener", text: p.label + " ↗" })));
      }
      sel.addEventListener("change", function () { setAt(path("integrations", "chat", "provider"), sel.value); drawProvider(); refreshStates(); });
      b.appendChild(h("div", { class: "field" }, h("label", { for: pid, text: "Chat service" }), sel));
      b.appendChild(holder);
      drawProvider();
      b.appendChild(h("p", { class: "hint", text: "Most of these services include an AI chatbot you set up in their own dashboard (e.g. Tidio Lyro, Intercom Fin, Tawk.to AI Assist). Answer chats from their phone app." }));
    }));

    wrap.appendChild(cardFor("calendly", "Calendly — online booking", "Visitors pick a meeting time on your Book a Demo page.", function (b) {
      b.appendChild(field(path("integrations", "calendly", "enabled"), i.calendly.enabled, "enabled", i.calendly));
      b.appendChild(field(path("integrations", "calendly", "url"), i.calendly.url, "url", i.calendly));
      b.lastChild.querySelector(".hint") && (b.lastChild.querySelector(".hint").textContent = "In Calendly: open your event type → Share → copy the link, e.g. https://calendly.com/your-name/30min");
      b.appendChild(field(path("integrations", "calendly", "title"), i.calendly.title, "title", i.calendly));
      b.appendChild(field(path("integrations", "calendly", "text"), i.calendly.text, "text", i.calendly));
    }, "https://calendly.com/signup"));

    wrap.appendChild(cardFor("webhooks", "Zapier / Make — connect any app", "Send every form submission to Google Sheets, Mailchimp, Slack, a CRM and 6,000+ other apps.", function (b) {
      b.appendChild(field(path("integrations", "webhooks", "enabled"), i.webhooks.enabled, "enabled", i.webhooks));
      b.appendChild(h("p", { class: "help", text: "Zapier: create a Zap → trigger “Webhooks by Zapier” → “Catch Hook” → copy the webhook URL. Make: create a scenario → “Webhooks” → “Custom webhook” → copy the address. Paste it below. Each form submission is also sent there (name, email, phone, brokerage, message, which form, page, time). Works even before your CRM is connected." }));
      b.appendChild(h("div", { class: "field" }, h("span", { class: "label", text: "Webhook addresses" }), listEditor(path("integrations", "webhooks", "urls"), "urls", i.webhooks.urls)));
    }, "https://zapier.com/sign-up"));

    wrap.appendChild(cardFor("ga", "Google Analytics", "Visitor statistics from Google (free).", function (b) {
      b.appendChild(field(path("analytics", "googleAnalyticsId"), S.site.analytics.googleAnalyticsId || "", "googleAnalyticsId", S.site.analytics));
      b.appendChild(h("p", { class: "help", text: "In Google Analytics: Admin → Data streams → your website → copy the Measurement ID (G-…). Leave empty to switch it off." }));
    }, "https://analytics.google.com"));

    wrap.appendChild(cardFor("plausible", "Plausible Analytics", "Simple, privacy-friendly visitor statistics (paid).", function (b) {
      b.appendChild(field(path("analytics", "plausibleDomain"), S.site.analytics.plausibleDomain || "", "plausibleDomain", S.site.analytics));
      b.appendChild(h("p", { class: "help", text: "Type your domain exactly as added in Plausible, e.g. prospectingcalltracker.com. Leave empty to switch it off." }));
    }, "https://plausible.io/register"));

    wrap.appendChild(cardFor("metaPixel", "Meta (Facebook) Pixel", "Measure and retarget your Facebook & Instagram ads. Form submissions count as Leads.", function (b) {
      b.appendChild(field(path("integrations", "metaPixel", "enabled"), i.metaPixel.enabled, "enabled", i.metaPixel));
      b.appendChild(field(path("integrations", "metaPixel", "pixelId"), i.metaPixel.pixelId, "pixelId", i.metaPixel));
      b.appendChild(h("p", { class: "help", text: "In Meta Events Manager: Data sources → your Pixel → copy the long number under its name (the Pixel ID)." }));
    }, "https://business.facebook.com/events_manager"));

    wrap.appendChild(cardFor("clarity", "Microsoft Clarity", "Free heatmaps and session recordings to see how visitors use your site.", function (b) {
      b.appendChild(field(path("integrations", "clarity", "enabled"), i.clarity.enabled, "enabled", i.clarity));
      b.appendChild(field(path("integrations", "clarity", "projectId"), i.clarity.projectId, "projectId", i.clarity));
      b.appendChild(h("p", { class: "help", text: "In Clarity: your project → Settings → Overview → copy the Project ID (letters and numbers, e.g. abcd1234ef)." }));
    }, "https://clarity.microsoft.com"));

    function refreshStates() {
      wrap.querySelectorAll(".int-state").forEach(function (el) {
        var st = integrationState(el.getAttribute("data-int"));
        el.className = "int-state " + st;
        el.textContent = STATE_TEXT[st];
      });
    }
    wrap.addEventListener("input", refreshStates);
    wrap.addEventListener("change", refreshStates);
    wrap.addEventListener("click", function (e) { if (e.target.closest(".add-row, .str-tools")) setTimeout(refreshStates, 50); });
    refreshStates();
    return wrap;
  }

  function head(title, intro, extra) {
    return h("div", { class: "main-head" }, h("div", null, h("h1", { text: title }), intro ? h("p", { text: intro }) : null), extra || null);
  }

  function pageView(key) {
    var meta = PAGES.filter(function (p) { return p[0] === key; })[0] || [key, humanize(key), "/"];
    var page = S.site.pages[key];
    return h("div", null,
      head(meta[1], "Everything on the " + meta[1] + " page, from top to bottom.", h("a", { class: "b", href: meta[2], target: "_blank", rel: "noopener", text: "View this page ↗" })),
      objectPanels(["pages", key], page));
  }

  function keysView(title, intro, keys) {
    var wrap = h("div", null, head(title, intro));
    keys.forEach(function (k) {
      if (S.site[k] === undefined) return;
      var v = S.site[k];
      if (v && typeof v === "object") {
        if (keys.length === 1 && !Array.isArray(v)) wrap.appendChild(objectPanels([k], v));
        else wrap.appendChild(panel([k], k, v, true));
      } else {
        wrap.appendChild(h("div", { class: "panel panel-plain" }, field([k], v, k, S.site)));
      }
    });
    return wrap;
  }

  /** An object's simple fields in one card, then each nested object/list as its own collapsible card. */
  function objectPanels(path, obj) {
    var wrap = h("div");
    var simple = h("div", { class: "panel panel-plain" });
    var hasSimple = false;
    Object.keys(obj).forEach(function (k) {
      var v = obj[k];
      if (k === "_help") { wrap.insertBefore(h("p", { class: "help", text: v }), wrap.firstChild); return; }
      if (v && typeof v === "object") return;
      simple.appendChild(field(path.concat(k), v, k, obj));
      hasSimple = true;
    });
    if (hasSimple) wrap.appendChild(simple);
    Object.keys(obj).forEach(function (k) {
      var v = obj[k];
      if (v && typeof v === "object") wrap.appendChild(panel(path.concat(k), k, v, true));
    });
    return wrap;
  }

  function panel(path, key, value, openByDefault) {
    var ps = pathStr(path);
    var isOpen = S.open[ps] !== undefined ? S.open[ps] : !!openByDefault;
    var d = h("details", { class: "panel", "data-path": ps, open: isOpen }, h("summary", null, h("span", { text: humanize(key) }), countBadge(value)));
    d.addEventListener("toggle", function () { S.open[ps] = d.open; });
    var body = h("div", { class: "panel-body" });
    if (Array.isArray(value)) body.appendChild(listEditor(path, key, value));
    else fillObject(body, path, value);
    d.appendChild(body);
    return d;
  }
  function countBadge(value) {
    var n = 0;
    (function scan(v, k) {
      if (typeof v === "string") { if (needsInfo(k, v)) n++; }
      else if (Array.isArray(v)) v.forEach(function (x) { scan(x, ""); });
      else if (v && typeof v === "object") { if (v.placeholder === true) n++; for (var kk in v) if (kk !== "_help") scan(v[kk], kk); }
    })(value, "");
    return n ? h("span", { class: "count", title: n + " placeholder(s) to fill in", text: String(n) }) : null;
  }

  function fillObject(container, path, obj) {
    Object.keys(obj).forEach(function (k) {
      var v = obj[k];
      if (k === "_help") { container.appendChild(h("p", { class: "help", text: v })); return; }
      if (Array.isArray(v)) container.appendChild(h("div", { class: "field" }, h("span", { class: "label", text: humanize(k) }), listEditor(path.concat(k), k, v)));
      else if (v && typeof v === "object") {
        var fs = h("fieldset", { class: "group", "data-path": pathStr(path.concat(k)) }, h("legend", { text: humanize(k) }));
        fillObject(fs, path.concat(k), v);
        container.appendChild(fs);
      } else container.appendChild(field(path.concat(k), v, k, obj));
    });
  }

  /* ================================================================ fields */

  function ctaOptions() {
    return Object.keys(S.site.ctas || {}).map(function (k) { return [k, (S.site.ctas[k].label || k) + "  →  " + (S.site.ctas[k].href || "")]; });
  }
  function linkList() {
    var dl = document.getElementById("dl-links");
    var opts = PAGES.map(function (p) { return p[2]; })
      .concat((S.site.customPages || []).map(function (p) { return "/" + p.slug; }))
      .concat(Object.keys(S.site.ctas || {}).map(function (k) { return S.site.ctas[k].href; }))
      .concat(["/resources#kpi-tracker", "/software#demo-video", "mailto:", "tel:", "https://"]);
    var uniq = opts.filter(function (x, i) { return x && opts.indexOf(x) === i; });
    var fresh = h("datalist", { id: "dl-links" }, uniq.map(function (o) { return h("option", { value: o }); }));
    if (dl) dl.replaceWith(fresh); else document.body.appendChild(fresh);
  }

  function field(path, value, key, parent) {
    var id = uid();
    var gp = genericPath(path);
    var parentKey = path.length > 1 ? path[path.length - 2] : "";
    var hintKey = HINTS[path.slice(-2).join(".")] ? path.slice(-2).join(".") : key;
    var hint = HINTS[hintKey];
    var counter = COUNTERS[path.slice(-2).join(".")];
    var needs = needsInfo(key, value);
    var wrap = h("div", { class: "field" + (needs ? " needs" : ""), "data-path": pathStr(path) });
    var labelText = typeof key === "number" ? humanize(singular(parentKey)) + " " + (key + 1) : humanize(key);
    var label = h("label", { for: id }, labelText, needs ? h("span", { class: "needs-badge", text: "Needs your info" }) : null);
    var hintEl = hint ? h("p", { class: "hint", id: id + "-h", text: hint }) : null;
    var described = hint ? id + "-h" : null;
    var control;

    function setNeeds(v) {
      var n = needsInfo(key, v);
      wrap.classList.toggle("needs", n);
      var b = label.querySelector(".needs-badge");
      if (n && !b) label.appendChild(h("span", { class: "needs-badge", text: "Needs your info" }));
      if (!n && b) b.remove();
    }

    if (typeof value === "boolean") {
      var cb = h("input", { type: "checkbox", id: id, checked: value, onchange: function () { setAt(path, cb.checked); } });
      return h("div", { class: "field", "data-path": pathStr(path) }, h("label", { class: "check", for: id }, cb, labelText), hintEl);
    }
    if (typeof value === "number") {
      control = h("input", { type: "number", id: id, value: String(value), oninput: function () { var n = Number(control.value); if (!isNaN(n)) setAt(path, n); } });
    } else if (key === "mockup") {
      control = h("select", { id: id, onchange: function () { setAt(path, control.value); } }, MOCKUPS.map(function (m) { return h("option", { value: m, text: humanize(m), selected: m === value }); }));
    } else if ((key === "cta" && path[0] !== "forms") || ((parentKey === "ctas" || parentKey === "heroButtons") && Array.isArray(getAt(path.slice(0, -1))))) {
      var opts = ctaOptions();
      if (value && !S.site.ctas[value]) opts.unshift([value, value + " (missing!)"]);
      control = h("select", { id: id, onchange: function () { setAt(path, control.value); } }, opts.map(function (o) { return h("option", { value: o[0], text: o[1], selected: o[0] === value }); }));
    } else if (/Color$/.test(String(key)) || key === "themeColor") {
      var txt = h("input", { type: "text", id: id, value: value, maxlength: "7", spellcheck: "false" });
      var picker = h("input", { type: "color", value: /^#[0-9a-f]{6}$/i.test(value) ? value : "#000000", "aria-label": labelText + " picker" });
      txt.addEventListener("input", function () { setAt(path, txt.value.trim()); if (/^#[0-9a-f]{6}$/i.test(txt.value.trim())) picker.value = txt.value.trim(); });
      picker.addEventListener("input", function () { txt.value = picker.value.toUpperCase(); setAt(path, txt.value); });
      add(wrap, [label, hintEl, h("div", { class: "row color-row" }, picker, txt)]);
      return wrap;
    } else if (key === "src" || key === "poster" || key === "ogImage" || (typeof value === "string" && /^\/assets\/.+\.(png|jpe?g|webp|gif|svg)$/i.test(value))) {
      return imageField(path, value, key, parent, wrap, label, hintEl, id);
    } else if (key === "kpiTrackerDownloadUrl") {
      var inp = h("input", { type: "text", id: id, value: value, oninput: function () { setAt(path, inp.value); } });
      add(wrap, [label, h("p", { class: "hint", text: "Upload a PDF or spreadsheet. Visitors get a download button after sending the KPI form." }),
        h("div", { class: "row" }, inp, h("button", { class: "b", type: "button", text: "Choose or upload file", onclick: function () {
          pickMedia("file", function (p) { inp.value = p; setAt(path, p); });
        } }))]);
      return wrap;
    } else {
      var str = String(value ?? "");
      var long = LONG_KEYS[key] || LONG_KEYS[parentKey] || str.length > 80 || str.indexOf("\n") >= 0;
      if (long) {
        control = h("textarea", { id: id, rows: String(Math.min(12, Math.max(2, Math.ceil(str.length / 85) + (str.match(/\n/g) || []).length))), value: str });
      } else {
        control = h("input", { type: "text", id: id, value: str });
        if (key === "href" || key === "url" || /Url$/.test(String(key)) || key === "endpoint") { linkList(); control.setAttribute("list", "dl-links"); control.setAttribute("spellcheck", "false"); }
      }
      var counterEl = counter ? h("span", { class: "counter" }) : null;
      var updCounter = function () { if (counterEl) { counterEl.textContent = control.value.length + " / " + counter; counterEl.classList.toggle("over", control.value.length > counter); } };
      updCounter();
      control.addEventListener("input", function () {
        setAt(path, control.value); setNeeds(control.value); updCounter();
        var item = wrap.closest(".item");
        if (item && item._refresh) item._refresh();
      });
      if (described) control.setAttribute("aria-describedby", described);
      add(wrap, [label, hintEl, control, counterEl]);
      return wrap;
    }
    if (described) control.setAttribute("aria-describedby", described);
    add(wrap, [label, hintEl, control]);
    return wrap;
  }

  function imageField(path, value, key, parent, wrap, label, hintEl, id) {
    var inp = h("input", { type: "text", id: id, value: value || "", spellcheck: "false" });
    var thumbBox = h("div");
    function drawThumb(v) {
      var src = S.previews[v] || (S.sb && String(v).indexOf("/assets/media/") === 0 ? "/api/admin?action=file&name=" + encodeURIComponent(String(v).slice(14)) : v);
      thumbBox.replaceChildren(v ? h("img", { class: "thumb", src: src, alt: "", onerror: function (e) { e.target.replaceWith(h("div", { class: "thumb thumb-empty", text: "Shows after publishing" })); } }) : h("div", { class: "thumb thumb-empty", text: "No image" }));
    }
    drawThumb(value);
    inp.addEventListener("input", function () { setAt(path, inp.value); drawThumb(inp.value); });
    function chosen(p) {
      inp.value = p; setAt(path, p); drawThumb(p);
      if (parent && parent.placeholder === true) {
        parent.placeholder = false; changed();
        var cb = document.querySelector('[data-path="' + pathStr(path.slice(0, -1).concat("placeholder")) + '"] input');
        if (cb) cb.checked = false;
      }
      if (parent && typeof parent.alt === "string") {
        toast("Image set. Now update the image description so blind visitors and Google know what it shows.", "ok", 7000);
        var alt = document.querySelector('[data-path="' + pathStr(path.slice(0, -1).concat("alt")) + '"] textarea, [data-path="' + pathStr(path.slice(0, -1).concat("alt")) + '"] input');
        if (alt) { alt.focus(); alt.select(); }
      }
    }
    add(wrap, [label, hintEl, h("div", { class: "img-field" }, thumbBox, h("div", { class: "field" }, inp,
      h("div", { class: "row" }, h("button", { class: "b", type: "button", text: "Choose or upload image", onclick: function () { pickMedia("image", chosen); } }),
        value ? h("button", { class: "b b-ghost b-sm", type: "button", text: "Remove image", onclick: function () { inp.value = ""; setAt(path, ""); drawThumb(""); } }) : null)))]);
    return wrap;
  }

  /* ================================================================ lists */

  function listEditor(path, key, arr) {
    var box = h("div", { class: "list", "data-path": pathStr(path) });
    function redraw() { var fresh = listEditor(path, key, getAt(path)); box.replaceWith(fresh); changed(); }
    function move(i, d) { var a = getAt(path); var j = i + d; if (j < 0 || j >= a.length) return; var t = a[i]; a[i] = a[j]; a[j] = t; S.open[pathStr(path.concat(j))] = true; redraw(); }
    function remove(i) {
      var a = getAt(path);
      if (!confirm("Remove “" + itemTitle(a[i], i).slice(0, 80) + "”?")) return;
      a.splice(i, 1); redraw();
    }
    function dup(i) { var a = getAt(path); a.splice(i + 1, 0, clone(a[i])); S.open[pathStr(path.concat(i + 1))] = true; redraw(); }
    arr.forEach(function (item, i) {
      var ipath = path.concat(i);
      if (item && typeof item === "object" && !Array.isArray(item)) {
        var ps = pathStr(ipath);
        var titleEl = h("span", { class: "item-title", text: itemTitle(item, i) });
        var d = h("details", { class: "item", "data-path": ps, open: !!S.open[ps] },
          h("summary", null, h("span", { class: "item-num", text: String(i + 1) }), titleEl, countBadge(item)));
        d._refresh = function () { titleEl.textContent = itemTitle(getAt(ipath), i); };
        d.addEventListener("toggle", function () { S.open[ps] = d.open; });
        var body = h("div", { class: "item-body" });
        body.appendChild(h("div", { class: "item-tools" },
          h("button", { class: "b b-sm", type: "button", text: "↑ Move up", disabled: i === 0, onclick: function () { move(i, -1); } }),
          h("button", { class: "b b-sm", type: "button", text: "↓ Move down", disabled: i === arr.length - 1, onclick: function () { move(i, 1); } }),
          h("button", { class: "b b-sm", type: "button", text: "Duplicate", onclick: function () { dup(i); } }),
          key === "customPages" && item.slug ? h("a", { class: "b b-sm", href: "/" + item.slug, target: "_blank", rel: "noopener", text: "View page ↗" }) : null,
          h("button", { class: "b b-sm b-danger", type: "button", text: "Remove", onclick: function () { remove(i); } })));
        fillObject(body, ipath, item);
        d.appendChild(body);
        box.appendChild(d);
      } else {
        var f = field(ipath, item, i, arr);
        box.appendChild(h("div", { class: "str-row" }, f, h("div", { class: "str-tools" },
          h("button", { class: "b b-sm b-ghost", type: "button", "aria-label": "Move up", title: "Move up", text: "↑", disabled: i === 0, onclick: function () { move(i, -1); } }),
          h("button", { class: "b b-sm b-ghost", type: "button", "aria-label": "Move down", title: "Move down", text: "↓", disabled: i === arr.length - 1, onclick: function () { move(i, 1); } }),
          h("button", { class: "b b-sm b-ghost b-danger", type: "button", "aria-label": "Remove", title: "Remove", text: "✕", onclick: function () { remove(i); } }))));
      }
    });
    if (!arr.length) box.appendChild(h("p", { class: "hint", text: "Nothing here yet." }));
    box.appendChild(h("div", { class: "add-row" }, h("button", { class: "b b-sm", type: "button", text: "+ Add " + singular(key), onclick: function () {
      var a = getAt(path);
      var tpl = TEMPLATES[genericPath(path)];
      var fresh;
      if (tpl) fresh = tpl();
      else if (a.length && a[a.length - 1] && typeof a[a.length - 1] === "object") fresh = blank(a[a.length - 1]);
      else if (key === "heroButtons" || key === "ctas") fresh = Object.keys(S.site.ctas)[0];
      else fresh = "";
      a.push(fresh);
      openAll(path.concat(a.length - 1), fresh);
      redraw();
      setTimeout(function () {
        var last = document.querySelector('[data-path="' + pathStr(path.concat(a.length - 1)) + '"]');
        if (last) { var inp = last.querySelector("input:not([type=checkbox]), textarea, select"); if (inp) inp.focus(); }
      }, 30);
    } })));
    return box;
  }

  /** Opens a new item and everything inside it, so the person can start typing straight away. */
  function openAll(path, v) {
    S.open[pathStr(path)] = true;
    if (v && typeof v === "object") Object.keys(v).forEach(function (k) { openAll(path.concat(Array.isArray(v) ? Number(k) : k), v[k]); });
  }

  /** A new, empty item shaped like an existing one. */
  function blank(v) {
    if (Array.isArray(v)) return [];
    if (v && typeof v === "object") { var o = {}; for (var k in v) o[k] = k === "mockup" || k === "cta" ? v[k] : blank(v[k]); return o; }
    if (typeof v === "boolean") return false;
    if (typeof v === "number") return 0;
    return "";
  }

  /* ================================================================ extra pages */

  function customView() {
    if (!Array.isArray(S.site.customPages)) S.site.customPages = [];
    var wrap = h("div", null, head("Extra pages", "Add your own pages — a guide, a landing page, a service page. Each one gets its own web address. To show one in the top menu, add a link to it under Menu & buttons → Top menu."));
    wrap.appendChild(h("div", { class: "panel panel-plain" }, listEditor(["customPages"], "customPages", S.site.customPages)));
    return wrap;
  }

  /* ================================================================ to-do */

  function todoList() {
    var out = [];
    function where(path) {
      if (path[0] === "pages") { var p = PAGES.filter(function (x) { return x[0] === path[1]; })[0]; return { section: "page:" + path[1], name: p ? p[1] : humanize(path[1]) }; }
      if (path[0] === "customPages") return { section: "custom", name: "Extra pages" };
      var s = SITEWIDE.filter(function (x) { return x.keys.indexOf(path[0]) >= 0; })[0];
      return s ? { section: s.id, name: s.label } : { section: "other", name: "Other settings" };
    }
    (function scan(v, path) {
      var key = path[path.length - 1];
      if (key === "_help" || key === "_readme") return;
      if (typeof v === "string") { if (needsInfo(key, v)) out.push({ path: path, where: where(path), value: v }); return; }
      if (Array.isArray(v)) { v.forEach(function (x, i) { scan(x, path.concat(i)); }); return; }
      if (v && typeof v === "object") {
        if (v.placeholder === true) out.push({ path: path.concat("placeholder"), where: where(path), value: "Marked as a placeholder: " + itemTitle(v, 0) });
        Object.keys(v).forEach(function (k) { scan(v[k], path.concat(k)); });
      }
    })(S.site, []);
    return out;
  }

  function describePath(path) {
    var parts = [];
    for (var i = 0; i < path.length; i++) {
      var k = path[i];
      if (i === 0 && (k === "pages" || k === "customPages")) continue;
      if (i === 1 && path[0] === "pages") continue;
      if (typeof k === "number") { parts.push("#" + (k + 1) + " “" + itemTitle(getAt(path.slice(0, i + 1)), k).slice(0, 40) + "”"); continue; }
      parts.push(k === "placeholder" ? "still a placeholder" : humanize(k));
    }
    return parts.join(" → ");
  }

  function todoView() {
    var items = todoList();
    var wrap = h("div", null, head("To-do: needs your info", "Everything on the website that's still a placeholder (shown with a yellow outline or [square brackets] on the site). Click Fix to jump straight to it."));
    if (!items.length) { wrap.appendChild(h("div", { class: "banner banner-ok" }, h("p", { text: "Nothing left to fill in. 🎉" }))); return wrap; }
    var groups = {};
    var order = [];
    items.forEach(function (it) { if (!groups[it.where.name]) { groups[it.where.name] = []; order.push(it.where.name); } groups[it.where.name].push(it); });
    order.forEach(function (name) {
      var g = groups[name];
      var card = h("div", { class: "panel todo-group" }, h("h2", { class: "panel-plain", text: name + " (" + g.length + ")" }));
      g.forEach(function (it) {
        card.appendChild(h("div", { class: "todo-item" },
          h("div", null, h("p", null, h("b", { text: describePath(it.path) })), h("p", { class: "todo-where", text: it.value ? String(it.value).slice(0, 140) : "(empty)" })),
          h("button", { class: "b b-sm b-primary", type: "button", text: "Fix", onclick: function () { reveal(it.where.section, it.path); } })));
      });
      wrap.appendChild(card);
    });
    return wrap;
  }

  function reveal(section, path) {
    for (var i = 1; i <= path.length; i++) S.open[pathStr(path.slice(0, i))] = true;
    go(section);
    setTimeout(function () {
      var el = document.querySelector('[data-path="' + pathStr(path) + '"]');
      if (!el) return;
      var p = el.parentElement;
      while (p) { if (p.tagName === "DETAILS") p.open = true; p = p.parentElement; }
      el.scrollIntoView({ block: "center" });
      el.classList.add("flash");
      var inp = el.querySelector("input, textarea, select");
      if (inp) inp.focus({ preventScroll: true });
    }, 40);
  }

  /* ================================================================ publish */

  function openPublish() {
    var msg = h("input", { type: "text", id: "pub-msg", maxlength: "120", placeholder: "e.g. Updated pricing and founder photo" });
    var err = h("div", { class: "banner banner-error", role: "alert", hidden: true });
    var go2 = h("button", { class: "b b-primary", type: "submit", text: "Publish now" });
    var dlg = h("dialog", { class: "dlg-small", "aria-labelledby": "pub-title" });
    var form = h("form", { class: "dlg", onsubmit: function (e) {
      e.preventDefault();
      go2.disabled = true; go2.textContent = "Publishing…"; err.hidden = true;
      var snapshot = JSON.stringify(S.site);
      api("save", { body: { content: S.site, sha: S.sha, message: msg.value } }).then(function (r) {
        S.sha = r.sha; S.saved = snapshot;
        try { localStorage.removeItem(DRAFT_KEY); } catch (x) { /* ignore */ }
        dlg.close(); dlg.remove();
        S.publishing = "pending"; updateStatus(); updateCounts();
        if (r.deployHookSet === false) toast("Saved — but the website won't update until VERCEL_DEPLOY_HOOK is added in Vercel (see the yellow note at the top).", "error", 12000);
        else if (r.deployTriggered === false) toast("Saved — but Vercel didn't accept the rebuild request. Check VERCEL_DEPLOY_HOOK in Vercel, or redeploy there.", "error", 12000);
        else toast("Published! Your website is rebuilding and will be live in about a minute.", "ok", 8000);
        if (r.commit) watchDeploy(r.commit, Date.now());
        else setTimeout(function () { if (S.publishing === "pending") { S.publishing = null; updateStatus(); } }, 90000);
      }).catch(function (x) {
        err.textContent = x.status === 422 ? "This change can't be published yet:\n" + x.message : x.message;
        err.hidden = false; go2.disabled = false; go2.textContent = "Publish now";
      });
    } },
      h("h2", { id: "pub-title", text: "Publish your changes" }),
      h("p", { text: "Your changes go live on the website in about a minute. Every version is saved, so you can always go back under History & undo." }),
      h("div", { class: "field" }, h("label", { for: "pub-msg", text: "What did you change? (optional, helps you find it later)" }), msg),
      err,
      h("div", { class: "dlg-actions" }, h("button", { class: "b", type: "button", text: "Cancel", onclick: function () { dlg.close(); dlg.remove(); } }), go2));
    dlg.appendChild(form);
    dlg.addEventListener("close", function () { dlg.remove(); });
    document.body.appendChild(dlg);
    dlg.showModal();
    msg.focus();
  }

  function watchDeploy(commit, started) {
    if (!commit || isDirty()) return;
    api("deploy", { query: "&sha=" + commit }).then(function (d) {
      if (d.state === "live") { S.publishing = "live"; updateStatus(); toast("Your changes are live on the website.", "ok"); return; }
      if (d.state === "failed") { S.publishing = "failed"; updateStatus(); toast("The website build failed, so the previous version is still online. Check the deployment in Vercel.", "error", 12000); return; }
      if (d.state === "unknown" || Date.now() - started > 4 * 60 * 1000) { S.publishing = null; updateStatus(); return; }
      setTimeout(function () { watchDeploy(commit, started); }, 6000);
    }).catch(function () { S.publishing = null; updateStatus(); });
  }

  /* ================================================================ history */

  function historyView() {
    var wrap = h("div", null, head("History & undo", "Every time the website content was published. Load an older version to see it in the editor, then click Publish to put it back on the website."));
    var list = h("div", { class: "panel" }, h("p", { class: "panel-plain", text: "Loading…" }));
    wrap.appendChild(list);
    api("history").then(function (d) {
      list.replaceChildren();
      if (!d.items.length) list.appendChild(h("p", { class: "panel-plain", text: "No history yet." }));
      d.items.forEach(function (c, i) {
        list.appendChild(h("div", { class: "history-item" },
          h("div", null, h("p", null, h("b", { text: c.message })), h("p", { class: "todo-where", text: fmtDate(c.date) + (c.author ? " · " + c.author : "") + (i === 0 ? " · current version" : "") })),
          h("div", { class: "row" },
            c.url ? h("a", { class: "b b-sm b-ghost", href: c.url, target: "_blank", rel: "noopener", text: "Details ↗" }) : null,
            i === 0 ? null : h("button", { class: "b b-sm", type: "button", text: "Load this version", onclick: function (e) {
              if (isDirty() && !confirm("This replaces your unpublished changes in the editor. Continue?")) return;
              e.target.disabled = true;
              api("content", { query: "&ref=" + c.sha }).then(function (r) {
                if (!r.content) throw new Error(r.error || "That version could not be read.");
                S.site = r.content; changed(); buildSidebar(); go("todo");
                toast("Loaded the version from " + fmtDate(c.date) + ". Click Publish changes to put it back on the website.", "ok", 9000);
              }).catch(function (x) { e.target.disabled = false; toast(x.message, "error"); });
            } }))));
      });
    }).catch(function (x) { list.replaceChildren(h("p", { class: "panel-plain", text: x.message })); });
    return wrap;
  }

  /* ================================================================ media */

  function loadMedia(force) {
    if (S.media && !force) return Promise.resolve(S.media);
    if (!S.sb) return api("media").then(function (d) { S.media = d.items; return S.media; });
    // Supabase mode: uploads come from Supabase storage; the site's own images from the build's list.
    var own = fetch("/admin/assets.json").then(function (r) { return r.ok ? r.json() : []; }).catch(function () { return []; });
    return Promise.all([api("media"), own]).then(function (r) {
      r[0].items.forEach(function (m) { if (m.preview) S.previews[m.path] = S.previews[m.path] || m.preview; });
      S.media = r[0].items.concat(r[1]);
      return S.media;
    });
  }
  var IMG_RE = /\.(png|jpe?g|webp|gif|svg)$/i;

  function mediaGrid(kind, onPick) {
    var grid = h("div", { class: "media-grid" }, h("p", { text: "Loading…" }));
    loadMedia().then(function (items) {
      var list = items.filter(function (m) { return kind === "image" ? IMG_RE.test(m.name) : kind === "file" ? !IMG_RE.test(m.name) : true; });
      list.sort(function (a, b) { var up = function (m) { return m.folder === "assets/uploads" || m.folder === "assets/media" ? 0 : 1; }; return up(a) - up(b); });
      grid.replaceChildren();
      if (!list.length) grid.appendChild(h("p", { class: "hint", text: "Nothing uploaded yet." }));
      list.forEach(function (m) {
        var isImg = IMG_RE.test(m.name);
        grid.appendChild(h("button", { class: "media-card", type: "button", title: m.path, onclick: function () { onPick(m.path); } },
          isImg ? h("img", { src: S.previews[m.path] || m.path, alt: "", loading: "lazy" }) : h("span", { class: "file-ic", text: m.name.split(".").pop().toUpperCase() }),
          h("span", { class: "media-name", text: m.name }), h("span", { class: "media-folder", text: m.folder.replace("assets/", "") })));
      });
    }).catch(function (x) { grid.replaceChildren(h("p", { text: x.message })); });
    return grid;
  }

  function uploadButton(kind, done) {
    var id = uid();
    var status = h("span", { class: "hint", role: "status" });
    var input = h("input", { type: "file", id: id, accept: kind === "image" ? "image/jpeg,image/png,image/webp,image/gif" : kind === "file" ? ".pdf,.xlsx,.xls,.csv,.docx" : "image/jpeg,image/png,image/webp,image/gif,.pdf,.xlsx,.xls,.csv,.docx,.mp4" });
    input.addEventListener("change", function () {
      var file = input.files && input.files[0];
      if (!file) return;
      status.textContent = "Uploading " + file.name + "…";
      prepareFile(file).then(function (prep) {
        return api("upload", { body: { name: prep.name, data: prep.data } }).then(function (r) {
          if (prep.preview) S.previews[r.path] = prep.preview;
          S.media = null;
          status.textContent = "Uploaded.";
          toast("Uploaded " + r.path.split("/").pop() + ". It appears on the website after you publish (about a minute).", "ok");
          done(r.path);
        });
      }).catch(function (x) { status.textContent = ""; toast(x.message, "error", 9000); }).finally(function () { input.value = ""; });
    });
    return h("div", { class: "row" }, h("label", { class: "b b-primary upload-label", for: id }, "⬆ Upload from your computer", input), status);
  }

  /** Shrinks big photos in the browser (max 1600 px wide) so the site stays fast, then returns base64. */
  function prepareFile(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onerror = function () { reject(new Error("The file could not be read.")); };
      reader.onload = function () {
        var dataUrl = reader.result;
        var resizable = /^image\/(jpeg|png|webp)$/.test(file.type);
        if (!resizable) {
          if (file.size > 3 * 1024 * 1024) return reject(new Error("That file is larger than 3 MB. Please make it smaller and try again."));
          return resolve({ name: file.name, data: dataUrl, preview: /^image\//.test(file.type) ? dataUrl : null });
        }
        var img = new Image();
        img.onerror = function () { reject(new Error("That image could not be opened.")); };
        img.onload = function () {
          var max = 1600;
          var scale = Math.min(1, max / img.naturalWidth);
          if (scale === 1 && file.size <= 600 * 1024) return resolve({ name: file.name, data: dataUrl, preview: dataUrl });
          var c = document.createElement("canvas");
          c.width = Math.round(img.naturalWidth * scale);
          c.height = Math.round(img.naturalHeight * scale);
          c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
          var type = file.type === "image/png" ? "image/png" : file.type;
          var out = c.toDataURL(type, 0.85);
          if (type === "image/png" && out.length > 1.4 * 1024 * 1024) { out = c.toDataURL("image/jpeg", 0.85); file = { name: file.name.replace(/\.png$/i, ".jpg") }; }
          if (out.length * 0.75 > 3 * 1024 * 1024) return reject(new Error("That image is still larger than 3 MB after shrinking. Please use a smaller one."));
          resolve({ name: file.name, data: out, preview: out });
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    });
  }

  function pickMedia(kind, onPick) {
    var dlg = h("dialog", { "aria-labelledby": "pick-title" });
    function pick(p) { dlg.close(); onPick(p); }
    var gridHolder = h("div", { class: "dlg-scroll" }, mediaGrid(kind, pick));
    dlg.appendChild(h("div", { class: "dlg" },
      h("h2", { id: "pick-title", text: kind === "file" ? "Choose a file" : "Choose an image" }),
      h("p", { class: "hint", text: kind === "file" ? "PDF or spreadsheet, up to 3 MB." : "JPG, PNG, WebP or GIF. Big photos are shrunk automatically so the site stays fast." }),
      uploadButton(kind, pick),
      gridHolder,
      h("div", { class: "dlg-actions" }, h("button", { class: "b", type: "button", text: "Cancel", onclick: function () { dlg.close(); } }))));
    dlg.addEventListener("close", function () { dlg.remove(); });
    document.body.appendChild(dlg);
    dlg.showModal();
  }

  function libraryView() {
    var wrap = h("div", null, head("Media library", "Images and files on your website. Upload here, then pick them from any image field. Click an item to copy its address."));
    var holder = h("div", { class: "panel panel-plain" });
    function draw() {
      holder.replaceChildren(uploadButton("any", function () { draw(); }), mediaGrid("any", function (p) {
        var full = location.origin + p;
        (navigator.clipboard ? navigator.clipboard.writeText(p) : Promise.reject()).then(function () { toast("Copied " + p, "ok"); }).catch(function () { prompt("Copy this address:", full); });
      }));
    }
    draw();
    wrap.appendChild(holder);
    return wrap;
  }

  boot();
})();
