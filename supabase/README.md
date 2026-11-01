# Website editor with Supabase (recommended)

With Supabase, the editor at `/admin` gets:

- **Real logins**: each person has their own email and password, with "Forgot password?" by email.
- **A team list**: you decide who may edit (the `website_admins` table). Others can't log in to the editor, even with
  a Supabase account.
- **Your content in a database**: every publish is saved with who did it and when (History & undo).
- **Photo storage**: uploads go to Supabase Storage and are copied into the website when it rebuilds.
- **No GitHub token needed.**

The website itself still runs on Vercel. When you click **Publish**, the editor saves to Supabase and asks Vercel to
rebuild the site (about a minute). If Supabase ever has a problem, the live site keeps running as it is.

---

## Setup (about 15 minutes, once)

### 1. Create the Supabase project
1. Go to <https://supabase.com> → **Sign up / Sign in** → **New project**.
2. Pick a name (e.g. `prospecting-website`), a strong database password (save it in your password manager), and the
   region closest to you. Click **Create new project** and wait a minute or two.

### 2. Create the tables, rules and photo storage
1. Open the file **`supabase/setup.sql`** from this folder (on GitHub: click it, then the copy icon).
2. **Change the email on the last line** to the email address you will log in with.
3. In Supabase: **SQL Editor → New query** → paste → **Run**. You should see "Success. No rows returned".

### 3. Create your login
1. Supabase → **Authentication → Users → Add user → Create new user**.
2. Type the **same email** you put in `setup.sql`, choose a password, tick **Auto Confirm User**, and click **Create user**.

### 4. Tell Supabase where the editor is (for password-reset and invite emails)
Supabase → **Authentication → URL Configuration**:
- **Site URL**: `https://YOUR-DOMAIN/admin` (for now: `https://prospectingcalltrackerwebsite.vercel.app/admin`)
- **Redirect URLs** → **Add URL**: the same address. If you use more than one address (e.g. your own domain and the
  vercel.app one), add each of them followed by `/admin`.

### 5. Create the "rebuild the website" link in Vercel
Vercel → your website project → **Settings → Git → Deploy Hooks**: name `Website editor`, branch `main` → **Create
Hook** → copy the URL. (The project must be connected to its GitHub repository: **Settings → Git → Connect Git
Repository**.)

### 6. Add four settings in Vercel
Supabase → **Project Settings → API Keys** (or **Settings → API**): copy the **Project URL** and the
**publishable** key (called **anon public** in older projects). **Never use the `service_role` / secret key here.**

Vercel → your website project → **Settings → Environment Variables** — add each with **Production** ticked:

| Name | Value |
| --- | --- |
| `SUPABASE_URL` | the Project URL, e.g. `https://abcdefgh.supabase.co` |
| `SUPABASE_ANON_KEY` | the publishable / anon public key |
| `VERCEL_DEPLOY_HOOK` | the deploy hook URL from step 5 |

(`ADMIN_PASSWORD` and `GITHUB_TOKEN` are no longer needed; you can delete them.)

### 7. Redeploy and log in
Vercel → **Deployments** → newest **Production** deployment → **⋯ → Redeploy**. When it shows **Ready**, open `/admin`
and log in with your email and password. The first time, the editor copies your current website content into Supabase
automatically.

---

## Adding someone to your team
1. Supabase → **SQL Editor** → run (with their email):
   ```sql
   insert into website_admins (email) values ('their.email@example.com');
   ```
2. Supabase → **Authentication → Users → Invite user** → their email. They get an email, click the link, choose a
   password on your website's `/admin` page, and they're in.

**Removing someone:** delete their row in **Table Editor → website_admins** (and optionally the user under
Authentication → Users).

## Good to know
- **Free plan pausing:** Supabase pauses free projects after about a week without use. The live website stays up, but
  the editor can't log in and rebuilds fail until you click **Restore project** in Supabase. The Pro plan never pauses.
- **Security:** the publishable key is meant to be public. Supabase's rules (in `setup.sql`) only let people on the
  `website_admins` list change anything, and every change is made with that person's own login. The secret
  (`service_role`) key is never used.
- **Password-reset emails** come from Supabase's built-in email service, which allows only a few emails per hour. For
  a team, connect your own email sender under Authentication → Emails → SMTP Settings.
- **Turning it off:** delete `SUPABASE_URL` and `SUPABASE_ANON_KEY` in Vercel and redeploy. The editor goes back to
  the GitHub mode (`ADMIN_PASSWORD` + `GITHUB_TOKEN`), and the site uses `content/site.json`, which doesn't include
  changes made in Supabase.
