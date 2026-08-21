# Kairos

**Which of your pursuits is furthest behind, right now.**

Kairos is a single-screen tracker for people running several long-term
self-directed projects at once — a language, a translation, a research
habit, a book, a weekly essay — where the problem was never *time*. Time
was enough. The problem was that time arrives in **pockets**: random in
size, random in when they open, and gone by the time you've decided what
to do with them.

I built this for my own week, which usually looks like Persian and
Chinese in parallel, a page of translation a day, a couple of hours on
distributed systems, a book that only gets touched on weekend mornings,
a short story that kept losing to everything louder, and a weekly post
and essay on top. I tried Trello, Notion, Google Keep. Each one added a
layer of *deciding what to do* on top of the work itself — another
backlog to triage before I could start. That's exactly backwards when
the actual bottleneck is the ten seconds between a pocket opening and a
decision getting made.

So Kairos doesn't ask you to plan a day. It asks you one number per
pursuit — a weekly quota — and then, whenever you open it, tells you
the one thing furthest behind. You press **GO**. You do the thing. You
press **DONE**. That's the whole interaction.

*Kairos* (καιρός) is the Greek word for the opportune, unscheduled
moment — as opposed to *chronos*, sequential clock-time. This app has
no notifications, no clock-based schedule, no streaks. It exists for the
moment you already have, not the moment you were supposed to have.

---

## How it works

- **You define pursuits**, each with a name and a **weekly time quota**.
- **The home screen shows one pursuit** — the one furthest behind its
  own quota, weighted by how much of the week is left. Everyone else's
  state is visible as a thin ranked rail on the right; tap any bar to
  bring it to focus instead.
- **New pursuits start on pace.** Adding one mid-week does not treat it
  as if you had neglected it since Monday — only time after it exists
  can put it behind.
- **GO starts a timer. DONE logs it.** No categories, no manual time
  entry, no forms. The log is just a timestamped start and end.
- **The pace marker** on the progress bar shows where you'd be if you
  were exactly on schedule for the week so far — a small gnomon, really,
  same idea as a sundial's shadow. Bar past the mark, you're ahead of
  it, you're behind.
- **Stats** (7 / 30 / 180 days) show total time, active-day count, a
  bar chart of the period, and a per-pursuit breakdown against
  prorated quota — mainly so a neglected pursuit shows up as a visible
  gap rather than disappearing quietly.

Colour carries the state: pine when you're on pace, brass as you slip,
rust when you're badly behind. You should be able to tell how you're
doing before reading a single number.

## The formalism

Let there be $n$ pursuits $X_1, \dots, X_n$. Each $X_i$ carries a weekly
quota $q_i$ (minutes) and a creation time $t_i^{0}$. Let $d_i(t)$ be the
cumulative minutes logged against $X_i$ within the current ISO week as
of time $t$.

If $X_i$ was created during the current week, it receives a one-time
**birth credit** so that it begins on pace rather than as if neglected
since Monday:

$$
c_i \;=\; q_i \cdot \frac{t_i^{0} - w_{\mathrm{start}}}{w_{\mathrm{end}} - w_{\mathrm{start}}}
\quad\text{(else $c_i = 0$)}.
$$

Effective progress is $\tilde{d}_i(t) = d_i(t) + c_i$. At any moment $t$,
with $\tau(t)$ the minutes remaining until the week's close, define the
**deficit rate**

$$
r_i(t) = \frac{q_i - \tilde{d}_i(t)}{\tau(t)}.
$$

This is not merely "how far behind" — $q_i - \tilde{d}_i(t)$ alone is a
raw deficit and treats a Monday-morning shortfall the same as a
Saturday-night one. Dividing by $\tau(t)$ converts a static deficit into
a required *rate of closure*: the pace, in minutes-of-work-per-minute-
of-week-remaining, that $X_i$ now demands to still make quota. $r_i(t)$
is dimensionless, and — this is the property that matters — it is
directly comparable across pursuits with wildly different $q_i$. A
neglected 30-minute weekly commitment and a neglected 14-hour one land
on the same scale and can be honestly ranked against each other.

Kairos always surfaces

$$
X^{*}(t) = \underset{i}{\arg\max}\; r_i(t),
$$

breaking near-ties by creation order (older first).

Two structural properties fall out for free:

- **Monotonicity under neglect.** For fixed $\tilde{d}_i$, $r_i(t)$ is
  strictly increasing as $\tau(t) \to 0^{+}$ — a pursuit's urgency
  accelerates automatically as the week closes on it, with no
  re-planning required. This is the whole mechanism behind "pacing up":
  it's not a heuristic bolted on top, it's what the ratio does.
- **Self-correction, not debt.** $d_i$ resets with the week rather than
  carrying a rolling balance forward. A missed week raises $r_i$ for
  the *next* week's first observation only through $q_i$ itself, never
  through accumulated arrears — which is deliberate: compounding debt
  is what turns one bad week into the two-week abandonment spiral this
  tool exists to prevent.

The **pace marker** on each progress bar is the visual residue of the
same idea at the single-pursuit level — it plots the elapsed-week
fraction
$\varepsilon(t) = (t - w_{\mathrm{start}}) / (w_{\mathrm{end}} - w_{\mathrm{start}})$
against $\tilde{d}_i(t)/q_i$. It is, quite literally, a gnomon: the
marker plays the role of the sundial's rod, and the filled bar is its
shadow. Where the shadow falls short of the rod, you are behind; where
it overtakes it, you are ahead. $r_i(t)$ is simply the instantaneous
slope this comparison demands for the remainder of the week.

## What it deliberately doesn't do

- No notifications. The whole point is that pockets are unscheduled;
  a buzz defeats that.
- No gamification, streaks, or badges. This is a pacing instrument, not
  a scoreboard — the goal is to keep going through a bad week, not to
  feel bad about breaking a streak.
- No accounts, no server, no sync. Everything lives in your browser's
  local storage. Nothing you log leaves your device.
- One active session at a time, by design — it keeps "what am I doing
  right now" unambiguous.

## Running it

Kairos is a static site: two React UMD builds, one compiled JS bundle,
one HTML shell, a manifest, and a service worker. No build step, no
dependencies to install, no backend.

1. Serve the contents of this repo over HTTPS (GitHub Pages, Netlify,
   Vercel, or any static host — a service worker requires HTTPS, so
   opening `index.html` directly from disk won't fully work).
2. Open the URL on your phone in a Chromium-based browser.
3. Use "Install app" / "Add to Home Screen." You'll get a standalone
   icon with no browser chrome, and it'll keep working offline once
   the first load has cached the shell.

To rebuild `app.js` from source after editing the JSX, you'll need
`esbuild`:

```bash
npx esbuild app.jsx --loader:.jsx=jsx \
  --jsx-factory=React.createElement --jsx-fragment=React.Fragment \
  --minify --target=es2018 --outfile=app.js
```

The service worker is network-first: when you're online it always pulls
the latest files and refreshes the offline cache; when you're offline it
serves whatever was last successfully fetched. No cache-version bumps
on deploy.

## Data and privacy

Everything — your pursuits, quotas, and every logged session — is
stored in `localStorage` in your own browser, on your own device.
There is no server component and nothing is transmitted anywhere.
This also means: clearing your browser's site data for this origin
will erase your history, and the data does not sync across devices.
Both are deliberate trade-offs for a zero-dependency, single-file tool;
if you need either sync or backup, exporting `localStorage` to JSON is
the natural next step and a welcome contribution.

## Contributing

This started as a tool for exactly one person's exactly one problem,
so it's opinionated rather than configurable. That said, issues and
pull requests are genuinely welcome — particularly around:

- JSON export/import for backup and cross-device use
- Accessibility (keyboard navigation, screen-reader labelling)
- Alternate ranking strategies for people whose pursuits don't fit a
  weekly-quota model

If you use it for a different set of pursuits than language study and
writing, I'd like to hear what changed and what didn't.

## License

MIT. Use it, fork it, rename it — and if it helps you, a quiet credit back here would mean a lot.

---
