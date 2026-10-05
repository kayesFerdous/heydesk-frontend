# Research: how production-grade product UI is built

Done 4 Oct 2026 to replace the first HeyDesk theme (pale stone canvas, floating
white panel, pill nav, green accent), which the owner rejected as "what most AI
tools produce". This note is the evidence behind
[design-direction.md](design-direction.md).

## What each company actually does

### Google: Material 3 Expressive
Source: [design.google research write-up](https://design.google/library/expressive-material-design-google-research)
and [the nav rail changes](https://9to5google.com/2025/05/14/material-3-expressive-navigation/).

- Most-researched update in Material's history: 46 studies, 18,000+ people.
- Color, shape, size and **containment** are used deliberately to "draw
  attention to what matters". Users found the key action **up to 4x faster**
  when it was larger and colour-highlighted.
- The age gap disappeared: users 45+ located controls as fast as younger users.
  Relevant: our owners are not 22-year-old developers.
- Bigger buttons cut interaction time.
- Constraint: removing familiar patterns **reduced** usability. Do not invent
  navigation.
- Navigation rail: collapsed (icons) and expanded (labels + secondary
  destinations), for medium windows and up.

**Take:** one large, high-contrast primary action per screen. Familiar left rail
that collapses. Containment (grouped regions) instead of boxes everywhere.

### Apple: Liquid Glass and the HIG
Sources: [Create with Swift: Hierarchy, Harmony, Consistency](https://www.createwithswift.com/liquid-glass-redefining-design-through-hierarchy-harmony-and-consistency/),
[morrick's notes](https://morrick.me/archives/10068).

- Three principles: **Hierarchy** (controls elevate and distinguish the content
  beneath them), **Harmony** (concentric shapes: inner radii follow outer ones),
  **Consistency** (platform conventions, adapt across window sizes).
- Navigation and controls are one layer; content is another. Design the
  content first, then add navigation.
- Glass "shouldn't be decorative; it's a tool to signal depth, feedback or
  change of context."

**Take:** content full-bleed and calm; the rail is the "control layer". No
decorative glass. Concentric radii (outer 14, inner 10). Chrome recedes when you
are working.

### OpenAI: ChatGPT
Sources: [925 Studios breakdown](https://www.925studios.co/blog/chatgpt-interface-design-breakdown),
[style reference](https://styles.refero.design/style/52a007ed-ad1b-46a6-bd44-b76f91df6d0c).

- "Radical subtraction": the interface succeeded by getting out of the way.
- Near-monochrome: white surfaces, near-black text (#0D0D0D), secondary grey
  (#5D5D5D), a faintly tinted sidebar (#F9F9F9), almost no chromatic identity.
  Colour is saved for the one thing that matters.
- History is a **timeline** ("Today", "Yesterday", "Last 7 days"), not a file
  system.
- Reading column capped at ~65 characters.
- Capabilities named by **outcome** ("Fast", "Thinking"), not mechanism.
- Known weaknesses: generic labels ("New chat"), no search inside history.
  We can do better: search and meaningful labels.

**Take:** time-grouped Inbox and Conversations. Plain outcome words. Restraint:
the brand colour appears on actions and selection only.

### Meta: Ads Manager / Business Suite
Sources: [Adweek](https://www.adweek.com/?p=1039624),
[SEJ](https://searchenginejournal.com/facebook-is-improving-ads-manager-and-business-manager/303713).

- Meta rebuilt its business tools on a new design system with "simplified
  navigation, a cleaner design and a new campaign management experience".
- The new nav bar "gives users more space to manage their ads" and focuses on
  tools that show **performance and results**, not configuration.
- Business Suite's selling point is one **unified inbox** for messages and
  comments.

**Take:** a single Inbox is the home screen; navigation takes less space than the
work; results first, setup second.

### Stripe (and the dense-operational pattern)
Source: [AdminLTE 2026 dashboard principles](https://adminlte.io/blog/admin-dashboard-design/).

- Tables are the primary interface; 40px rows, 16px padding, 8-12 rows visible.
- In an operational screen "density is a feature and the job is to make action
  cheap."
- Cool, restrained tones and layered depth read as trust for products that
  handle money.

**Take:** HeyDesk handles customers' orders and money, so it should look like a
payments dashboard, not a toy: tabular figures, hairlines, predictable rows.

## What is wrong with the Gigalogy console (from the screenshots)

See [reference-notes.md](reference-notes.md) for the full list. In short: a loud
full-width blue band that carries nothing; fields and canvases far larger than
their content; every field the same weight; jargon labels; unlabeled icon-button
rows with Delete beside Edit; ALL-CAPS tracked buttons; four navigation layers
(breadcrumb, stepper, tabs, title) fighting at the top.

## What of Gigalogy's identity is worth keeping

Sampled from the screenshots:

| Asset | Value | Keep as |
| --- | --- | --- |
| Top bar blue | `#004AAC` (0,74,172) | **The brand colour.** Primary actions, links, selection, focus. |
| Project names | `#283371` deep indigo navy | Record names and headings, used for emphasis. |
| Success green | the "Maira" chip | Success and "live" only. |
| Logo | a constellation of connected dots | The HeyDesk mark and a faint node motif. |
| Workspace switcher | "Gigalogy Dev" with chevron at top-left | Business switcher at the top of the rail. |
| White content body | | Content stays white. |

What changes: the blue stops being a banner and becomes a **deliberate system**:
deep navy rail, cobalt actions, white work area.

## The rules this research gives us

1. Content first. Full-bleed white work area; no floating card, no outer canvas.
2. One control layer: a left rail (collapsible), not a top band plus a sidebar.
3. One big, coloured primary action per screen; secondary actions quiet;
   destructive actions out of the way.
4. Familiar patterns only (rail, tabs, tables, split view).
5. Time-grouped lists; outcome words; plain English.
6. Restraint: brand blue only for action and selection; semantic colours only
   for state.
7. Dense-but-calm tables: 56px rows (touch friendly), hairlines, tabular
   figures, status = icon + text.
8. Sentence case everywhere. No ALL-CAPS buttons.
9. Concentric radii, one rule.
10. Both light and dark from the start (the rail is already dark).
