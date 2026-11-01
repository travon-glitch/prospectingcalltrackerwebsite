# Directus — optional content backend

[Directus](https://github.com/directus/directus) gives the website a full back office: a dashboard to edit every page,
a file library for photos, user accounts with roles (invite your team), revision history, and automations.

**You don't need it to launch.** The website deploys to Vercel and works on its own, with the built-in editor at `/admin`.
Add Directus when you want team logins and a bigger back office. When Directus is turned on, the site reads its content
from Directus and `/admin` points people there instead.

```
 Directus (your server)  ──save──▶  Flow calls Vercel deploy hook  ──▶  Vercel builds the site
        ▲                                                                  │
        └──────────── build reads content with a read-only token ◀─────────┘
```

## What gets created

| In Directus | What it holds |
| --- | --- |
| **Website → Website settings** | Business name, web address, brand colors, analytics |
| **Website → Contact & social** | Email, phone, address, hours, social links |
| **Website → Menu & buttons** | Top menu, corner button, every button on the site |
| **Website → Footer / Forms / Photos & video** | Footer links and small print, form settings, founder photo, video, KPI download |
| **Pages → Page: Home … Page: 404** | Everything on each page (groups for each section, repeaters for lists) |
| **Pages → Extra pages** | New pages you add, each with its own web address |
| Role **Website editor** | For your team: edit content and upload files, nothing else |
| User **Website build** (read-only token) | What Vercel uses to read the content |
| Flow **Rebuild website on Vercel** | Rebuilds the site about a minute after anyone saves |

## Setup (about 30 minutes, once)

### 1. Run Directus somewhere (not on Vercel)

Directus needs an always-on server and a database, which Vercel doesn't provide. Pick one:

- **Directus Cloud** (easiest, paid): <https://directus.io/cloud> — create a project; skip to step 2.
- **Your own server** (a $6–12/month VPS, Railway, Render, Coolify…) with Docker:
  ```bash
  cp cms/.env.example cms/.env        # fill in the values
  docker compose -f cms/docker-compose.yml --env-file cms/.env up -d
  ```
  Point a subdomain such as `cms.prospectingcalltracker.com` at it with HTTPS.

Licence note: Directus is free for organisations under US$5M in yearly revenue (BSL licence); larger ones need a licence.

### 2. Get two values

- **Admin token**: log in to Directus → your user (bottom left) → **Token** → generate → copy → **Save**.
- **Vercel deploy hook**: Vercel → website project → **Settings → Git → Deploy Hooks** → name `Directus`, branch `main` → copy the URL.

### 3. Run the setup script from this folder (Node 20+, nothing to install)

```bash
DIRECTUS_URL=https://cms.prospectingcalltracker.com DIRECTUS_ADMIN_TOKEN=paste-admin-token VERCEL_DEPLOY_HOOK=paste-hook-url node cms/setup.mjs
```

It creates everything above, imports the current website content and images, and prints a **DIRECTUS_TOKEN**.
It is safe to run again (it only adds what's missing). `--reimport` overwrites Directus with `content/site.json`;
`--new-token` makes a new build token.

### 4. Turn it on in Vercel

Vercel → website project → **Settings → Environment Variables**:

| Name | Value |
| --- | --- |
| `DIRECTUS_URL` | e.g. `https://cms.prospectingcalltracker.com` |
| `DIRECTUS_TOKEN` | the token printed by the setup script (read-only) |

Redeploy. From now on, edit in Directus; the site rebuilds by itself after each save.

### 5. Invite your team

Directus → **User Directory → Invite user** → role **Website editor**.

## Good to know

- If Directus is down or a change can't be built, the Vercel build stops and **the current live site stays online**.
- Images uploaded in Directus are copied into the website at build time (`/assets/cms/…`), so the site never depends on
  Directus being up for visitors.
- Inside lists (e.g. screenshots, extra-page sections), image fields take a file ID from the File Library (open the file
  and copy its ID) or a website path like `/assets/img/logo.svg`.
- To go back to the built-in editor, delete `DIRECTUS_URL` and `DIRECTUS_TOKEN` in Vercel and redeploy (the site then uses
  `content/site.json`, which Directus does not update; copy changes over first if you need them).
