import { Timer } from './timer/Timer'
import { timerStore } from './shared/data-store'
import { GlobalSettings } from './timer/GlobalSettings'
import van from "vanjs-core"
import "./timer/TimerNavigation"

let { a, article, br, button, footer, h1, header, li, main, img, nav, section, small, ul } = van.tags

function createTimer(id: number) {
    return article({ id: `appTimer${id}` }, Timer(id))
}

function downloadData() {
    let blob = new Blob([JSON.stringify(timerStore.data, null, 2)], { type: "application/json" })
    let url = URL.createObjectURL(blob)
    let $a = document.createElement("a")
    $a.href = url
    $a.download = "timers.json"
    $a.click()
    URL.revokeObjectURL(url)
}

function uploadData() {
    let $input = document.createElement("input")
    $input.type = "file"
    $input.accept = "application/json,.json"
    $input.onchange = async () => {
        let file = $input.files?.[0]
        if (!file) return
        try {
            let data = JSON.parse(await file.text())
            if (data == null || typeof data !== "object" || !Array.isArray(data.timers)) {
                alert("Invalid timer data file.")
                return
            }
            timerStore.data = data
            timerStore.save()
            location.reload()
        } catch {
            alert("Could not read timer data file.")
        }
    }
    $input.click()
}

function App() {
    let $timerCards: HTMLElement

    function addTimer() {
        $timerCards.appendChild(createTimer(timerStore.newTimer().id))
    }

    return [
        header(
            nav(
                ul(
                    li({ class: "pb-0 pt-0" },
                        h1({ class: "m-0" },
                            img({
                                onclick: addTimer,
                                class: "pointer",
                                src: "/images/timer.svg",
                                alt: "Timer Hourglass logo",
                                style: `height: 2em; width: 1.56em;`
                            }))),
                ),
                ul(
                    li(button({ onclick: addTimer }, "Add Timer")),
                    li(GlobalSettings()),
                    li(button({
                        onclick: downloadData,
                        ariaLabel: "Download timer data",
                        title: "Download timer data",
                        innerHTML: "&#11015;"
                    })),
                    li(button({
                        onclick: uploadData,
                        ariaLabel: "Upload timer data",
                        title: "Upload timer data",
                        innerHTML: "&#11014;"
                    })))
            )),

        main({ id: "timer" },
            $timerCards = section({
                class: "grid timer-cards",
            }, timerStore.timerIds.map(id => createTimer(id)))),

        footer(
            a({ href: "https://github.com/jon49/timer/tree/master/src/van-timer" }, "Source Code"),
            br(),
            small(`Created with `, a({ href: "https://vanjs.org/" }, "Van JS")),
            br(),
            small("Created with ", a({ href: "https://www.freesoundeffects.com/" }, "Sounds"), "."))
    ]
}

export default App
