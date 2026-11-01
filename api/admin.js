// Website editor API (Vercel serverless function at /api/admin). Node built-ins only.
//
// The editor reads and writes content/site.json (and uploads files to assets/) in this site's GitHub repository.
// Each "Publish" is a GitHub commit; Vercel sees the commit and rebuilds the site in about a minute.
//
// Vercel → Project → Settings → Environment Variables:
//   ADMIN_PASSWORD   the password for /admin (use a long one)                         required
//   GITHUB_TOKEN     fine-grained GitHub token for THIS repository only:               required
//                    Contents: Read and write (Deployments: Read-only is optional, for the "live" check)
//   GITHUB_REPO      owner/name, e.g. travon-glitch/prospectingcalltrackerwebsite      optional (Vercel fills it in)
//   GITHUB_BRANCH    branch the live site deploys from                                 optional (default: main)
//
// Every request after login needs the signed, HttpOnly session cookie. Requests that change anything must also send
// the X-PCT-Admin header (browsers never add it on cross-site requests) and JSON, which blocks cross-site forgery.

import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { parseContent, validateSite } from "../templates/validate.mjs";

const CONTENT_PATH = "content/site.json";
const SESSION_HOURS = 12;
const COOKIE = "pct_admin";
const MAX_UPLOAD_BYTES = 3 * 1024 * 1024; // Vercel accepts request bodies up to 4.5 MB; base64 adds a third.
const UPLOAD_TYPES = { jpg: "image", jpeg: "image", png: "image", webp: "image", gif: "image", pdf: "file", xlsx: "file", xls: "file", csv: "file", docx: "file", mp4: "file" };
const MEDIA_FOLDERS = ["assets/uploads", "assets/img", "assets/downloads", "assets/placeholders"];

const env = () => ({
  password: process.env.ADMIN_PASSWORD || "",
  token: process.env.GITHUB_TOKEN || "",
  repo: process.env.GITHUB_REPO || (process.env.VERCEL_GIT_REPO_OWNER && process.env.VERCEL_GIT_REPO_SLUG ? `${process.env.VERCEL_GIT_REPO_OWNER}/${process.env.VERCEL_GIT_REPO_SLUG}` : ""),
  branch: process.env.GITHUB_BRANCH || "main",
  api: (process.env.GITHUB_API || "https://api.github.com").replace(/\/$/, ""),
  // When the site reads its content from Directus, Directus is the editor and this one steps aside.
  directus: process.env.DIRECTUS_URL && process.env.DIRECTUS_TOKEN ? process.env.DIRECTUS_URL.replace(/\/$/, "") : "",
});

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/* ------------------------------------------------------------------ sessions */

const secret = (e) => createHash("sha256").update(`pct-admin|${e.password}|${e.token}`).digest();
const sign = (e, data) => createHmac("sha256", secret(e)).update(data).digest("base64url");
const sha = (s) => createHash("sha256").update(String(s)).digest();

function sessionCookie(e) {
  const exp = Date.now() + SESSION_HOURS * 3600 * 1000;
  const data = `${exp}.${randomBytes(9).toString("base64url")}`;
  return `${COOKIE}=${data}.${sign(e, data)}; Path=/api/admin; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_HOURS * 3600}`;
}

function loggedIn(req, e) {
  if (!e.password || !e.token) return false;
  const raw = String(req.headers.cookie || "")
    .split(/;\s*/)
    .find((c) => c.startsWith(COOKIE + "="));
  if (!raw) return false;
  const value = raw.slice(COOKIE.length + 1);
  const cut = value.lastIndexOf(".");
  if (cut < 0) return false;
  const data = value.slice(0, cut);
  const expected = Buffer.from(sign(e, data));
  const given = Buffer.from(value.slice(cut + 1));
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return false;
  return Number(data.split(".")[0]) > Date.now();
}

/* ------------------------------------------------------------------ GitHub */

async function github(e, method, path, body) {
  const res = await fetch(`${e.api}/repos/${e.repo}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${e.token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "pct-website-editor",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  if (!res.ok) {
    if (res.status === 401) throw new HttpError(502, "GitHub refused the token. Check GITHUB_TOKEN in Vercel (it may have expired).");
    if (res.status === 403) throw new HttpError(502, "The GitHub token doesn't have permission for this. It needs Contents: Read and write on this repository.");
    if (res.status === 409 || (res.status === 422 && /sha/i.test(json?.message || ""))) throw new HttpError(409, "The website was changed somewhere else after you opened the editor. Reload the editor to get the latest version, then make your change again.");
    const err = new HttpError(res.status === 404 ? 404 : 502, `GitHub: ${json?.message || res.statusText}`);
    throw err;
  }
  return json;
}

const enc = (p) => p.split("/").map(encodeURIComponent).join("/");

async function readContent(e, ref) {
  const f = await github(e, "GET", `/contents/${enc(CONTENT_PATH)}?ref=${encodeURIComponent(ref || e.branch)}`);
  let raw;
  if (f.content) raw = Buffer.from(f.content, "base64").toString("utf8");
  else raw = Buffer.from((await github(e, "GET", `/git/blobs/${f.sha}`)).content, "base64").toString("utf8");
  return { raw, sha: f.sha };
}

/* ------------------------------------------------------------------ helpers */

async function readBody(req) {
  if (req.body !== undefined && req.body !== null && typeof req.body !== "string" && !Buffer.isBuffer(req.body)) return req.body;
  let text = typeof req.body === "string" ? req.body : Buffer.isBuffer(req.body) ? req.body.toString("utf8") : "";
  if (!text) {
    const chunks = [];
    let size = 0;
    for await (const c of req) {
      size += c.length;
      if (size > 5 * 1024 * 1024) throw new HttpError(413, "That is too large to send in one go.");
      chunks.push(c);
    }
    text = Buffer.concat(chunks).toString("utf8");
  }
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw new HttpError(400, "The request was not valid JSON.");
  }
}

function send(res, status, data, extraHeaders = {}) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  for (const [k, v] of Object.entries(extraHeaders)) res.setHeader(k, v);
  res.end(JSON.stringify(data));
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function safeFileName(name) {
  const m = /^(.*?)(?:\.([a-z0-9]+))?$/i.exec(String(name || "").trim());
  const ext = (m[2] || "").toLowerCase();
  if (!UPLOAD_TYPES[ext]) throw new HttpError(400, `That file type isn't allowed. Use ${Object.keys(UPLOAD_TYPES).join(", ")}.`);
  const base =
    m[1]
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "file";
  return { base, ext };
}

/* ------------------------------------------------------------------ actions */

const actions = {
  async session(req, e) {
    if (e.directus) return { loggedIn: false, directus: e.directus };
    return { loggedIn: loggedIn(req, e), configured: { password: !!e.password, token: !!e.token, repo: !!e.repo }, repo: e.repo, branch: e.branch };
  },

  async login(req, e, body, res) {
    if (!e.password || !e.token || !e.repo) throw new HttpError(503, "The editor isn't set up yet: add ADMIN_PASSWORD and GITHUB_TOKEN in Vercel → Settings → Environment Variables, then redeploy.");
    const ok = timingSafeEqual(sha(body.password ?? ""), sha(e.password));
    if (!ok) {
      await sleep(900); // slows down password guessing
      throw new HttpError(401, "That password isn't right.");
    }
    res.setHeader("Set-Cookie", sessionCookie(e));
    return { loggedIn: true };
  },

  async logout(req, e, body, res) {
    res.setHeader("Set-Cookie", `${COOKIE}=; Path=/api/admin; HttpOnly; Secure; SameSite=Strict; Max-Age=0`);
    return { loggedIn: false };
  },

  async content(req, e, body, res, url) {
    const ref = url.searchParams.get("ref");
    if (ref && !/^[0-9a-f]{7,40}$/i.test(ref)) throw new HttpError(400, "Unknown version.");
    const { raw, sha: fileSha } = await readContent(e, ref || undefined);
    const parsed = parseContent(raw);
    return { content: parsed.site ?? null, raw: parsed.site ? undefined : raw, error: parsed.error, sha: ref ? undefined : fileSha };
  },

  async validate(req, e, body) {
    return { problems: validateSite(body.content) };
  },

  async save(req, e, body) {
    if (!body.content || typeof body.content !== "object") throw new HttpError(400, "Nothing to save.");
    if (!body.sha) throw new HttpError(400, "Reload the editor and try again.");
    const problems = validateSite(body.content);
    if (problems.length) throw new HttpError(422, problems.join("\n"));
    const text = JSON.stringify(body.content, null, 2) + "\n";
    if (text.length > 900 * 1024) throw new HttpError(413, "The content file is getting too large. Move long text into separate pages.");
    const note = String(body.message || "").replace(/\s+/g, " ").trim().slice(0, 120);
    const result = await github(e, "PUT", `/contents/${enc(CONTENT_PATH)}`, {
      message: `Website editor: ${note || "update website content"}`,
      content: Buffer.from(text, "utf8").toString("base64"),
      sha: body.sha,
      branch: e.branch,
    });
    return { sha: result.content.sha, commit: result.commit.sha, commitUrl: result.commit.html_url };
  },

  async history(req, e) {
    const list = await github(e, "GET", `/commits?path=${encodeURIComponent(CONTENT_PATH)}&sha=${encodeURIComponent(e.branch)}&per_page=30`);
    return {
      items: list.map((c) => ({
        sha: c.sha,
        message: c.commit.message.split("\n")[0],
        date: c.commit.author?.date || c.commit.committer?.date,
        author: c.author?.login || c.commit.author?.name || "",
        url: c.html_url,
      })),
    };
  },

  async media(req, e) {
    const out = [];
    for (const folder of MEDIA_FOLDERS) {
      let list;
      try {
        list = await github(e, "GET", `/contents/${enc(folder)}?ref=${encodeURIComponent(e.branch)}`);
      } catch (err) {
        if (err.status === 404) continue;
        throw err;
      }
      for (const f of Array.isArray(list) ? list : []) if (f.type === "file" && !f.name.startsWith(".")) out.push({ path: "/" + f.path, name: f.name, size: f.size, folder });
    }
    return { items: out };
  },

  async upload(req, e, body) {
    const { base, ext } = safeFileName(body.name);
    const data = String(body.data || "").replace(/^data:[^,]*,/, "");
    if (!/^[A-Za-z0-9+/=\s]+$/.test(data)) throw new HttpError(400, "The file could not be read.");
    const bytes = Buffer.from(data, "base64");
    if (!bytes.length) throw new HttpError(400, "The file is empty.");
    if (bytes.length > MAX_UPLOAD_BYTES) throw new HttpError(413, "That file is larger than 3 MB. Make it smaller (for photos, 1600 pixels wide is plenty) and try again.");
    const folder = UPLOAD_TYPES[ext] === "image" ? "assets/uploads" : "assets/downloads";
    // Never overwrite: add a short suffix when the name is taken.
    let name = `${base}.${ext}`;
    for (let i = 0; i < 5; i++) {
      try {
        await github(e, "GET", `/contents/${enc(`${folder}/${name}`)}?ref=${encodeURIComponent(e.branch)}`);
        name = `${base}-${randomBytes(3).toString("hex")}.${ext}`;
      } catch (err) {
        if (err.status === 404) break;
        throw err;
      }
    }
    const result = await github(e, "PUT", `/contents/${enc(`${folder}/${name}`)}`, {
      message: `Website editor: upload ${name}`,
      content: bytes.toString("base64"),
      branch: e.branch,
    });
    return { path: `/${folder}/${name}`, commit: result.commit.sha };
  },

  async deploy(req, e, body, res, url) {
    const commit = url.searchParams.get("sha") || "";
    if (!/^[0-9a-f]{7,40}$/i.test(commit)) throw new HttpError(400, "Unknown version.");
    let deployments;
    try {
      deployments = await github(e, "GET", `/deployments?sha=${commit}&per_page=10`);
    } catch {
      return { state: "unknown" };
    }
    const d = (deployments || []).find((x) => /production/i.test(x.environment)) || (deployments || [])[0];
    if (!d) return { state: "pending" };
    const statuses = await github(e, "GET", `/deployments/${d.id}/statuses?per_page=1`).catch(() => []);
    const s = statuses?.[0]?.state || "pending";
    return { state: s === "success" ? "live" : s === "failure" || s === "error" ? "failed" : "pending", url: statuses?.[0]?.environment_url || statuses?.[0]?.target_url || "" };
  },
};

const PUBLIC = new Set(["session", "login"]);
const WRITES = new Set(["login", "logout", "save", "upload", "validate"]);

export default async function handler(req, res) {
  const e = env();
  const url = new URL(req.url, "http://localhost");
  const name = url.searchParams.get("action") || "";
  try {
    const action = Object.hasOwn(actions, name) ? actions[name] : null;
    if (!action) throw new HttpError(404, "Unknown action.");
    const isWrite = WRITES.has(name);
    if (isWrite !== (req.method === "POST")) throw new HttpError(405, "Wrong method.");
    if (isWrite) {
      if (req.headers["x-pct-admin"] !== "1" || !/^application\/json/i.test(req.headers["content-type"] || "")) throw new HttpError(403, "Request blocked.");
    }
    if (e.directus && name !== "session") throw new HttpError(409, `This website is edited in Directus now: ${e.directus}/admin`);
    if (!PUBLIC.has(name) && !loggedIn(req, e)) throw new HttpError(401, "Your session has ended. Please log in again.");
    const body = isWrite ? await readBody(req) : {};
    const data = await action(req, e, body, res, url);
    send(res, 200, data);
  } catch (err) {
    const status = err instanceof HttpError ? err.status : 500;
    if (status === 500) console.error(err);
    send(res, status, { error: status === 500 ? "Something went wrong on the server. Please try again." : err.message });
  }
}
