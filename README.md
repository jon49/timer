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
| van-timer | 13.2 / 5.5 / 4.9 | 568 | 95 | 60 | 0.86 / 1.73 | 376 | 0.42 |
| react-timer | 192.5 / 61.2 / 52.7 | 538 | 148 | 93 | 1.45 / 2.63 | 376 | 1.12 |
| svelte-timer | 67.4 / 25.8 / 23.1 | 509 | 102 | 81 | 1.23 / 2.21 | 376 | 0.53 |
| solid-timer | 56.0 / 21.6 / 19.5 | 553 | 81 | 55 | 1.06 / 1.98 | 376 | 0.76 |
| morph-timer | 23.9 / 8.8 / 7.8 | 541 | 52 | 144 | 0.72 / 1.76 | 338 | 0.27 |
| morph-scoped-timer | 24.4 / 8.9 / 7.9 | 561 | 63 | 11 | 0.73 / 1.73 | 339 | 0.23 |
| malinajs | 17.1 / 7.0 / 6.2 | 482 | 64 | 28 | 0.84 / 1.71 | 376 | 0.15 |
| _action | 13.2 / 5.0 / 4.3 | 599 | 77 | 23 | 0.68 / 1.55 | 378 | 0.27 |
| data-action | 13.4 / 5.0 / 4.3 | 597 | 84 | 20 | 0.68 / 1.55 | 378 | 0.29 |
| stage-left | 14.5 / 5.5 / 4.7 | 711 | 106 | 20 | 0.76 / 1.62 | 398 | 0.24 |
| vanilla | 12.9 / 4.9 / 4.2 | 569 | 83 | 33 | 0.67 / 1.54 | 397 | 0.25 |

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
  morphs every timer, so adding 20 takes the longest (144 ms). morph-scoped-timer
  renders only the new card, and adds them about 13× faster (11 ms), the quickest of
  all. It costs 20 lines of code and 0.1 KB. Both change the same DOM nodes,
  because idiomorph leaves unchanged nodes alone. The time goes to rendering the
  HTML and diffing it.
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
