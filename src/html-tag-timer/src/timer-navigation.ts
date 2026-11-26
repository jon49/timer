document.body.addEventListener("keydown", handleKeyDown)

function handleKeyDown(e: KeyboardEvent) {
    if (e.target instanceof HTMLInputElement) {
        leaveTimeEntry(e, e.target)
        return
    }
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

function handleTimerNavigation(e: KeyboardEvent, $article: HTMLElement, direction: "next" | "prev" | "none") {
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
        // The clock, not the first button: that is Delete, in the corner.
        let firstButton = target.querySelector("button.clock")
        if (firstButton instanceof HTMLButtonElement) {
            firstButton.focus()
        }
    }
}

// Enter or Escape in a time's inputs is done editing: the focus leaves them,
// so the change saves and the time shows again. Enter moves it on to the
// card's clock; Escape leaves nothing focused.
function leaveTimeEntry(e: KeyboardEvent, input: HTMLInputElement) {
    if (e.key !== "Enter" && e.key !== "Escape") return
    let entry = input.closest(".time-entry")
    if (!entry) return
    e.preventDefault()
    if (e.key === "Escape") input.blur()
    else entry.parentElement?.querySelector<HTMLButtonElement>("button.clock")?.focus()
}
