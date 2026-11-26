// The theme: light or dark as the system has it, until the toggle in the header
// (any `.theme-toggle` button) picks one, which is saved. Every implementation
// loads this in <head>, so the saved theme is set before the page draws.
(function () {
    let root = document.documentElement
    try {
        let saved = localStorage.getItem("theme")
        if (saved) root.dataset.theme = saved
    } catch { }

    document.addEventListener("click", e => {
        if (!(e.target instanceof Element) || !e.target.closest(".theme-toggle")) return
        let dark = root.dataset.theme
            ? root.dataset.theme === "dark"
            : matchMedia("(prefers-color-scheme: dark)").matches
        root.dataset.theme = dark ? "light" : "dark"
        try {
            localStorage.setItem("theme", root.dataset.theme)
        } catch { }
    })
})()
