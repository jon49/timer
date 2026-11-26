# Timer

A timer page which allows multiple timers to run at the same time.

[The website can be accessed here.](https://jon49.github.io/timer/)

## Implementations

The same app is written twelve times, once per directory in `src/`, to compare
ways of building a front end. They look and behave the same. `./tasks/e2e.sh`
runs one set of checks against every build to keep it that way: adding,
editing and validating timers (the time takes a click to edit, and a running
timer keeps going), the countdown, alarm and restart, the 2-minute
auto-stop, sounds, both options dialogs, delete, download/upload and arrow-key
navigation. They all keep their data in the same `localStorage` key, so you can
switch between them without losing your timers.

| Implementation | Path | How it's built |
|---|---|---|
| [van-timer](src/van-timer) | `/van/` | [VanJS](https://vanjs.org/) states and `van.tags`. |
| [react-timer](src/react-timer) | `/react/` | [React 19](https://react.dev/) function components and hooks. |
| [svelte-timer](src/svelte-timer) | `/svelte/` | [Svelte 5](https://svelte.dev/) with runes. |
| [solid-timer](src/solid-timer) | `/solid/` | [SolidJS 2.0](https://www.solidjs.com/) signals and split effects. |
| [morph-timer](src/morph-timer) | `/morph/` | Every change renders the whole app with [html-template-tag-stream](https://github.com/jon49/html-template-tag-async) and [idiomorph](https://github.com/bigskysoftware/idiomorph) morphs it in. `_click`/`_change`/`_load` actions come from [@jon49/web](https://github.com/jon49/jon49-web). |
| [morph-scoped-timer](src/morph-scoped-timer) | `/morph-scoped/` | The same, except each action renders and morphs only what it changed: one timer's card, or the open dialog. |
| [html-tag-timer](src/html-tag-timer) | `/` and `/html-tag/` | The same actions as morph-scoped-timer, with no morphing. Each renders only what it changed (one timer's clock or time, or the dialog) with [html-template-tag](https://github.com/AntonioVdlC/html-template-tag) and swaps it in with `outerHTML`/`innerHTML`. The main site. |
| [malinajs](src/malinajs) | `/malinajs/` | [Malina.js](https://malinajs.github.io/) components, compiled with Rollup. |
| [_action](src/_action) | `/_action/` | `<template>` clones and a small `_click="method"` attribute dispatcher. |
| [data-action](src/data-action) | `/data-action/` | The same, with `data-action="method"` attributes. |
| [stage-left](src/stage-left) | `/stage-left/` | Custom elements rendered with the `stage-left` template library in the directory. |
| [vanilla](src/vanilla) | `/vanilla/` | Custom elements and DOM APIs only. |

Shared assets ([nimble.css](https://github.com/Leftium/nimble.css), `main.css`, images and sounds) live in `static/`. Each
implementation keeps its own copy of the few framework-neutral modules (the
store, alarm, ticker and download/upload), so each one stands alone.

## Comparison

Measured 2026-11-25 with Chromium 145 on an Intel Core i5-1235U laptop, with 20
saved timers. `./tasks/measure.sh` builds everything and prints this table.

| Implementation | HTML + JS, KB (raw / gzip / brotli) | Source lines | Startup, ms | Add 20 timers, ms | JS heap idle / running, MB | DOM elements | Script time while running, ms/s |
|---|---|---|---|---|---|---|---|
| van-timer | 13.5 / 5.6 / 5.0 | 587 | 48 | 18 | 0.89 / 1.76 | $\color{#2da44e}\mathbf{356}$ | 0.52 |
| react-timer | 192.9 / 61.3 / 52.9 | 555 | 100 | 53 | 1.42 / 2.58 | $\color{#2da44e}\mathbf{356}$ | 1.41 |
| svelte-timer | 67.9 / 26.0 / 23.3 | 526 | 68 | 32 | 1.27 / 2.23 | $\color{#2da44e}\mathbf{356}$ | 0.94 |
| solid-timer | 56.3 / 21.7 / 19.6 | 570 | 52 | 23 | 1.07 / 1.98 | $\color{#2da44e}\mathbf{356}$ | 1.08 |
| morph-timer | 24.6 / 9.0 / 7.9 | 576 | 47 | 124 | 0.75 / 1.80 | 358 | 0.30 |
| morph-scoped-timer | 25.1 / 9.1 / 8.1 | 597 | 47 | 14 | 0.75 / 1.76 | 359 | 0.40 |
| html-tag-timer | 14.8 / 5.8 / 5.0 | 598 | 41 | 11 | $\color{#2da44e}\mathbf{0.66}$ / 1.58 | 358 | 0.40 |
| malinajs | 17.5 / 7.2 / 6.3 | $\color{#2da44e}\mathbf{503}$ | 40 | 13 | 0.85 / 1.71 | $\color{#2da44e}\mathbf{356}$ | $\color{#2da44e}\mathbf{0.21}$ |
| _action | 13.7 / 5.1 / 4.4 | 628 | $\color{#2da44e}\mathbf{39}$ | 9 | 0.68 / $\color{#2da44e}\mathbf{1.53}$ | 378 | 0.36 |
| data-action | 13.9 / 5.1 / 4.4 | 626 | 40 | 9 | 0.68 / 1.54 | 378 | 0.39 |
| stage-left | 15.0 / 5.6 / 4.9 | 738 | 44 | 9 | 0.76 / 1.61 | 398 | 0.44 |
| vanilla | $\color{#2da44e}\mathbf{13.3}$ / $\color{#2da44e}\mathbf{5.0}$ / $\color{#2da44e}\mathbf{4.3}$ | 598 | 40 | $\color{#2da44e}\mathbf{8}$ | 0.68 / 1.54 | 397 | 0.36 |

Lower is better in every column, and the best in each is in bold green.

What each column measures:

- **HTML + JS**: the page and every script and stylesheet it loads, less what
  all of them share (nimble, `main.css`, images, sounds). Compressed with gzip -9
  and brotli 11.
- **Source lines**: non-blank lines of the app's own code and `index.html`. About
  200 of them are the shared modules every implementation copies.
- **Startup**: from navigation until all 20 timers are on the page, with the CPU
  slowed 4× to stand in for a phone. Median of 7 runs. Runs vary by about
  ±20 ms, so smaller differences are noise.
- **Add 20 timers**: clicking Add Timer 20 times on an empty page, waiting for
  each new timer to appear. CPU slowed 4×, median of 3 runs.
- **JS heap**: used heap after garbage collection, first with all timers
  stopped, then with all 20 counting down.
- **DOM elements**: elements on the page with 20 timers.
- **Script time while running**: JavaScript time per second of wall clock with
  20 timers counting down.

What stands out:

- **React costs the most to load.** Its page is over 12× the size of the
  smallest (53 KB against 4 KB brotli), and it starts the slowest. Svelte and
  Solid come to 20–23 KB. VanJS, Malina.js, morph-timer and the hand-written
  ones stay at 4–8 KB.
- **The dependency-free versions are the smallest and lightest**, but not by
  much. VanJS and Malina.js are within 1–2 KB of them, with about the same heap.
- **Re-rendering everything has a cost, and scoping the render removes it.**
  morph-timer starts about as fast as any of them, but each new timer re-renders
  and morphs every timer, so adding 20 takes the longest of all, over twice as
  long as React (124 ms against 53 ms). morph-scoped-timer renders only the new
  card, and adds them about 9× faster (14 ms). It costs 21 lines of code and
  0.2 KB. Both change the same DOM
  nodes, because idiomorph leaves unchanged nodes alone. The time goes to
  rendering the HTML and diffing it.
- **Once the render is scoped, the morph isn't needed.** html-tag-timer has
  the same actions as morph-scoped-timer. It sets `outerHTML`/`innerHTML` on
  the part that changed, and gives the focus back to the element with the same
  `id`. A start, stop or ring changes only the clock button, so that's all it
  replaces. Without idiomorph or the streaming templates, it's 5.0 KB brotli
  against 8.1, about the size of the hand-written ones, and it adds 20 timers
  about as fast as they do (11 ms against 8–9). It stays on html-template-tag 4.0.1: from 4.1 on, the
  tag checks the HTML so far against 444 attribute names for every value it
  fills in. That costs about 1 ms per card with the CPU slowed 4×, and tripled
  the time to add 20 timers (34 ms).
- **Dialogs that wait in the page add up.** _action and data-action used to keep
  each timer's settings dialog (12 sound choices) and the all-timers dialog in
  the page, 1,048 elements in all. Now, like the others, they create a dialog
  when it opens. That brings them to 378, and adding timers got about a third
  faster. VanJS kept two empty `<div>`s for each place a dialog goes (419); it
  now has 356, like most of the others. What's left comes from the approach:
  the custom-element versions wrap each card in an `<x-timer>`, and a few pages
  have a `<template>` or two. None keeps an `<audio>` element: they all play the
  alarm with `new Audio()`.
- **A running timer costs next to nothing anywhere.** Every implementation shares
  one ticker and updates only the clock text, so 20 running timers take 1.5 ms or
  less of script time a second. The cheapest write the new time into the clock's
  existing text node. VanJS replaces that node every second, and
  React, Svelte and Solid do more bookkeeping per update. This column is noisy:
  the same build can measure up to twice as much on one run as on another.
