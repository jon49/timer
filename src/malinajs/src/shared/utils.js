function formatTime(time, defaultValue = "") {
  if (!time)
    return defaultValue;
  return ("" + time).padStart(2, "0");
}
export {
  formatTime
};
