<script lang="ts">
    import { timerStore } from "./shared/data-store"
    import { downloadData, uploadData } from "./shared/data-transfer"
    import GlobalSettings from "./timer/GlobalSettings.svelte"
    import Timer from "./timer/Timer.svelte"

    let timerIds = $state(timerStore.timerIds)

    function addTimer() {
        timerIds.push(timerStore.newTimer().id)
    }

    function removeTimer(id: number) {
        timerStore.deleteTimer(id)
        timerIds = timerIds.filter(x => x !== id)
    }
</script>

<header>
    <nav>
        <ul>
            <li class="pb-0 pt-0">
                <h1 class="m-0">
                    <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
                    <img
                        onclick={addTimer}
                        class="pointer"
                        src="/images/timer.svg"
                        alt="Timer Hourglass logo"
                        style="height: 2em; width: 1.56em;">
                </h1>
            </li>
        </ul>
        <ul>
            <li><button onclick={addTimer}>Add Timer</button></li>
            <li><GlobalSettings /></li>
            <li>
                <button onclick={downloadData} aria-label="Download timer data" title="Download timer data">&#11015;</button>
            </li>
            <li>
                <button onclick={uploadData} aria-label="Upload timer data" title="Upload timer data">&#11014;</button>
            </li>
        </ul>
    </nav>
</header>

<main id="timer">
    <section class="grid timer-cards">
        {#each timerIds as id (id)}
            <article>
                <Timer {id} onDelete={() => removeTimer(id)} />
            </article>
        {/each}
    </section>
</main>

<footer>
    <a href="https://github.com/jon49/timer/tree/master/src/svelte-timer">Source Code</a>
    <br>
    <small>Created with <a href="https://svelte.dev/">Svelte</a></small>
    <br>
    <small>Created with <a href="https://www.freesoundeffects.com/">Sounds</a>.</small>
</footer>
