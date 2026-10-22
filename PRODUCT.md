# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

(Tauri 2 desktop app on Windows; the UI is a React web view. Design language is web, not native OS.)

## Users

A single person — the owner — using Lister as their personal command board for both paid work (client projects, freelas) and personal life (home, weekend, "today"). The app stays open on the desktop all day.

## Product Purpose

Organize everything the owner has to do in Kanban boards, and track time spent on tasks. Success = at any moment the owner knows what to do next, and the hours logged per task are reliable enough to account for (e.g. billing a client).

## Positioning

A local, private, single-user board where time tracking is first-class: starting a task's timer pops a small always-on-top floating timer and gets the board out of the way, so focus and logged hours come from the same gesture.

## Operating Context

- Windows desktop, mouse + keyboard, long sessions.
- Workflow: pick a board → scan columns → open/edit a task → start the timer → work with the floating timer window → pause/resume → back to the board.
- Data is stored locally in `lister_data.bin` (Tauri Store, key `boards`). No accounts, no sync, no network required.

## Capabilities and Constraints

- Multiple boards (create, select, delete), each with columns and tasks; columns and tasks reorder via drag and drop.
- Column: title, optional description, editable inline.
- Task: title, description, priority (Baixa/Média/Alta), tags (per board, 17 colors), subtasks with progress, created/completed dates, completion checkbox.
- Time tracking per task (`timeLog`, `isRunning`, `lastStartTime`); one floating `timer` window synced with the main window via Tauri events (`timer-state-sync`, `timer-toggle`, `request-timer-state`).
- Data model must stay backward-compatible with Lister 0.2.0 (same identifier `com.lister.app`, same store file and shape) — the owner already has real data.
- UI language: Brazilian Portuguese.
- Redesign scope: full freedom — flows may be rethought and features added when they improve daily use.

## Brand Commitments

- Name: Lister. Existing app icon at `public/lister.ico`.
- Dark interface (explicit owner request).

## Evidence on Hand

Real boards exist in the owner's local data (e.g. Empreegou, Recomendacao, Hoje, Final de semana, Casa, Lister, Tarefas). No external users, testimonials or metrics; none must be invented.

## Product Principles

1. The next action is always obvious: what's running, what's next, what's overdue in attention.
2. Time is a first-class citizen: starting, pausing and reading logged time takes one gesture from anywhere.
3. Never lose data: compatibility with existing stored boards outranks any redesign idea.
4. Built for all-day presence: calm, low-fatigue, dense enough to see a whole board at once.
5. Fast hands: common actions reachable by keyboard.
