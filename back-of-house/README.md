# Back of House

An in-house app for a small café. Staff clock in with a PIN, count stock at closing, and learn drinks step by step. Managers get a reorder list built for them, hand it to Muse (Meta's personal AI agent) to place the orders, and publish a daily menu suggested from the weather and what's in stock.

Built with Next.js 16, TypeScript and Supabase. It runs as a full demo with no setup at all.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000 and choose **Maya, the manager** or **Leo, a barista**. The demo café's PINs are 1111, 2222, 3333 and 4444. Demo data lives in memory and resets when the server restarts or you tap **Reset demo data**.

```bash
npm test        # menu engine, reorder logic and demo store
npm run build   # production build with type checking
```

## What it does

| Screen | For | What happens |
| --- | --- | --- |
| **Today** | Everyone | Who's on shift, what's running low, today's weather and menu. First-time users get a three-step "start here" card. |
| **Clock in** | Everyone | Tap your name, type a 4-number PIN on the pad or keyboard. The same steps clock you out. |
| **Inventory** | Everyone | Count stock with big +/− buttons or by typing. Items under their reorder level are flagged with an icon, a word and a color. |
| **Reorder** | Managers approve | Every low item, topped back up to its "full" level in whole packs, grouped by supplier. Approve it and copy a ready-made message for Muse, or the same order as JSON. |
| **Daily menu** | Managers publish | A suggested menu from the forecast and stock. Switch items on or off, feature a drink of the day, publish. Try other forecasts to see how it changes. |
| **Recipes** | Everyone | Ingredients scaled to 12 or 16 oz, steps with timers, and a practice mode that shows one step at a time with tips. "Log one made" takes the ingredients out of stock. |

The menu includes coffee, tea, food, **energy drinks** (a citrus yerba mate sparkler and two berry refreshers) and **sugar-free** choices (sugar-free vanilla and caramel lattes, sugar-free berry energy, a sugar-free oat cookie, plus drinks that are naturally sugar-free). Every item shows dietary tags in words: Sugar-free, Dairy-free, High caffeine.

## How the menu is suggested

`lib/menu-engine.ts` is a small, tested rules engine rather than a black box:

1. Anything the café can make fewer than 12 of is left off, with the reason shown.
2. Every item gets a score: cold drinks rise with temperature, hot drinks with cold, cosy items (mocha, chai, soup) on rain, energy drinks on hot afternoons, and a small boost for items that use plentiful stock so it doesn't go to waste.
3. The top 8 drinks and 4 foods fill the menu.
4. **Variety rule:** if a sugar-free drink or an energy drink can be made, at least one of each is always on. Some guests need a sugar-free option, so the app protects it.
5. The drink of the day is the top drink that uses plentiful stock.

A manager always has the final say before anything is published.

## Muse handoff

Muse is Meta's personal AI agent (launched September 2026). It can shop online, and it asks for approval before completing a purchase. There's no public developer API yet, so the app writes a clear message the manager pastes into Muse, in its app or on WhatsApp:

```
Hi Muse, please place these restock orders for Little Bloom Café. Use our usual account
with each supplier, and check with me before you complete each checkout.

Valley Dairy Co.
  - Whole milk: 6 × 4 L jug (24 L)
...
```

The same order is available as JSON (`orderJson` in `lib/reorder.ts`), ready for a direct integration if Meta opens one. A human approves twice: once in this app and once in Muse.

## Design and accessibility

The design system is pastel and calm: a soft pink-white page, one pastel per section (lavender, mint, peach, butter, sky) so people learn where they are, and a single berry accent for the main action on each screen. Titles use **Fredoka**; everything people read uses **Atkinson Hyperlegible Next**, designed by the Braille Institute so similar letters never look alike. Fonts are self-hosted in `app/fonts`.

- Every text color is at least **5.7:1** contrast on every background it sits on (WCAG AA asks for 4.5:1). Control borders and the focus ring are above 3:1.
- Status never relies on color: each chip pairs an icon and a word ("✓ In stock", "! Running low", "✕ Out of stock").
- Tap targets are at least 48px. Body text is 17px.
- Full keyboard use with a visible focus ring, a skip link, labelled landmarks, and real form labels.
- Saves, clock-ins and publishes are announced through a polite live region, not only a visual toast.
- Motion is minimal and turns off with `prefers-reduced-motion`.
- Every page opens with one plain sentence on what to do, and every empty state explains what will appear.

Pages were checked with axe-core (no violations).

## Architecture

```
app/
  (app)/            signed-in screens: today, clock, inventory, reorder, menu, recipes
  actions.ts        server actions; role checks happen here
  login/            demo role picker or Supabase email sign-in
lib/
  menu-engine.ts    weather + stock → menu suggestion (pure, tested)
  reorder.ts        low stock → order lines, Muse message, JSON (pure, tested)
  weather.ts        Open-Meteo forecast, with a sample fallback
  store/            one Store interface, two implementations: demo (memory) and Supabase
  seed.ts           the sample café, shared by demo mode and supabase/seed.sql
supabase/
  migrations/       schema, row level security, clock_toggle and record_made functions
  seed.sql          generated from lib/seed.ts (npm run seed:sql)
tests/              Vitest
```

Decisions worth calling out:

- **One store interface, two backends.** The UI never knows whether it's talking to memory or Postgres, which keeps the demo honest and makes a live portfolio link free to host.
- **PINs never leave the database.** Clocking in calls `clock_toggle`, a `security definer` function that checks a bcrypt hash. The team can read staff names and roles through a column grant, never `pin_hash`.
- **Server-trusted orders.** The browser sends only item ids and pack counts. The server rebuilds every line from inventory before saving.
- **Least privilege for counts.** Baristas can update `quantity` only (column grant); thresholds, menus and orders need a manager (`is_manager()` in RLS).
- **Stock updates are atomic.** `record_made` deducts every ingredient and a cup in one statement and logs usage for future forecasting.

## Use your own Supabase

1. Create a project at supabase.com.
2. In the SQL editor, run `supabase/migrations/0001_init.sql`, then `supabase/seed.sql`.
3. Under Authentication, add users. For each, add a row to `profiles` with their `user_id`, `display_name` and `role` (`manager` or `barista`).
4. Copy `.env.example` to `.env.local` and fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
5. Optional: set `SHOP_LATITUDE` and `SHOP_LONGITUDE` for the live forecast, and `NEXT_PUBLIC_SHOP_NAME`.

Change staff PINs in SQL: `update staff set pin_hash = crypt('5678', gen_salt('bf')) where id = 'leo';`

## Deploy

Push to GitHub and import the repo on Vercel. With no Supabase variables it deploys as the demo, which is ideal for a portfolio link.

## What's next

- A customer-facing site that reads the published menu.
- Forecast demand from `usage_log` plus weather, and feed it into par levels.
- Waste tracking (spoiled milk, remade drinks) with a weekly report.
- A direct Muse integration if Meta opens an API.
- A dark theme.
