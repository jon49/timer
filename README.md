# Timer

A timer page which allows multiple timers to run at the same time.

[The website can be accessed here.](https://jon49.github.io/timer/)

## Implementations

The same app is written eleven times, once per directory in `src/`, to compare
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
| van-timer | 13.3 / 5.6 / 5.0 | 568 | 62 | 27 | 0.88 / 1.75 | 419 | 0.44 |
| react-timer | 192.5 / 61.2 / 52.7 | 538 | 114 | 69 | 1.45 / 2.64 | 376 | 1.37 |
| svelte-timer | 67.4 / 25.8 / 23.1 | 509 | 75 | 48 | 1.23 / 2.21 | 376 | 0.85 |
| solid-timer | 56.0 / 21.6 / 19.5 | 553 | 67 | 36 | 1.06 / 1.98 | 376 | 1.02 |
| morph-timer | 23.9 / 8.8 / 7.8 | 541 | 48 | 110 | 0.72 / 1.76 | 338 | 0.41 |
| morph-scoped-timer | 24.4 / 8.9 / 7.9 | 561 | 48 | 11 | 0.73 / 1.73 | 339 | 0.58 |
| malinajs | 17.1 / 7.0 / 6.2 | 482 | 50 | 27 | 0.84 / 1.71 | 376 | 0.18 |
| _action | 13.1 / 5.1 / 4.3 | 590 | 60 | 27 | 0.69 / 1.56 | 1048 | 0.46 |
| data-action | 13.3 / 5.1 / 4.3 | 588 | 88 | 26 | 0.69 / 1.56 | 1048 | 0.43 |
| stage-left | 14.6 / 5.6 / 4.8 | 711 | 77 | 19 | 0.76 / 1.62 | 399 | 0.45 |
| vanilla | 12.9 / 5.0 / 4.2 | 566 | 79 | 18 | 0.68 / 1.54 | 398 | 0.35 |

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
  morphs every timer, so adding 20 takes the longest (110 ms). morph-scoped-timer
  renders only the new card, and adds them 10× faster (11 ms), the quickest of
  all. It costs 20 lines of code and 0.1 KB. Both change the same DOM nodes,
  because idiomorph leaves unchanged nodes alone. The time goes to rendering the
  HTML and diffing it.
- **_action and data-action have 2.5× the DOM elements.** Each timer keeps its
  settings dialog (12 sound choices) in the page, where the others create the
  dialog when it opens.
- **A running timer costs next to nothing anywhere.** Every implementation shares
  one ticker and updates only the clock text, so 20 running timers take under
  1.5 ms of script time a second.
