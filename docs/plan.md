# Daily Log — Build & Learning Plan

A personal iOS app for tracking sleep, movement, nourishment, hydration, weight,
hair-care routine, and habit streaks — built so that **you learn real software
engineering** as it comes together.

---

## 1. What we're building

A private, cloud-synced iOS app where you log your day and watch trends over time.

**Design principles (these are deliberate — keep them):**
- **Nourishment, not calorie-policing.** We log *what* you eat and flag hair-supportive
  nutrients (protein, iron, omega-3, veg). No calorie ceilings or deficit ledgers.
- **Weight is trend-first.** A 7-day trend line is the focus; single-day numbers are noise.
- **Private by default.** A PIN lock guards the app; the discreet "Focus" streak is yours alone.
- **Your data is yours.** Cloud-synced *and* exportable to a file you control.

---

## 2. How we'll work — the "command center" model

You'll run two Claudes with two different jobs:

| Where | Role | Does |
|-------|------|------|
| **This chat (Claude on web)** | Architect & reviewer | Designs, decides, writes the prompts, reviews outputs, explains concepts |
| **Claude Code (in VS Code)** | Builder | Creates and edits the actual project files on your machine |
| **You** | Pilot | Run commands, test on your phone, paste results back here |

**The loop for every step:**
1. We plan the step here and I write you a precise prompt.
2. You paste that prompt into Claude Code in VS Code.
3. Claude Code builds it; you run/test it on your phone.
4. You paste the output (or screenshots/errors) back here.
5. We review, fix, and lock it in — then move to the next step.

This keeps the *thinking* in one place and the *building* in another, which is exactly
how senior engineers separate design from implementation.

---

## 3. The tech stack (and why each piece)

- **Language: TypeScript** — JavaScript with type safety. It catches mistakes before you
  run the app and is the single most useful thing you can learn here.
- **Framework: React Native via Expo** — this builds a **true native iOS app** (not a
  website). Expo lets you run it on your real iPhone through the free **Expo Go** app while
  developing — no Mac required to start.
- **Navigation: Expo Router** — moving between screens.
- **Backend / Database / Login: Supabase** — a real Postgres database with built-in
  authentication and security rules. This is what makes your data live on a server, sync
  across devices, and survive a lost phone. Generous free tier.
- **Offline cache: Expo SQLite / AsyncStorage** — the app works with no signal and syncs
  when back online.
- **Charts: react-native-svg + Victory Native** — the weight trend and weekly bars.
- **Version control: Git + GitHub** — history of every change; your undo button for the
  whole project.

**Why Expo and not the alternatives:**

| Option | True iOS app? | Needs a Mac? | Cost | Learning value |
|--------|---------------|--------------|------|----------------|
| PWA (what we prototyped) | No (web app on home screen) | No | Free | Low–medium |
| **React Native + Expo** ← chosen | **Yes** | **No (to start)** | **Free** | **High** |
| Swift / SwiftUI | Yes (most "native") | Yes | Free, $99/yr to ship | High (iOS-only) |

Expo is the sweet spot: a genuine native app, free to build and run on your own phone,
reuses the React knowledge from our prototype, and teaches transferable skills.

---

## 4. Costs — the honest version

- **$0** to build, learn, and run it on your own iPhone (Expo Go + free tiers).
- **$99/year** *only* if you later want it published on the App Store for other people.
  You do **not** need this for personal use.
- Supabase's free database pauses after ~1 week of total inactivity — one tap to resume,
  or a tiny weekly ping keeps it awake.

---

## 5. Before we start — accounts & tools you set up

> I won't create accounts for you (that's yours to do), but I'll guide each one.

- [ ] **Node.js** (LTS version) installed
- [ ] **VS Code** with Claude Code connected ✅ (you have this)
- [ ] **Git** installed
- [ ] **GitHub** account (free)
- [ ] **Expo** account (free) + **Expo Go** app on your iPhone
- [ ] **Supabase** account (free)

---

## 6. Architecture in plain words

Your **app** (running on your iPhone) is the *client*. It talks over the internet to
**Supabase** (the *server*), which holds your data in a database and checks that you're
logged in. Each time you log something, the app saves it locally first (so it's instant
and works offline), then syncs it up to Supabase. **Row-Level Security** is a rule on the
database that guarantees you can only ever read or write *your own* rows — even if someone
had the app's address, they couldn't see your data without your login.

```
[ iPhone app ]  --( logs in, reads/writes )-->  [ Supabase: Auth + Postgres DB ]
      |                                                   ^
      | saves locally first (offline cache)               |
      +------------------ syncs when online --------------+
```

---

## 7. Data model

```
auth.users                 -- handled by Supabase Auth (your login)

daily_logs
  id          uuid  (primary key)
  user_id     uuid  (-> auth.users)
  date        date
  data        jsonb        -- { sleep, meals[], water, sugarFree,
                           --   shampoo, microneedle, weight, energy, notes }
  updated_at  timestamptz
  UNIQUE (user_id, date)

settings
  user_id       uuid (primary key -> auth.users)
  sugar_start   date         -- streak anchors
  focus_start   date
  prefs         jsonb        -- water goal, units, etc.

-- Row-Level Security: every row filtered by  user_id = auth.uid()
```

Using a single `jsonb` column for each day keeps the flexible shape we already designed
without redesigning the database every time we add a field.

---

## 8. The roadmap

Each phase lists its **goal**, what you'll **learn**, and ends with a **prompt to give
Claude Code**. We do them in order and don't move on until the "Done when" is true.

### Phase 0 — Environment & "Hello, iPhone"
- **Goal:** A blank Expo app running on your physical iPhone via Expo Go.
- **Learn:** terminal basics, Node/npm, what a dev server is, project structure.
- **Done when:** you see a "Hello" screen on your phone that updates live as code changes.
- **Prompt for Claude Code:**
  > Create a new Expo app using TypeScript and Expo Router named "daily-log". Set it up so I
  > can run it on my iPhone with Expo Go. Give me the exact terminal commands to start it,
  > and explain each file in the starter project in one line.

### Phase 1 — App shell, navigation & design system
- **Goal:** The screens and the look (colors, fonts, cards) from our prototype, with tab/stack navigation.
- **Learn:** components, props, reusable UI, styling in React Native, navigation.
- **Done when:** you can navigate the empty Daily Log screen and it matches our warm palette.
- **Prompt for Claude Code:** *(we'll write this together after Phase 0, porting the design)*

### Phase 2 — The daily log, stored locally (offline-first)
- **Goal:** All the inputs working — sleep, movement, meals, water (litres), weight, hair care, energy, notes — saved on the device.
- **Learn:** React state, forms/inputs, local storage (SQLite/AsyncStorage), dates.
- **Done when:** you log a day, close the app, reopen it, and it's still there.

### Phase 3 — Charts & streaks
- **Goal:** The 7-day weight trend line, weekly sleep/movement bars, and the sugar-free + Focus streaks.
- **Learn:** data transformation, rendering charts, derived values (rolling averages).
- **Done when:** trends render from your logged data.

### Phase 4 — Supabase: login + cloud sync
- **Goal:** Magic-link login; your data saves to the cloud and loads on any device.
- **Learn:** authentication, REST/database queries, environment variables & secrets, security (RLS).
- **Done when:** you log in on the app, see your data sync, and a fresh install pulls it back.

### Phase 5 — Real offline sync
- **Goal:** Edits made offline reliably reconcile with the cloud when you reconnect.
- **Learn:** caching strategies, sync/conflict handling, async edge cases.
- **Done when:** airplane-mode edits appear in the cloud once you're back online.

### Phase 6 — Polish
- **Goal:** PIN lock, app icon & splash screen, export/import backup, a weekly review view.
- **Learn:** app lifecycle, secure storage, file export, UX refinement.

### Phase 7 — (Optional) Reminders & App Store
- **Goal:** Local notifications for shampoo/microneedling days; optionally publish.
- **Learn:** notifications, build pipelines (EAS), release process.
- **Honest note:** iOS notification reliability for these apps is imperfect; we'll set
  expectations and consider calendar/email fallbacks. App Store publishing needs the $99/yr
  Apple account — skip unless you want it public.

---

## 9. The SDE concepts you'll pick up (mapped to phases)

- **Phase 0–1:** how projects are structured, the dev loop, components & props, version control with Git.
- **Phase 2:** state management, handling user input, persistence, working with dates.
- **Phase 3:** transforming data into views, derived/computed values.
- **Phase 4:** client–server model, APIs, databases, authentication, secrets, security rules.
- **Phase 5:** asynchronous programming, caching, offline-first design, conflict resolution.
- **Phase 6–7:** app lifecycle, secure storage, build/release pipelines (CI/CD basics).

Cross-cutting throughout: **reading errors calmly**, **debugging**, and **committing small
changes often** — the habits that matter more than any single technology.

---

## 10. Glossary

- **Native app** — software built to run directly on the phone's OS (vs. a website).
- **React Native** — write apps in React; it renders real native components.
- **Expo** — toolkit that makes React Native easy to run, test, and build without a Mac.
- **Expo Go** — free app that runs your project on your phone during development.
- **Supabase** — hosted Postgres database + auth + storage with a free tier.
- **Postgres** — a powerful, widely used relational database.
- **JSONB** — a flexible JSON column type in Postgres.
- **RLS (Row-Level Security)** — database rules ensuring users only access their own rows.
- **Magic link** — passwordless login via a link emailed to you.
- **Environment variable / secret** — config (like API keys) kept out of your code.
- **Git / GitHub** — version control and where your code lives online.
- **EAS** — Expo's cloud service for building installable app binaries.

---

## 11. The very first prompt to give Claude Code

Once Node, Git, and Expo Go are installed, paste this into Claude Code in VS Code:

> Create a new Expo app using TypeScript and Expo Router, named "daily-log", in the current
> folder. Configure it to run on a physical iPhone via Expo Go. After creating it, give me:
> (1) the exact terminal commands to install dependencies and start the dev server, and
> (2) a one-line explanation of what each top-level file and folder is for. Don't add any
> features yet — just the clean starter so I can confirm it runs on my phone.

Then bring the result back here and we'll review it together before Phase 1.
