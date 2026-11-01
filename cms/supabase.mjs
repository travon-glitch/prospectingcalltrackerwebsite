// Reads the website content from Supabase for the build (used by build.mjs when SUPABASE_URL and SUPABASE_ANON_KEY
// are set). Only the public key is needed: published content and photos are public by design (supabase/setup.sql).

const BUCKET = "website-media";
const MEDIA = /\/assets\/media\/([a-z0-9][a-z0-9._-]{0,120})/gi;

/**
 * Returns { site, files, fromSupabase } — `site` in the content/site.json shape, `files` the uploaded photos the site
 * uses ([{ name, bytes }]), to be written to dist/assets/media/. Before the first publish (empty table) it returns
 * the fallback (content/site.json).
 */
export async function pullSupabase({ url, key, fallback }) {
  const base = url.trim().replace(/\/+$/, "");
  const get = async (path) => {
    let res;
    try {
      res = await fetch(base + path, { headers: { apikey: key }, signal: AbortSignal.timeout(30000) });
    } catch (err) {
      throw new Error(`couldn't reach Supabase at ${base} (${err.message}). If the project is paused, restore it at supabase.com.`);
    }
    if (!res.ok) {
      const text = await res.text();
      if (/PGRST205|could not find the table/i.test(text)) throw new Error("the website tables don't exist yet. Run supabase/setup.sql in Supabase → SQL Editor.");
      throw new Error(`Supabase answered ${res.status} for ${path.split("?")[0]}: ${text.slice(0, 200)}`);
    }
    return res;
  };
  const rows = await (await get("/rest/v1/site_content?id=eq.1&select=content,version")).json();
  if (!rows.length) return { site: fallback, files: [], fromSupabase: false };
  const site = rows[0].content;
  const names = new Set([...JSON.stringify(site).matchAll(MEDIA)].map((m) => m[1]));
  const files = [];
  for (const name of names) {
    const res = await get(`/storage/v1/object/public/${BUCKET}/${encodeURIComponent(name)}`);
    files.push({ name, bytes: Buffer.from(await res.arrayBuffer()) });
  }
  return { site, files, fromSupabase: true, version: rows[0].version };
}
