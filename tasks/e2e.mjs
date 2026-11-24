// The user-facing behavior every implementation must share, checked in
// headless Chromium against the builds in dist/ (run ./tasks/build.sh first).
// See tasks/e2e.sh.
//
// The page contract the checks rely on, which is what a user sees:
// - header: "Add Timer", the logo (also adds a timer), and buttons labeled
//   "Options for all timers", "Download timer data", "Upload timer data";
// - each timer is a top-level <article> in <main> with inputs named title,
//   hours, minutes and seconds, then the clock button (Start / the countdown /
//   Stop) as its first button, then "Restart", "Timer options" and
//   "Delete timer" buttons;
// - dialogs are modal <dialog>s with a "Close" button.
import { chromium } from "playwright"
import { spawn } from "node:child_process"
import { writeFileSync, readFileSync, mkdtempSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"

let root = new URL("..", import.meta.url).pathname
let port = 5198
let base = `http://localhost:${port}`

export let apps = [
    ["van-timer", "/van/"],
    ["react-timer", "/react/"],
    ["svelte-timer", "/svelte/"],
    ["solid-timer", "/solid/"],
    ["morph-timer", "/morph/"],
    ["morph-scoped-timer", "/morph-scoped/"],
    ["_action", "/_action/"],
    ["data-action", "/data-action/"],
    ["stage-left", "/stage-left/"],
    ["vanilla", "/vanilla/"],
    ["malinajs", "/malinajs/"],
]

// Uncaught errors on any page of the check running now; any fails it.
let pageErrors = []

let wait = ms => new Promise(r => setTimeout(r, ms))
let timer = (n = 1) => ({ id: n, hours: 0, minutes: 0, seconds: 0, title: "", sound: null })
let data = (timers, allowedSounds = []) => JSON.stringify({ sound: "random", allowedSounds, timers })

class Failure extends Error {}
function expect(cond, msg) { if (!cond) throw new Failure(msg) }

let cards = page => page.locator("main article:not(article article)")
let clockOf = card => card.locator("button").first()
let text = async l => (await l.textContent()).trim()
let openDialogs = page => page.locator("dialog[open]")
let audios = page => page.evaluate(() => window.__audios.map(a => ({ src: new URL(a.src, location.href).pathname, paused: a.paused, volume: a.volume })))

async function open(browser, path, stored, { clock = false } = {}) {
    let context = await browser.newContext({ acceptDownloads: true })
    await context.addInitScript(stored => {
        // Every audio element or Audio() that plays, wherever it lives.
        window.__audios = []
        let play = HTMLMediaElement.prototype.play
        HTMLMediaElement.prototype.play = function () {
            if (!window.__audios.includes(this)) window.__audios.push(this)
            return play.call(this)
        }
        if (stored != null && !sessionStorage.seeded) {
            localStorage.timers = stored
            sessionStorage.seeded = 1
        }
    }, stored)
    let page = await context.newPage()
    page.setDefaultTimeout(4000)
    page.on("pageerror", e => pageErrors.push(e.message))
    if (clock) await page.clock.install()
    await page.goto(base + path)
    await page.waitForSelector("header button", { timeout: 5000 })
    await wait(150)
    return { context, page }
}

let stored = page => page.evaluate(() => JSON.parse(localStorage.timers))

async function setField(card, name, value) {
    let input = card.locator(`input[name=${name}]`)
    await input.fill(value)
    await input.press("Tab")
    await wait(50)
    return input.inputValue()
}

let checks = {
    async "add timers from the button and the logo"(browser, path) {
        let { context, page } = await open(browser, path, data([]))
        await page.locator("header button", { hasText: "Add Timer" }).click()
        await page.locator("header img[alt='Timer Hourglass logo']").click()
        await wait(100)
        expect(await cards(page).count() === 2, `expected 2 timers, saw ${await cards(page).count()}`)
        let s = await stored(page)
        expect(s.timers.map(t => t.id).join() === "1,2", `ids ${s.timers.map(t => t.id)}`)
        expect(await text(clockOf(cards(page).first())) === "Start", "new timer shows Start")
        await context.close()
    },

    async "edit, validate and save title and time"(browser, path) {
        let { context, page } = await open(browser, path, data([timer(1)]))
        let card = cards(page).first()
        await setField(card, "title", "Tea")
        expect(await setField(card, "seconds", "5") === "05", "seconds shown as 05")
        expect(await setField(card, "minutes", "60") === "", "minutes 60 reverted")
        expect(await setField(card, "minutes", "59") === "59", "minutes 59 kept")
        expect(await setField(card, "hours", "24") === "", "hours 24 reverted")
        expect(await setField(card, "hours", "23") === "23", "hours 23 kept")
        expect(await setField(card, "seconds", "-1") === "05", "seconds -1 reverted")
        expect(await setField(card, "seconds", "0") === "", "seconds 0 shown empty")
        let t = (await stored(page)).timers[0]
        expect(t.title === "Tea" && t.hours === 23 && t.minutes === 59 && t.seconds === 0, `saved ${JSON.stringify(t)}`)
        await page.reload()
        await page.waitForSelector("main article")
        card = cards(page).first()
        expect(await card.locator("input[name=title]").inputValue() === "Tea", "title after reload")
        expect(await card.locator("input[name=hours]").inputValue() === "23", "hours after reload")
        expect(await card.locator("input[name=minutes]").inputValue() === "59", "minutes after reload")
        await context.close()
    },

    async "count down, ring, stop and restart"(browser, path) {
        let { context, page } = await open(browser, path, data([{ ...timer(1), seconds: 2, sound: "forest" }]))
        let card = cards(page).first()
        let clock = clockOf(card)
        let restart = card.locator("button[aria-label=Restart]")
        expect(await clock.getAttribute("aria-label") === "Click to start.", "stopped aria-label")
        expect(!(await restart.isVisible()), "restart hidden when stopped")
        await clock.click()
        await wait(300)
        expect(/^00:00:0[12]$/.test(await text(clock)), `running shows ${await text(clock)}`)
        expect(await clock.getAttribute("aria-label") === "Click to stop.", "running aria-label")
        expect(await restart.isVisible(), "restart visible while running")
        await wait(2300)
        expect(await text(clock) === "Stop", `alarm shows ${await text(clock)}`)
        expect(await clock.evaluate(b => document.activeElement === b), "alarm focuses the clock")
        expect(await clock.getAttribute("title") === "Forest", `alarm title ${await clock.getAttribute("title")}`)
        let a = (await audios(page)).at(-1)
        expect(a?.src === "/media/forest.wav" && !a.paused, `audio ${JSON.stringify(a)}`)
        expect(a.volume <= 0.02, `fades in from quiet, volume ${a.volume}`)
        await clock.click()
        await wait(100)
        expect(await text(clock) === "Start", "Stop returns to Start")
        expect((await audios(page)).every(a => a.paused), "audio stops")
        expect(!(await restart.isVisible()), "restart hidden again")

        await setField(card, "seconds", "10")
        await clock.click()
        await wait(2200)
        let before = await text(clock)
        await restart.click()
        await wait(300)
        let after = await text(clock)
        expect(/^00:00:0[78]$/.test(before) && after === "00:00:10", `restart ${before} -> ${after}`)
        await clock.click()
        await context.close()
    },

    async "alarm stops itself after 2 minutes"(browser, path) {
        let { context, page } = await open(browser, path, data([{ ...timer(1), seconds: 1 }]), { clock: true })
        let clock = clockOf(cards(page).first())
        await clock.click()
        await page.clock.runFor(2000)
        expect(await text(clock) === "Stop", `rings, shows ${await text(clock)}`)
        await page.clock.runFor(118_000)
        expect(await text(clock) === "Stop", "still ringing before 2 minutes")
        await page.clock.runFor(4000)
        expect(await text(clock) === "Start", `after 2 minutes shows ${await text(clock)}`)
        expect((await audios(page)).every(a => a.paused), "audio stopped")
        await context.close()
    },

    async "Default and Random sounds pick from the allowed sounds"(browser, path) {
        for (let [sound, allowed, expected] of [[null, ["waves"], "/media/waves.wav"], ["random", ["sea"], "/media/sea.wav"]]) {
            let { context, page } = await open(browser, path, data([{ ...timer(1), seconds: 1, sound }], allowed))
            let clock = clockOf(cards(page).first())
            await clock.click()
            await wait(1600)
            let a = (await audios(page)).at(-1)
            expect(a?.src === expected && !a.paused, `${sound ?? "Default"} with ${allowed} played ${JSON.stringify(a)}`)
            expect(await clock.getAttribute("title") === (expected.includes("sea") ? "Sea" : "Waves"), `title ${await clock.getAttribute("title")}`)
            await context.close()
        }
    },

    async "timer options: choose a sound"(browser, path) {
        let { context, page } = await open(browser, path, data([timer(1), timer(2)]))
        let card = cards(page).nth(1)
        await card.locator("button[aria-label='Timer options']").click()
        await page.waitForSelector("dialog[open]")
        let dialog = openDialogs(page)
        expect(await dialog.locator("h2").textContent() === "Options", "title Options")
        let radios = dialog.locator("input[type=radio]")
        expect(await radios.count() === 12, `12 sound choices, saw ${await radios.count()}`)
        expect(await dialog.locator("input[type=radio][value=default]").isChecked(), "Default checked")
        await dialog.locator("label", { hasText: "Random" }).click()
        await dialog.locator("input[type=radio][value=forest]").check()
        await dialog.locator("button[aria-label=Close]").click()
        await wait(150)
        expect(await openDialogs(page).count() === 0, "Close button closes")
        let s = await stored(page)
        expect(s.timers[1].sound === "forest" && s.timers[0].sound === null, `saved ${s.timers.map(t => t.sound)}`)
        await card.locator("button[aria-label='Timer options']").click()
        await page.waitForSelector("dialog[open]")
        expect(await openDialogs(page).locator("input[type=radio][value=forest]").isChecked(), "reopens with Forest")
        await openDialogs(page).locator("input[type=radio][value=default]").check()
        await page.keyboard.press("Escape")
        await wait(150)
        expect(await openDialogs(page).count() === 0, "Escape closes")
        expect((await stored(page)).timers[1].sound === null, "Default saves null")
        await context.close()
    },

    async "options for all timers: allowed sounds"(browser, path) {
        let { context, page } = await open(browser, path, data([timer(1)]))
        let openIt = async () => {
            await page.locator("header button[aria-label='Options for all timers']").click()
            await page.waitForSelector("dialog[open]")
            return openDialogs(page)
        }
        let dialog = await openIt()
        expect(await dialog.locator("h2").textContent() === "Options for All Timers", "title")
        let boxes = dialog.locator("input[type=checkbox]")
        expect(await boxes.count() === 10, `10 sounds (no Random), saw ${await boxes.count()}`)
        let toggle = dialog.locator("button", { hasText: /Select All|Deselect All/ })
        expect(await text(toggle) === "Select All", `toggle reads ${await text(toggle)}`)
        await toggle.click()
        await wait(100)
        expect(await dialog.locator("input[type=checkbox]:checked").count() === 10, "Select All checks all")
        expect((await stored(page)).allowedSounds.length === 10, "saves all 10")
        expect(await text(toggle) === "Deselect All", "toggle then reads Deselect All")
        await dialog.locator("input[value=sea]").uncheck()
        await wait(100)
        let s = await stored(page)
        expect(s.allowedSounds.length === 9 && !s.allowedSounds.includes("sea"), `unchecking saves ${s.allowedSounds}`)
        expect(await text(toggle) === "Select All", "toggle back to Select All")
        await page.mouse.click(5, 5)
        await wait(150)
        expect(await openDialogs(page).count() === 0, "backdrop click closes")
        dialog = await openIt()
        expect(await dialog.locator("input[type=checkbox]:checked").count() === 9, "reopens with saved state")
        await toggle.click()
        await wait(50)
        await dialog.locator("button", { hasText: "Deselect All" }).click()
        await wait(100)
        expect((await stored(page)).allowedSounds.length === 0, "Deselect All saves none")
        await dialog.locator("button[aria-label=Close]").click()
        await wait(150)
        expect(await openDialogs(page).count() === 0, "Close button closes")
        await page.reload()
        dialog = await openIt()
        expect(await dialog.locator("input[type=checkbox]:checked").count() === 0, "none after reload")
        await context.close()
    },

    async "delete a timer"(browser, path) {
        let { context, page } = await open(browser, path, data([timer(1), { ...timer(2), title: "Two" }, timer(3)]))
        await cards(page).nth(0).locator("button[aria-label='Delete timer']").click()
        await wait(100)
        expect(await cards(page).count() === 2, "two left")
        expect(await cards(page).first().locator("input[name=title]").inputValue() === "Two", "the right one went")
        expect((await stored(page)).timers.map(t => t.id).join() === "2,3", "removed from storage")
        await page.locator("header button", { hasText: "Add Timer" }).click()
        await wait(100)
        expect((await stored(page)).timers.map(t => t.id).join() === "2,3,4", "next id after the highest")
        await context.close()
    },

    async "download and upload timer data"(browser, path) {
        let saved = data([{ ...timer(1), title: "Saved", minutes: 3 }], ["sea"])
        let { context, page } = await open(browser, path, saved)
        let [download] = await Promise.all([
            page.waitForEvent("download"),
            page.locator("header button[aria-label='Download timer data']").click(),
        ])
        expect(download.suggestedFilename() === "timers.json", `file name ${download.suggestedFilename()}`)
        let file = JSON.parse(readFileSync(await download.path(), "utf8"))
        expect(JSON.stringify(file) === JSON.stringify(JSON.parse(saved)), `downloaded ${JSON.stringify(file)}`)

        let dir = mkdtempSync(join(tmpdir(), "timer-e2e-"))
        let upload = join(dir, "upload.json")
        writeFileSync(upload, data([{ ...timer(5), title: "Uploaded", seconds: 7 }, timer(6)]))
        let [chooser] = await Promise.all([
            page.waitForEvent("filechooser"),
            page.locator("header button[aria-label='Upload timer data']").click(),
        ])
        await Promise.all([page.waitForEvent("load"), chooser.setFiles(upload)])
        await page.waitForSelector("main article")
        await wait(150)
        expect(await cards(page).count() === 2, `uploaded timers shown, saw ${await cards(page).count()}`)
        expect(await cards(page).first().locator("input[name=title]").inputValue() === "Uploaded", "uploaded title")
        expect(await cards(page).first().locator("input[name=seconds]").inputValue() === "07", "uploaded seconds")

        let bad = join(dir, "bad.json")
        writeFileSync(bad, JSON.stringify({ nope: true }))
        let alerted = new Promise(resolve => page.once("dialog", d => { resolve(d.message()); d.dismiss() }))
        let [chooser2] = await Promise.all([
            page.waitForEvent("filechooser"),
            page.locator("header button[aria-label='Upload timer data']").click(),
        ])
        await chooser2.setFiles(bad)
        expect(await alerted === "Invalid timer data file.", "invalid file alerts")
        expect((await stored(page)).timers.length === 2, "invalid file changes nothing")
        await context.close()
    },

    async "arrow keys move between timers"(browser, path) {
        let { context, page } = await open(browser, path, data([timer(1), timer(2), timer(3)]))
        let focusedCard = () => page.evaluate(() => {
            let all = [...document.querySelectorAll("main article")].filter(a => !a.parentElement.closest("article"))
            return all.findIndex(a => a.contains(document.activeElement))
        })
        await page.locator("footer").click()
        await page.keyboard.press("ArrowRight")
        expect(await focusedCard() === 0, `a key outside the timers focuses the first, saw ${await focusedCard()}`)
        await page.keyboard.press("ArrowRight")
        expect(await focusedCard() === 1, `ArrowRight to the second, saw ${await focusedCard()}`)
        await page.keyboard.press("ArrowRight")
        expect(await focusedCard() === 2, `ArrowRight to the third, saw ${await focusedCard()}`)
        await page.keyboard.press("ArrowLeft")
        expect(await focusedCard() === 1, `ArrowLeft back, saw ${await focusedCard()}`)
        await cards(page).first().locator("input[name=minutes]").focus()
        await page.keyboard.press("ArrowRight")
        expect(await focusedCard() === 0, "arrows inside an input stay in the input")
        await context.close()
    },
}

export async function run(only) {
    let server = spawn("npx", ["serve", "-l", String(port), join(root, "dist")], { cwd: root, stdio: "ignore" })
    await wait(1500)
    let browser = await chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required"] })
    let failures = 0
    try {
        for (let [name, path] of apps.filter(([name]) => !only?.length || only.includes(name))) {
            console.log(name)
            for (let [check, fn] of Object.entries(checks)) {
                pageErrors = []
                try {
                    await fn(browser, path)
                    expect(pageErrors.length === 0, `page error: ${pageErrors[0]}`)
                    console.log(`  ok   ${check}`)
                } catch (e) {
                    failures++
                    console.log(`  FAIL ${check}: ${e instanceof Failure ? e.message : e.message.split("\n")[0]}`)
                }
            }
        }
    } finally {
        await browser.close()
        server.kill()
    }
    console.log(failures ? `\n${failures} failed` : "\nall passed")
    return failures
}

if (import.meta.url === `file://${process.argv[1]}`) {
    process.exit(await run(process.argv.slice(2)) ? 1 : 0)
}
