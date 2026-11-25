# Timer

A timer page which allows multiple timers to run at the same time.

[The website can be accessed here.](https://jon49.github.io/timer/)

## Implementations

The same app is written twelve times, once per directory in `src/`, to compare
ways of building a front end. They look and behave the same. `./tasks/e2e.sh`
runs one set of checks against every build to keep it that way: adding,
editing and validating timers, the countdown, alarm and restart, the 2-minute
auto-stop, sounds, both options dialogs, delete, download/upload and arrow-key
navigation. They all keep their data in the same `localStorage` key, so you can
switch between them without losing your timers.

| Implementation | Path | How it's built |
|---|---|---|
| [van-timer](src/van-timer) | `/` and `/van/` | [VanJS](https://vanjs.org/) states and `van.tags`. The main site. |
| [react-timer](src/react-timer) | `/react/` | [React 19](https://react.dev/) function components and hooks. |
| [svelte-timer](src/svelte-timer) | `/svelte/` | [Svelte 5](https://svelte.dev/) with runes. |
| [solid-timer](src/solid-timer) | `/solid/` | [SolidJS 2.0](https://www.solidjs.com/) signals and split effects. |
| [morph-timer](src/morph-timer) | `/morph/` | Every change renders the whole app with [html-template-tag-stream](https://github.com/jon49/html-template-tag-async) and [idiomorph](https://github.com/bigskysoftware/idiomorph) morphs it in. `_click`/`_change`/`_load` actions come from [@jon49/web](https://github.com/jon49/jon49-web). |
| [morph-scoped-timer](src/morph-scoped-timer) | `/morph-scoped/` | The same, except each action renders and morphs only what it changed: one timer's card, or the open dialog. |
| [html-tag-timer](src/html-tag-timer) | `/html-tag/` | The same actions as morph-scoped-timer, with no morphing. Each renders only what it changed (one timer's clock, or the dialog) with [html-template-tag](https://github.com/AntonioVdlC/html-template-tag) and swaps it in with `outerHTML`/`innerHTML`. |
| [malinajs](src/malinajs) | `/malinajs/` | [Malina.js](https://malinajs.github.io/) components, compiled with Rollup. |
| [_action](src/_action) | `/_action/` | `<template>` clones and a small `_click="method"` attribute dispatcher. |
| [data-action](src/data-action) | `/data-action/` | The same, with `data-action="method"` attributes. |
| [stage-left](src/stage-left) | `/stage-left/` | Custom elements rendered with the `stage-left` template library in the directory. |
| [vanilla](src/vanilla) | `/vanilla/` | Custom elements and DOM APIs only. |

Shared assets (Pico CSS, `main.css`, images and sounds) live in `static/`. Each
implementation keeps its own copy of the few framework-neutral modules (the
store, alarm, ticker and download/upload), so each one stands alone.

## Comparison

Measured 2026-11-24 with Chromium 145 on an Intel Core i5-1235U laptop, with 20
saved timers. `./tasks/measure.sh` builds everything and prints this table.

| Implementation | HTML + JS, KB (raw / gzip / brotli) | Source lines | Startup, ms | Add 20 timers, ms | JS heap idle / running, MB | DOM elements | Script time while running, ms/s |
|---|---|---|---|---|---|---|---|
| van-timer | 13.2 / 5.5 / 4.9 | 568 | 61 | 29 | 0.88 / 1.75 | 376 | 0.40 |
| react-timer | 192.5 / 61.2 / 52.7 | 538 | 136 | 120 | 1.45 / 2.62 | 376 | 1.33 |
| svelte-timer | 67.4 / 25.8 / 23.1 | 509 | 86 | 57 | 1.23 / 2.21 | 376 | 0.75 |
| solid-timer | 56.0 / 21.6 / 19.5 | 553 | 79 | 43 | 1.06 / 1.98 | 376 | 1.03 |
| morph-timer | 23.9 / 8.8 / 7.8 | 541 | 53 | 114 | 0.72 / 1.76 | $\color{#2da44e}\mathbf{338}$ | 0.24 |
| morph-scoped-timer | 24.4 / 8.9 / 7.9 | 561 | 60 | 12 | 0.73 / 1.74 | 339 | 0.26 |
| html-tag-timer | 14.0 / 5.6 / 4.8 | 555 | $\color{#2da44e}\mathbf{51}$ | $\color{#2da44e}\mathbf{9}$ | $\color{#2da44e}\mathbf{0.65}$ / 1.57 | $\color{#2da44e}\mathbf{338}$ | 0.19 |
| malinajs | 17.1 / 7.0 / 6.2 | $\color{#2da44e}\mathbf{482}$ | 60 | 29 | 0.84 / 1.71 | 376 | $\color{#2da44e}\mathbf{0.15}$ |
| _action | 13.2 / 5.0 / 4.3 | 599 | 82 | 19 | 0.68 / 1.55 | 378 | 0.33 |
| data-action | 13.4 / 5.0 / 4.3 | 597 | 96 | 22 | 0.68 / 1.55 | 378 | 0.24 |
| stage-left | 14.5 / 5.5 / 4.7 | 711 | 88 | 20 | 0.76 / 1.62 | 398 | 0.28 |
| vanilla | $\color{#2da44e}\mathbf{12.9}$ / $\color{#2da44e}\mathbf{4.9}$ / $\color{#2da44e}\mathbf{4.2}$ | 569 | 54 | 19 | 0.67 / $\color{#2da44e}\mathbf{1.54}$ | 397 | 0.22 |

Lower is better in every column, and the best in each is in bold green.

What each column measures:

- **HTML + JS**: the page and every script and stylesheet it loads, less what
  all of them share (Pico, `main.css`, images, sounds). Compressed with gzip -9
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
  morph-timer starts as fast as any of them, but each new timer re-renders and
  morphs every timer, so adding 20 takes almost as long as React (114 ms against
  120 ms). morph-scoped-timer renders only the new card, and adds them about 10×
  faster (12 ms). It costs 20 lines of code and 0.1 KB. Both change the same DOM
  nodes, because idiomorph leaves unchanged nodes alone. The time goes to
  rendering the HTML and diffing it.
- **Once the render is scoped, the morph isn't needed.** html-tag-timer has
  the same actions as morph-scoped-timer. It sets `outerHTML`/`innerHTML` on
  the part that changed, and gives the focus back to the element with the same
  `id`. A start, stop or ring changes only the clock button, so that's all it
  replaces. Without idiomorph or the streaming templates, it's 4.8 KB brotli
  against 7.9, the same size as the hand-written ones. It adds 20 timers the
  fastest of all (9 ms). It stays on html-template-tag 4.0.1: from 4.1 on, the
  tag checks the HTML so far against 444 attribute names for every value it
  fills in. That costs about 1 ms per card with the CPU slowed 4×, and tripled
  the time to add 20 timers (34 ms).
- **Dialogs that wait in the page add up.** _action and data-action used to keep
  each timer's settings dialog (12 sound choices) and the all-timers dialog in
  the page, 1,048 elements in all. Now, like the others, they create a dialog
  when it opens. That brings them to 378, and adding timers got about a third
  faster. VanJS kept two empty `<div>`s for each place a dialog goes (419); it
  now has 376, like most of the others. What's left comes from the approach: the custom-element versions
  wrap each card in an `<x-timer>`, the morph versions play the alarm with
  `new Audio()` instead of an `<audio>` element per timer, and a few pages have
  a `<template>` or two.
- **A running timer costs next to nothing anywhere.** Every implementation shares
  one ticker and updates only the clock text, so 20 running timers take 1.5 ms or
  less of script time a second. The cheapest write the new time into the clock's
  existing text node. VanJS replaces that node every second, and
  React, Svelte and Solid do more bookkeeping per update. This column is noisy:
  the same build can measure up to twice as much on one run as on another.
