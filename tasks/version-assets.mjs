// Adds `?v=<content hash>` to every stylesheet and script in dist/ whose name
// has no hash of its own (the shared /css files, malinajs's bundle.js), in each
// index.html and in the stylesheets' @imports. The server caches .css and .js
// for a year as immutable, so a changed file needs a new URL. Run by
// tasks/build.sh after the builds. Same input, same output, so rsync -c still
// skips what didn't change.
import { createHash } from "node:crypto"
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join, relative } from "node:path"
import { brotliCompressSync, constants, gzipSync } from "node:zlib"

let dist = new URL("../dist", import.meta.url).pathname

function* walk(dir) {
    for (let entry of readdirSync(dir, { withFileTypes: true })) {
        let path = join(dir, entry.name)
        if (entry.isDirectory()) yield* walk(path)
        else yield path
    }
}

let files = [...walk(dist)]
let hashes = new Map()
let hashOf = file => {
    if (!hashes.has(file)) hashes.set(file, createHash("sha256").update(readFileSync(file)).digest("hex").slice(0, 10))
    return hashes.get(file)
}

// A local .css or .js URL without a query, outside Vite's hashed assets/.
let unversioned = url => /^[^:?#]+\.(css|js)$/.test(url) && !url.startsWith("//") && !url.includes("/assets/")

// `url` as written in `from`: root-relative is under dist/, the rest next to it.
let resolve = (url, from) => url.startsWith("/") ? join(dist, url) : join(dirname(from), url)

function version(file, pattern) {
    let text = readFileSync(file, "utf8")
    let changed = text.replace(pattern, (match, before, url, after) => {
        if (!unversioned(url)) return match
        let target = resolve(url, file)
        if (!existsSync(target)) throw new Error(`${relative(dist, file)} links ${url}, which isn't in dist/`)
        return `${before}${url}?v=${hashOf(target)}${after}`
    })
    if (changed === text) return
    writeFileSync(file, changed)
    hashes.delete(file)
    // The builds also write compressed copies for the server to send as is.
    if (existsSync(file + ".gz")) writeFileSync(file + ".gz", gzipSync(changed, { level: 9 }))
    if (existsSync(file + ".br")) writeFileSync(file + ".br", brotliCompressSync(changed, {
        params: { [constants.BROTLI_PARAM_QUALITY]: 11 },
    }))
}

// Stylesheets first, since an @import changes the importing file's hash.
for (let file of files.filter(f => f.endsWith(".css") && !f.includes("/assets/"))) {
    version(file, /(@import\s+url\(["']?)([^"')]+)(["']?\))/g)
}
for (let file of files.filter(f => f.endsWith(".html"))) {
    version(file, /(<(?:link|script)\b[^>]*?\b(?:href|src)=["'])([^"']+)(["'])/g)
}
