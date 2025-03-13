import { Timer } from './timer/Timer'
import { useTimers } from './shared/data-store'
import { publish } from './shared/messaging'
import { GlobalSettings } from './timer/GlobalSettings'

function addTimer() {
  publish("newTimer")
}

function App() {
  let [timerIds] = useTimers()

  return (
    <>
      <header>
        <nav>
          <ul>
            <li className="pb-0 pt-0">
              <h1 className="m-0">
                <img onClick={addTimer} className="pointer" src="/images/timer.svg"
                  alt="Timer Hourglass logo" style={{ height: "2em", width: "1.56em" }}></img>
              </h1>
            </li>
          </ul>
          <ul>
            <li><button onClick={addTimer}>Add Timer</button></li>
            <li><GlobalSettings /></li>
          </ul>
        </nav>
      </header>

      <main id="timer">
        <section className="grid timer-cards">
            {timerIds.map(id => <article key={id}><Timer id={id} /></article>)}
        </section>
      </main>

      <footer className="container">
        <a href="https://github.com/jon49/timer/tree/master/src/react-timer">Source Code</a>
        <br />
        <small> Created with <a href="https://react.dev/">React JS</a>.</small>
        <br />
        <small>Created with <a href="https://www.freesoundeffects.com/">Sounds</a>.</small>
      </footer>
    </>
  )
}

export default App
