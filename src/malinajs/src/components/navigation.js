document.body.addEventListener("keydown", handleKeyDown)

function handleKeyDown(e) {
    if (e.target instanceof HTMLInputElement) return
    if (!(e.target instanceof HTMLElement)) return
    let $article = e.target.closest("article")
    if (!$article) {
        $article = document.querySelector("article")
        if (!$article) return
        handleTimerNavigation(e, $article, "none")
        return
    }
    if (e.key === "ArrowLeft") {
        handleTimerNavigation(e, $article, "prev")
    }
    if (e.key === "ArrowRight") {
        handleTimerNavigation(e, $article, "next")
    }
}

function handleTimerNavigation(e, $article, direction) {
    e.preventDefault()
    if (e.target instanceof HTMLInputElement) return
    if (!(e.target instanceof HTMLElement)) return
    if (!$article) return
    let target =
        direction === "next"
            ? $article.nextElementSibling
        : direction === "prev"
            ? $article.previousElementSibling
        : $article
    if (target instanceof HTMLElement) {
        let firstButton = target.querySelector("button:not([hidden])")
        if (firstButton instanceof HTMLButtonElement) {
            firstButton.focus()
        }
    }
}