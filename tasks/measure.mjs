// Measures each built implementation in dist/ (run ./tasks/build.sh first) and
// prints the comparison table used in README.md. See tasks/measure.sh.
import { chromium } from "playwright"
import { spawn } from "node:child_process"
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs"
import { join, extname } from "node:path"
import { gzipSync, brotliCompressSync, constants } from "node:zlib"
import os from "node:os"

let root = new URL("..", import.meta.url).pathname
let dist = join(root, "dist")
let port = 5199
let base = `http://localhost:${port}`

// [name, dist path, source dir, framework, runtime dependencies]
let apps = [
    ["van-timer", "/van/", "src/van-timer", "VanJS", "vanjs-core"],
    ["react-timer", "/react/", "src/react-timer", "React 19", "react, react-dom"],
    ["svelte-timer", "/svelte/", "src/svelte-timer", "Svelte 5", "svelte (compiled in)"],
    ["solid-timer", "/solid/", "src/solid-timer", "SolidJS 2", "solid-js, @solidjs/web"],
    ["morph-timer", "/morph/", "src/morph-timer", "HTML template tags + idiomorph", "html-template-tag-stream, idiomorph, @jon49/web"],
    ["morph-scoped-timer", "/morph-scoped/", "src/morph-scoped-timer", "HTML template tags + idiomorph, one element at a time", "html-template-tag-stream, idiomorph, @jon49/web"],
    ["html-tag-timer", "/html-tag/", "src/html-tag-timer", "HTML template tags, no morphing", "html-template-tag, @jon49/web"],
    ["malinajs", "/malinajs/", "src/malinajs", "Malina.js", "malinajs (compiled in)"],
    ["_action", "/_action/", "src/_action", "`_action` attributes", "none"],
    ["data-action", "/data-action/", "src/data-action", "`data-action` attributes", "none"],
    ["stage-left", "/stage-left/", "src/stage-left", "stage-left templates + custom elements", "none"],
    ["vanilla", "/vanilla/", "src/vanilla", "custom elements", "none"],
]

let TIMERS = 20
let STARTUP_RUNS = 7
let CPU_SLOWDOWN = 4

let seed = JSON.stringify({
    sound: "random",
    allowedSounds: [],
    timers: Array.from({ length: TIMERS }, (_, i) =>
        ({ id: i + 1, hours: 0, minutes: 5, seconds: 0, title: `Timer ${i + 1}`, sound: null })),
})

let median = xs => xs.slice().sort((a, b) => a - b)[xs.length >> 1]
let kb = n => (n / 1024).toFixed(1)

function sizes(files) {
    let raw = 0, gz = 0, br = 0
    for (let f of files) {
        let buf = readFileSync(f)
        raw += buf.length
        gz += gzipSync(buf, { level: 9 }).length
        br += brotliCompressSync(buf, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } }).length
    }
    return { raw, gz, br }
}

// Non-blank lines of the app's own source: src/** and index.html.
function sourceLines(dir) {
    let lines = 0
    let walk = d => {
        for (let name of readdirSync(d)) {
            let p = join(d, name)
            if (name === "node_modules" || name === "public" || name.startsWith(".")) continue
            if (statSync(p).isDirectory()) walk(p)
            else if ([".ts", ".tsx", ".js", ".jsx", ".svelte", ".xht"].includes(extname(p)) && !p.endsWith(".d.ts"))
                lines += readFileSync(p, "utf8").split("\n").filter(l => l.trim()).length
        }
    }
    walk(join(root, dir, "src"))
    let html = [join(root, dir, "index.html"), join(root, dir, "static", "index.html")].find(existsSync)
    if (html) lines += readFileSync(html, "utf8").split("\n").filter(l => l.trim()).length
    return lines
}

// Resolves once `count` timers are on the page; records the time in __ready.
function readyScript(count) {
    return `
        window.__ready = null
        new MutationObserver((_, o) => {
            if (window.__ready == null && Math.max(document.querySelectorAll("main article:not(article article)").length, document.querySelectorAll("x-timer").length) >= ${count}) {
                window.__ready = performance.now()
                o.disconnect()
            }
        }).observe(document, { childList: true, subtree: true })`
}

async function newPage(browser, { data, slowdown = 1 } = {}) {
    let context = await browser.newContext()
    if (data != null) await context.addInitScript(d => {
        if (!sessionStorage.seeded) { localStorage.timers = d; sessionStorage.seeded = 1 }
    }, data)
    let page = await context.newPage()
    let cdp = await context.newCDPSession(page)
    await cdp.send("Performance.enable")
    if (slowdown > 1) await cdp.send("Emulation.setCPUThrottlingRate", { rate: slowdown })
    return { context, page, cdp }
}

async function heap(cdp) {
    await cdp.send("HeapProfiler.collectGarbage")
    await cdp.send("HeapProfiler.collectGarbage")
    let { usedSize } = await cdp.send("Runtime.getHeapUsage")
    return usedSize
}

async function scriptSeconds(cdp) {
    let { metrics } = await cdp.send("Performance.getMetrics")
    return metrics.find(m => m.name === "ScriptDuration").value
}

let startButtons = page => page.locator("main button:visible", { hasText: /^\s*Start\s*$/ })

async function measure(browser, [name, path, dir, framework, deps]) {
    // Size: the HTML, scripts and styles the page loads, less what every
    // implementation shares (nimble, main.css, theme.js), images and sounds.
    let { context, page, cdp } = await newPage(browser, { data: seed })
    let loaded = new Set()
    page.on("response", r => {
        let type = r.request().resourceType()
        let url = new URL(r.url())
        if (url.origin === base && ["document", "script", "stylesheet"].includes(type)) loaded.add(url.pathname)
    })
    await page.addInitScript(readyScript(TIMERS))
    await page.goto(base + path, { waitUntil: "networkidle" })
    let rendered = await page.evaluate(() => Math.max(document.querySelectorAll("main article:not(article article)").length, document.querySelectorAll("x-timer").length))
    let files = [...loaded]
        .filter(p => !/\/(css\/(nimble|main)\.css|js\/theme\.js)$/.test(p))
        .map(p => join(dist, p.endsWith("/") ? p + "index.html" : p))
        .filter(existsSync)
    let size = sizes(files)
    let step = what => process.stderr.write(`  ${what}\n`)
    step(`loaded ${rendered} timers, ${files.length} files`)

    // Memory and DOM, idle and with every timer running.
    let domNodes = await page.evaluate(() => document.getElementsByTagName("*").length)
    let heapIdle = await heap(cdp)
    let buttons = startButtons(page)
    let n = await buttons.count()
    for (let i = 0; i < n; i++) await buttons.first().click()
    await page.waitForTimeout(1500)
    step(`started ${n} timers`)
    let heapRunning = await heap(cdp)
    let s0 = await scriptSeconds(cdp)
    await page.waitForTimeout(10_000)
    let scriptPerSecond = (await scriptSeconds(cdp) - s0) * 1000 / 10
    await context.close()

    step("memory and running CPU done")
    // Startup: navigation to all timers on screen, CPU slowed down.
    let startups = []
    for (let i = 0; i < STARTUP_RUNS; i++) {
        let { context, page } = await newPage(browser, { data: seed, slowdown: CPU_SLOWDOWN })
        await page.addInitScript(readyScript(TIMERS))
        await page.goto(base + path)
        await page.waitForFunction(() => window.__ready != null, null, { timeout: 15_000 }).catch(async e => { throw new Error(`${name} never showed ${TIMERS} timers: ${await page.evaluate(() => JSON.stringify({ articles: document.querySelectorAll("main article:not(article article)").length, xTimers: document.querySelectorAll("x-timer").length, ready: window.__ready }))}`) })
        startups.push(await page.evaluate(() => window.__ready))
        await context.close()
    }

    step(`startup ${startups.map(x => x.toFixed(0)).join(" ")}`)
    // Adding timers: click Add Timer and wait for each new timer to show.
    let adds = []
    for (let i = 0; i < 3; i++) {
        let { context, page } = await newPage(browser, { data: JSON.stringify({ sound: "random", allowedSounds: [], timers: [] }), slowdown: CPU_SLOWDOWN })
        await page.goto(base + path, { waitUntil: "networkidle" })
        adds.push(await page.evaluate(async count => {
            let button = [...document.querySelectorAll("header button")].find(b => b.textContent.trim() === "Add Timer")
            let articles = () => Math.max(document.querySelectorAll("main article:not(article article)").length, document.querySelectorAll("x-timer").length)
            let shown = target => new Promise(resolve => {
                if (articles() >= target) return resolve()
                new MutationObserver((_, o) => { if (articles() >= target) { o.disconnect(); resolve() } })
                    .observe(document.body, { childList: true, subtree: true })
            })
            let t0 = performance.now()
            for (let i = 1; i <= count; i++) {
                button.click()
                await shown(i)
            }
            return performance.now() - t0
        }, TIMERS))
        await context.close()
    }

    return {
        name, framework, path, rendered, started: n,
        size, files: files.map(f => f.slice(dist.length)),
        lines: sourceLines(dir), deps,
        domNodes, heapIdle, heapRunning, scriptPerSecond,
        startup: median(startups), add: median(adds),
    }
}

let server = spawn("npx", ["serve", "-l", String(port), dist], { cwd: root, stdio: "ignore" })
await new Promise(r => setTimeout(r, 1500))
let browser = await chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required"] })
let results = []
try {
    let only = process.env.ONLY?.split(",")
    for (let app of apps.filter(a => !only || only.includes(a[0]))) {
        process.stderr.write(`measuring ${app[0]}...\n`)
        results.push(await measure(browser, app))
    }
} finally {
    await browser.close()
    server.kill()
}

for (let r of results) {
    if (r.rendered !== TIMERS || r.started !== TIMERS)
        process.stderr.write(`warning: ${r.name} rendered ${r.rendered} timers and started ${r.started}\n`)
}

console.log(`Measured ${new Date().toISOString().slice(0, 10)} with Chromium ${browser.version()} on ${os.cpus()[0].model.trim()}, ${TIMERS} saved timers.\n`)
// The table in README.md. Lower is better in every column, and the best value
// in each is bold and green. Values are compared as printed, so a tie is marked
// in every row. GitHub drops inline styles, but colors math, so the mark is a
// `$\color{…}…$` expression.
let mb = n => (n / 2 ** 20).toFixed(2)
let columns = [
    r => [kb(r.size.raw), kb(r.size.gz), kb(r.size.br)],
    r => [String(r.lines)],
    r => [r.startup.toFixed(0)],
    r => [r.add.toFixed(0)],
    r => [mb(r.heapIdle), mb(r.heapRunning)],
    r => [String(r.domNodes)],
    r => [r.scriptPerSecond.toFixed(2)],
]
let cells = results.map(r => columns.map(column => column(r)))
let mark = v => `$\\color{#2da44e}\\mathbf{${v}}$`
let best = columns.map((_, i) => cells[0][i].map((_, j) => Math.min(...cells.map(row => +row[i][j]))))
console.log("| Implementation | HTML + JS, KB (raw / gzip / brotli) | Source lines | Startup, ms | Add 20 timers, ms | JS heap idle / running, MB | DOM elements | Script time while running, ms/s |")
console.log("|---|---|---|---|---|---|---|---|")
results.forEach((r, k) => {
    let row = cells[k].map((values, i) => values.map((v, j) => +v === best[i][j] ? mark(v) : v).join(" / "))
    console.log(`| ${r.name} | ${row.join(" | ")} |`)
})
console.log("\nRuntime dependencies:\n")
for (let r of results) console.log(`- ${r.name}: ${r.deps}`)
if (process.env.VERBOSE) console.error(JSON.stringify(results, null, 2))
