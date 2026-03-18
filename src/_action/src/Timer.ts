import { timerStore } from "./shared/data-store.js"
import { soundOptions } from "./shared/sounds.js"
import { tickCoordinator } from "./shared/tick-coordinator.js"
import type { TimerData } from "./shared/types.js"
import { formatTime, getXElements } from "./shared/utils.js"
import { formatClock, getAlarm } from "./timer/countdown.js"

let w = window

// Populate sound options
let soundOptionsHTML = soundOptions.slice(1).reduce((acc, sound) => {
  return acc + `<label><input type="radio" name="sound" value="${sound[0]}">${sound[1]}</label>`
}, "")

export class Timer {
  root: Element
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
    let dialogId = `timerSettings${timer.id}`
    $.$timerSettings.id = dialogId
    setAttribute($.$openSettings, "commandfor", dialogId)

    $.$title.id += timer.id
    $.$titleLabel.setAttribute("for", $.$title.id)

    $.$sounds.insertAdjacentHTML("beforeend", soundOptionsHTML)

    let timerFormId = `timerForm${timer.id}`
    $.$timerForm.id = timerFormId
    for (let input of $.$sounds.querySelectorAll("input")) {
      setAttribute(input, "form", timerFormId)
    }

    this.setValues(timer)
    $.$id.value = "" + timer.id

    this.root = root
    root.app = this

    $.$timerSettings.addEventListener("close", this)

    w.timers.append(root)

    $.$timerForm.sound.value = timer.sound || "default"
  }

  handleEvent(e: Event) {
    // @ts-ignore
    this[e.type]?.(e)
  }

  close() {
    this.save()
  }

  deleteTimer() {
    tickCoordinator.unsubscribe(this)
    clearTimeout(this.clockTimeoutId)
    clearTimeout(this.alarmTimeoutId)
    clearInterval(this.audioIntervalId)
    timerStore.deleteTimer(+this.$.id)
    this.root.remove()
  }

  save() {
    let $ = this.$
    let sound = $.$timerForm.sound.value
    let timer: TimerData = {
      id: +$.id,
      title: $.title,
      hours: $.hours,
      minutes: $.minutes > 59 ? 59 : $.minutes,
      seconds: $.seconds > 59 ? 59 : $.seconds,
      sound: sound === "default" ? null : sound
    }
    this.setValues(timer)
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
    this.totalTime = timerStore.getTotalTime(this.$)
    this.tick(this.clockStartedTime)
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
    let soundInfo = getAlarm(this.$.$timerForm.sound.value, allowedSounds)
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

  tick(now: number) {
    let timeElapsed = (now - this.clockStartedTime) | 0
    let newTimeLeft = this.totalTime - timeElapsed
    this.$.clock = formatClock(newTimeLeft)
  }

  setValues(timer: TimerData) {
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
  id: string
  $id: HTMLInputElement
  title: string
  $title: HTMLInputElement
  get seconds(): number
  set seconds(val: string)
  $seconds: HTMLInputElement
  get minutes(): number
  set minutes(val: string)
  $minutes: HTMLInputElement
  get hours(): number
  set hours(val: string)
  $hours: HTMLInputElement
  restart: string
  $restart: HTMLButtonElement
  clock: string
  $clock: HTMLButtonElement
  $audio: HTMLAudioElement
  $sounds: HTMLFormElement
  $timerSettings: HTMLDialogElement
  $openSettings: HTMLButtonElement
  $titleLabel: HTMLLabelElement
  $timerForm: HTMLFormElement
}
