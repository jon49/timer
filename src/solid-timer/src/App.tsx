import { createSignal, For } from "solid-js"
import { timerStore } from "./shared/data-store"
import { downloadData, uploadData } from "./shared/data-transfer"
import { GlobalSettings } from "./timer/GlobalSettings"
import { Timer } from "./timer/Timer"

export default function App() {
    const [timerIds, setTimerIds] = createSignal(timerStore.timerIds)

    function addTimer() {
        const id = timerStore.newTimer().id
        setTimerIds(ids => [...ids, id])
    }

    function removeTimer(id: number) {
        timerStore.deleteTimer(id)
        setTimerIds(ids => ids.filter(x => x !== id))
    }

    return (
        <>
            <header>
                <nav>
                    <ul>
                        <li class="pb-0 pt-0">
                            <h1 class="m-0">
                                <img
                                    onClick={addTimer}
                                    class="pointer"
                                    src="/images/timer.svg"
                                    alt="Timer Hourglass logo"
                                    style={{ height: "2em", width: "1.56em" }} />
                            </h1>
                        </li>
                    </ul>
                    <ul>
                        <li><button class="theme-toggle" aria-label="Toggle theme" title="Toggle theme"></button></li>
                        <li><button onClick={addTimer}>Add Timer</button></li>
                        <li><GlobalSettings /></li>
                        <li>
                            <button onClick={downloadData} aria-label="Download timer data" title="Download timer data">&#11015;</button>
                        </li>
                        <li>
                            <button onClick={uploadData} aria-label="Upload timer data" title="Upload timer data">&#11014;</button>
                        </li>
                    </ul>
                </nav>
            </header>

            <main id="timer">
                <section class="grid timer-cards">
                    <For each={timerIds()}>
                        {id => (
                            <article>
                                <Timer id={id} onDelete={() => removeTimer(id)} />
                            </article>
                        )}
                    </For>
                </section>
            </main>

            <footer>
                <a href="https://github.com/jon49/timer/tree/master/src/solid-timer">Source Code</a>
                <br />
                <small>Created with <a href="https://www.solidjs.com/">SolidJS</a></small>
                <br />
                <small>Created with <a href="https://www.freesoundeffects.com/">Sounds</a>.</small>
            </footer>
        </>
    )
}
