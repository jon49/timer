# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

This repo holds **multiple independent implementations of the same multi-timer web app**, one per `src/*` directory (`van-timer`, `react-timer`, `svelte-timer`, `solid-timer`, `morph-timer`, `morph-scoped-timer`, `html-tag-timer`, `stage-left`, `vanilla`, `malinajs`, `data-action`, `_action`). They are reimplementations of one another, not coupled modules. They all read the same `localStorage` data, so one browser profile can switch between them. README.md compares them.

**Every implementation must behave the same for the user.** The contract is `tasks/e2e.mjs`: what's in the header, the timer card, both dialogs, validation, the alarm, download/upload and arrow-key navigation, plus the labels and names the checks find things by. A change to what the user sees or does goes into every implementation and into that file, and `./tasks/e2e.sh` must pass for all of them. Each implementation keeps a copy of the framework-neutral modules (`shared/alarm`, `data-store`, `data-transfer`, `sounds`, `tick-coordinator`, `utils`). They're copies, not imports, so each stays independent. A fix to one copy belongs in all of them. `malinajs` has plain JS versions, and it imports the ticker through `onTick`/`offTick`, because Malina auto-subscribes to any imported object with a `subscribe` method.

`morph-timer`, `morph-scoped-timer` and `html-tag-timer` need `../jon49-web` checked out next to this repo: `@jon49/web` is a `file:` dependency, because the npm release predates `_action.lifecycle`. Its views are `html-template-tag-stream` templates. In `morph-timer` every action re-renders the whole app and idiomorph morphs it in. `morph-scoped-timer` is the same app, except an action renders only what it changed (one timer's `<article>`, or the `#dialog` slot), through the functions in its `render.ts`. In both, any element that has to survive a render, such as a `_load` component, a focused button or a dialog, needs a stable `id`.

`html-tag-timer` has the same actions as `morph-scoped-timer`, but no idiomorph. Its views are synchronous `html-template-tag` strings (a nested view goes in with `$${}`, or it gets escaped). That's pinned to 4.0.1, because from 4.1 the tag checks every value it fills in against all known attribute names, which tripled the time to add timers. An action renders only what it changed (one timer's clock button, the allowed-sounds form, or the `#dialog` slot) by setting `outerHTML`/`innerHTML` through the functions in its `render.ts`. A swap gives the focus back to the new element with the same `id`, so a control that can be focused when it's re-rendered needs one.

`src/html-tag-timer` is the **primary, actively maintained** implementation (html-template-tag + `@jon49/web` actions + TypeScript + Vite) and is what gets deployed to the main site path. Default work here unless told otherwise. `van-timer` used to be the main site; it's now one of the others, at `/van/`.

Shared, framework-agnostic assets (sounds, CSS, images, `manifest.json`) live in the top-level `static/` directory — not inside any implementation. Vite serves it via `publicDir: '../../static'`, so asset URLs are root-relative (e.g. `/media/forest.wav`, `/css/main.css`).

## Commands

Run inside `src/html-tag-timer`:

- `npm start` — Vite dev server.
- `npm run check` — typecheck only (`tsc --noEmit`). Use this to validate changes; there is no unit test suite or linter (behavior is checked by `./tasks/e2e.sh`).
- `npm run build` — typecheck + build to `../../dist/html-tag/` with base `/html-tag/`.
- `npm run build:main` — typecheck + build to `../../dist/` with base `/` (the main published site). It doesn't empty `dist/`, because the other builds write into it at the same time.

Every other implementation has `start` and `build` (to `../../dist/<name>/`), and most have `check`.

Repo-root commands:

- `./tasks/build.sh` (or `npm run build` at root) — builds **all** implementations in parallel into `dist/`.
- `./tasks/e2e.sh [--no-build] [names...]` (or `npm run e2e`) — builds, then checks that every implementation (or the named ones) behaves the same, in headless Chromium against `dist/`.
- `./tasks/measure.sh [--no-build]` (or `npm run measure`) — builds, then measures every implementation in headless Chromium (Playwright, pinned to `~1.58.2`). It prints the comparison table in README.md. Rerun it and paste the new table after changing an implementation.
- `./tasks/deploy.sh <host> <path>` — builds, then `rsync`s `dist/` to the server. Uses `rsync --checksum` deliberately so unchanged files keep their mtime and nginx ETags stay stable; preserve that flag.

## Architecture (van-timer)

**State lives in `localStorage` under the single key `"timers"`**, shape = `TimerInfo` (`shared/types.d.ts`): a global `sound` default, an `allowedSounds` whitelist, and an array of `TimerData`. `shared/data-store.ts` exposes a singleton `timerStore` that is the only thing reading/writing that key; every mutation calls `save()` immediately.

**Reactivity is VanJS.** UI components hold `van.state` cells and use `van.derive(...)` for side effects. The bridge to persistence is the `useTimer(id)` / `useAllowedSounds()` helpers in `data-store.ts`: they wrap store data in a state and set up a `derive` that writes back to `timerStore` whenever the state changes. New DOM is created functionally with `van.tags` (no JSX).

**Each timer is a small state machine.** `TimerState` (`shared/utils.ts`) = `"stopped" | "running" | "alarm" | "deleting"`. `Timer.ts` and `CountDownTimer.ts` register one `derive` per state value; flipping `timerState.val` is how you trigger start/stop/alarm/teardown logic (e.g. setting `"deleting"` removes the timer from the store and the DOM). When adding timer behavior, add/extend a `derive` keyed off the state rather than calling logic imperatively.

**One shared ticker for all timers.** `shared/tick-coordinator.ts` is a singleton that runs a *single* `setInterval` and fans out to subscribed timers; it stops the interval when the last timer unsubscribes. Don't add per-timer intervals — subscribe/unsubscribe through `tickCoordinator`. Timers compute remaining time from wall-clock deltas (`Date.now()`), so they stay correct across tab throttling; the tick only refreshes the display.

**Sounds** are defined as a tuple list in `shared/sounds.ts` (`[id, label, url?]`); index 0 (`random`) is the sentinel meaning "pick from `allowedSounds`". `getAlarm` in `CountDownTimer.ts` resolves a timer's `sound` (or random within the whitelist) to a media URL.

**Styling** is [PicoCSS](https://picocss.com/) (`/css/pico.min.css`) plus `/css/main.css`; markup leans on Pico semantics (`article`, `fieldset[role=group]`, `dialog`). Pico is pulled in by `static/css/main.css` itself (`@import url("pico.min.css") layer;` — relative so it follows the build base, layered so `main.css` wins the cascade), with a `<link rel="preload">` in each `index.html`. Don't put the `@import` back in an inline `<style>` in `index.html`: Vite resolves it and inlines all of Pico into the HTML. The reusable `components/Dialog.ts` wraps the native `<dialog>` element and drives open/close through a `DialogState` state with a closing-animation step.
