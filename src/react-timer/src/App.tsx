import { useState } from "react"
import { timerStore } from "./shared/data-store"
import { downloadData, uploadData } from "./shared/data-transfer"
import { GlobalSettings } from "./timer/GlobalSettings"
import { Timer } from "./timer/Timer"

export default function App() {
    let [timerIds, setTimerIds] = useState(() => timerStore.timerIds)

    function addTimer() {
        let id = timerStore.newTimer().id
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
                        <li className="pb-0 pt-0">
                            <h1 className="m-0">
                                <img onClick={addTimer} className="pointer" src="/images/timer.svg"
                                    alt="Timer Hourglass logo" style={{ height: "2em", width: "1.56em" }} />
                            </h1>
                        </li>
                    </ul>
                    <ul>
                        <li><button className="theme-toggle" aria-label="Toggle theme" title="Toggle theme"></button></li>
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
                <section className="grid timer-cards">
                    {timerIds.map(id => (
                        <article key={id}>
                            <Timer id={id} onDelete={() => removeTimer(id)} />
                        </article>
                    ))}
                </section>
            </main>

            <footer>
                <a href="https://github.com/jon49/timer/tree/master/src/react-timer">Source Code</a>
                <br />
                <small>Created with <a href="https://react.dev/">React</a></small>
                <br />
                <small>Created with <a href="https://www.freesoundeffects.com/">Sounds</a>.</small>
            </footer>
        </>
    )
}
