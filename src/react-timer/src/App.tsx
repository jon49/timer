import { Timer } from './components/Timer'
import { useTimers } from './shared/data-store'
import { publish } from './shared/messaging'

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
            <li><button data-action="editSettings">&#9881;</button></li>
          </ul>
        </nav>
      </header>

      <main id="timer">
        <section className="grid timer-cards">
          <ul>
            {timerIds.map(id => <article key={id}><Timer id={id} /></article>)}
          </ul>
        </section>
      </main>

      <footer className="container">
        <a href="https://github.com/jon49/timer">Source Code</a>
        <br />
        <small> Created with <a href="https://developer.mozilla.org/en-US/docs/Web/API/Web_components">Custom Elements</a>.</small>
        <br />
        <small>Created with <a href="https://www.freesoundeffects.com/">Sounds</a>.</small>
      </footer>
    </>
  )
}

export default App
