// Dashboard-style illustrations of the CRM, drawn in HTML + inline SVG (no images, no stock photos).
// Every name, address and number in here is SAMPLE DATA for illustration only; each mockup is captioned as such.
// Screen readers get one short description per mockup (role="img" + aria-label); the inner markup is presentational.

import { esc, icon } from "./html.mjs";

let NOTE = "Illustration with sample data";
export const setMockupNote = (s) => { NOTE = s || NOTE; };

function frame(title, label, body, { cls = "", caption = true } = {}) {
  return `<figure class="mock ${cls}">
  <div class="mock-win" role="img" aria-label="${esc(label)}">
    <div class="mock-bar"><span class="dots"><i></i><i></i><i></i></span><span class="mock-title">${esc(title)}</span></div>
    <div class="mock-body">${body}</div>
  </div>
  ${caption ? `<figcaption>${esc(NOTE)}</figcaption>` : ""}
</figure>`;
}

const tag = (t, kind = "") => `<span class="m-tag ${kind}">${esc(t)}</span>`;
const btn = (t, kind = "", ic = "") => `<span class="m-btn ${kind}">${ic ? icon(ic, "m-ic") : ""}${esc(t)}</span>`;
/** Horizontal bar 0..100 as SVG (no inline styles, so the CSP can forbid them). */
const bar = (pct, kind = "") => `<svg class="m-bar ${kind}" viewBox="0 0 100 8" preserveAspectRatio="none" aria-hidden="true"><rect width="100" height="8" rx="4" class="track"/><rect width="${Math.max(4, Math.min(100, pct))}" height="8" rx="4" class="fill"/></svg>`;

/* ---------------------------------------------------------------- building blocks */

const LEADS = [
  ["Estate of R. Hayes", "Probate", "probate", "New", "—"],
  ["Linda Moreno", "Expired", "expired", "Attempted", "Today 9:42"],
  ["Marcus Chen", "Absentee", "absentee", "Conversation", "Yesterday"],
  ["Dana Whitfield", "FSBO", "fsbo", "Follow-up", "Mon"],
  ["Paul & Rita Ortiz", "High equity", "equity", "New", "—"],
];

function leadListBody(rows = LEADS, compact = false) {
  return `<div class="m-list${compact ? " m-list-compact" : ""}">
  <div class="m-list-head"><span>${icon("list", "m-ic")}Probate &amp; Expired — Week 12</span><span class="m-muted">85 leads</span></div>
  ${rows
    .map(
      ([n, t, k, s, last], i) => `<div class="m-row${i === 1 ? " is-active" : ""}"><span class="m-name">${esc(n)}</span>${tag(t, k)}${compact ? "" : `<span class="m-status">${esc(s)}</span><span class="m-muted m-last">${esc(last)}</span>`}</div>`,
    )
    .join("")}
</div>`;
}

function leadCardBody() {
  return `<div class="m-lead">
  <div class="m-lead-top">
    <div><div class="m-lead-name">Linda Moreno</div><div class="m-muted">1420 Maple Ave · Expired listing</div></div>
    ${tag("Expired", "expired")}
  </div>
  <div class="m-phones"><span>${icon("phone", "m-ic")}(555) 201-4417 <em>mobile</em></span><span>${icon("phone", "m-ic")}(555) 201-8830 <em>landline</em></span></div>
  <div class="m-actions">${btn("Call", "primary", "phone")}${btn("Text", "", "chat")}${btn("Email", "", "mail")}</div>
  <div class="m-note"><strong>Last note:</strong> Listing expired Friday. Wants to wait until spring — follow up in 2 weeks.</div>
  <div class="m-outcomes"><span>No answer</span><span>Voicemail</span><span class="on">Conversation</span><span>Appointment</span></div>
</div>`;
}

function followupsBody(n = 4) {
  const items = [
    ["Overdue", "late", "Call Marcus Chen — absentee owner, asked to call after 5pm", "phone"],
    ["Today", "today", "Text Dana Whitfield — FSBO open house recap", "chat"],
    ["Today", "today", "Email Estate of R. Hayes — probate resource guide", "mail"],
    ["Tomorrow", "", "Call Paul & Rita Ortiz — equity check-in", "phone"],
  ].slice(0, n);
  return `<div class="m-fu">
  <div class="m-list-head"><span>${icon("clock", "m-ic")}Follow-ups due</span><span class="m-muted">3 today · 1 overdue</span></div>
  ${items.map(([d, k, t, ic]) => `<div class="m-fu-row"><span class="m-due ${k}">${esc(d)}</span>${icon(ic, "m-ic m-ic-soft")}<span>${esc(t)}</span></div>`).join("")}
</div>`;
}

const STAGES = [["New conversation", 14], ["Appointment set", 6], ["Listing signed", 3], ["Under contract", 2], ["Closed", 1]];
const SHORT_STAGES = [["New", 14], ["Appt set", 6], ["Listed", 3], ["Contract", 2], ["Closed", 1]];
function pipelineBody(cards = true) {
  return `<div class="m-pipe">${(cards ? STAGES : SHORT_STAGES).map(
    ([s, n], i) => `<div class="m-stage"><div class="m-stage-h"><span>${esc(s)}</span><b>${n}</b></div>${cards ? `<div class="m-deal">${esc(["M. Chen", "L. Moreno", "Hayes estate", "D. Whitfield", "J. Park"][i])}<span class="m-muted">${esc(["Absentee", "Expired", "Probate", "FSBO", "Past client"][i])}</span></div>` : ""}</div>`,
  ).join("")}</div>`;
}

const AGENTS = [["Jordan P.", 212, 148, 19, 4], ["Alexis R.", 186, 131, 16, 3], ["Sam T.", 154, 102, 12, 2], ["Chris M.", 97, 70, 8, 1]];
function scoreboardBody(rows = AGENTS, compact = false) {
  const goal = 250;
  return `<div class="m-score${compact ? " m-score-compact" : ""}">
  <div class="m-list-head"><span>${icon("chart", "m-ic")}${compact ? "Team call scoreboard" : "Weekly scoreboard"}</span><span class="m-muted">Goal ${goal} pts</span></div>
  ${compact ? "" : `<div class="m-score-h"><span>Agent</span><span>Points</span><span>Calls</span><span>Conv.</span><span>Appts</span></div>`}
  ${rows
    .map(
      ([n, p, c, v, a], i) => `<div class="m-score-row"><span class="m-name"><b class="m-rank">${i + 1}</b>${esc(n)}</span><span class="m-pts">${bar((p / goal) * 100)}<b>${p}</b></span>${compact ? `<span class="m-muted">${c} calls</span>` : `<span>${c}</span><span>${v}</span><span>${a}</span>`}</div>`,
    )
    .join("")}
</div>`;
}

function aiBody() {
  return `<div class="m-ai">
  <div class="m-ai-h">${icon("spark", "m-ic")}AI suggestion <span class="m-muted">· for Linda Moreno</span></div>
  <div class="m-bubble">Hi Linda, it's Jordan with the team. I know the timing didn't work out this fall. Would it help if I sent a quick spring pricing outlook for Maple Ave so you have it when you're ready?</div>
  <div class="m-ai-why"><strong>Why:</strong> Expired 3 days ago · said “maybe spring” · no text sent yet</div>
  <div class="m-actions">${btn("Edit")}${btn("Approve & send", "primary", "check")}</div>
  <div class="m-ai-safe">${icon("shield", "m-ic")}Nothing is sent until a person approves it.</div>
</div>`;
}

/* ---------------------------------------------------------------- public mockups */

export const mockups = {
  hero: () =>
    frame(
      "Prospecting Call Tracker — Today",
      "Illustration of the CRM dashboard: a prospecting lead list, the current lead with Call and Text buttons, follow-up reminders, pipeline stages, a weekly team call scoreboard and an AI message suggestion waiting for approval.",
      `<div class="m-hero">
  <div class="m-hero-pipe">${pipelineBody(false)}</div>
  <div class="m-hero-list">${leadListBody(LEADS, true)}</div>
  <div class="m-hero-lead">${leadCardBody()}</div>
  <div class="m-hero-ai">${aiBody()}</div>
  <div class="m-hero-side"><div class="m-hero-fu">${followupsBody(3)}</div><div class="m-hero-score">${scoreboardBody(AGENTS.slice(0, 3), true)}</div></div>
</div>`,
      { cls: "mock-hero" },
    ),

  leadList: () => frame("Leads", "Illustration of a prospecting lead list with probate, expired, absentee, FSBO and high-equity leads, their status and last attempt.", leadListBody()),
  leadCard: () => frame("Current lead", "Illustration of the current lead card: name, address, two phone numbers, Call, Text and Email buttons, the last note and one-tap call outcomes.", leadCardBody()),
  followups: () => frame("Follow-Up Queue", "Illustration of the follow-up queue with one overdue call, two follow-ups due today and one due tomorrow.", followupsBody()),
  pipeline: () => frame("Seller pipeline", "Illustration of a seller pipeline with stages from new conversation to closed, each with a count and a sample deal.", pipelineBody(), { cls: "mock-wide" }),
  scoreboard: () => frame("Scoreboard", "Illustration of a weekly team scoreboard ranking four agents by points, with calls, conversations and appointments.", scoreboardBody()),
  aiDraft: () => frame("AI Assistant", "Illustration of an AI-drafted text message for a lead, the reason for the suggestion, and Edit and Approve buttons. Nothing is sent until a person approves.", aiBody()),

  listImport: () =>
    frame(
      "Import list",
      "Illustration of a list import: spreadsheet columns mapped to CRM fields, with the mapping saved for the next import.",
      `<div class="m-map">
  <div class="m-list-head"><span>${icon("list", "m-ic")}probate_county_export.csv</span><span class="m-muted">1,240 rows</span></div>
  ${[["Owner Name", "First / Last name"], ["Property Address", "Address"], ["Mailing City", "City"], ["Phone 1", "Phone (mobile)"], ["Case Filed", "Custom: Filing date"]]
    .map(([a, b]) => `<div class="m-map-row"><span class="m-col">${esc(a)}</span>${icon("arrow", "m-ic m-ic-soft")}<span class="m-field">${esc(b)}</span></div>`)
    .join("")}
  <div class="m-save">${icon("check", "m-ic")}Mapping saved as “Probate — County export”</div>
</div>`,
    ),

  assignment: () =>
    frame(
      "Assign leads",
      "Illustration of lead assignment: a probate list split between three agents, with agent data isolation turned on.",
      `<div class="m-assign">
  <div class="m-list-head"><span>${icon("users", "m-ic")}Probate — March · 120 leads</span></div>
  ${[["Jordan P.", 40], ["Alexis R.", 40], ["Sam T.", 40]].map(([n, c]) => `<div class="m-assign-row"><span class="m-avatar">${esc(n[0])}</span><span class="m-name">${esc(n)}</span><span class="m-muted">${c} leads</span>${bar((c / 120) * 100)}</div>`).join("")}
  <div class="m-toggle"><span>${icon("shield", "m-ic")}Agents see only their own leads</span><span class="m-switch on" aria-hidden="true"><i></i></span></div>
  <div class="m-toggle"><span>Agents can export leads</span><span class="m-switch" aria-hidden="true"><i></i></span></div>
</div>`,
    ),

  dialer: () =>
    frame(
      "Call queue",
      "Illustration of the dialer: a call in progress with a timer, the lead's details, outcome buttons and the position in the call queue.",
      `<div class="m-dial">
  <div class="m-dial-top"><div><div class="m-lead-name">Marcus Chen</div><div class="m-muted">Absentee owner · 88 Birch Ct</div></div><div class="m-timer">${icon("phone", "m-ic")}02:14</div></div>
  ${bar(14)}
  <div class="m-muted m-small">Lead 12 of 85 · Absentee — North side</div>
  <div class="m-outcomes"><span>No answer</span><span>Left voicemail</span><span class="on">Conversation</span><span>Appointment set</span><span>Bad number</span><span>Do Not Call</span></div>
  <div class="m-actions">${btn("Save & next lead", "primary", "arrow")}</div>
</div>`,
    ),

  texting: () =>
    frame(
      "Messages",
      "Illustration of the texting workspace: a two-way conversation with a lead, the lead's consent status, and automatic opt-out handling.",
      `<div class="m-sms">
  <div class="m-list-head"><span>${icon("chat", "m-ic")}Dana Whitfield · FSBO</span>${tag("Consent: granted", "ok")}</div>
  <div class="m-msg in">Thanks for stopping by the open house! Do you have the pricing sheet you mentioned?</div>
  <div class="m-msg out">Absolutely — here's the sheet for the three homes nearby that sold this summer. Happy to walk through it.</div>
  <div class="m-msg in">That helps. Can we talk Thursday?</div>
  <div class="m-ai-safe">${icon("shield", "m-ic")}STOP and other opt-out words are handled automatically.</div>
</div>`,
    ),

  emailCenter: () =>
    frame(
      "Email Center",
      "Illustration of the Email Center: a template library and a campaign report with sent, delivered, opened, clicked and replied counts.",
      `<div class="m-email">
  <div class="m-email-tpl">
    <div class="m-sub">Templates</div>
    ${["Probate introduction", "Expired — spring outlook", "Open house thank-you", "Past client check-in"].map((t, i) => `<div class="m-tpl${i === 1 ? " is-active" : ""}">${icon("mail", "m-ic m-ic-soft")}${esc(t)}</div>`).join("")}
  </div>
  <div class="m-email-stats">
    <div class="m-sub">Campaign · Expired — spring outlook</div>
    <div class="m-stat-grid">${[["Sent", "240"], ["Delivered", "236"], ["Opened", "118"], ["Clicked", "31"], ["Replied", "9"], ["Unsubscribed", "2"]].map(([k, v]) => `<div class="m-stat"><b>${v}</b><span>${k}</span></div>`).join("")}</div>
  </div>
</div>`,
    ),

  smartPlan: () =>
    frame(
      "Smart Plan · Probate Lead Plan",
      "Illustration of a Smart Plan timeline: an introduction email, a 7-day wait, a call task, a 14-day wait and a follow-up email; the plan stops if the lead replies.",
      `<ol class="m-plan">
  ${[["mail", "Email", "Probate introduction", "Day 0"], ["clock", "Wait", "7 days", ""], ["phone", "Call task", "Check in with the family", "Day 7"], ["clock", "Wait", "14 days", ""], ["mail", "Email", "Helpful resource guide", "Day 21"]]
    .map(([ic, t, d, day]) => `<li class="m-step"><span class="m-step-ic">${icon(ic, "m-ic")}</span><span><b>${esc(t)}</b> <span class="m-muted">${esc(d)}</span></span>${day ? `<span class="m-day">${esc(day)}</span>` : ""}</li>`)
    .join("")}
</ol>
<div class="m-ai-safe">${icon("shield", "m-ic")}Stops automatically when the lead replies or unsubscribes.</div>`,
    ),

  kpis: () =>
    frame(
      "Agent KPIs · Jordan P.",
      "Illustration of agent KPI cards: dials, conversations, appointments and dial-to-appointment rate for this week compared with last week, plus a daily activity chart.",
      `<div class="m-kpis">${[["Dials", "212", "+18"], ["Conversations", "48", "+6"], ["Appointments", "4", "+1"], ["Dial → appt", "1.9%", "+0.3"]]
        .map(([k, v, d]) => `<div class="m-kpi"><span class="m-muted">${k}</span><b>${v}</b><span class="m-delta">${icon("arrow", "m-ic")}${d} vs last week</span></div>`)
        .join("")}</div>
<svg class="m-chart" viewBox="0 0 300 80" aria-hidden="true">${[38, 52, 30, 61, 47, 22, 0].map((v, i) => `<rect x="${12 + i * 41}" y="${72 - v}" width="26" height="${v}" rx="4"/>`).join("")}<line x1="0" y1="72" x2="300" y2="72"/></svg>
<div class="m-days">${["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => `<span>${d}</span>`).join("")}</div>`,
    ),

  roi: () =>
    frame(
      "Lead source ROI",
      "Illustration of a lead source report comparing probate, expired, absentee, circle prospecting and a paid portal by spend, appointments, deals and cost per appointment.",
      `<div class="m-roi">
  <div class="m-roi-h"><span>Source</span><span>Spend</span><span>Appts</span><span>Deals</span><span>Cost / appt</span></div>
  ${[["Probate list", "$350", "9", "2", "$39"], ["Expired", "$120", "6", "1", "$20"], ["Absentee", "$200", "5", "1", "$40"], ["Circle prospecting", "$0", "4", "1", "$0"], ["Paid portal", "$1,800", "3", "0", "$600"]]
    .map((r, i) => `<div class="m-roi-row${i === 4 ? " warn" : ""}">${r.map((c) => `<span>${esc(c)}</span>`).join("")}</div>`)
    .join("")}
</div>`,
    ),

  permissions: () =>
    frame(
      "Roles & permissions",
      "Illustration of a permissions matrix: Owner, Administrator, Team leader and Agent roles against permissions such as view all leads, view phone numbers, export, reassign leads and manage Smart Plans.",
      `<div class="m-perm">
  <div class="m-perm-h"><span>Permission</span><span>Owner</span><span>Admin</span><span>Leader</span><span>Agent</span></div>
  ${[["View all leads", 1, 1, 0, 0], ["View team leads", 1, 1, 1, 0], ["View phone numbers", 1, 1, 1, 1], ["Export leads", 1, 1, 0, 0], ["Reassign leads", 1, 1, 1, 0], ["Manage Smart Plans", 1, 1, 1, 0]]
    .map(([k, ...v]) => `<div class="m-perm-row"><span>${esc(k)}</span>${v.map((on) => `<span class="${on ? "yes" : "no"}">${icon(on ? "check" : "x", "m-ic")}</span>`).join("")}</div>`)
    .join("")}
</div>`,
    ),

  coaching: () =>
    frame(
      "Team dashboard",
      "Illustration of the team coaching dashboard: follow-up completion rate, a weekly conversations trend line and the pipeline summary.",
      `<div class="m-coach">
  <div class="m-kpis">${[["Follow-ups done on time", "86%"], ["Conversations this week", "131"], ["Appointments", "11"], ["Listings signed", "3"]].map(([k, v]) => `<div class="m-kpi"><span class="m-muted">${k}</span><b>${v}</b></div>`).join("")}</div>
  <div class="m-sub">Conversations per week</div>
  <svg class="m-line" viewBox="0 0 300 70" aria-hidden="true"><polyline points="0,58 50,50 100,52 150,38 200,34 250,24 300,18" fill="none"/><line x1="0" y1="66" x2="300" y2="66"/></svg>
</div>`,
    ),
};
