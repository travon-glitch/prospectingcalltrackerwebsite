// Supabase mode for the website editor (used by api/admin.js when SUPABASE_URL and SUPABASE_ANON_KEY are set).
// Files starting with "_" in api/ are not deployed as their own endpoint; this is a helper module.
//
// - Login: Supabase Auth. The browser logs in directly with Supabase and sends its access token here; every request
//   is checked with Supabase and the person must be on the website_admins list (supabase/setup.sql).
// - Content: table site_content (one row) + site_content_history (every published version).
// - Photos/files: storage bucket "website-media"; the website build copies them to /assets/media/.
// - Publishing calls VERCEL_DEPLOY_HOOK so Vercel rebuilds the site.
// All database writes use the logged-in person's own token, so Supabase's security rules apply to every change.
// No Supabase secret/service key is needed anywhere.

export const BUCKET = "website-media";
export const MEDIA_PREFIX = "/assets/media/";

export function supabaseEnv() {
  const url = (process.env.SUPABASE_URL || "").trim().replace(/\/+$/, "");
  const key = (process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || "").trim();
  const hook = (process.env.VERCEL_DEPLOY_HOOK || "").trim();
  return { url, key, hook, on: !!(url && key) };
}

const PAUSED_HELP = "If your Supabase project is paused (the free plan pauses after about a week without use), open supabase.com → your project → Restore project, wait a minute and try again.";
const SETUP_HELP = "Supabase isn't set up for the website yet: open Supabase → SQL Editor → New query, paste the file supabase/setup.sql from the website folder, and click Run.";

export function createSupabaseActions({ HttpError, checker, safeFileName, sendRaw }) {
  /** Calls Supabase. `token` = the logged-in person's access token (omit for public reads). */
  async function sb(s, path, { method = "GET", token, body, headers = {}, raw = false } = {}) {
    let res;
    try {
      res = await fetch(s.url + path, {
        method,
        headers: {
          apikey: s.key,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(body !== undefined && !(body instanceof Uint8Array) ? { "Content-Type": "application/json" } : {}),
          ...headers,
        },
        body: body === undefined ? undefined : body instanceof Uint8Array ? body : JSON.stringify(body),
        signal: AbortSignal.timeout(20000),
      });
    } catch {
      throw new HttpError(504, `The editor couldn't reach Supabase (${s.url}). ${PAUSED_HELP}`);
    }
    if (raw) return res;
    const text = await res.text();
    let json = null;
    try { json = text ? JSON.parse(text) : null; } catch { json = null; }
    if (!res.ok) {
      const msg = json?.message || json?.msg || json?.error_description || json?.error || text.slice(0, 200) || res.statusText;
      if (json?.code === "PGRST205" || json?.code === "42P01" || /could not find the (table|function)/i.test(msg)) throw new HttpError(503, SETUP_HELP);
      if (/bucket not found/i.test(msg)) throw new HttpError(503, SETUP_HELP);
      if (res.status === 401 || /jwt expired|invalid jwt|invalid token/i.test(msg)) throw new HttpError(401, "Your login has expired. Please log in again.");
      if (res.status === 403 || json?.code === "42501" || /row-level security/i.test(msg)) throw new HttpError(403, "Supabase didn't allow this change. Make sure your email is on the editor list (website_admins) in Supabase.");
      if (res.status >= 500) throw new HttpError(503, `Supabase had a problem (${res.status}). ${PAUSED_HELP}`);
      const err = new HttpError(res.status === 409 ? 409 : 502, `Supabase: ${msg}`);
      err.code = json?.code || json?.error || json?.statusCode;
      throw err;
    }
    return json;
  }

  /** Who is calling? Checks the access token with Supabase and the editor list. Returns { email, token }. */
  async function authenticate(req, s) {
    const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "").trim();
    if (!token) throw new HttpError(401, "Please log in.");
    const user = await sb(s, "/auth/v1/user", { token });
    const email = String(user?.email || "").toLowerCase();
    if (!email) throw new HttpError(401, "Please log in again.");
    const isAdmin = await sb(s, "/rest/v1/rpc/is_website_admin", { method: "POST", token, body: {} });
    if (isAdmin !== true) {
      throw new HttpError(403, `Your login works, but ${email} isn't on the website editor list yet. In Supabase → SQL Editor, run:  insert into website_admins (email) values ('${email}');`);
    }
    return { email, token };
  }

  // Imported (not read from disk) so Vercel always packages the file with this function.
  const bundledContent = async () => structuredClone((await import("../content/site.json", { with: { type: "json" } })).default);

  async function readRow(s, user) {
    const rows = await sb(s, "/rest/v1/site_content?id=eq.1&select=content,version", { token: user.token });
    return rows?.[0] ?? null;
  }

  const UUIDISH = /^\d+$/;

  const actions = {
    async content(req, s, user, body, url) {
      const ref = url.searchParams.get("ref");
      if (ref) {
        if (!UUIDISH.test(ref)) throw new HttpError(400, "Unknown version.");
        const rows = await sb(s, `/rest/v1/site_content_history?id=eq.${ref}&select=content`, { token: user.token });
        if (!rows?.length) throw new HttpError(404, "That version wasn't found.");
        return { content: rows[0].content };
      }
      let row = await readRow(s, user);
      if (!row) {
        // First time: copy the website's current content into Supabase.
        const content = await bundledContent();
        await sb(s, "/rest/v1/site_content", { method: "POST", token: user.token, body: { id: 1, content, version: 1, updated_by: user.email }, headers: { Prefer: "return=minimal" } }).catch((err) => {
          if (err.status !== 409) throw err; // someone else did it at the same moment
        });
        await sb(s, "/rest/v1/site_content_history", { method: "POST", token: user.token, body: { content, message: "Imported the website content into Supabase", created_by: user.email }, headers: { Prefer: "return=minimal" } });
        row = await readRow(s, user);
      }
      return { content: row.content, sha: String(row.version) };
    },

    async validate(req, s, user, body) {
      return { problems: (await checker()).validateSite(body.content) };
    },

    async save(req, s, user, body) {
      if (!body.content || typeof body.content !== "object") throw new HttpError(400, "Nothing to save.");
      const version = Number(body.sha);
      if (!Number.isInteger(version)) throw new HttpError(400, "Reload the editor and try again.");
      const problems = (await checker()).validateSite(body.content);
      if (problems.length) throw new HttpError(422, problems.join("\n"));
      const note = String(body.message || "").replace(/\s+/g, " ").trim().slice(0, 120) || "Updated website content";
      // Only succeeds if nobody else published since this person opened the editor.
      const updated = await sb(s, `/rest/v1/site_content?id=eq.1&version=eq.${version}`, {
        method: "PATCH",
        token: user.token,
        body: { content: body.content, version: version + 1, updated_at: new Date().toISOString(), updated_by: user.email },
        headers: { Prefer: "return=representation" },
      });
      if (!updated?.length) throw new HttpError(409, "The website was changed by someone else after you opened the editor. Reload the editor to get the latest version, then make your change again.");
      await sb(s, "/rest/v1/site_content_history", { method: "POST", token: user.token, body: { content: body.content, message: note, created_by: user.email }, headers: { Prefer: "return=minimal" } });
      let deployTriggered = false;
      if (s.hook) {
        try {
          const r = await fetch(s.hook, { method: "POST", signal: AbortSignal.timeout(10000) });
          deployTriggered = r.ok;
        } catch {
          deployTriggered = false;
        }
      }
      return { sha: String(version + 1), commit: null, deployTriggered, deployHookSet: !!s.hook };
    },

    async history(req, s, user) {
      const rows = await sb(s, "/rest/v1/site_content_history?select=id,message,created_at,created_by&order=id.desc&limit=30", { token: user.token });
      return { items: rows.map((r) => ({ sha: String(r.id), message: r.message || "Update", date: r.created_at, author: r.created_by || "", url: "" })) };
    },

    async media(req, s, user) {
      const list = await sb(s, `/storage/v1/object/list/${BUCKET}`, { method: "POST", token: user.token, body: { prefix: "", limit: 1000, offset: 0, sortBy: { column: "created_at", order: "desc" } } });
      return {
        items: (list || [])
          .filter((f) => f.name && !f.name.startsWith(".") && f.id)
          .map((f) => ({ path: MEDIA_PREFIX + f.name, name: f.name, size: f.metadata?.size ?? 0, folder: "assets/media", preview: `/api/admin?action=file&name=${encodeURIComponent(f.name)}` })),
      };
    },

    async upload(req, s, user, body) {
      const { base, ext } = safeFileName(body.name);
      const data = String(body.data || "").replace(/^data:[^,]*,/, "");
      if (!/^[A-Za-z0-9+/=\s]+$/.test(data)) throw new HttpError(400, "The file could not be read.");
      const bytes = new Uint8Array(Buffer.from(data, "base64"));
      if (!bytes.length) throw new HttpError(400, "The file is empty.");
      if (bytes.length > 3 * 1024 * 1024) throw new HttpError(413, "That file is larger than 3 MB. Make it smaller (for photos, 1600 pixels wide is plenty) and try again.");
      const type = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif", pdf: "application/pdf", csv: "text/csv", xls: "application/vnd.ms-excel", xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", mp4: "video/mp4" }[ext];
      let name = `${base}.${ext}`;
      for (let i = 0; i < 5; i++) {
        try {
          await sb(s, `/storage/v1/object/${BUCKET}/${encodeURIComponent(name)}`, { method: "POST", token: user.token, body: bytes, headers: { "Content-Type": type, "x-upsert": "false", "Cache-Control": "3600" } });
          return { path: MEDIA_PREFIX + name, preview: `/api/admin?action=file&name=${encodeURIComponent(name)}` };
        } catch (err) {
          if (err.status === 409 || /already exists|duplicate/i.test(err.message)) {
            name = `${base}-${Date.now().toString(36).slice(-5)}.${ext}`;
            continue;
          }
          throw err;
        }
      }
      throw new HttpError(409, "Couldn't find a free file name. Rename the file and try again.");
    },

    /** Public: streams an uploaded file (for thumbnails in the editor before the site is rebuilt). */
    async file(req, s, user, body, url, res) {
      const name = url.searchParams.get("name") || "";
      if (!/^[a-z0-9][a-z0-9._-]{0,120}$/i.test(name)) throw new HttpError(400, "Unknown file.");
      const r = await sb(s, `/storage/v1/object/public/${BUCKET}/${encodeURIComponent(name)}`, { raw: true });
      if (!r.ok) throw new HttpError(404, "File not found.");
      sendRaw(res, 200, Buffer.from(await r.arrayBuffer()), { "Content-Type": r.headers.get("content-type") || "application/octet-stream", "Cache-Control": "private, max-age=300" });
      return undefined;
    },

    async deploy() {
      return { state: "unknown" };
    },

    async check(req, s, user) {
      const steps = [];
      const add = (name, ok, fix = "") => steps.push({ name, ok, fix });
      add("Vercel settings SUPABASE_URL and SUPABASE_ANON_KEY", true);
      add(`Your login (${user.email}) is on the editor list`, true);
      try {
        await sb(s, "/rest/v1/site_content?select=id&limit=1", { token: user.token });
        add("Website tables exist in Supabase", true);
      } catch (err) {
        add("Website tables exist in Supabase", false, err.message);
      }
      try {
        await sb(s, `/storage/v1/object/list/${BUCKET}`, { method: "POST", token: user.token, body: { prefix: "", limit: 1 } });
        add("Photo storage is ready", true);
      } catch (err) {
        add("Photo storage is ready", false, err.message);
      }
      add("Publishing rebuilds the website (VERCEL_DEPLOY_HOOK)", !!s.hook, s.hook ? "" : "Saving works, but the website won't update by itself. In Vercel → your project → Settings → Git → Deploy Hooks, create a hook for branch main, copy its URL and add it as VERCEL_DEPLOY_HOOK (Production), then redeploy.");
      return { ok: steps.every((x) => x.ok), steps };
    },
  };

  return { actions, authenticate, sb };
}
