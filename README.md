# Prospecting Call Tracker — marketing website

This folder is the public website (home, software, consulting, how it works, about the founder, resources, pricing,
book a demo, contact, privacy, terms, thank-you and 404 pages). It is a plain, fast static site: **no npm packages, no
framework, nothing to install**. A small script turns one text file into the finished pages.

It is deployed as its **own Vercel project**, separate from the CRM app, and does not change how the CRM is built.

```
(repository root)
  content/site.json     ← ALL the words, prices, links, contact details and settings. Edit this file.
  assets/               ← styles.css, site.js (menu, forms, analytics), images, placeholders
  templates/            ← how the pages are laid out (only for design changes)
  build.mjs             ← builds the site into dist/
  check.mjs             ← checks the built site (links, headings, labels…)
  serve.mjs             ← previews dist/ on your computer
  vercel.json           ← Vercel settings and security headers
```

## 1. Changing text

Open `content/site.json` (on GitHub: open the file, click the pencil ✏️, edit, then **Commit changes**). Vercel rebuilds the
site automatically in about a minute.

- Change only the text **between the quotes**. Keep the quotes, commas and brackets exactly as they are.
- To write a quote mark inside text, use a curly one (“ ”) or `\"`.
- If you make a typo, the build stops and tells you the line number (for example *“site.json has a formatting mistake near
  line 212”*). The old site stays online until it is fixed.

Where things are:

| What | Where in `site.json` |
| --- | --- |
| Site name, web address, tagline, brand statement | `site` |
| Email, phone, address, office hours | `contact` |
| Facebook / Instagram / LinkedIn / YouTube links | `social` (leave `url` empty to show a placeholder) |
| Top menu and the “Book a Demo” button | `nav`, `headerCta` |
| Button labels and where they go | `ctas` |
| Footer columns, disclaimer, provider-fees note | `footer` |
| Each page’s headline, sections, SEO title and description | `pages.home`, `pages.software`, `pages.consulting`, `pages.howItWorks`, `pages.about`, `pages.resources`, `pages.pricing`, `pages.demo`, `pages.contact`, `pages.privacy`, `pages.terms`, `pages.thankYou`, `pages.notFound` |
| Software features (benefit, description, picture) | `pages.software.features` |
| Consulting services and “Who this is for” | `pages.consulting.services`, `pages.consulting.who` |
| Founder story, name and numbers | `pages.about.story`, `pages.about.founderName`, `pages.about.stats` |
| Testimonials, results numbers, case study | `pages.home.socialProof` |
| Pricing cards and footnotes | `pages.pricing.plans`, `pages.pricing.footnotes` |
| Resources list | `pages.resources.items` |
| FAQs | `pages.home.faq`, `pages.consulting.faq`, `pages.pricing.faq` |
| Form questions, consent text, where forms are sent | `forms` |
| Analytics | `analytics` |

## 2. Replacing placeholders

Anything written in **[square brackets]** or shown with a dashed yellow outline on the site is waiting for real information.

- **Founder numbers** (`pages.about.stats`): put the real value in `"value"`, e.g. `"value": "7+"`. Empty values show `[—]`.
- **Founder name**: `pages.about.founderName`.
- **Testimonials** (`pages.home.socialProof.testimonials`): replace `quote`, `name`, `role`, then set `"placeholder": false` so
  the yellow “Placeholder” tag disappears. **Only publish real quotes from real clients, with their permission.**
- **Results numbers** (`pages.home.socialProof.metrics`): fill `"value"` only with real, verifiable numbers.
- **Prices** (`pages.pricing.plans`): `"price"` is the big line (e.g. `"$499 / month"`), `"priceNote"` the small line under it. Set
  `"priceNote": ""` to hide it. Keep the provider-fees footnote and “no unlimited custom programming” wording.
- **Contact details and social links**: `contact` and `social`. Empty ones show “[add …]” placeholders.

### Photos, screenshots and videos

1. Put the file in `assets/` (e.g. `assets/img/founder.jpg`, `assets/img/crm-dialer.png`). Use JPG/WebP for photos, PNG for
   screenshots, and keep images under ~300 KB (1600 px wide is plenty).
2. In `site.json` change the matching `"src"` to `/assets/img/your-file.jpg`, write a real description in `"alt"`
   (what is in the picture, for blind visitors and Google), and set `"placeholder": false`.
   - Founder photo: `media.founderPhoto` (portrait, 4:5, e.g. 800 × 1000).
   - CRM screenshots: `media.screenshots` (16:10, e.g. 1600 × 1000).
3. **Demo video**: upload it to YouTube or Vimeo, copy the **embed** address and paste it into `media.demoVideo.embedUrl`:
   `https://www.youtube-nocookie.com/embed/VIDEO_ID` or `https://player.vimeo.com/video/VIDEO_ID`.
4. **KPI Tracker file**: put it in `assets/downloads/` and set `media.kpiTrackerDownloadUrl` to `/assets/downloads/your-file.pdf`;
   visitors then get a download button after sending the form.

The dashboard pictures on the site are drawings made in code (in `templates/mockups.mjs`) with sample data and a caption
saying so; they are not screenshots and need no image files.

## 3. Forms → CRM

Every form (demo, strategy call, audit, KPI tracker, Founding Team, contact) sends the visitor’s answers to the CRM, which creates a
lead for the Owner with a note and a follow-up due today. To connect:

1. In the CRM’s Vercel project set `WEBSITE_LEADS_ORG_ID` and `WEBSITE_ORIGINS` (see the CRM’s `DEPLOYMENT.md`, section 4.17).
2. In `site.json` set `forms.endpoint` to `https://YOUR-CRM-DOMAIN/api/public/website-lead` (your real CRM address).

Until step 2 is done, forms show “This form isn’t connected yet” and send nothing. Forms include a hidden anti-spam field, a
required consent checkbox linked to the Privacy Policy, and work without JavaScript too (they then return to `/thank-you`).

## 4. Analytics (optional)

Nothing loads unless you turn it on in `site.json → analytics`:

- Google Analytics 4: `"googleAnalyticsId": "G-XXXXXXXXXX"`.
- Plausible: `"plausibleDomain": "yourdomain.com"`.

Events sent: `cta_click` (with the button label and page), `demo_request_submit`, `strategy_call_submit`, `audit_request_submit`,
`kpi_download_submit`, `founding_team_submit`, `contact_submit`, `form_error`. They are also pushed to `window.dataLayer`, so Google
Tag Manager can use them.

## 5. Build and preview on your computer (optional)

You only need [Node.js](https://nodejs.org) 20 or newer.

```bash
cd website
node build.mjs     # builds dist/
node check.mjs     # checks links, headings, labels, images
node serve.mjs     # preview at http://localhost:4321
```

## 6. Deploy on Vercel (once)

1. Vercel → **Add New… → Project** → import **this website's own GitHub repository** (not the CRM's).
2. **Root Directory**: leave blank (the repository root). **Framework Preset**: Other.
3. **Build Command**: `node build.mjs` · **Output Directory**: `dist` · **Install Command**: leave as set by `vercel.json`
   (there is nothing to install). These are also in `vercel.json`.
4. **Deploy**. Then **Settings → Domains** → add your domain (e.g. `www.prospectingcalltracker.com` and
   `prospectingcalltracker.com`) and follow Vercel’s DNS instructions at your domain registrar.
5. Make sure `site.url` in `site.json` is your final address (it is used for search-engine links, the sitemap and social
   previews), and add the same address(es) to the CRM’s `WEBSITE_ORIGINS`.
6. Optional: in **Settings → Git → Ignored Build Step** you can use `git diff --quiet HEAD^ HEAD -- .` so the website only
   rebuilds when something in this repository changed.

## 7. Security notes (for whoever maintains this)

- No inline scripts, no `onclick=` style attributes, no inline `style=` attributes: the Content-Security-Policy forbids them.
  `node check.mjs` fails if any appear.
- Each page carries a Content-Security-Policy `<meta>` tag built from `site.json` (it allows exactly the CRM address, analytics
  and video host you configured). `vercel.json` adds a second, fixed policy as a header (plus clickjacking and other protections).
  Browsers enforce both, so a script must pass both. If you use an analytics or video host other than Google Analytics,
  Plausible (`plausible.io`), YouTube or Vimeo, add it to the header in `vercel.json` too.
- Do not add third-party scripts or npm packages. The forms send data only to your own CRM.

## 8. Legal pages

`/privacy` and `/terms` are plain-English **drafts** and say so at the top. Have your attorney review them (especially texting and
calling consent) and then remove the `draftNote` text in `site.json`.
