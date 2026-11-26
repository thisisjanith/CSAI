# CSAI: Ceylon School of Artificial Intelligence

Institute website with student accounts, course enrollment, bank-transfer payments, a student dashboard with Zoom class links, and an admin panel.

**Stack:** Vite, React, TypeScript, Tailwind CSS v4, React Router, Supabase (auth, Postgres, storage), Three.js, GSAP + ScrollTrigger, Lenis, tsParticles.

## Run locally

```bash
npm install
cp .env.example .env      # then fill in your Supabase keys (see below)
npm run dev               # http://localhost:5173
```

The public pages work without Supabase (courses fall back to `src/data/courses.ts`). Sign in, dashboards and payments need the backend below.

## 1. Create the Supabase backend (free tier is fine)

1. Create a project at https://supabase.com.
2. **SQL Editor → New query**, paste all of [`supabase/schema.sql`](supabase/schema.sql) and click **Run**.
   This creates the tables, security rules, the private `payment-slips` storage bucket and the four draft courses.
3. **Project Settings → API**: copy the *Project URL* and *anon public* key into `.env`:
   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```
4. **Authentication → URL Configuration**
   - Site URL: your live domain (e.g. `https://csai.lk`), or `http://localhost:5173` while developing
   - Redirect URLs: add `http://localhost:5173/**` and `https://YOUR-DOMAIN/**`

## 2. Enable Google sign-in

1. In [Google Cloud Console](https://console.cloud.google.com/apis/credentials) create an **OAuth client ID** (type: Web application).
2. Authorised redirect URI: `https://YOUR-PROJECT.supabase.co/auth/v1/callback`
3. In Supabase **Authentication → Providers → Google**, enable it and paste the Client ID and Secret.

## 3. Make yourself an admin

Sign up on the site, then run in the SQL Editor:

```sql
update public.profiles set role = 'admin' where email = 'you@example.com';
```

Refresh the site: you will see **Admin panel** in the account menu (`/admin`). Admins can also promote other users from **Admin → Students**.

## 4. Edit your details

- Bank account, contact details, WhatsApp number: [`src/lib/config.ts`](src/lib/config.ts)
- Courses, prices and outlines: **Admin → Courses** (no code changes needed)

## How it works

| Step | Student | Admin |
| --- | --- | --- |
| 1 | Signs up (Google or email) | |
| 2 | Opens a course → **Enroll now** → sees bank details and a unique reference (e.g. `CSAI-3F9A1C`) | |
| 3 | Uploads the bank slip | Sees it in **Admin → Payments**, views the slip, **Approve** or **Reject** with a note |
| 4 | Enrollment becomes **Active** | Schedules classes in **Admin → Schedule** (Zoom link, ID, passcode, optional weekly repeat) |
| 5 | Dashboard shows the schedule; **Join on Zoom** unlocks 15 minutes before class | Adds recording links after class |

Security is enforced in the database (row-level security): students only see their own data, Zoom links are only visible to students with an active enrollment for that course, and only admins can approve payments or change roles.

## Deploy

Any static host works (Vercel, Netlify, Cloudflare Pages):

- Build command: `npm run build`, output directory: `dist`
- Add the two `VITE_SUPABASE_*` environment variables
- Add an SPA fallback so deep links work (all routes → `/index.html`). On Netlify: `public/_redirects` with `/* /index.html 200`. Vercel and Cloudflare Pages handle Vite SPAs automatically.

## PayHere (later)

The schema already has `payment_method = 'payhere'` and a `gateway_ref` column. The plan: a Supabase Edge Function creates the PayHere hash, and a second function receives PayHere's `notify_url` callback, verifies the MD5 signature and inserts an approved payment and active enrollment.
