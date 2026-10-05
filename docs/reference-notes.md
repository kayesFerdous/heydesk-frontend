# Reference: the Gigalogy dashboard (what we are NOT building)

Screenshots of the current company product, kept here as an **anti-reference**.
The owner's verdict: "I completely don't like this." HeyDesk should feel like
the opposite of it. Files are in [reference/](reference/).

| File | Screen |
| --- | --- |
| `gigalogy-1-projects-list.webp` | Projects list, one table row, a disabled "Create Project" button |
| `gigalogy-2-dataset-form-top.webp` | Dataset update, stepper + first half of a long form |
| `gigalogy-3-dataset-form-bottom.webp` | The same form scrolled: Cancel / Skip update / Continue |
| `gigalogy-4-profile-settings.webp` | Profile settings, a form on top of three tabs |

## What is wrong with it (the things HeyDesk must not do)

1. **Material-default look.** Floating-label outlined inputs, a saturated blue
   top bar, grey sidebar, ALL-CAPS tracked buttons. It looks like a framework
   demo, not a product with a point of view.
2. **The blue bar carries nothing.** A full-width 88px blue band holds a logo,
   a bell, a globe and a name. It is the loudest thing on every screen and says
   the least.
3. **Giant empty canvases.** The projects page is one row of data floating in a
   vast white panel; the form fields are 1500px wide with one word in them.
   Nothing is sized to its content.
4. **Every field has the same weight.** On the dataset form eleven fields look
   identical, so the user cannot tell the two that matter from the nine that do
   not. No grouping, no progressive disclosure.
5. **Jargon in the UI.** "Index Column Name", "Secondary Index Column",
   "Fill Up Index if Empty", "Solution Type". The user must already know the
   system to use it.
6. **Weak hierarchy in tables.** Tiny grey headers, a green outlined chip, a
   row of five identical grey icon-buttons (view, edit, stop, refresh, delete)
   with no labels. Delete sits one pixel from Edit.
7. **Chat bubble in the corner** covers content on every screen (see the form
   bottom edge in screenshot 3).
8. **Navigation is just a list of words with big grey icons.** The active item
   is a grey slab. No sense of "where am I, what needs me".
9. **Breadcrumb + stepper + tab + title** all fight for the same 150px at the
   top of a page.

## What we keep in mind instead

- The owner of a small restaurant or clinic is **not technical**. Plain words,
  one obvious next step per screen.
- The first screen after login answers "what did my agent do while I was away?"
  (orders, messages, hand-offs), not "which project do you want to open?".
- Setup is a conversation-sized task: pick a preset, check a few facts, **talk
  to your agent right there**, done. Target: live in under five minutes.
- Calm, light, fast, a little warm. Premium through restraint (spacing, type,
  one accent), not through decoration.
