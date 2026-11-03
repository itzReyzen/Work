# KnowAboutSSR — Phase 1 Setup

## 1. Create the Supabase project
1. Go to supabase.com → New project (free tier is fine).
2. Project Settings → API → copy **Project URL** and **anon public key**.

## 2. Run the schema
Dashboard → **SQL Editor** → paste all of `supabase/schema.sql` → Run.
This creates all tables, RLS policies, triggers, storage buckets, realtime, and seeds your services, categories, and settings.

## 3. Auth settings (Authentication → Providers / Settings)
- **Anonymous sign-ins: ON** (lets customers order and chat without an account).
- **Email provider: ON**, but **"Allow new users to sign up": OFF** so nobody can register themselves.
- Authentication → Sessions: set **JWT expiry** (e.g. 3600s) and **Inactivity timeout** / **Time-box** (e.g. 8h) for admin session expiration.

## 4. Create your admin account
1. Authentication → Users → **Add user** → email `parlegez@gmail.com` + a strong password (Supabase stores it hashed with bcrypt).
2. SQL Editor → run:
   ```sql
   insert into public.admin_users (id, email)
   select id, email from auth.users where email = 'parlegez@gmail.com';
   ```
Only users in `admin_users` get admin rights, both in the `/admin` middleware and in every RLS policy.

## 5. Environment variables
Copy `.env.example` to `.env.local` and fill in the URL and anon key. On Vercel, add the same variables under Project Settings → Environment Variables.

## 6. Set your UPI details (later, from admin)
`payment.upi_id` starts empty on purpose. You'll set it and upload a QR from the admin dashboard in Phase 4.

## Security summary
- No passwords or keys in frontend code; auth is server-validated (`getUser()`).
- Prices are copied from `services` by a DB trigger, so customers can't tamper with them.
- Orders can't be self-marked paid; only an admin-verified payment record flips `payment_status` to `paid`.
- Customers can only read their own orders, chats, payments, and chat images. Internal notes are admin-only.
- Chat uploads are in a private bucket, limited to 5 MB and image types.

## Next
Phase 2: Next.js scaffold + public site (hero, about, services, portfolio, contact).

---

## 7. Hero image
Put your original art at `public/hero.png`. If it has a solid black background instead of transparency, turn on **hero blend** in Admin → Content → site. The black then blends into the page. If you already ran the schema, add the setting first:
```sql
update public.settings set value = value || '{"hero_blend": false}' where key = 'site';
```

## 8. Run locally
```bash
npm install
cp .env.example .env.local   # fill in the Supabase URL + anon key
npm run dev                  # http://localhost:3000  (admin: /admin/login)
```

## 9. Deploy (Vercel)
Push to GitHub → import in Vercel → add the 3 env vars from `.env.example` (set `NEXT_PUBLIC_SITE_URL` to your real domain) → deploy. Then in Supabase → Authentication → URL Configuration, set the Site URL to the same domain.

## 10. Launch test checklist
- [ ] Public site loads, services and prices appear
- [ ] Order Now creates an order and opens the chat
- [ ] The message shows up in /admin → Chat in real time, and your reply reaches the customer
- [ ] Online dot turns green for visitors while /admin is open
- [ ] Customer submits a UTR → you click Verify → order shows Paid
- [ ] Edit a price in admin → the public site updates without a redeploy
- [ ] Upload a portfolio project with an image
- [ ] Mark maintenance mode on, check the public site, then turn it off
- [ ] Check on a real phone (layout, chat, UPI button)
- [ ] Replace the starter text on /privacy and /terms with your own policies

---

## 11. Spam protection
Removed for now. Anonymous sign-in has no captcha, so make sure CAPTCHA is OFF in Supabase → Authentication → Attack Protection.

## 12. Email alerts for new orders
1. Create a free account at resend.com **using parlegez@gmail.com** (the free sandbox sender `onboarding@resend.dev` can only email the account owner). Create an API key.
2. Set `RESEND_API_KEY`, `WEBHOOK_SECRET` (any long random string) and optionally `NOTIFY_EMAIL` in Vercel, then redeploy.
3. Supabase → Database → **Webhooks** → Create: table `orders`, event **Insert**, type HTTP Request, method POST, URL `https://YOUR-DOMAIN/api/notify-order`, add HTTP header `x-webhook-secret` = your `WEBHOOK_SECRET`.
4. Place a test order. You should get an email within seconds. If not, check the webhook's delivery log in Supabase and the Vercel function logs.
