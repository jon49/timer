let appStateKey = "timers";
class TimerStore {
  data;
  constructor() {
    let data = JSON.parse(localStorage.getItem(appStateKey) ?? "null");
    if (data == null) {
      data = { sound: "random", timers: [], allowedSounds: [] };
    }
    if (data.allowedSounds == null) {
      data.allowedSounds = [];
    }
    this.data = data;
  }
  save() {
    localStorage.setItem(appStateKey, JSON.stringify(this.data));
  }
  updateTimer(timer) {
    let index = this.data.timers.findIndex((t) => t.id === timer.id);
    if (index == -1) {
      this.data.timers.push(timer);
    } else {
      this.data.timers[index] = timer;
    }
    this.save();
  }
  deleteTimer(id) {
    this.data.timers = this.data.timers.filter((t) => t.id != id);
    this.save();
  }
  getTimer(id) {
    return this.data.timers.find((t) => t.id == id) ?? { id, hours: 0, minutes: 0, seconds: 0, title: "", sound: null };
  }
  getTotalTime(id) {
    let timer = this.data.timers.find((t) => t.id === id);
    if (!timer)
      return 0;
    return timer.hours * 3600 + timer.minutes * 60 + timer.seconds;
  }
  setAllowedSounds(sounds) {
    this.data.allowedSounds = sounds;
    this.save();
  }
  get timerIds() {
    return this.data.timers.map((t) => t.id);
  }
  newTimer() {
    let id = newId(this.timerIds);
    let timer = { id, hours: 0, minutes: 0, seconds: 0, title: "", sound: null };
    this.updateTimer(timer);
    return timer;
  }
}
let timerStore = new TimerStore();
function newId(ids) {
  if (ids.length == 0) {
    return 1;
  }
  return Math.max(...ids) + 1;
}
export {
  timerStore
};
