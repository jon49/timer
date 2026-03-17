<script>
  function addTimer() {
  }
  function save() {
  }
  function toggleTimerState() {
  }
  function restart() {
  }
  function deleteTimer() {
  }
  function saveAppSettings() {
  }
  function toggleSounds() {
  }
</script>

<header>
  <nav>
    <ul>
      <li class="pb-0 pt-0">
        <h1 class="m-0">
          <img class="pointer" src="/images/timer.svg" alt="Timer Hourglass logo"
            style="height: 2em; width: 1.56em;">
        </h1>
      </li>
    </ul>
    <ul>
      <li><button onclick={addTimer}>Add Timer</button></li>
      <li><button commandfor="appSettings" command="show-modal">⚙</button></li>
    </ul>
  </nav>
</header>

<main>
  <section id="timers" class="grid timer-cards">
    <template id="timerTemplate">
      <article data-root>
        <header class="pb-0">
          <fieldset role="group">
              <input x="title" id="timerTitle" onchange={save} class="plain" name="title" type="text" placeholder="Title">
              <label x="titleLabel" for="timerTitle" aria-label="Timer Title">✎</label>
          </fieldset>
        </header>
        <fieldset role="group" onchange={save}>
          <input name="hours" type="number" placeholder="h">
          <input name="minutes" type="number" placeholder="m">
          <input name="seconds" type="number" placeholder="s">
        </fieldset>
        <div class="flex">
          <button onclick={toggleTimerState} x="clock" title="Click to start."
            aria-label="Click to start." style="width: 140px;">Start</button>
          <span hidden><audio x="audio" loop></audio></span>
          <button hidden x="restart" onclick={restart}>↻</button>
          <button x="openSettings" command="show-modal">⚙</button>
          <button onclick={deleteTimer}>❌</button>
        </div>
        <dialog x="timerSettings">
          <article data-box>
            <header>
              <button x="modalCloseButton" form="modalClose" aria-label="Close" value="cancel" rel="prev"></button>
              <h2 class="inline">Options</h2>
            </header>
            <form x="sounds">
              <legend>Sound</legend>
              <label><input type="radio" name="sound" value="default">Default</label>
              <label><input type="radio" name="sound" value="random">Random</label>
            </form>
          </article>
          <form id="modalClose" method="dialog"></form>
        </dialog>
      </article>
    </template>
  </section>
</main>

<dialog id="appSettings" onclose={saveAppSettings}>
  <article data-box>
    <header>
      <button form="appSettingsDialogForm" aria-label="Close" value="cancel" rel="prev"></button>
      <h2 class="inline">Options for All Timers</h2>
    </header>
    <h3>Allowed Sounds</h3>
    <fieldset id="allowedSounds">
      <button onclick={toggleSounds}>Toggle All</button>
      <hr>
    </fieldset>
  </article>
  <form id="appSettingsDialogForm" method="dialog"></form>
</dialog>

<footer class="container">
  <a href="https://github.com/jon49/timer/tree/master/src/_action">Source Code</a>
  <br>
  <small>Created with <a href="https://www.freesoundeffects.com/">Sounds</a>.</small>
</footer>
