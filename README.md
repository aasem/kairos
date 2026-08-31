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

---

## Philosophy

In modern time management, the collision of Chronos and Kairos
represents the tension between efficiency (doing things fast) and
effectiveness (doing the right things at the right moment). *Kairos*
(καιρός) is the opportune, unscheduled moment; *chronos* is sequential
clock-time. In Greek myth they appear as contrasting figures — one the
devouring Titan who ruled measured time, one the fleeting youth who
embodies the chance that passes if you look away. Used as psychological
metaphors, they describe two modes of spending attention, not objects of
belief.

This app is named for Kairos, but it does not pretend Chronos doesn't
exist. Weekly quotas are the Chronos layer — structure you agree to in
advance; the ranking tells you which pursuit most needs a Kairos moment
*right now*.

### The mythological meeting point

| Time management challenge | The Chronos mode (measured, sequential) | The Kairos mode (opportune, unscheduled) |
|---|---|---|
| The core philosophy | "How much can I fit into this hour?" | "Is this the perfect moment to do this?" |
| Hobbies & creative work | Tracking hours spent practicing an instrument. | Entering a state of flow where clock time vanishes. |
| Pursuits & big goals | Sticking to a strict 5-year career roadmap. | Pivoting immediately when an unexpected door opens. |
| The danger / shadow side | Burnout: being consumed by your calendar. | Procrastination: waiting forever for the "perfect" mood. |

### Hobbies and pursuits: grind vs. flow

Mastery needs both modes.

- **Chronos builds the foundation.** Skill demands a repetitive block of
  clock time every day — the myth's scythe as an image for clearing away
  distraction, not mysticism.
- **Kairos delivers the breakthrough.** You cannot force inspiration; it
  tends to arrive inside the structure Chronos provides.
- **The meeting point.** Without routine, you never practice. Without
  opportune depth, the hobby becomes mechanical.

### Multitasking: the ultimate clash

Multitasking tries to stretch clock-time while destroying the focus
that opportune moments require.

- **The Chronos trap.** Stretching measured time across tasks triggers
  cognitive switching costs; you save nothing.
- **The Kairos image.** In myth, Kairos is bald in the back — you can
  grasp him only as he arrives. Divided attention means that moment
  passes unseen.
- **The meeting point.** Monotask. One block, one pursuit, the narrow
  focus where insight actually lands.

### Shifting your mindset

Calendar overwhelm is **Chronos overload** — the myth's warning that
measured time, unchecked, consumes the life it was meant to organise.
The counterweight is a **Kairos block**: unstructured hours with no alarm,
no progress tracking, and no multitasking — just choosing the pursuit
that feels exactly right for that moment.

The app lives at that boundary: you set the Chronos layer once per
pursuit (a weekly quota), and whenever a pocket opens, it surfaces the
one furthest behind so you can monotask without deciding from scratch.

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
- **Surplus carries; deficit does not.** Time logged above last week's
  quota starts the new week already counted. A shortfall dies at Monday
  00:00 — you never owe a missed week.
- **GO starts a timer. DONE logs it.** No categories, no manual time
  entry. A session is just a timestamped start and end.
- **The pace marker** on the progress bar shows where you'd be if you
  were exactly on schedule for the week so far. Bar past the mark,
  you're ahead; short of it, you're behind.
- **Stats** (7 / 30 / 180 days) show total logged time, a daily/weekly
  bar chart, and a per-pursuit breakdown against a prorated plan.
- **Colour** is a discrete trio shared by the home screen and the rail:
  green (fine), amber (slipping), crimson (dropped). Green means at or
  ahead of this week's linear pace (or quota already met); amber means
  behind that pace; crimson means more than one day of quota behind.
  Not a spectrum, and not the ranking key. Rail tiles add a bottom-up
  fill at this week's progress and a rank ordinal; the left column shows
  a band census and a one-line rank cue.

## How ranking works

This section matches `app.js` as shipped. **Two separate scoring systems**
drive the home screen and Stats; they can disagree — details at the end
of this section and under [Known gaps](#known-gaps-honestly).

### Home screen: the deficit-rate ranking

Let there be $n$ pursuits $X_1, \ldots, X_n$, each with weekly quota
$q_i$ (minutes) and creation time $t_i^0$. Let $w_s$ and $w_e$ bound the
current ISO week (Monday 00:00 to the following Monday 00:00), and let
$d_i(t)$ be minutes logged against $X_i$ within that window as of time
$t$, including any timer currently running.

**Birth credit.** If $X_i$ was created during the current week, it
receives a one-time credit so it starts on pace rather than as if
neglected since Monday:

$$
c_i =
\begin{cases}
q_i \cdot \frac{t_i^0 - w_s}{w_e - w_s} & \text{if } w_s < t_i^0 < w_e \\[4pt]
0 & \text{otherwise}
\end{cases}
$$

**Surplus carry.** Deficit is forgiven at each Monday; only overshoot
banks. Walk every completed ISO week $k$ from the week of $t_i^0$
(or the first session, if earlier) up to last week, with $\sigma_i^{(0)}=0$:

$$
\sigma_i^{(k+1)} = \max\!\left(0,\ d_i^{(k)} + c_i^{(k)} + \sigma_i^{(k)} - q_i\right)
$$

where $d_i^{(k)}$ and $c_i^{(k)}$ are minutes logged and birth credit
in week $k$. Unused banked time is consumed against later quotas; a
short week still drops any remaining gap. $\sigma_i$ is last week's
outgoing surplus — the incoming credit for the current week.

Effective progress is $\tilde{d}_i(t) = d_i(t) + c_i + \sigma_i$.

**Deficit fraction** — outstanding quota as a share of $q_i$ itself
(comparable across pursuits of different sizes):

$$
\delta_i(t) = \max\left(0,\ \frac{q_i - \tilde{d}_i(t)}{q_i}\right)
$$

**Fraction of the week remaining:**

$$
\phi(t) = \max\left(\frac{1}{10080},\ 1 - \frac{t - w_s}{w_e - w_s}\right)
$$

(clamped to at least one minute of a week so the ratio below never
divides by zero at week rollover.)

**Deficit rate**, the ranking key:

$$
r_i(t) = \min\left(4,\ \frac{\delta_i(t)}{\phi(t)}\right)
$$

$r_i(t) = 1$ means on pace to finish at the deadline if nothing changes.
Above 1, the gap is widening; below 1, you have slack. The cap at 4
is only a numerical ceiling on the ranking key — it does not affect
sort order below that ceiling, and colour no longer reads from $r_i$.

Kairos surfaces the pursuit with the highest deficit rate:

$$
X^{*}(t) = \max_{i} r_i(t)
$$

breaking near-ties (rate difference under 0.02) by `createdAt`
ascending, then by id.

**Colour and status** use simpler raw-minute quantities, not $r_i(t)$.
Write $\varepsilon(t) = (t - w_s)/(w_e - w_s)$ for the fraction of the
week elapsed:

$$
b_i(t) = q_i \cdot \varepsilon(t) - \tilde{d}_i(t)
$$

$$
k_i(t) = \max\left(0,\ \frac{q_i - \tilde{d}_i(t)}{d_{\mathrm{rem}}}\right)
$$

where $d_{\mathrm{rem}}$ is days remaining in the week. Pace band
(`heat` in code: $0$ / $0.5$ / $1$) is a hard step at the pace marker
and at one day of quota ($q_i/7$), not a hue interpolation:

$$
h_i(t) =
\begin{cases}
0 & \tilde{d}_i(t) \geq q_i \ \text{or}\ b_i(t) \le 0 \\[4pt]
1 & b_i(t) > q_i/7 \\[4pt]
0.5 & \text{otherwise}
\end{cases}
$$

mapped to green / amber / crimson. The same band colours the focused
home shell, GO, status line, and every rail tile. Tile *fill height*
is $\tilde{d}_i / q_i$ (this week's progress); rail order and ordinals
still follow $r_i(t)$, so colour and rank can disagree. On-screen copy
matches the band — **QUOTA MET**, **AHEAD OF WEEK PACE**, **ON PACE**,
amber **37 SHORT OF WEEK PACE**, or crimson **37 SHORT OF WEEK PACE ·
12/DAY TO CATCH**. A mute census under the week totals counts the set
(**2 DROPPED · 3 SLIPPING · 4 FINE**, or **9 ON PACE**); a rank cue
above the name reads **FURTHEST BEHIND**, **LEAST SLACK**, or
**3 OF 9 · FURTHEST IS NAME**. Raw minutes are easier to act on
mid-pocket than a dimensionless ratio, even though $r_i(t)$ is what
ranked this pursuit first.

### Stats screen: a different formula

For a window of $N$ days (7, 30, or 180), let $a_i$ be the pursuit's
age in whole days since creation and $L_i$ the minutes logged in the
window. Stats computes a prorated expected total,

$$
E_i = q_i \cdot \frac{\min(N,\ a_i)}{7}
$$

and

$$
p_i = \frac{L_i}{E_i} \times 100
$$

The list is sorted by $p_i$ (ascending) and each row is labelled
AHEAD OF PLAN ($\geq 100\%$), NEAR PLAN ($\geq 70\%$), or BEHIND PLAN. This answers "how much of the plan
for this stretch have I completed?" — not "how urgently must I work
before Monday?" — so order can differ from the home screen.

### What this is, formally

The home-screen ranking is a **greedy, single-step priority rule** —
$\max_i r_i(t)$ evaluated fresh on each render. No lookahead, no model
of how many pockets remain before the week ends. Given that pocket
arrival is unpredictable by the app's own premise, a myopic rule is the
right level of ambition.

## What it deliberately doesn't do

- No notifications, gamification, streaks, or badges.
- No accounts, server, or cross-device sync.
- One active session at a time.
- No user-settable tie-break priority (removed; ties resolve by age).

## Running it

Kairos is a static site: two React UMD builds, one compiled JS bundle,
one HTML shell, a manifest, and a service worker. No build step, no
dependencies to install, no backend.

1. Serve the contents of this repo over HTTPS (GitHub Pages, Netlify,
   Vercel, or any static host — a service worker requires HTTPS).
2. Open the URL on your phone in a Chromium-based browser.
3. Use "Install app" / "Add to Home Screen."

`app.js` is the shipped, minified bundle and the source of truth. To
edit logic, work from a readable copy and re-minify with `esbuild`:

```bash
npx esbuild app.jsx --loader:.jsx=jsx \
  --jsx-factory=React.createElement --jsx-fragment=React.Fragment \
  --minify --target=es2018 --outfile=app.js
```

The service worker is network-first: online, it fetches the latest
files; offline, it serves whatever was last fetched successfully.

## Data and privacy

Everything lives in `localStorage` on your device under this origin.
Nothing is transmitted anywhere.

**Backup (Edit screen).** Use **EXPORT JSON** to save pursuits and
session history to a file. **IMPORT** restores from a backup. Do this
before clearing site data or reinstalling the app — browser "clear data"
wipes storage and cannot be undone from inside Kairos.

Normal app updates (opening the site while online) refresh cached files
without touching your data. Only a deliberate site-data clear, or
reinstalling without a backup, loses history.

**Home-screen icon.** The splash image on an installed copy is fixed at
install time. To update it, export a backup, remove the app from your
home screen, open the site in the browser, then install again and import.

## Known gaps, honestly

- **Two ranking formulas.** Home (urgency via $r_i$) and Stats (plan
  completion via $p_i$) can disagree. Unifying them, or
  labelling Stats clearly as plan completion, is the top open item.
- **Colour cap.** $r_i$ is capped at 4 for legibility; two badly
  neglected pursuits can look equally urgent.
- **Birth credit.** Computed once from `createdAt`; editing quota
  mid-week does not adjust it retroactively.
- **Surplus carry.** Past weeks are replayed with the *current* quota,
  so editing quota also rewrites how much surplus those weeks banked.
- **No lookahead.** The greedy rule cannot reason about whether working
  on one pursuit now will cause another to miss quota later.

## Contributing

Issues and pull requests welcome, particularly:

- Reconciling the home-screen and Stats ranking formulas
- Accessibility (keyboard navigation, screen-reader labelling)

## License

MIT.
