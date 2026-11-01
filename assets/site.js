/* Prospecting Call Tracker website — the only script on the site.
 * Mobile menu, call-to-action tracking, form validation + submission, and optional analytics.
 * No inline scripts or event-handler attributes anywhere (the Content-Security-Policy forbids them).
 */
(function () {
  "use strict";

  var cfgEl = document.getElementById("site-config");
  var CFG = {};
  try { CFG = JSON.parse(cfgEl ? cfgEl.textContent : "{}"); } catch (e) { CFG = {}; }
  var A = CFG.analytics || {};

  /* ------------------------------------------------------------ analytics (nothing loads unless configured) */

  window.dataLayer = window.dataLayer || [];
  function loadScript(src, attrs) {
    var s = document.createElement("script");
    s.async = true;
    s.src = src;
    if (attrs) Object.keys(attrs).forEach(function (k) { s.setAttribute(k, attrs[k]); });
    document.head.appendChild(s);
  }
  if (A.ga && /^G-[A-Z0-9]+$/i.test(A.ga)) {
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", A.ga);
    loadScript("https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(A.ga));
  }
  if (A.plausibleDomain && A.plausibleScript) {
    window.plausible = window.plausible || function () { (window.plausible.q = window.plausible.q || []).push(arguments); };
    loadScript(A.plausibleScript, { "data-domain": A.plausibleDomain });
  }

  /** Records an event: always to window.dataLayer; to Google Analytics / Plausible only when they are configured. */
  function track(event, props) {
    props = props || {};
    props.page = props.page || location.pathname;
    window.dataLayer.push(Object.assign({ event: event }, props));
    if (typeof window.gtag === "function" && A.ga) window.gtag("event", event, props);
    if (typeof window.plausible === "function" && A.plausibleDomain) window.plausible(event, { props: props });
  }
  window.pctTrack = track;

  /* ------------------------------------------------------------ mobile menu */

  var toggle = document.querySelector(".menu-toggle");
  var menu = document.getElementById("mobile-menu");
  function setMenu(open, returnFocus) {
    if (!toggle || !menu) return;
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    menu.hidden = !open;
    document.documentElement.classList.toggle("menu-open", open);
    if (open) {
      var first = menu.querySelector("a");
      if (first) first.focus();
    } else if (returnFocus) {
      toggle.focus();
    }
  }
  if (toggle && menu) {
    toggle.addEventListener("click", function () { setMenu(toggle.getAttribute("aria-expanded") !== "true", true); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") { e.preventDefault(); setMenu(false, true); }
    });
    // Keep keyboard focus inside the open menu (toggle + menu links).
    document.addEventListener("focusin", function (e) {
      if (toggle.getAttribute("aria-expanded") !== "true") return;
      if (!menu.contains(e.target) && e.target !== toggle) setMenu(false, false);
    });
    menu.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false, false); });
    window.addEventListener("resize", function () { if (window.innerWidth >= 1180 && toggle.getAttribute("aria-expanded") === "true") setMenu(false, false); });
  }

  /* ------------------------------------------------------------ call-to-action clicks */

  document.addEventListener("click", function (e) {
    var a = e.target.closest ? e.target.closest("[data-cta]") : null;
    if (!a) return;
    var label = a.getAttribute("data-cta");
    track("cta_click", { label: label, page: location.pathname, href: a.getAttribute("href") || "" });
    try { sessionStorage.setItem("pct_cta", label); } catch (err) { /* private mode */ }
  });

  /* ------------------------------------------------------------ forms */

  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var types = CFG.requestTypes || {};

  function lastCta() { try { return sessionStorage.getItem("pct_cta") || ""; } catch (e) { return ""; } }

  function setupForm(form) {
    var typeSel = form.querySelector('select[name="requestType"]');
    var ctaInput = form.querySelector('input[name="cta"]');
    var alertBox = form.querySelector(".form-alert");
    var wrap = form.parentNode;
    var success = wrap.querySelector(".form-success");
    var fixed = form.getAttribute("data-fixed-type");

    // Which request did the visitor come for? ?cta=<slug> picks the request type; the clicked button's label is kept as the CTA.
    var params = new URLSearchParams(location.search);
    var slugType = (CFG.ctaSlugs || {})[params.get("cta") || ""];
    if (typeSel && slugType && typeSel.querySelector('option[value="' + slugType + '"]')) typeSel.value = slugType;
    function currentType() { return fixed || (typeSel ? typeSel.value : "demo"); }
    var clicked = lastCta();
    var t0 = types[currentType()];
    if (ctaInput) ctaInput.value = (clicked && clicked.length <= 80 ? clicked.replace(/ \(menu\)$/, "") : "") || (t0 ? t0.cta : ctaInput.value);
    if (typeSel) typeSel.addEventListener("change", function () { var t = types[typeSel.value]; if (t && ctaInput) ctaInput.value = t.cta; });

    function fieldErr(name, msg) {
      var input = form.querySelector('[name="' + name + '"]');
      var id = (input && input.id ? input.id : form.id + "-" + name) + "-err";
      if (name === "interest") id = form.id + "-interest-err";
      if (name === "requestType") id = form.id + "-type-err";
      var p = document.getElementById(id);
      if (p) { p.textContent = msg || ""; p.hidden = !msg; }
      var targets = name === "interest" ? form.querySelectorAll('[name="interest"]') : input ? [input] : [];
      Array.prototype.forEach.call(targets, function (el) { if (msg) el.setAttribute("aria-invalid", "true"); else el.removeAttribute("aria-invalid"); });
      return msg ? (targets[0] || null) : null;
    }

    function showAlert(msg) {
      alertBox.textContent = msg;
      alertBox.hidden = !msg;
    }

    function validate() {
      var v = function (n) { var el = form.elements[n]; return el ? String(el.value || "").trim() : ""; };
      var errors = [];
      var add = function (name, msg) { var el = fieldErr(name, msg); if (msg) errors.push(el); };
      add("name", v("name").length < 2 ? "Please enter your name." : "");
      add("email", !EMAIL.test(v("email")) ? "Please enter a valid email address." : "");
      var digits = v("phone").replace(/\D/g, "");
      if (digits.length === 11 && digits.charAt(0) === "1") digits = digits.slice(1);
      add("phone", v("phone") && digits.length !== 10 ? "Please enter a 10-digit US phone number, or leave it blank." : "");
      var interest = form.querySelector('[name="interest"]:checked');
      add("interest", !interest ? "Please choose Software, Consulting or Both." : "");
      add("consent", !form.elements.consent.checked ? "Please check the box so we can contact you about your request." : "");
      return errors.filter(Boolean);
    }

    var tried = false;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      tried = true;
      showAlert("");
      var errors = validate();
      var type = currentType();
      if (errors.length) {
        showAlert("Please fix the " + (errors.length === 1 ? "highlighted field" : errors.length + " highlighted fields") + " below.");
        errors[0].focus();
        track("form_error", { form: type, reason: "validation", fields: errors.length });
        return;
      }
      var endpoint = form.getAttribute("data-endpoint");
      if (!endpoint) {
        showAlert("This form isn't connected yet." + (CFG.contactEmail ? " Please email us at " + CFG.contactEmail + "." : " Please try again soon."));
        track("form_error", { form: type, reason: "not_configured" });
        return;
      }
      var data = {};
      Array.prototype.forEach.call(form.elements, function (el) {
        if (!el.name || el.type === "submit") return;
        if (el.type === "radio") { if (el.checked) data[el.name] = el.value; return; }
        if (el.type === "checkbox") { data[el.name] = el.checked; return; }
        data[el.name] = el.value;
      });
      delete data.redirect;
      var btn = form.querySelector('[type="submit"]');
      btn.disabled = true;
      form.setAttribute("aria-busy", "true");
      var label = btn.textContent;
      btn.textContent = "Sending…";

      fetch(endpoint, { method: "POST", mode: "cors", credentials: "omit", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(data) })
        .then(function (res) {
          return res.json().catch(function () { return {}; }).then(function (body) { return { ok: res.ok, status: res.status, body: body }; });
        })
        .then(function (r) {
          if (!r.ok) {
            var msg = r.status === 429 ? "Too many requests from this connection. Please wait a few minutes and try again." : (r.body && typeof r.body.message === "string" && r.body.message.length < 300 ? r.body.message : "Something went wrong sending your request. Please try again.");
            throw { message: msg, status: r.status };
          }
          var t = types[type] || {};
          track(t.event || "form_submit", { form: type, cta: data.cta || "" });
          form.hidden = true;
          success.querySelector(".success-text").textContent = t.success || "Thanks — we received your request.";
          success.hidden = false;
          success.focus();
        })
        .catch(function (err) {
          showAlert((err && err.message && err.status) ? err.message : "We couldn't reach our server. Check your connection and try again.");
          track("form_error", { form: type, reason: err && err.status ? "http_" + err.status : "network" });
          alertBox.setAttribute("tabindex", "-1");
          alertBox.focus();
        })
        .then(function () {
          btn.disabled = false;
          btn.textContent = label;
          form.removeAttribute("aria-busy");
        });
    });

    // Clear a field's error as soon as it is fixed.
    // Text fields re-check while typing (not on blur: hiding a message on blur would shift the layout under the pointer
    // mid-click); choices re-check when they change.
    form.addEventListener("input", function (e) { if (tried && e.target.name && /^(text|email|tel|textarea)$/.test(e.target.type)) validate(); });
    form.addEventListener("change", function (e) { if (tried && e.target.name && /^(radio|checkbox|select-one)$/.test(e.target.type)) validate(); });
  }

  Array.prototype.forEach.call(document.querySelectorAll("form.lead-form"), setupForm);
})();
