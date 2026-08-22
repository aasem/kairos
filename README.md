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
clock-time. Apply their mythological traits to hobbies, pursuits, and
multitasking, and the ancient gods become perfect metaphors for how we
spend our energy.

This app is named for Kairos, but it does not pretend Chronos doesn't
exist. Weekly quotas are Chronos's tribute; the ranking tells you which
pursuit most needs a Kairos moment *right now*.

### The mythological meeting point

| Time management challenge | The Chronos approach (the devouring titan) | The Kairos approach (the fleeting youth) |
|---|---|---|
| The core philosophy | "How much can I fit into this hour?" | "Is this the perfect moment to do this?" |
| Hobbies & creative work | Tracking hours spent practicing an instrument. | Entering a state of flow where clock time vanishes. |
| Pursuits & big goals | Sticking to a strict 5-year career roadmap. | Pivoting immediately when an unexpected door opens. |
| The danger / shadow side | Burnout: being consumed by your calendar. | Procrastination: waiting forever for the "perfect" mood. |

### Hobbies and pursuits: grind vs. flow

Balancing both gods is the secret to mastery.

- **Chronos builds the foundation.** Mastery demands a repetitive block
  of clock time every day — Chronos's scythe clearing away distractions.
- **Kairos delivers the breakthrough.** You cannot force inspiration; it
  arrives inside the container Chronos built.
- **The meeting point.** Without Chronos's routine, you never practice.
  Without Kairos's inspiration, the hobby feels like a mechanical chore.

### Multitasking: the ultimate clash

Multitasking cheats Chronos and insults Kairos.

- **Chronos's trap.** Stretching clock time across tasks triggers
  cognitive switching costs; you save nothing.
- **Kairos's revenge.** Kairos is bald in the back — multitasking means
  you miss the opportune moment entirely because your attention was
  elsewhere.
- **The meeting point.** Monotask. One Chronos block, one pursuit, the
  focus required to seize a Kairos moment of deep insight.

### Shifting your mindset

Calendar overwhelm is **Chronos sickness** — the Titan devouring his
children. The antidote is **Kairos blocks**: unstructured hours with no
alarm, no progress tracking, and no multitasking — just choosing the
pursuit that feels exactly right for that moment.

The app lives at that boundary: you pay Chronos once per pursuit (a
weekly quota), and whenever a pocket opens, it surfaces the one furthest
behind so you can monotask without deciding from scratch.

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
- **Colour** (pine → brass → rust) reflects urgency on both the home
  screen and the rail; it is derived from the same ranking key described
  below.

## The ranking, exactly as coded

This section describes `app.js` as shipped. **Two separate scoring
systems** drive the home screen and Stats; they can disagree — details
at the end of this section and under [Known gaps](#known-gaps-honestly).

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

**Deficit fraction** — outstanding quota as a share of $q_i$ itself
(comparable across pursuits of different sizes):

$$
\delta_i(t) = \max\!\left(0,\ \frac{q_i - \tilde d_i(t)}{q_i}\right)
$$

**Fraction of the week remaining:**

$$
\phi(t) = \max\!\left(\frac{1}{10080},\ 1 - \frac{t - w_{\text{start}}}{w_{\text{end}} - w_{\text{start}}}\right)
$$

(clamped to at least one minute of a week so the ratio below never
divides by zero at week rollover.)

**Deficit rate**, the ranking key:

$$
r_i(t) = \min\!\left(4,\ \frac{\delta_i(t)}{\phi(t)}\right)
$$

$r_i(t) = 1$ means on pace to finish at the deadline if nothing changes.
Above 1, the gap is widening; below 1, you have slack. The cap at 4
limits colour saturation only — it does not affect sort order below
that ceiling.

Kairos surfaces

$$
X^{*}(t) = \operatorname*{arg\,max}_i \; r_i(t)
$$

breaking near-ties (rate difference under $0.02$) by `createdAt`
ascending, then by id.

**Colour** (`heat`) comes from the same $r_i(t)$:

$$
\text{heat}_i(t) =
\begin{cases}
0 & \tilde d_i(t) \geq q_i \quad \text{(quota already met)} \\
\min\!\left(1,\ \dfrac{r_i(t)}{1.6}\right) & \text{otherwise}
\end{cases}
$$

mapped through pine → brass → rust at `heat` = 0, 0.5, 1.

**On-screen status line** uses simpler raw-minute quantities, not
$r_i(t)$:

$$
\text{behind}_i(t) = q_i \cdot \varepsilon(t) - \tilde d_i(t),
\qquad \varepsilon(t) = \frac{t - w_{\text{start}}}{w_{\text{end}} - w_{\text{start}}}
$$

shown as "$\text{behind}_i$ SHORT OF WEEK PACE", plus

$$
\text{catchPerDay}_i = \max\!\left(0,\ \frac{q_i - \tilde d_i(t)}{\text{days remaining}}\right)
$$

as "$\cdot$/DAY TO CATCH." These are easier to act on mid-pocket than a
dimensionless ratio, even though $r_i(t)$ is what picked this pursuit.

### Stats screen: a different formula

For a window of $N$ days (7, 30, or 180), Stats computes a prorated
expected total,

$$
E_i = q_i \cdot \frac{\min(N,\ \text{age}_i)}{7}, \qquad
\text{age}_i = \left\lceil \frac{t - t_i^0}{1\text{ day}} \right\rceil
$$

and

$$
\text{pct}_i = \frac{\text{logged}_i}{E_i} \times 100
$$

to sort the list (ascending) and label rows AHEAD OF PLAN ($\geq 100\%$),
NEAR PLAN ($\geq 70\%$), or BEHIND PLAN. This answers "how much of the
plan for this stretch have I completed?" — not "how urgently must I work
before Monday?" — so order can differ from the home screen.

### What this is, formally

The home-screen ranking is a **greedy, single-step priority rule** —
$\arg\max r_i(t)$ evaluated fresh on each render. No lookahead, no model
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
Nothing is transmitted anywhere; clearing site data erases the history.
JSON export/import would be the natural next step and a welcome
contribution.

## Known gaps, honestly

- **Two ranking formulas.** Home (urgency via $r_i$) and Stats (plan
  completion via $\text{pct}_i$) can disagree. Unifying them, or
  labelling Stats clearly as plan completion, is the top open item.
- **Colour cap.** $r_i$ is capped at 4 for legibility; two badly
  neglected pursuits can look equally urgent.
- **Birth credit.** Computed once from `createdAt`; editing quota
  mid-week does not adjust it retroactively.
- **No lookahead.** The greedy rule cannot reason about whether working
  on one pursuit now will cause another to miss quota later.

## Contributing

Issues and pull requests welcome, particularly:

- Reconciling the home-screen and Stats ranking formulas
- JSON export/import for backup and cross-device use
- Accessibility (keyboard navigation, screen-reader labelling)

## License

MIT.
