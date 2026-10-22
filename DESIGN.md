---
name: Lister
description: Local Kanban board where the running task is the live broadcast scoreboard.
colors:
  ground: "#141311"
  rail: "#0f0e0c"
  slab: "#1d1b17"
  slab-2: "#24211c"
  slab-3: "#2c2822"
  line: "#2f2b24"
  line-2: "#3d382f"
  cream: "#e9e2d3"
  muted: "#b0a896"
  faint: "#8c8473"
  violet: "#8b7cf6"
  violet-ink: "#b3a8fa"
  violet-deep: "#2a2547"
  stamp: "#e0713f"
  amber: "#d4ad55"
  sage: "#9fb38a"
typography:
  display:
    fontFamily: "Barlow Condensed, Barlow, system-ui, sans-serif"
    fontSize: "40px"
    fontWeight: 700
    lineHeight: 1
    fontFeature: "tnum"
  headline:
    fontFamily: "Barlow Condensed, Barlow, system-ui, sans-serif"
    fontSize: "28px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.03em"
  title:
    fontFamily: "Barlow Condensed, Barlow, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 700
    lineHeight: 1.55
    letterSpacing: "0.05em"
  body:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: 1.375
  label:
    fontFamily: "Barlow Condensed, Barlow, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0.12em"
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.violet}"
    textColor: "{colors.ground}"
    rounded: "{rounded.md}"
    padding: "6px 12px"
  button-primary-hover:
    backgroundColor: "{colors.violet-ink}"
    textColor: "{colors.ground}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.muted}"
    rounded: "{rounded.md}"
    height: "36px"
    padding: "0 12px"
  button-outline-hover:
    textColor: "{colors.cream}"
  button-destructive:
    backgroundColor: "{colors.stamp}"
    textColor: "{colors.ground}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  input-field:
    backgroundColor: "{colors.slab}"
    textColor: "{colors.cream}"
    rounded: "{rounded.md}"
    height: "36px"
    padding: "0 12px"
  task-card:
    backgroundColor: "{colors.slab}"
    textColor: "{colors.cream}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "10px 12px"
  task-card-hover:
    backgroundColor: "{colors.slab-2}"
  task-card-running:
    backgroundColor: "{colors.violet-deep}"
  column:
    backgroundColor: "{colors.slab}"
    rounded: "{rounded.lg}"
    width: "304px"
  column-header:
    backgroundColor: "{colors.slab}"
    typography: "{typography.title}"
    height: "48px"
  scoreboard:
    backgroundColor: "{colors.slab}"
    textColor: "{colors.cream}"
    rounded: "{rounded.md}"
    height: "56px"
  scoreboard-tag-running:
    backgroundColor: "{colors.violet}"
    textColor: "{colors.ground}"
    typography: "{typography.title}"
  nav-rail:
    backgroundColor: "{colors.rail}"
    width: "240px"
  nav-item-active:
    backgroundColor: "{colors.slab-2}"
    textColor: "{colors.cream}"
    rounded: "{rounded.md}"
    padding: "10px 12px"
  chip-tag:
    backgroundColor: "transparent"
    textColor: "{colors.cream}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
  chip-tag-selected:
    backgroundColor: "{colors.violet-deep}"
    textColor: "{colors.cream}"
---

# Design System: Lister

## Overview

**Creative North Star: "Placar ao Vivo"**

Lister borrows the grammar of Brazilian football TV graphics and prints it in the colours of an old time card (Cartão de Ponto). The running task is the placar: a pinned slab in the corner of the board with a column tag, the task name, a big tabular clock and a pulsing "Ao vivo" dot. Everything else (rail, board, columns, cards) is set in the same vocabulary of matte slabs, condensed uppercase labels and score pairs, so time reads like a scoreline at every level: per task, per column, per board.

The interface is dark, warm and matte. Surfaces are kraft-dark slabs on a graphite ground, separated by hairlines rather than shadows. Colour is rationed: violet means "act or running", the vermilion stamp means "live, urgent or destructive", and nothing else carries hue except the user's own tag colours. Density is high but calm, built for an all-day desktop window: dense cards on an 8px rhythm, whole board visible at once.

Rejected: neon or gamer glow, gradients, the generic grey Trello look.

**Key Characteristics:**
- Matte slab layering on a graphite ground; hairline borders, no glow, no gradients.
- Barlow Condensed uppercase for every label, title and number; Barlow for reading text.
- Tabular numerals everywhere time or counts appear.
- Score pairs (count | time) as two joined chips.
- One action colour (violet), one alarm colour (stamp).
- The scoreboard wipes in left-to-right when a clock starts.

## Colors

A warm time-card palette: graphite and kraft-brown neutrals, cream ink, a stamp-violet for action and a vermilion stamp for live and danger.

### Primary
- **Stamp Violet** (violet): the only action and running colour. Primary buttons, the running scoreboard's column tag, the running card's border, the live column's header underline, the active board's rail bar, checked checkboxes, focus outlines, caret, subtask progress.
- **Violet Ink** (violet-ink): violet as text on dark: running time readouts, play icons on idle buttons, "Limpar filtros" link, selected-option checkmarks. Also the primary button's hover fill.
- **Violet Deep** (violet-deep): violet as a surface: the running card's fill (at 50%), active filter button fill (at 40%), selected tag chip, idle scoreboard resume button.

### Secondary
- **Vermilion Stamp** (stamp): the live dot and "Ao vivo" text, Alta priority, destructive actions (delete text, confirm-delete button, hover on delete icons).

### Tertiary
- **Ledger Amber** (amber): Média priority only.
- **Field Sage** (sage): Baixa priority and completed subtask counts.

### Neutral
- **Graphite Ground** (ground): app ground, inset fields, score-chip backgrounds, checkbox fill.
- **Rail Black** (rail): the 240px board rail.
- **Kraft Slab** (slab): cards, column headers, scoreboard, drawer, dialogs, inputs. Columns use it at 45%.
- **Kraft Slab 2** (slab-2): hover fill, active rail item, popover menus.
- **Kraft Slab 3** (slab-3): menu item hover, idle scoreboard tag, column-tag block in the drawer header.
- **Hairline** (line): default dividers and card borders.
- **Hairline Strong** (line-2): interactive borders (inputs, outline buttons, kbd), idle column header underline, scrollbar thumb.
- **Cream Ink** (cream): primary text.
- **Muted Ink** (muted): secondary text, descriptions, idle time.
- **Faint Ink** (faint): labels, dates, placeholders, disabled marks.

### Tag colours (data-bound, outside the palette)
User tags store one of 17 Tailwind `-500` background classes (red through rose) in their saved data. They are the user's data, not system colour: shown only as small bars (28 x 4px) on cards and 8px dots in chips and filters, never as fills, text or borders.

### Named Rules
**The Two Stamps Rule.** Violet means act or running; stamp means live, urgent or destructive. No third accent enters the UI chrome.

**The Ink Not Paint Rule.** Accents appear as text, thin borders, dots and short bars. Full accent fills are reserved for primary buttons, the running scoreboard tag and the confirm-delete button.

## Typography

**Display Font:** Barlow Condensed (with Barlow, system-ui)
**Body Font:** Barlow (with system-ui)

**Character:** Broadcast graphics: condensed bold caps for anything that is a name, a label or a number; a plain, sturdy grotesk for anything you read as a sentence.

### Hierarchy
- **Display** (700, 40px, line-height 1, tabular): clocks in the drawer and floating timer. The in-board scoreboard clock runs the same style at 34px.
- **Headline** (700, 28px, line-height 1, 0.03em, uppercase): the board title. The LISTER wordmark uses 26px at 0.06em.
- **Title** (700, 18px, 0.05em, uppercase): column headers and scoreboard tag (scoreboard at 0.08em). Dialog titles use 20px at 0.04em.
- **Body** (Barlow 500, 14px, line-height 1.375): card titles. Descriptions run Barlow 400 at 13-14px in muted ink. The drawer's editable task name is Barlow 600, 22px, tight.
- **Label** (600, 13px, 0.12em, uppercase): drawer field labels in faint ink. Card meta rows use the same face at 0.05em; rail section headers 12px at 0.14em; the "Ao vivo" tag 700 at 0.16em.

### Named Rules
**The Scoreline Rule.** Every time value and count is set in Barlow Condensed with tabular numerals, so ticking clocks never shift width.

**The Caps Are Names Rule.** Uppercase condensed is for names, labels and numbers (boards, columns, fields, status). Sentences, task names and buttons that read as phrases stay in sentence-case Barlow.

## Layout

Fixed desktop frame: a 240px rail on the left, then the board. The board header is 64px tall with 24px side padding: title, score pair, then search and filters pushed right. The scoreboard sits under it with 16px top padding. Columns are 304px wide, 16px apart, scrolling horizontally; inside, cards stack 8px apart with 8-12px column padding. The task drawer is a 480px panel from the right, 24px inner padding, sections 28px apart.

Rhythm is 4/8px: most gaps are 8px, card padding 10px x 12px, larger groupings 16px and 24px. At 1280px and up the header loosens (16px gap, wider search, "Tags" label shown); below it the Tags button collapses to its icon.

The floating timer window is its own frame: a 28px status strip over a clock row, rounded 8px on a transparent body.

## Elevation & Depth

Depth is tonal: ground, slab, slab-2 and slab-3 step lighter as layers rise, and hairlines separate them. Resting surfaces carry no shadow. Only things that float over the board (menus, popovers, dialogs, the drawer) get a soft dark drop shadow, and modal dialogs add a 60% black scrim.

### Shadow Vocabulary
- **Popover** (`box-shadow: 0 16px 32px -8px rgb(0 0 0 / 0.6)`): context menu, board menu, filter list, tag picker.
- **Dialog** (`box-shadow: 0 24px 48px -12px rgb(0 0 0 / 0.6)`): confirm dialog, command palette, tags manager.
- **Drawer** (`box-shadow: -24px 0 48px -16px rgb(0 0 0 / 0.55)`): the task drawer's left edge.

### Named Rules
**The Matte Rule.** Slabs are flat at rest. Shadows exist only on floating layers and are always soft, dark and offset downward or outward; never coloured, never glowing.

## Shapes

Small, consistent radii on rectangular slabs. 6px is the working corner (cards, inputs, buttons, scoreboard, menus); 8px for larger containers (columns, dialogs, floating timer); 4px for keycaps, score-chip halves and small icon buttons. Fully round only for dots, tag bars, tag chips and progress tracks. Borders are 1px hairlines; the one heavier stroke is the 2px underline on column headers. The scoreboard is a single slab cut into joined cells by internal hairlines, the defining silhouette of the system.

## Components

### Buttons
Compact and flat; colour says what kind of action it is.
- **Shape:** 6px corners; toolbar buttons 36px tall.
- **Primary:** violet fill, ground-coloured semibold text; hover lifts to violet-ink.
- **Outline (toolbar):** transparent with a line-2 border and muted text; hover brightens border to faint and text to cream.
- **Ghost:** no border, muted text, slab or slab-2 fill on hover (Cancelar, Adicionar tarefa, close).
- **Destructive:** stamp text with a 10% stamp hover wash, or a full stamp fill for the final confirm.
- **Focus:** global 2px violet outline, 2px offset.

### Chips
- **Tag chip:** pill with a line-2 border, 8px colour dot, 13px text; selected becomes violet border on violet-deep.
- **Priority toggle:** 36px condensed uppercase segment; selected takes its priority colour as text, 60-70% border and 10-15% fill.
- **Score pair:** two joined condensed tabular chips, count on the darker half, time on the lighter half; time turns violet-ink while live.

### Cards / Containers
- **Corner Style:** 6px.
- **Background:** slab; hover slab-2 with a line-2 border; running card violet border on violet-deep at 50%; completed card loses its border and fades to slab at 50% with struck-through faint title.
- **Shadow Strategy:** none (see Elevation).
- **Border:** 1px line.
- **Internal Padding:** 10px x 12px. A play button appears top-right on hover and stays visible (violet) while running.

### Inputs / Fields
- **Style:** 1px line-2 border, slab or ground (60%) fill, 6px corners, 36px tall, faint placeholders, violet caret.
- **Focus:** border turns violet.
- **Checkbox:** 16px square, 4px corners, 1.5px line-2 border on ground; checked fills violet with a ground checkmark that scales in.

### Navigation
- **Rail:** rail-black, LISTER wordmark, a "Quadros · total" label row, then each board as a 6px-rounded row with name, condensed tabular time and a 3px proportional bar on a full-width line track. Active row is slab-2 with a violet bar; others muted with a faint bar. A live board shows a pulsing stamp dot.

### Scoreboard (signature)
A 56px slab with joined cells: column tag (violet fill when running, slab-3 when paused or idle), task name, 34px tabular clock on a darker inset, "Ao vivo" / "Pausado" status with dot, and a 56px pause/resume cell. When a clock starts it enters with a left-to-right clip wipe (520ms, ease-out-expo). The floating timer window and the drawer's time block repeat the same anatomy, so the placar is one object in three sizes.

### Motion
One curve, `cubic-bezier(0.16, 1, 0.3, 1)` (ease-out-expo): scoreboard wipe 520ms, drawer slide 320ms, popovers and dialogs scale in from 0.97 over 180ms. The live dot pulses on a 1.6s cycle. All animation stops under reduced-motion.

## Do's and Don'ts

### Do:
- **Do** set every clock, count and duration in Barlow Condensed with tabular numerals.
- **Do** keep violet for act and running, stamp for live, Alta and delete; amber and sage only for priority.
- **Do** build new surfaces from the slab ladder (ground, slab, slab-2, slab-3) with 1px hairlines.
- **Do** reuse the placar anatomy (tag cell, name, clock, status, toggle) wherever a running timer is shown.
- **Do** use the line-art icon set (24px grid, 1.75 stroke, round caps) for every icon.

### Don't:
- **Don't** add glow, gradients or coloured shadows.
- **Don't** put shadows on resting slabs; only floating layers get one.
- **Don't** use user tag colours as fills, text or borders; they stay as dots and short bars.
- **Don't** introduce a third accent hue into the chrome.
- **Don't** let time values use proportional figures.
