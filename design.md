---
version: alpha
name: PeoplePay360
description: A payroll ledger that reads like a well-kept book of account — quiet chrome, loud figures.
colors:
  primary: "#14283f"
  primary-hover: "#1d3855"
  primary-subtle: "#e7ecf2"
  on-primary: "#f7f9fb"
  accent: "#2563a8"
  accent-hover: "#1d4f8a"
  accent-subtle: "#e6eef7"
  on-accent: "#ffffff"
  canvas: "#f4f6f8"
  surface: "#ffffff"
  surface-raised: "#ffffff"
  surface-subtle: "#f7f9fb"
  surface-sunken: "#eceff3"
  text: "#111a24"
  text-muted: "#5b6672"
  text-subtle: "#69727d"
  text-inverse: "#f7f9fb"
  border: "#dde2e8"
  border-strong: "#c2c9d2"
  focus-ring: "#2563a8"
  success: "#1a6b47"
  success-subtle: "#e4f1ea"
  warning: "#8a5a00"
  warning-subtle: "#fbf0da"
  danger: "#a32330"
  danger-subtle: "#fbe9eb"
  info: "#1d5b8f"
  info-subtle: "#e9f1f8"
  chart-1: "#2563a8"
  chart-2: "#4c8ac4"
  chart-3: "#86b3d9"
  chart-4: "#1a6b47"
  chart-5: "#8a5a00"
  chart-track: "#eceff3"
typography:
  font-body: "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif"
  font-numeric: "'IBM Plex Mono', ui-monospace, 'SFMono-Regular', monospace"
  display:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: -0.02em
  h1:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: -0.02em
  h2:
    fontFamily: Inter
    fontSize: 22px
    fontWeight: 600
    lineHeight: 1.35
  h3:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: 600
    lineHeight: 1.35
  body-lg:
    fontFamily: Inter
    fontSize: 17px
    fontWeight: 400
    lineHeight: 1.6
  body:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.6
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: 500
    lineHeight: 1.35
  caption:
    fontFamily: IBM Plex Mono
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.35
    letterSpacing: 0.04em
  metric:
    fontFamily: IBM Plex Mono
    fontSize: 28px
    fontWeight: 600
    lineHeight: 1.15
weights:
  regular: 400
  medium: 500
  semibold: 600
  bold: 700
leading:
  tight: 1.15
  snug: 1.35
  normal: 1.6
tracking:
  tight: -0.02em
  normal: 0
  wide: 0.04em
rounded:
  none: 0px
  sm: 2px
  md: 4px
  lg: 6px
  full: 9999px
spacing:
  space-0: 0px
  space-1: 4px
  space-2: 8px
  space-3: 12px
  space-4: 16px
  space-5: 24px
  space-6: 32px
  space-7: 48px
  space-8: 64px
elevation:
  shadow-none: none
  shadow-sm: "0 1px 2px rgba(17, 26, 36, 0.06)"
  shadow-md: "0 4px 12px rgba(17, 26, 36, 0.10)"
  shadow-lg: "0 12px 32px rgba(17, 26, 36, 0.16)"
layout:
  container-max: 1280px
  container-narrow: 640px
  gutter: 24px
  nav-height: 56px
  control-height: 36px
  control-height-sm: 28px
borders:
  border-width: 1px
  border-width-strong: 2px
motion:
  duration-fast: 120ms
  duration-base: 200ms
  easing-standard: "cubic-bezier(0.2, 0, 0.15, 1)"
z-index:
  z-nav: 100
  z-dropdown: 200
  z-modal: 300
  z-toast: 400
  z-popover: 500
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    height: "{layout.control-height}"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-accent:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    height: "{layout.control-height}"
  button-accent-hover:
    backgroundColor: "{colors.accent-hover}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    borderColor: "{colors.border-strong}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    height: "{layout.control-height}"
  button-danger:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.danger}"
    borderColor: "{colors.border-strong}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    borderColor: "{colors.border}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    height: "{layout.control-height}"
  input-error:
    borderColor: "{colors.danger}"
    textColor: "{colors.danger}"
  card:
    backgroundColor: "{colors.surface}"
    borderColor: "{colors.border}"
    rounded: "{rounded.lg}"
    padding: "{spacing.space-5}"
  table-header:
    backgroundColor: "{colors.surface-sunken}"
    textColor: "{colors.text-muted}"
    typography: "{typography.label}"
  amount:
    fontFamily: "{typography.font-numeric}"
    textColor: "{colors.text}"
    typography: "{typography.body-sm}"
  amount-negative:
    textColor: "{colors.danger}"
  badge-status:
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: "{spacing.space-1}"
  kpi-value:
    fontFamily: "{typography.font-numeric}"
    typography: "{typography.metric}"
    textColor: "{colors.primary}"
  modal:
    backgroundColor: "{colors.surface-raised}"
    rounded: "{rounded.lg}"
    shadow: "{elevation.shadow-lg}"
    padding: "{spacing.space-5}"
---

# PeoplePay360

## Overview

PeoplePay360 is used by people who are held to account for the numbers on the screen. A payroll
officer approving 42 payslips is not browsing — they are checking, and if something is wrong they
have to find it before it reaches a bank. The interface is therefore built like a ledger: quiet
chrome, dense but legible rows, and figures that carry every bit of visual weight the layout can
spare.

Density is high by intent. Twenty rows visible without scrolling matters more than generous
whitespace. Nothing decorative appears anywhere; there are no illustrations, no gradients, no
photography, no icons used as ornament. The product should feel like it has been in service for
years and is maintained by someone meticulous.

The memorable element is a single deliberate choice: **every figure in the product is set in a
monospaced face with tabular alignment.** Money, day counts, hours, rule codes, contract
references, periods and clock times all sit in the same column-aligned typeface, right-aligned in
tables and totalled under a hairline rule. Scanning a column of amounts for the one that is wrong
is the core task, and this is what makes it possible. Everything else — the nav, the forms, the
headings — stays deliberately unremarkable so the figures are the only thing that stands out.

## Colors

An ink navy on a cool grey ground, with one clear blue carrying every action.

- **Primary (#14283f)** — ink navy. The navigation bar, page headings, KPI values and primary
  buttons. It reads as institutional rather than corporate because it is nearly black, not bright.
  It never appears as a large flat decorative field.
- **Accent (#2563a8)** — the one clear blue. Reserved for the primary action on a screen, for
  links, for the focus ring and for the first chart series. It never decorates.
- **Canvas (#f4f6f8)** — a cool grey page ground so white cards and table bodies separate without
  a shadow doing the work.
- **Surface-sunken (#eceff3)** — table headers, wells and chart tracks. It is the only fill that
  appears behind large regions of text.
- **Text (#111a24)** — near-black with a blue cast, in the same family as the primary.
- **Status colours** — success, warning, danger and info carry record state only: payslip and
  pay run status, request approval state, contract validity, payroll warnings. They never appear
  as decoration and never as chart series.
- **Chart colours** — five values, ordered. Series use them in order and never skip. Because they
  run blue → blue → blue → green → amber, no chart may rely on colour alone to distinguish a
  series; every chart carries a legend or direct labels.

Each status colour has a `-subtle` pair for badge and banner fills; the strong value is the text.

**Contrast.** Every text-on-background pair used in the product clears WCAG AA at 4.5:1:
text on surface 16.9:1, text on canvas 16.2:1, text-muted on surface 5.8:1, text-muted on canvas
5.4:1, text-subtle on surface 4.9:1, accent on surface 6.1:1, on-accent on accent 6.1:1,
on-primary on primary 14.7:1, success on success-subtle 5.6:1, warning on warning-subtle 5.2:1,
danger on danger-subtle 6.6:1, info on info-subtle 6.5:1.

## Typography

Two families, with a hard division of labour that is never blurred.

- **Inter** carries everything a person reads as language: display, h1 through h3, body, labels,
  buttons, form fields, nav items and prose. Headings are semibold with tight tracking; body has
  no tracking adjustment.
- **IBM Plex Mono** carries everything a person reads as a figure: money, day and hour counts,
  percentages, dates, clock times, rule codes, contract references, employee codes and period
  labels. It is set with tabular figures so columns align across rows.

The rule is absolute and is what gives the product its character: **if it is a number or a code,
it is mono; if it is language, it is Inter.** A table cell containing "Aarav Mehta" is Inter; the
cell next to it containing "₹85,000.00" is mono. A KPI card's label is Inter; its value is mono.
There is no third family and no italic anywhere.

Body copy sits at 16px with 1.6 line height. Table cells drop to 14px with 1.35, because density
is the point. Nothing in the product is smaller than 12px, and nothing a user must read to
complete a task is smaller than 14px.

## Layout

A full-bleed top navigation bar 56px tall, then a single content column capped at 1280px with a
24px gutter. Forms and single-column reading views use the 640px narrow variant. There is no
sidebar. Navigation is three tiers deep, and they are not interchangeable:

- **Tier 1, the top bar.** Employees, Attendance, Time off, Payroll, Reports. Items are pills; the
  active one takes a `primary-hover` fill rather than merely turning semibold. Payroll and Reports
  render only for roles with payroll read access. Employees stays lit for everything filed under
  it — departments, contracts, schedules, holidays and users.
- **Tier 2, the module sub-navigation.** A tab strip under the page header, carried by three
  modules: Employees (Directory, Contracts, Working schedules, Public holidays, and User
  management for admins only), Time off (Overview, Requests, Allocations, Leave types) and Payroll
  (Dashboard, Pay runs, Payslips, Salary structures, Salary rules). These are routes, not panels.
  Payroll carries the strip on its form screens too; the other two drop it once you are inside a
  record.
- **Tier 3, in-page tabs.** The same strip used to switch panels without changing route. Only
  Reports and the profile page use it.

The right end of the top bar holds three controls that open panels in place rather than
navigating: the attendance check-in pill, the notification bell, and the account menu. The pill is
absent for accounts with no employee record.

Spacing uses only the named 4px steps. Page sections are separated by `space-6`; groups within a
section by `space-5`; elements within a group by `space-2` or `space-3`. Card interiors use
`space-5`. Table cells use `space-3` vertical and `space-4` horizontal.

Tables are the dominant layout. Every list view is: page header, then the module sub-navigation,
then a full-width table inside a bordered card. Filtering lives inside the table's own header — a
second header row of one control per column — and the pager sits in the card footer, so the card
holds the whole interaction and nothing floats above it. Form views are a two-column grid of
label-above-field pairs at desktop, collapsing to one column below 900px. The dashboard is a
four-column grid of KPI cards above a two-column grid of chart and table cards.

## Elevation & Depth

Depth comes from surface tone and hairline borders, never from shadow. A white card on the cool
grey canvas with a 1px border establishes its own layer; that is the entire system for anything
sitting in the page flow.

Shadow is reserved for the three things that genuinely float: modals (`shadow-lg`), dropdowns and
popovers (`shadow-md`), and toasts (`shadow-md`). Only those.

Never combine a border and a shadow on the same element.

Stacking order runs nav, dropdown, modal, toast, popover. The last of those is deliberately the
highest: a modal can contain a select or a menu, so anything portalled out of the document flow
has to clear the modal that opened it. `z-dropdown` is for menus that stay in flow; portalled
overlays take `z-popover`.

## Shapes

Corners are restrained to the point of being nearly square: 4px on buttons and inputs, 6px on
cards and modals, 2px on inline chips inside table cells, and pill only on status badges. Nothing
is fully square and nothing is heavily rounded. Within one view, no more than two radius values
appear outside of badges.

Charts use square-cornered bars. Donut rings are the only circular geometry in the product.

## Components

- **Sub-navigation.** A tab strip directly under the page header, separated from the content by a
  hairline that runs the full width. The active tab takes a 2px accent underline and semibold text;
  the rest are muted and underline in `border-strong` on hover. It is navigation, so it looks
  identical to in-page tabs on purpose — the tier is told apart by position, not by styling.
- **Buttons.** Four variants. Primary is the ink navy fill, for the main action on a screen.
  Accent is the blue fill and appears at most once per screen, reserved for the action the user
  came to perform — "Create pay run", "Approve", "Compute". Secondary is white with a strong
  border. Danger is white with a strong border and danger-coloured label, used only for Refuse,
  Archive and Delete. All are 36px tall with `space-4` horizontal padding and a `label` type size.
  Labels are sentence-case verbs naming what happens: "Create pay run", never "Submit".
- **Inputs.** 36px tall, white, 1px border, 4px radius, `body-sm` type. The label sits above in
  `label` weight medium; helper text sits below in `caption` muted. In error, the border and the
  helper text turn danger; the label does not. Read-only derived fields (weekly hours, worked
  days, remaining balance) use the sunken fill with no border, so a user can see at a glance
  which numbers the system owns.
- **Cards.** White, 1px border, 6px radius, `space-5` padding. A card has an optional header row
  with an `h3` title on the left and controls on the right, separated from the body by a hairline.
- **Tables.** Header row on the sunken fill with `label` type in muted; body rows on surface with
  a hairline between them and no zebra striping. Text columns left-aligned in Inter; every numeric
  column right-aligned in mono. A totals row, where present, sits under a strong hairline and is
  set semibold. Row hover fills with `primary-subtle`. The row itself is not a click target: the
  first cell carries a link to the record, and destructive or editing actions live in a trailing
  Actions column that is rendered for admins only.
- **Sortable heads and column filters.** Sortable heads carry their direction glyph at all times —
  muted when idle, accent when the column is the sort key — so the header never reflows on click.
  Under them sits a second header row holding one filter control per filterable column: a text box
  by default, a date input or a select where the column warrants it, each on surface at `caption`
  size. A column with nothing to filter leaves its cell empty rather than borrowing a neighbour's.
- **Pager.** Sits inside the card, under the table, above a hairline. The range reads `1–10 of 38`
  in mono on the left; Previous and Next are small secondary buttons on the right, disabled rather
  than hidden at the ends. Page size is fixed and never offered as a control.
- **Amounts.** Mono, tabular, right-aligned. Deductions and negative values render with a leading
  minus in the danger colour. Currency symbol is part of the string, not a separate element.
  When a payslip is shown in a payout currency, the converted value sits below the original in
  `caption` muted — the original never disappears.
- **Status badges.** Pill, `-subtle` fill, strong-colour text, `caption` mono. One badge per row
  or per header. The mapping is fixed: `success` for approved, running, present, paid and done;
  `warning` for to_approve, draft, late and computed; `danger` for refused, absent, expired,
  cancelled and any blocking warning; `info` for validated and half_day; neutral sunken for
  inactive, archived and non-working.
- **Smart buttons.** On the employee form only: a horizontal row of bordered buttons, each with
  its `caption` label above and its mono count below, linking to the filtered related list.
- **Warning banners.** Full-width inside the card, `-subtle` fill, 1px border in the strong colour,
  a `body-sm` message and a mono count. Blocking warnings use danger; advisory use warning.
- **Empty states.** Centred in the container with `space-8` vertical padding: one line of `body`
  in muted saying what would appear here, and one secondary button offering the action that would
  fill it. No illustration.
- **Error states.** Same geometry as empty, but with a `body` line in danger naming what failed
  and a secondary "Try again" button. Never a raw error code in the user-facing line.
- **Modals.** 640px max width, surface raised, `shadow-lg`, `space-5` padding, a hairline-separated
  header and footer, dismissible by Escape and by an explicit Cancel button. The pay run wizard is
  two modals in sequence, each with its step named in the title. Destructive actions share one
  confirm modal: the record named in bold, the sentence "This action cannot be undone", Cancel and
  a danger button naming the deletion. A server refusal renders inside the modal body in danger
  `caption`; the modal stays open.
- **Popovers.** Three hang off the top bar, all `shadow-md` on surface raised, all anchored to
  their trigger and closed by Escape or an outside click. The **attendance** popover shows the
  employee, an open/off-duty badge, the check-in time, the running elapsed clock in mono at `h1`,
  the day's worked hours, and a full-width accent button to punch the other way. The
  **notification** popover is wider and unpadded, owning a header with a Clear all control, a
  scrolling list where unread items take the `accent-subtle` tint, and a footer link through to
  the full page — the bell never navigates on its own. The **account** menu is a short list of
  destinations: profile, then sign out.
- **Avatars.** Initials only, never a photograph. Mono on `primary-subtle` at list size; on the
  profile hero it grows to `space-8`, takes the accent fill and sets its initials in Inter bold.
- **Profile hero.** A `surface-subtle` band across the top of the profile card: avatar, name, the
  status and role badges inline with it, then position, department and location on one muted line,
  and the account email in mono beneath. Editing controls sit at the far right of the band.
- **Charts.** Recharts, drawing every colour from the chart tokens. No gridline heavier than
  `border`, no drop shadows, no gradient fills, no 3D. Axis labels in `caption` mono. A bar chart
  labels its values directly above each bar rather than relying on the axis.
- **Year calendar.** Twelve rows, 31 day columns, `caption` mono day numbers. Non-working days
  take the sunken fill, holidays take `border-strong`, leave days take their time off type's
  colour at full strength, half days take the same colour on a diagonal split. Today gets a 2px
  accent outline, never a fill.

## Do's and Don'ts

- Do set every number, code, date and time in the mono family
- Do right-align every numeric table column
- Do use the accent colour for exactly one action per screen
- Do give every list a loading, an empty and an error state
- Do keep a list's filters, rows and pager inside the one card
- Do let the bell, the check-in pill and the account menu open in place rather than navigating
- Do show the original currency alongside any converted amount
- Do label chart values directly rather than relying on the legend colour alone
- Don't put a shadow and a border on the same element
- Don't use status colours for anything that is not a record state
- Don't use more than two radius values in one view, badges excepted
- Don't set all-caps tracked-out labels above headings
- Don't introduce a colour, a font size or a spacing value that is not a token
- Don't animate anything the user did not trigger
- Don't use an icon where a word fits — icons pair with a label (Edit, Delete) or carry an
  accessible name when the control is genuinely iconic, as the notification bell is
- Don't let a derived field look editable