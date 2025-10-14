import { timerStore } from "./shared/data-store.js"
import { soundOptions } from "./shared/sounds.js"
import { tickCoordinator } from "./shared/tick-coordinator.js"
import type { TimerData } from "./shared/types"
import { formatTime, getXElements } from "./shared/utils.js"
import { formatClock, getAlarm } from "./timer/countdown.js"

let w = window

export class Timer {
  root: Element
  timer: TimerData
  $: TimerElements
  clockStartedTime: number = 0
  totalTime: number = 0
  clockTimeoutId: number = 0
  alarmTimeoutId: number = 0
  audioIntervalId: number = 0

  constructor(timer: TimerData) {
    let $timer = w.timerTemplate.content.cloneNode(true) as DocumentFragment
    let root = $timer.firstElementChild
    if (!root) throw new Error("No root element in timer template!")

    let $ = this.$ = getXElements<TimerElements>(root)
    $.$modalClose.id += timer.id
    setAttribute($.$modalCloseButton, "form", ""+$.$modalCloseButton.getAttribute("form")  + timer.id)
    let dialogId = `timerSettings${timer.id}`
    $.$timerSettings.id = dialogId
    setAttribute($.$openSettings, "commandfor", dialogId)

    for (let sound of soundOptions.slice(1)) {
      $.$sounds.insertAdjacentHTML("beforeend",
        `<label><input type="radio" name="sound" value="${sound[0]}">${sound[1]}</label>`)
    }

    $.$sounds.sound.value = timer.sound ? timer.sound : "default"

    this.timer = timer
    this.setValues()

    this.root = root
    root.app = this

    w.timers.append(root)

  }

  deleteTimer() {
    tickCoordinator.unsubscribe(this)
    clearTimeout(this.clockTimeoutId)
    clearTimeout(this.alarmTimeoutId)
    clearInterval(this.audioIntervalId)
    timerStore.deleteTimer(this.timer.id)
    this.root.remove()
  }

  save() {
    let $ = this.$
    let timer = this.timer

    timer.title = $.title
    timer.hours = +$.hours
    let minutes = +$.minutes
    if (minutes > 59) {
      minutes = 59
    }
    timer.minutes = minutes
    let seconds = +$.seconds
    if (seconds > 59) {
      seconds = 59
    }
    timer.seconds = seconds
    this.setValues()
    timerStore.updateTimer(timer)
  }

  toggleTimerState() {
    if (this.$.clock === "Start") {
      this.start()
    } else {
      this.stop()
    }
  }

  stop() {
    this.stopAlarm()
    let $ = this.$
    $.$restart.hidden = true
    $.clock = "Start"
    removeAttribute($.$clock, "title")
    removeAttribute($.$clock, "aria-label")
  }

  start() {
    clearTimeout(this.clockTimeoutId ?? 0)

    let $ = this.$

    setAttribute($.$clock, "title", "Click to stop.")
    setAttribute($.$clock, "aria-label", "Click to stop.")
    $.$restart.hidden = false

    let now = Date.now()
    this.clockStartedTime = now / 1e3
    this.totalTime = timerStore.getTotalTime(this.timer)
    tickCoordinator.subscribe(this)
    this.clockTimeoutId = setTimeout(() => this.startAlarm(), this.totalTime * 1e3)
  }

  restart() {
    this.stopAlarm()
    this.start()
  }

  clearTimeouts() {
    clearTimeout(this.clockTimeoutId)
    clearTimeout(this.alarmTimeoutId)
    clearInterval(this.audioIntervalId)
  }

  stopAlarm() {
    this.clearTimeouts()
    tickCoordinator.unsubscribe(this)
    this.$.$audio.pause()
  }

  startAlarm() {
    tickCoordinator.unsubscribe(this)
    let $ = this.$

    $.clock = "Stop"
    $.$clock.focus()

    let { allowedSounds } = timerStore.data
    let soundInfo = getAlarm(this.timer.sound, allowedSounds)
    if (!soundInfo) return

    this.clearTimeouts()

    let $audio = $.$audio
    setAttribute($audio, "title", soundInfo.title)
    setAttribute($audio, "src", soundInfo.url)

    let volume = 1
    $audio.volume = volume / 100
    this.audioIntervalId = setInterval(() => {
      if ($audio && volume < 100) {
          volume += 1
          $audio.volume = volume / 100
      } else {
          clearInterval(this.audioIntervalId)
      }
    }, 1200)

    // Stop audio after 2 minutes
    this.alarmTimeoutId = setTimeout(() => this.stopAlarm(), 12e4)

    $audio.play()
        .catch(x => console.error("Audio failed to start.", x))
  }

  saveSound() {
    let sound = this.$.$sounds.sound.value
    if (!sound) return
    this.timer.sound = sound === "default" ? null : sound
    timerStore.updateTimer(this.timer)
  }

  tick(now: number) {
    let timeElapsed = (now - this.clockStartedTime) | 0
    let newTimeLeft = this.totalTime - timeElapsed
    this.$.clock = formatClock(newTimeLeft)
  }

  setValues() {
    let timer = this.timer
    let $ = this.$
    $.title = timer.title
    $.hours = formatTime(timer.hours)
    $.minutes = formatTime(timer.minutes)
    $.seconds = formatTime(timer.seconds)
  }
}

function setAttribute(el: HTMLElement, key: string, value: string) {
  el.setAttribute(key, value)
}

function removeAttribute(el: HTMLElement, key: string) {
  el.removeAttribute(key)
}

interface TimerElements {
  title: string
  $title: HTMLInputElement
  seconds: string
  $seconds: HTMLInputElement
  minutes: string
  $minutes: HTMLInputElement
  hours: string
  $hours: HTMLInputElement
  restart: string
  $restart: HTMLButtonElement
  $modalClose: HTMLFormElement
  $modalCloseButton: HTMLButtonElement
  clock: string
  $clock: HTMLButtonElement
  $audio: HTMLAudioElement
  $sounds: HTMLFormElement
  $timerSettings: HTMLDialogElement
  $openSettings: HTMLButtonElement
}
