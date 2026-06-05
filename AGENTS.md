# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing any code.

---

# daily-log — project guide

A private, personal iOS health & habit tracker. One screen per day to log **sleep,
movement, nourishment, hydration, weight, hair care, energy & notes**, plus two habit
**streaks** (sugar-free and a discreet "Focus"). Single-user, data lives on the device.

## Stack

- **Expo SDK 56** + **React Native** + **TypeScript**
- **Expo Router** (file-based routing; tabs under `app/(tabs)/`)
- **AsyncStorage** for all local persistence
- **react-native-svg** for the Trends charts
- Fonts via `@expo-google-fonts/fraunces` + `@expo-google-fonts/dm-sans`
- **Supabase** is planned later for cloud sync + auth (not yet present)

## Commands

```sh
npx expo start        # start the dev server, then scan the QR with Expo Go on iPhone
```

Runs on a physical iPhone through **Expo Go** — no native build step. `npm run ios` /
`android` / `web` also exist but the iPhone-via-Expo-Go path is the one we use.

## Structure

- **`app/`** — routes. `_layout.tsx` loads fonts (gates render until ready) and defines
  the root Stack. `(tabs)/_layout.tsx` defines the two bottom tabs.
  - **`app/(tabs)/index.tsx`** — the **Today** screen. Owns `selectedDate`, `dayData`,
    and `settings` state; holds `updateDay()` (debounced) and `updateSettings()`
    (immediate); renders the streak tiles, the date bar, and all seven cards.
  - **`app/(tabs)/trends.tsx`** — the **Trends** tab: weekly Sleep + Active-minutes bar
    charts and the weight trend chart (SVG). Reloads on focus via `useFocusEffect`.
- **`components/`** — shared UI. `Card.tsx` (the rounded card shell every card section
  uses), `DateBar.tsx` (day navigation + saved indicator), `StreakTile.tsx` (reusable
  streak counter with start / count / edit / reset states).
  - **`components/cards/`** — one file per Today section: `SleepCard`, `MovementCard`,
    `NourishmentCard`, `HydrationCard`, `WeightCard`, `HairCareCard`, `EnergyNotesCard`.
    Each is a controlled component: takes current values + `onChange`-style callbacks,
    holds no persistence logic of its own.
- **`lib/storage.ts`** — the entire data layer. Types (`DayData`, `Meal`, `Settings`,
  `DayEntry`) and their defaults; `toDateKey`; `getDay` / `saveDay`; `getSettings` /
  `saveSettings`; `getRecentDays(n)` (batched `multiGet` range loader used by Trends).
- **`constants/theme.ts`** — the single source of truth for `Colors`, `Spacing`, and
  `Radius`. (Note: `constants/Colors.ts` is leftover starter scaffolding — use
  `theme.ts`.)

## Conventions

- **Theme tokens only.** All colours, spacing, and radii come from `constants/theme.ts`
  — never hard-code hex/px when a token exists.
- **Type:** Fraunces for headings/numbers, DM Sans for body/labels. Reference the loaded
  family names (e.g. `Fraunces_600SemiBold`, `DMSans_400Regular`).
- **Light theme only.** No dark mode; `userInterfaceStyle` is `light`.
- **Reuse `Card` and `StreakTile`** rather than rebuilding their shells.
- **Persistence timing:** continuous inputs (text, numbers, sliders) autosave through
  `updateDay()` with a **~500 ms debounce**; discrete toggles/buttons (sugar-free,
  hair-care toggles, streak actions) write **immediately**.
- **Storage keys:** day data at **`daily-log:day:YYYY-MM-DD`** (local-time date key),
  settings at **`daily-log:settings`**.
- **Forward-compat:** `getDay` (and `getRecentDays`) merge stored data over
  `DEFAULT_DAY` and backfill missing meal fields, so saves from older builds never
  break. Preserve this when adding fields — add to the defaults, never assume presence.

## Design principles (keep these)

- **Nourishment is logged as daily totals, not a meal list.** Two fields per day:
  `calories` (integer kcal, nullable) and `mealQuality` (1–5 dot selector). No
  per-meal breakdown, no macro targets, no deficit math.
- **Weight is trend-first.** The 7-day trailing average (the gold line) is the emphasis,
  not any single morning's number. Surface pace as ~lb/week; a too-fast drop should
  prompt eating *more*, not less.
- **The "Focus" streak stays discreetly labelled** — just "Focus", no extra wording.
- **The user's data is private to them.** Treat it as personal and local.

## Git

- Small, focused commits; **conventional commit** messages (`feat:`, `chore:`,
  `docs:`…).
- Push to **`origin main`** after each committed phase.
