# Kairos

**Which of your pursuits is furthest behind, right now.**

Kairos is a single-screen tracker for people running several long-term
self-directed projects at once — a language, a translation, a research
habit, a book, a weekly essay — where the problem was never *time*. Time
was enough. The problem was that time arrives in **pockets**: random in
size, random in when they open, and gone by the time you've decided what
to do with them.

Kairos doesn't ask you to plan a day. It asks you one number per
pursuit — a weekly quota — and then, whenever you open it, tells you
the one thing furthest behind. You press **GO**. You do the thing. You
press **DONE**. That's the whole interaction.

*Kairos* (καιρός) is the Greek word for the opportune, unscheduled
moment — as opposed to *chronos*, sequential clock-time. No
notifications, no clock-based schedule, no streaks.

---

## How it works

- **You define pursuits**, each with a name and a **weekly time quota**
  in minutes.
- **The home screen shows one pursuit** — the one the ranking picks as
  most urgent (see below). Every other pursuit sits in a ranked rail
  on the right as a coloured tile; tap one to bring it to focus.
- **New pursuits get a birth credit.** Adding one mid-week doesn't treat
  it as neglected since Monday — only the time since it was created
  counts against it.
- **GO starts a timer. DONE logs it.** No categories, no manual time
  entry. A session is just a timestamped start and end.
- **The pace marker** on the progress bar shows where you'd be if you
  were exactly on schedule for the week so far. Bar past the mark,
  you're ahead; short of it, you're behind.
- **Stats** (7 / 30 / 180 days) show total logged time, a daily/weekly
  bar chart, and a per-pursuit breakdown against a prorated plan.

Colour carries the state: pine when you're on pace, brass as you slip,
rust when you're badly behind.

## The ranking, exactly as coded

This section describes `app.js` as shipped, not an idealised version of
it. There are honestly **two separate scoring systems** in the app —
one drives the home screen, the other drives Stats — and they don't
agree with each other. That's the first thing worth knowing before
reading either formula.

### Home screen: the deficit-rate ranking

Let there be $n$ pursuits $X_1, \dots, X_n$, each with weekly quota
$q_i$ (minutes) and creation time $t_i^0$. Let $w_{\text{start}}$ and
$w_{\text{end}}$ bound the current ISO week (Monday 00:00 to the
following Monday 00:00), and let $d_i(t)$ be minutes logged against
$X_i$ within that window as of time $t$, including any timer currently
running.

**Birth credit.** If $X_i$ was created during the current week, it
receives a one-time credit so it starts on pace rather than as if
neglected since Monday:

$$
c_i =
\begin{cases}
q_i \cdot \dfrac{t_i^0 - w_{\text{start}}}{w_{\text{end}} - w_{\text{start}}} & \text{if } w_{\text{start}} < t_i^0 < w_{\text{end}} \\[4pt]
0 & \text{otherwise}
\end{cases}
$$

Effective progress is $\tilde d_i(t) = d_i(t) + c_i$.

**Deficit fraction** — how much of the quota is still outstanding, as
a share of the quota itself:

$$
\delta_i(t) = \max\!\left(0,\ \frac{q_i - \tilde d_i(t)}{q_i}\right)
$$

Dividing by $q_i$ is what makes this comparable across pursuits of
different sizes — a 30-minute weekly commitment and a 14-hour one can
both be "60% short" and that means the same thing for each.

**Fraction of the week remaining:**

$$
\phi(t) = \max\!\left(\frac{1}{10080},\ 1 - \frac{t - w_{\text{start}}}{w_{\text{end}} - w_{\text{start}}}\right)
$$

(clamped to at least one minute of a week, so the ratio below never
divides by zero in the last instant before the week rolls over.)

**Deficit rate**, the actual ranking key:

$$
r_i(t) = \min\!\left(4,\ \frac{\delta_i(t)}{\phi(t)}\right)
$$

$r_i(t) = 1$ means "exactly on pace to finish exactly at the deadline
if nothing changes." Above 1, the remaining share of quota is larger
than the remaining share of the week — you're behind and the gap is
widening. Below 1, you have slack. The cap at 4 exists only so one
badly neglected pursuit doesn't dominate the color scale into
illegibility; it does not affect the sort order below that ceiling.

Kairos always surfaces

$$
X^{*}(t) = \operatorname*{arg\,max}_i \; r_i(t)
$$

breaking near-ties (rate difference under $0.02$) by `createdAt`
ascending, then by id — oldest pursuit wins a tie, which is the only
priority signal left in the app. **There is no user-settable priority
or tie-break weight in the current build** — an earlier design had one,
it was removed, and ties now resolve by age alone.

**Colour** (`heat`) is derived from the same $r_i(t)$, not a separate
number:

$$
\text{heat}_i(t) =
\begin{cases}
0 & \tilde d_i(t) \geq q_i \quad \text{(quota already met)} \\
\min\!\left(1,\ \dfrac{r_i(t)}{1.6}\right) & \text{otherwise}
\end{cases}
$$

mapped through a three-stop gradient (pine → brass → rust) at
`heat` = 0, 0.5, 1. Because `heat` and the sort key now come from the
same $r_i(t)$, a pursuit's colour and its rank always agree — this
was not true in an earlier build, where colour was driven by a raw
linear-pace shortfall and rank by a differently-scaled quantity, and
the two could point in different directions.

**On-screen status line** uses a third, simpler quantity that is
deliberately *not* $r_i$ — the linear-pace shortfall in raw minutes,
not a rate:

$$
\text{behind}_i(t) = q_i \cdot \varepsilon(t) - \tilde d_i(t),
\qquad \varepsilon(t) = \frac{t - w_{\text{start}}}{w_{\text{end}} - w_{\text{start}}}
$$

shown as "$\text{behind}_i$ SHORT OF WEEK PACE" together with a
separate catch-up figure,

$$
\text{catchPerDay}_i = \max\!\left(0,\ \frac{q_i - \tilde d_i(t)}{\text{days remaining}}\right)
$$

shown as "$\cdot$/DAY TO CATCH." Neither of these two displayed numbers
is $r_i(t)$; they're both raw-minute quantities, kept because "37
minutes short, 12/day to catch" is easier to act on mid-pocket than a
dimensionless ratio, even though the ratio is what actually picked
this pursuit as the one on screen.

### Stats screen: a different formula entirely

The Stats view does not reuse $r_i(t)$, $\delta_i$, or $\phi(t)$ at
all. For a chosen window of $N$ days (7, 30, or 180), it computes a
prorated expected total,

$$
E_i = q_i \cdot \frac{\min(N,\ \text{age}_i)}{7}, \qquad
\text{age}_i = \left\lceil \frac{t - t_i^0}{1\text{ day}} \right\rceil
$$

and a percentage of that plan actually logged,

$$
\text{pct}_i = \frac{\text{logged}_i}{E_i} \times 100
$$

used to sort the per-pursuit list (ascending — furthest under its plan
first) and to label each row AHEAD OF PLAN ($\geq 100\%$), NEAR PLAN
($\geq 70\%$), or BEHIND PLAN (below that). **This can rank pursuits in
a different order than the home screen's $r_i(t)$ does**, because it
answers a different question — "how much of the plan for this stretch
of days have I completed" rather than "how urgently do I need to work
on this before Monday." A pursuit can be #1 on the home screen (worst
$r_i$ for the current week) and not top the 30-day Stats list, or vice
versa. This is a real, currently unreconciled gap between the two
views, not a rounding artefact.

### What this is, formally

The home-screen ranking is a **greedy, single-step priority rule** —
$\arg\max r_i(t)$ evaluated fresh each time the app renders. It is not
an optimizer in any stronger sense: there is no lookahead, no modelling
of how many pockets you'll actually get before the week ends, and no
attempt to sequence multiple future picks against each other. Given
that pocket arrival is unpredictable by the problem's own premise,
a myopic rule is arguably the right level of ambition — but it should
be named as what it is, not dressed up as solving a scheduling
optimization it doesn't attempt.

## What it deliberately doesn't do

- No notifications.
- No gamification, streaks, or badges.
- No accounts, no server, no sync. Everything lives in your browser's
  local storage.
- One active session at a time, by design.
- No user-adjustable tie-break priority (removed; see above).

## Running it

Kairos is a static site: two React UMD builds, one compiled JS bundle,
one HTML shell, a manifest, and a service worker. No build step, no
dependencies to install, no backend.

1. Serve the contents of this repo over HTTPS (GitHub Pages, Netlify,
   Vercel, or any static host — a service worker requires HTTPS).
2. Open the URL on your phone in a Chromium-based browser.
3. Use "Install app" / "Add to Home Screen."

`app.js` is the shipped, minified bundle and the actual source of
truth — it's what's described above. If you're editing logic, work
from a readable copy and re-minify with `esbuild`:

```bash
npx esbuild app.jsx --loader:.jsx=jsx \
  --jsx-factory=React.createElement --jsx-fragment=React.Fragment \
  --minify --target=es2018 --outfile=app.js
```

The service worker is network-first: online, it always fetches the
latest files and refreshes the cache; offline, it serves whatever was
last fetched successfully. No manual cache-version bump needed on
deploy.

## Data and privacy

Everything is stored in `localStorage`, on your device, under this
origin. Nothing is transmitted anywhere. Clearing site data for this
origin erases the history, and nothing syncs across devices. Both are
deliberate trade-offs for a zero-dependency tool; JSON export/import
would be the natural next step and a welcome contribution.

## Known gaps, honestly

- Home screen and Stats screen rank pursuits by two different formulas
  and can disagree. Unifying them, or clearly labelling Stats as "plan
  completion" rather than "urgency," is the most concrete open item.
- The deficit rate $r_i(t)$ is capped at 4 for colour legibility; this
  cap does not affect ranking below it but means two very badly
  neglected pursuits can render as visually identical urgency.
- Birth credit is computed once from `createdAt` and does not adjust
  retroactively if quota is edited mid-week.
- The ranking is a one-step greedy rule with no lookahead — it cannot
  reason about whether picking one pursuit now will cause another to
  miss quota later in the week, because it has no model of how many
  pockets are still coming.

## Contributing

Issues and pull requests welcome, particularly:

- Reconciling the home-screen and Stats ranking formulas
- JSON export/import for backup and cross-device use
- Accessibility (keyboard navigation, screen-reader labelling)

## License

MIT.
