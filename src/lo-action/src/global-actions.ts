import {timerStore} from "./shared/data-store.js"
import { soundOptions } from "./shared/sounds.js"
import { Timer } from "./Timer.js"

let w = window

w.app = {
  addTimer: _ => {
    let timer = timerStore.newTimer()
    new Timer(timer)
  },
  saveAppSettings: _ => {
    let allowedSounds = timerStore.data.allowedSounds
    allowedSounds.length = 0
    for (let input of w.allowedSounds.querySelectorAll("input")) {
      if (input.checked) {
        allowedSounds.push(input.value)
        timerStore.save()
      }
    }
  },
  toggleSounds: _ => {
    let allowedSounds = Array.from(w.allowedSounds.querySelectorAll("input"))
    let allChecked = allowedSounds.every(x => x.checked)
    for (let input of allowedSounds) {
      input.checked = !allChecked
    }
  }
}

for (let timer of timerStore.timers) {
  new Timer(timer)
}

for (let sound of soundOptions) {
  w.allowedSounds.insertAdjacentHTML(
    "beforeend",
    `<label><input name="allowedSounds" type="checkbox" value="${sound[0]}" ${timerStore.data.allowedSounds.includes(sound[0]) ? "checked" : ""}>${sound[1]}</label>`)
}
