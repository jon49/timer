import { Timer } from './timer/Timer'
import { useTimers } from './shared/data-store'
import { publish, subscribe } from './shared/messaging'
import { GlobalSettings } from './timer/GlobalSettings'
import van from "vanjs-core"

let { a, article, br, button, footer, h1, header, li, main, img, nav, section, small, ul } = van.tags

function addTimer() {
    publish("newTimer")
}

function createTimer(id: number) {
    return article({ id: `appTimer${id}` }, Timer(id))
}

function App() {
    let timerIds = useTimers()
    let $timerCards: HTMLElement | null = null

    subscribe("timerAdded", (id: number) => {
        if (!$timerCards) return
        $timerCards.appendChild(createTimer(id))
    })

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
                    li(GlobalSettings()))
            )),

        main({ id: "timer" },
            $timerCards = section({ class: "grid timer-cards" },
                timerIds.map(id => createTimer(id)))),

        footer({ class: "container" },
            a({ href: "https://github.com/jon49/timer/tree/master/src/van-timer" }, "Source Code"),
            br(),
            small(`Created with `, a({ href: "https://vanjs.org/" }, "Van JS")),
            br(),
            small("Created with ", a({ href: "https://www.freesoundeffects.com/" }, "Sounds"), "."))
    ]
}

export default App

