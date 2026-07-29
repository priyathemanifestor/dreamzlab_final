# DreamzLab ✨

A dream journal / goal-tracking app. Set a dream, get an auto-generated
milestone roadmap, track progress, share to a social feed, and (optionally)
book time with mentors through a premium tier.

Built with **React + Vite**, styled to work great on phones, and set up as an
**installable PWA** — so people can "Add to Home Screen" on iOS/Android and it
opens full-screen like a native app. No backend: all data is stored locally
in the browser (`localStorage`).

## Features

- **Home dashboard** — daily affirmation, quote of the day, journey stats
- **My Dreams** — search/filter, expand a dream, tick off milestones, add your own
- **Add a Dream** — auto-detects a category from your title/description and
  generates a 5-step roadmap, or let you write your own milestones
- **Progress** — overall stats and per-dream progress bars
- **Social Feed** — like, comment, follow, and share a dream as a post
- **Mentors & Podcasts** — a premium (mocked) subscription that unlocks
  mentor booking, podcast episodes, and video clips
- **Discovery quiz** — a short quiz that suggests a starter dream

## Real AI: the milestone generator

"Build my roadmap for me" on the Add a Dream page calls a real Claude API
model (`claude-sonnet-5`) through a small serverless function at
`api/generate-milestones.js`. It reads your title/description and returns a
category + 5 tailored milestones. If the API isn't configured or the request
fails, it automatically falls back to the local keyword-matched templates in
`src/data.js`, so the app still works without a key.

**You need an Anthropic API key** to turn this on:

1. Get one at https://console.anthropic.com/settings/keys
2. For local dev: copy `.env.example` to `.env` and paste your key in
3. For a real deployment: add `ANTHROPIC_API_KEY` as an environment variable
   in your hosting platform's dashboard (Vercel: Project Settings → Environment
   Variables). Never commit your real key to GitHub.

The key is only ever read on the server side (`process.env.ANTHROPIC_API_KEY`
inside the serverless function) — it's never sent to the browser.

## Real AI: mentor recommendations & finding real achievers

Two more features call the real Claude API, both through small serverless
functions in `api/` (same pattern as the milestone generator — key stays
server-side only):

- **`api/recommend-mentors.js`** — on the Mentors page, Claude looks at your
  actual dreams and picks 1-3 of the in-app mentors most relevant to them,
  with a one-line reason. It can only choose from the fixed mentor roster
  (it's given the list explicitly) — it can't invent a mentor.
- **`api/find-inspiration.js`** — the new "🔎 Inspiration" tab on the Mentors
  page. This one is different: it gives Claude the real `web_search` tool
  and asks it to find real, publicly documented people with a similar
  achievement to whichever dream you pick, returning name + one factual
  sentence + a source link for each. Nothing is invented — if search doesn't
  turn up solid matches, it returns fewer results (or none) rather than
  guessing. Still worth clicking through to the source yourself before
  treating anything as fact.
- **`api/recommend-people.js`** — on the Social Feed, an "AI PEOPLE TO
  FOLLOW" section suggests who to follow based on real overlap between your
  dreams and what they've actually posted (not just matching categories),
  with a one-line reason for each. Same fixed-candidate-list safety pattern
  as the mentor recommendations — Claude can't suggest someone who isn't a
  real author already in the feed.

Both use the same `ANTHROPIC_API_KEY` as the milestone generator. The
inspiration search costs a bit more per call since it does live web
searches — worth knowing if you're watching API spend.

## Sharing dreams

The share modal (📢 on the home page) has two tiers:

- **Real, working now, no setup required:**
  - Facebook and LinkedIn — opens their official share dialog (`sharer.php`
    / `share-offsite`) in a popup, pre-filled with a caption
  - "Share via your phone" — uses the Web Share API (`navigator.share`) to
    hand a generated image card off to your device's native share sheet,
    where Instagram, WhatsApp, Messages, etc. will show up if installed
    (mobile browsers only; desktop falls back to a download)
  - "Download image card" — generates a 1080×1080 shareable image
    (`src/shareCard.js`, drawn with Canvas) you can manually upload anywhere,
    including Instagram, which doesn't support direct web-to-post sharing
  - "Copy caption" — for pasting into any platform's compose box

- **Not built (needs your own setup):** true one-click "auto-post to my
  Instagram/Facebook Page" requires registering a developer app with Meta,
  verifying a business, and completing Meta's App Review (their Graph API /
  Content Publishing API) — that's a real-world process only you can do,
  usually 1-4 weeks. If you go through that, `shareImage`/`shareFacebook` in
  `src/components/ShareModal.jsx` is where you'd wire in the authenticated
  posting call instead of the share-dialog links.

## Getting started

This project uses a Vercel serverless function (`api/`) alongside the Vite
frontend, so local dev needs the Vercel CLI rather than plain `vite dev`, or
the `/api/generate-milestones` call won't have anywhere to go:

```bash
npm install
npm i -g vercel      # one-time
vercel dev
```

Open the printed local URL — on your phone, open the same URL over your LAN
to test the mobile layout on a real device.

(If you don't want to install the Vercel CLI, `npm run dev` still works for
everything except the AI milestone generator — that falls back to the local
templates automatically when `/api/generate-milestones` isn't reachable.)

Build for production:

```bash
npm run build
npm run preview   # serve the production build locally (frontend only, no /api)
```

## Installing it like a mobile app

Once deployed (see below), open the site on a phone:

- **iOS Safari**: Share → "Add to Home Screen"
- **Android Chrome**: menu (⋮) → "Install app" / "Add to Home Screen"

It'll launch full-screen, no browser chrome, with its own icon — this is what
the PWA config in `vite.config.js` sets up.

## Video feed

The "🎥 Videos" tab on the Mentors page is a vertical, swipeable feed
(`src/components/VideoFeed.jsx`) of real, embedded YouTube videos — official
TED-channel talks, curated by category in `src/videoFeedData.js`. Video IDs
were verified via web search against actual official TED YouTube uploads,
not guessed from memory.

How it works, no backend needed:
- Standard YouTube iframe embeds (`youtube.com/embed/...`) — this is
  YouTube's own supported embedding mechanism, not scraping or reproducing
  their content.
- An `IntersectionObserver` tracks which slide is most visible and posts
  `playVideo`/`pauseVideo` commands to the relevant iframe via
  `postMessage`, so only the video you're looking at plays — the inline
  "TikTok-style" autoplay-on-scroll behavior.
- Starts muted (browsers block unmuted autoplay); a mute/unmute button
  controls the currently active video.
- Every slide also links out to the real `youtube.com/watch` URL, so if an
  embed ever gets disabled you can still watch it directly.

To add more videos: append to the `REAL_VIDEOS` array in
`src/videoFeedData.js` with a real YouTube video ID, title, speaker, and
which dream categories it fits — no other code changes needed.

## Upload your own podcasts ("📼 My Podcasts")

A Premium-gated tab on the Mentors page where you can upload your own audio
episodes featuring niche mentors you've found yourself — not the built-in
roster. Uses the same subscription lock as the rest of the Mentors section
(`isSubscribed`) and the same "🔒 Unlock with Premium" pattern.

Storage, honestly explained:
- Audio files go straight into **IndexedDB** (`src/podcastStorage.js`) as
  real Blobs — no base64 conversion, no server. This is a genuine, working
  upload feature with zero setup.
- It's **local to that browser only** — not synced across devices, not
  backed up anywhere, not visible to anyone else. The UI says this plainly
  so it's not mistaken for cloud storage.
- Files over 150MB are rejected client-side to keep browser storage sane;
  adjust `MAX_FILE_BYTES` in `src/components/MyPodcasts.jsx` if you want a
  different ceiling.
- If you outgrow this (want episodes to sync across your own devices, or be
  shareable), that's the point where you'd need real cloud storage — same
  trade-off as the video-upload discussion for the video feed.

## Milestone due dates & calendar sync

Every milestone can have a due date now, editable inline in My Dreams
(`src/components/MyDreams.jsx`) via a plain `<input type="date">` next to
each one. Newly auto-generated milestones get sensible defaults — staggered
one week apart from creation (`makeMilestones()` in `src/data.js`) — and
you can always change them.

- **Overdue / due today styling** — a milestone with a past due date shows
  a red "⚠️ Overdue" badge; today's shows an orange "📅 Due today" badge.
- **"📅 Due Today" section on Home** — pulls every not-yet-done, due-or-overdue
  milestone across *all* your dreams into one list, with a one-click "mark
  done." This is the most reliable reminder surface in the app: it's just
  reading your real local data, no permissions or notifications required.
- **Calendar export** (`src/calendarExport.js`, no backend needed):
  - Per-dream **"📅 Sync to Calendar"** button downloads a real `.ics` file
    (one event per milestone with a due date) — opens in Google Calendar
    (File → Import), Apple Calendar, Outlook, or anything else that reads
    the standard iCalendar format.
  - Per-milestone **"+ GCal"** link for a one-off quick-add to Google
    Calendar specifically, no download needed.

## Reminders & notifications

There are two different layers here, worth understanding separately:

**1. Local due-today reminder** (`src/notifications.js`) — a real system
notification (not just an in-page banner), triggered client-side the first
time you open the app on a given day. It reads your actual local milestone
data and includes how many are due, plus today's affirmation. Turn it on
with the **"🔔 Enable Reminders"** button in the sidebar. Because it's
entirely client-side:
- It's always accurate (it's reading your real data, not a synced copy).
- Nothing about your dreams or milestones ever leaves your device.
- The trade-off: it only fires when you actually open the app that day —
  not while the app/browser is fully closed.

**2. Real Web Push for the daily affirmation** — a true push notification
that arrives even with the app completely closed, using the actual Web
Push standard (not a simulation), and **personalized** in two ways:

- **Content**: if you have dreams saved, Claude writes a short affirmation
  tailored to their actual titles/categories (`personalizedAffirmation()`
  in `api/send-daily-push.js`), instead of the generic rotating list.
  Falls back to the generic rotation if there's no `ANTHROPIC_API_KEY`
  configured, you have no dreams saved yet, or the AI call fails.
- **Timing**: when you tap "📲 Enable push," you pick a preferred hour
  (6am–9pm). Your browser's timezone offset is captured automatically —
  you don't need to tell it what timezone you're in.

How it's wired up:

- `src/sw.js` — custom service worker with `push` and `notificationclick`
  handlers (via `vite-plugin-pwa`'s `injectManifest` strategy).
- `src/push.js` / `src/components/PushToggle.jsx` — subscribe flow with the
  time picker; also silently re-syncs your dream profile
  (`syncPushProfile()`) whenever your dreams change while already
  subscribed, so the affirmation topic stays current without re-subscribing.
- `api/save-push-subscription.js` — stores the subscription plus your
  preferred hour, timezone offset, and a **lightweight** dream profile
  (title + category only — never descriptions or milestones) in Vercel KV.
- `api/update-push-profile.js` — refreshes just the dream profile.
- `api/send-daily-push.js` — for each subscriber, converts their stored
  timezone offset to their current local hour/date, and sends **only if**
  it's at-or-after their chosen hour and they haven't already been sent to
  today (their local day, not UTC) — see the honest timing caveat below.
- `vercel.json` — a Vercel Cron job that calls `send-daily-push`.

**Important honesty notes:**

- This push layer only delivers the *daily affirmation* (personalized in
  content and timing) — it does **not** deliver "your milestone is due
  today" as a closed-app push, because milestones only exist in your
  browser's local storage and the server never sees them. The Home page's
  "Due Today" section and the local notification (layer 1 above) are what
  cover that today, without your data leaving your device. Pushing
  milestone-specific reminders would mean syncing milestones to a backend
  too — a bigger step, same trade-off as the AWS/accounts discussion.
- **Timing precision depends on your setup.** Vercel's free Hobby plan
  caps cron jobs at once per day (confirmed against Vercel's own docs), so
  with just the default `vercel.json` cron, delivery is "once daily, at or
  after your chosen hour" — not to-the-minute. For real hourly precision
  without paying for Vercel Pro, use the included GitHub Actions workflow
  (`.github/workflows/hourly-push-check.yml`) — it's free, checks every
  hour, and is safe to run alongside Vercel's own cron since each
  subscriber only ever gets sent to once per their own local day.

**Setup, to turn on real push (skip this if the "Enable Reminders" local
notification above is enough for you):**

```bash
node scripts/generate-vapid-keys.mjs
```

This prints a fresh keypair using only Node's built-in crypto — no install,
no network call. Then:

1. In Vercel: Project → Storage → **enable KV** for this project (auto-sets
   `KV_REST_API_URL` / `KV_REST_API_TOKEN`, no manual copying needed).
2. In Vercel: Project → Settings → Environment Variables, add:
   `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (any `mailto:`
   address), and `VITE_VAPID_PUBLIC_KEY` (same value as `VAPID_PUBLIC_KEY`
   — the `VITE_` prefix is what exposes it to the browser build). Also make
   sure `ANTHROPIC_API_KEY` is set (same one used for the AI features
   above) — that's what personalizes the affirmation content.
3. Optional but recommended: add `CRON_SECRET` (any random string) — Vercel
   automatically sends it as a Bearer token on cron-triggered requests,
   which stops anyone who finds the URL from triggering a mass send.
4. Redeploy. The cron job in `vercel.json` fires daily at 13:00 UTC by
   default — edit the `schedule` field there to change the time.
5. **Optional, for real hourly precision:** in your GitHub repo, add two
   Actions secrets — `DEPLOYMENT_URL` (your Vercel URL) and `CRON_SECRET`
   (same value as step 3) — and the included workflow starts checking
   every hour automatically.

## Progress Garden (on the Home page)

A small SVG visual (`src/components/ProgressGarden.jsx`) that grows purely
from real completed milestones — an empty bed → seed → sprout → bud →
bloom → flowering tree → full garden, based on your total completed count.
Each dream category you've made progress in gets its own small flower
along the ground. **Growth-only, on purpose** — there's no decay for
missing a day, so it never turns a missed day into something that feels
like a loss. Verified against every stage boundary with unit tests (0, 1,
3, 7, 15, 30, 50+ completed milestones each land on the right stage).

## Friend Nudges / Accountability Buddy

Real push notifications between two real people when one of them completes
a milestone — genuinely built, not simulated. Worth understanding the
honest scope: this app has no user accounts or real "friends list," so
this isn't built as a social network — it's a lightweight **1:1 pairing**
on top of the push infrastructure already in place:

1. Once you've enabled push notifications, the sidebar shows a
   **"🤝 Accountability Buddy"** box. Tap **"Get my buddy code"** — a short
   code tied to your push subscription (`api/get-buddy-code.js`).
2. Share that code with exactly one real friend (text, whatever) who's
   also using the app with push enabled.
3. They enter your code (`api/pair-buddy.js`) — this links your two push
   subscriptions bidirectionally in Vercel KV.
4. From then on, whenever either of you marks a milestone done, the other
   gets a real push: *"🎉 Your buddy just made progress on '\<dream
   title\>'!"* (`api/nudge-buddy.js`, wired into `toggleMilestone` in
   `App.jsx` — fires for both manual milestone taps and Dream Bingo taps,
   since they share the same action).

A few honesty notes:
- **Privacy**: only the dream title + category is shared in the nudge —
  never the description or the rest of your milestone list.
- **Cooldown**: nudges are capped at once every 5 minutes per person, so
  completing several milestones in a row doesn't spam your buddy.
- **1:1 only** — no group pairing, no directory of other users to browse.
  Pairing only happens if you explicitly share your code with someone.
- **Known limitation**: like the rest of the push system, this trusts the
  browser-supplied subscription endpoint rather than a real authenticated
  account (there isn't one to authenticate against). Fine for a buddy pair
  you set up with someone you actually know; not a substitute for real
  auth if this ever needs to scale past friend-to-friend use.

## Dream Bingo ("🎯" nav item)

A real game built from your real milestones — no fake progress, no
separate scoring system. Each tile on the board (`src/bingoBoard.js`,
`src/components/BingoGame.jsx`) is a reference to one of your actual
milestones; tapping a tile calls the same `toggleMilestone` action used
everywhere else in the app, so the game and your dream journal are always
in sync in both directions.

- **Board size** scales with how many milestones you have: 3×3 (9+), 4×4
  (16+), or 5×5 (25+). Fewer than 9 and you get a friendly "add more
  milestones" prompt instead of a half-empty board.
- **Stable board** — generated once and persisted (`localStorage`), so it
  doesn't reshuffle every time you open the page. "🔄 New board" regenerates
  it on purpose.
- **Auto-regenerates** if the board's milestones no longer all exist (e.g.
  you deleted a dream it was using).
- **Real win detection** — completing a row, column, or diagonal (or a full
  blackout) triggers a one-time celebration banner; already-celebrated
  lines don't re-trigger on reload.

## Streaks

Lightweight, local-only (no AI, no server needed) — tracks consecutive
calendar days you've opened the app (`src/gamification.js`,
`updateStreakOnVisit`). The current streak shows as a chip in the sidebar
(🔥), with a toast when it goes up. Missing a day resets the streak to 1, not
0 — opening the app that day still counts. Persists to `localStorage`
(`dreamzlab_v1_streak`).

## Project structure

```
api/                          # Vercel serverless functions
  generate-milestones.js        # AI milestone generation (Claude)
  recommend-mentors.js          # AI mentor relevance ranking
  recommend-people.js           # AI "who to follow" ranking
  find-inspiration.js           # AI + web search for real achievers
  save-push-subscription.js     # store a push subscription + preferences (Vercel KV)
  remove-push-subscription.js   # remove a push subscription
  update-push-profile.js        # refresh the personalization profile
  send-daily-push.js            # cron-triggered personalized affirmation push
  get-buddy-code.js              # generate/retrieve a buddy pairing code
  pair-buddy.js                  # link two push subscriptions
  unpair-buddy.js                # remove a buddy pairing
  nudge-buddy.js                  # send a real push when a milestone completes
.github/workflows/
  hourly-push-check.yml         # optional: free hourly precision for push timing
scripts/
  generate-vapid-keys.mjs       # run this yourself to get push keys
src/
  App.jsx                      # top-level state + page routing
  data.js                       # categories, quotes, milestone templates, seed data
  storage.js                    # localStorage helpers
  gamification.js               # streak logic
  bingoBoard.js                  # Dream Bingo board generation + win detection
  calendarExport.js             # .ics generation + Google Calendar links
  notifications.js              # local (client-triggered) notifications
  push.js                       # real Web Push subscribe/unsubscribe
  shareCard.js                  # canvas-drawn shareable dream image
  podcastStorage.js             # IndexedDB wrapper for uploaded podcasts
  videoFeedData.js               # curated real YouTube videos by category
  sw.js                         # custom service worker (push handling)
  index.css                     # theme + responsive (mobile) styles
  components/
    Sidebar.jsx                  # nav (becomes a bottom bar on mobile)
    Home.jsx                     # dashboard + Due Today section + Progress Garden
    ProgressGarden.jsx            # growth-only visual companion
    MyDreams.jsx                 # dreams, milestones, due dates, calendar sync
    AddDream.jsx
    Progress.jsx
    SocialFeed.jsx                # posts, likes, comments, AI follow suggestions
    Mentors.jsx                   # mentors, podcasts, video feed, inspiration tabs
    BingoGame.jsx                  # Dream Bingo game
    MyPodcasts.jsx                # upload your own podcast episodes (Premium)
    VideoFeed.jsx                  # TikTok-style real YouTube feed
    Founders.jsx
    QuizModal.jsx
    ShareModal.jsx                 # internal + Facebook/LinkedIn/native share
    PushToggle.jsx                 # real push notification opt-in
    BuddySystem.jsx                 # accountability buddy pairing UI
    ui/                            # StatCard, ProgressBar, SectionLabel, EmptyState, Tabs
```

## Pushing this to GitHub

From inside this folder:

```bash
git init
git add .
git commit -m "Initial commit: DreamzLab"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

(Create the empty repo on GitHub first — no README/license/gitignore, since
this folder already has them — then copy its HTTPS or SSH URL into the
`remote add` command above.)

## Getting it onto your phone as a real URL

Because of the `api/generate-milestones.js` serverless function, **Vercel is
the easiest option** (it auto-detects both the Vite frontend and the `api/`
function with zero config):

```bash
npm i -g vercel
vercel            # first deploy, follow the prompts
```

Then in the Vercel dashboard: Project → Settings → Environment Variables →
add `ANTHROPIC_API_KEY` with your real key, and redeploy.

Other static hosts (Netlify, GitHub Pages) work for the frontend, but you'd
need to adapt `api/generate-milestones.js` to that platform's function
format (Netlify Functions, etc.) for the AI feature to work there too — the
app still runs fine without it, just using the template fallback.

Once deployed, visit the URL on your phone and "Add to Home Screen" as above.

## Notes on the data

Everything (dreams, milestones, social posts, subscription state) is stored
in the browser's `localStorage`, seeded with sample data on first load. There's
no server, so data won't sync across devices — that would be the natural next
step if you want to grow this further (e.g. add a small backend + auth).
