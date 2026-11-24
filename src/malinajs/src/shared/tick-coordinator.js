class TickCoordinator {
  intervalId = null;
  subscribers = /* @__PURE__ */ new Map();
  subscribe(id, subscriber) {
    this.subscribers.set(id, subscriber);
    if (!this.intervalId) {
      this.intervalId = setInterval(() => this.tick(), 1e3);
    }
  }
  unsubscribe(id) {
    this.subscribers.delete(id);
    if (this.subscribers.size === 0 && this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
  tick() {
    requestAnimationFrame(() => {
      let now = Math.floor(Date.now() / 1e3);
      this.subscribers.forEach((subscriber) => subscriber(now));
    });
  }
}
let tickCoordinator = new TickCoordinator();
export {
  tickCoordinator
};

// Components import these instead of tickCoordinator: Malina.js treats an
// imported object with a `subscribe` method as a store and subscribes to it.
export function onTick(id, fn) {
  tickCoordinator.subscribe(id, fn);
}
export function offTick(id) {
  tickCoordinator.unsubscribe(id);
}
