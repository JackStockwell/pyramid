# Pyramid

An online multiplayer version of the classic Pyramid drinking card game, built with React, Convex, and shadcn/ui.

## How it plays

- Create a room and share the 5-letter code with friends (each on their own device).
- The host picks how many cards each player gets; whatever's left over becomes the
  pyramid (cards that don't form a clean triangle just widen the bottom row, same as
  dealing it out by hand — every card in the deck gets used).
- The deck is shuffled, hands are dealt (sorted low to high, Ace low), and the pyramid
  is laid out face-down.
- Peek at your hand during the countdown, then it hides — you're on memory from there.
  You can peek again anytime, but it gets announced to the whole table.
- The pyramid is flipped one card at a time, lowest row first. Its drink value is its
  own rank (7 = 7, King = 13, Ace = 1), shown big when it's active.
- Claiming a card, calling someone out, and settling bluffs all happen out loud around
  the table — the app just deals and reveals, it doesn't referee any of that.
- The game ends once the whole pyramid is revealed. Drink counts aren't tracked by the
  app — that part's on you.
- If you peek at your hand mid-round, it gets announced to the table's activity log —
  you're not supposed to look unless someone's calling you out.

## Getting started

```bash
npm install
npx convex dev   # first run: log in / pick or create a Convex project
```

`npx convex dev` writes `.env.local` with your deployment URL and keeps your backend
functions in sync as you edit files under `convex/`. Leave it running in one terminal.

In another terminal:

```bash
npm run dev
```

Open the printed local URL. To play with others, they'll need to reach that URL too —
either deploy the frontend (e.g. Vercel/Netlify) pointed at your Convex deployment, or
use a tunnel (e.g. `ngrok`) during local testing.

## Deploying to Railway

The Convex backend and the frontend deploy separately: Convex hosts your functions and
database on its own infrastructure, and Railway just serves the built React app. This
repo is wired up so one Railway build does both in the right order.

**One-time setup (do this yourself — both need your own account login):**

1. If you've only used `npx convex dev` locally so far, your project is still a
   throwaway anonymous deployment. Link a real one:
   ```bash
   npx convex dev --configure=new
   ```
   Follow the prompts to log in and create/select a Convex project, then stop it
   (`Ctrl+C`) once it says functions are ready — you don't need to keep it running for
   this step, it just links the project.
2. Open the [Convex dashboard](https://dashboard.convex.dev), select your project →
   your **production** deployment → **Settings → Deploy Keys**, and generate a
   production deploy key. Copy it.
3. Push this repo to GitHub (a remote is already configured):
   ```bash
   git add -A
   git commit -m "Ready for deployment"
   git push -u origin main
   ```
4. In [Railway](https://railway.app), create a new project → **Deploy from GitHub
   repo** → select this repo.
5. In the Railway service's **Variables** tab, add:
   - `CONVEX_DEPLOY_KEY` = the production deploy key from step 2.

That's it — `railway.json` in this repo tells Railway to run
`npx convex deploy --cmd 'npm run build'` as the build step (which pushes your Convex
functions to production *and* builds the frontend with the right deployment URL baked
in), then `npm run start` (a static file server with client-side routing support) to
serve it. Every push to the connected branch redeploys both together.

## Stack

- [React](https://react.dev) + [Vite](https://vite.dev) + TypeScript
- [Convex](https://convex.dev) for real-time multiplayer state
- [shadcn/ui](https://ui.shadcn.com) + Tailwind CSS for the interface
