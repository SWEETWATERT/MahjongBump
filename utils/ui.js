function createUi(page) {
  const cache = {};

  function setFields(next) {
    const patch = {};
    Object.keys(next).forEach((key) => {
      if (cache[key] !== next[key]) {
        cache[key] = next[key];
        patch[key] = next[key];
      }
    });
    if (Object.keys(patch).length) {
      page.setData(patch);
    }
  }

  function init(metrics) {
    setFields({
      canvasWidth: metrics.width,
      canvasHeight: metrics.height,
      time: 60,
      score: 0,
      combo: 0,
      message: "点击两张相同麻将，最多2折线消除",
      noticeType: ""
    });
  }

  function hud(game) {
    setFields({
      time: game.time,
      score: game.score,
      combo: game.combo
    });
  }

  function message(text, type) {
    setFields({
      message: text,
      noticeType: type || ""
    });
  }

  function reset() {
    Object.keys(cache).forEach((key) => {
      delete cache[key];
    });
  }

  return {
    init,
    hud,
    message,
    reset
  };
}

module.exports = {
  createUi
};
