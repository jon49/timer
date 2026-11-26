import { soundOptions } from "./sounds.js";
import { formatTime } from "./utils.js";
function formatClock(time) {
  if (time < 1)
    return "00:00:00";
  let hours = Math.floor(time / 3600);
  let minutes = Math.floor(time % 3600 / 60);
  let seconds = time % 60;
  return `${formatTime(hours, "00")}:${formatTime(minutes, "00")}:${formatTime(seconds, "00")}`;
}
let alarmIds = soundOptions.slice(1).map(([value]) => value);
function getAlarm(sound, allowedSounds) {
  if (!sound || sound === "random") {
    let allowedAlarms = alarmIds.filter((x) => allowedSounds.length === 0 || allowedSounds.includes(x));
    if (allowedAlarms.length === 0)
      allowedAlarms = alarmIds;
    return getAlarm(allowedAlarms[Math.floor(Math.random() * allowedAlarms.length)], allowedSounds);
  }
  let alarm = soundOptions.find(([name]) => name === sound);
  if (!alarm || !alarm[2])
    return;
  return { url: alarm[2], title: alarm[1] };
}
function playAlarm(audio, sound) {
  audio.title = sound.title;
  audio.src = sound.url;
  audio.loop = true;
  let volume = 1;
  audio.volume = volume / 100;
  let fadeIn = setInterval(() => {
    if (volume < 100) {
      volume += 1;
      audio.volume = volume / 100;
    } else {
      clearInterval(fadeIn);
    }
  }, 1200);
  audio.play().catch((x) => console.error("Audio failed to start.", x));
  return () => {
    clearInterval(fadeIn);
    audio.pause();
  };
}
export {
  formatClock,
  getAlarm,
  playAlarm
};
