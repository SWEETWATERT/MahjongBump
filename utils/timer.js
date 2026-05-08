function createCountdown(options) {
  let seconds = options.seconds || 60;
  let left = seconds;
  let timer = null;

  function stop() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  function tick() {
    left -= 1;
    if (options.onTick) {
      options.onTick(left);
    }
    if (left <= 0) {
      stop();
      if (options.onDone) {
        options.onDone();
      }
    }
  }

  function start(nextSeconds) {
    stop();
    seconds = nextSeconds || seconds;
    left = seconds;
    if (options.onTick) {
      options.onTick(left);
    }
    timer = setInterval(tick, 1000);
  }

  function reset(nextSeconds) {
    start(nextSeconds || seconds);
  }

  return {
    start,
    stop,
    reset,
    getLeft() {
      return left;
    }
  };
}

module.exports = {
  createCountdown
};
