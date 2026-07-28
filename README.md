# EE Attendance Tracker — Launch Guide (Supabase edition, no card needed)

Ye backend ab **Supabase** use karta hai — Firebase jaisa hi (login + database),
lekin free tier ke liye koi card/billing nahi chahiye. Login email pe "magic link"
(bina password) se hota hai.

Total time: ~15-20 minutes, free hai.

---

## Step 1 — Supabase project banao

1. https://supabase.com par jao → **Start your project** → GitHub ya email se sign up karo.
2. **New project** → Organization select/create karo →
   - Name: `ee-attendance-knit`
   - Database password: koi bhi strong password daal do, kahin save kar lo (baad mein kaam nahi aayega directly, but rakh lo)
   - Region: `Mumbai (ap-south-1)` (India ke liye fastest)
3. **Create new project** — 1-2 minute mein ban jaayega.

---

## Step 2 — Database table banao

1. Left sidebar mein **SQL Editor** kholo → **New query**.
2. Ye poora SQL paste karo aur **Run** dabao:

   ```sql
   create table attendance_data (
     user_id uuid primary key references auth.users(id) on delete cascade,
     data jsonb not null default '{}'::jsonb,
     updated_at timestamptz default now()
   );

   alter table attendance_data enable row level security;

   create policy "Users can read own data"
     on attendance_data for select
     using (auth.uid() = user_id);

   create policy "Users can insert own data"
     on attendance_data for insert
     with check (auth.uid() = user_id);

   create policy "Users can update own data"
     on attendance_data for update
     using (auth.uid() = user_id);
   ```

   Ye table banayega jisme har student ki ek row hogi, aur Row Level Security
   (RLS) ensure karega ki koi bhi student sirf apni row dekh/edit kar sake, kisi
   aur ki nahi.

---

## Step 3 — API keys nikalo

1. Left sidebar mein **Project Settings** (gear icon) → **API**.
2. Do values copy karo:
   - **Project URL** (jaisa `https://xxxxx.supabase.co`)
   - **anon public** key (ek lambi string)

Ye do values Step 5 mein Vercel mein daalni hain.

---

## Step 4 — Code GitHub par lao

1. https://github.com par naya repo banao (e.g. `ee-attendance-tracker`).
2. Is poore folder (`ee-attendance-app/`) ko us repo mein upload karo — GitHub
   website se "Add file → Upload files" se bhi ho jaayega, git command line
   zaroori nahi.

   **Zaroori:** `.env` file kabhi GitHub par mat daalna (already `.gitignore`
   mein hai).

---

## Step 5 — Vercel par deploy karo

1. https://vercel.com par GitHub se login karo.
2. **Add New → Project** → apna repo select karo → **Import**.
3. Deploy se pehle **Environment Variables** mein ye 2 add karo:

   | Name | Value |
   |---|---|
   | `VITE_SUPABASE_URL` | Step 3 ka Project URL |
   | `VITE_SUPABASE_ANON_KEY` | Step 3 ka anon public key |

4. **Deploy** dabao. 1-2 min mein live URL milega, jaisa
   `https://ee-attendance-tracker.vercel.app`.

---

## Step 6 — Magic-link login ko live URL ke liye allow karo

Supabase ko batana hoga ki tumhara live site kaunsa hai, warna login link
kaam nahi karega:

1. Supabase dashboard → **Authentication → URL Configuration**.
2. **Site URL** mein apna Vercel URL daalo (poora, `https://` ke saath).
3. **Redirect URLs** mein bhi wahi URL add karo (aur chaho to
   `http://localhost:5173` bhi add kar sakte ho local testing ke liye).
4. Save karo.

Bas — ab wo URL kisi ko bhi bhej do. Jo bhi khole, apna email daalega, email
mein aaya link click karega, apna year select karega, aur uska data
automatically save/sync hoga.

---

## Baad mein kya edit karna hai

- **Timetable/subjects/holidays** ke defaults `src/Tracker.jsx` mein
  `YEAR_TEMPLATES` aur `DEFAULT_HOLIDAYS` mein hain.
- Local mein test karna ho to: `npm install` phir `npm run dev`
  (Node.js installed hona chahiye), aur ek `.env` file banao
  `.env.example` ki tarah apni Supabase values ke saath.
