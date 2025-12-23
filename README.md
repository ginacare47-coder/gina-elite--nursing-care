# Nurse Healthcare Booking Starter (Next.js + Supabase)

Mobile-first booking wizard + protected admin portal.

## 1) Unzip + install

```bash
unzip nurse-healthcare-booking-starter.zip
cd nurse-healthcare-booking
npm install
```

## 2) Create a Supabase project

1. Create a new Supabase project.
2. In **Project Settings → API**, copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 3) Create database tables + RLS

In **Supabase → SQL Editor**:

1. Run `supabase/schema.sql`
2. Run `supabase/rls.sql`

This creates:
- services
- availability
- blocked_dates
- appointments
- site_content
- profiles (role-based admin)

## 4) Create an admin user

1. In **Supabase → Authentication → Users**, create a user (email/password).
2. Make them admin:

```sql
update public.profiles
set role = 'admin'
where id = 'THE_USER_UUID';
```

> You can find the UUID in the Auth Users table.

## 5) Configure env vars

Copy `.env.example` to `.env.local` and fill in values.

```bash
cp .env.example .env.local
```

## 6) (Optional) Email notifications via Google Apps Script

This starter includes `scripts/email.gs`.

### Deploy steps
1. Go to `script.google.com` → New project
2. Paste `scripts/email.gs`
3. Deploy → **New deployment** → **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Copy the Web App URL into:

```
NEXT_PUBLIC_EMAIL_WEBHOOK_URL=...
NEXT_PUBLIC_ADMIN_NOTIFICATION_EMAIL=admin@clinic.com
```

When a booking is finalized, the app will POST to this webhook and send:
- Client confirmation email (if client email was provided)
- Admin notification email

## 7) Run locally

```bash
npm run dev
```

Open:
- Public landing page: http://localhost:3000
- Booking wizard starts at: http://localhost:3000/booking/step-1-service
- Admin portal: http://localhost:3000/admin/login

## Notes

### Booking flow
The booking wizard uses **sessionStorage** to keep the draft across step pages.
On the final step, it inserts an appointment with status `Pending`.

### Security
Row Level Security (RLS) is enabled:
- Public (anon) can read services/availability/blocked_dates
- Public can insert appointments, but ONLY with status `Pending`
- Only admins can read/update appointments and modify services/availability/content

### Wireframes
Reference wireframes are in `public/wireframes/`.

## Deploy
This is deployment-ready for Vercel/Netlify.
Just set the environment variables in your hosting provider.
