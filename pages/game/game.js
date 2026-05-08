const Board = require("../../utils/board");
const Effect = require("../../utils/effect");
const Match = require("../../utils/match");
const Shuffle = require("../../utils/shuffle");
const Timer = require("../../utils/timer");
const Ui = require("../../utils/ui");
const Tile = require("../../utils/tile");

const ROWS = 7;
const COLS = 6;
const TOTAL_TIME = 60;

Page({
  data: {
    time: TOTAL_TIME,
    score: 0,
    combo: 0,
    message: "点击两张相同麻将，最多2折线消除",
    noticeType: "",
    canvasWidth: 360,
    canvasHeight: 500
  },

  onLoad() {
    const systemInfo = wx.getSystemInfoSync();
    this.layout = Board.createLayout(systemInfo.windowWidth, ROWS, COLS);
    this.ui = Ui.createUi(this);
    this.game = {
      time: TOTAL_TIME,
      score: 0,
      combo: 0,
      selected: null,
      hintIds: [],
      finished: false
    };
    this.board = Board.createBoard(ROWS, COLS);
    this.images = {};
    this.autoHintTimer = null;
    this.ui.init(this.layout);
  },

  onReady() {
    this.setupCanvas(() => {
      this.effect = Effect.createEffectEngine(this.canvas, () => this.render());
      this.requestFrame = this.canvas.requestAnimationFrame ?
        this.canvas.requestAnimationFrame.bind(this.canvas) :
        (callback) => setTimeout(callback, 16);
      this.effect.start();
      this.loadImages();
      this.startTimer(TOTAL_TIME);
      this.scheduleAutoHint();
      this.render();
    });
  },

  onShow() {
    if (this.timer && !this.game.finished && this.game.time > 0) {
      this.startTimer(this.game.time);
      this.scheduleAutoHint();
    }
    if (this.effect) {
      this.effect.start();
    }
  },

  onHide() {
    this.pauseRuntime();
  },

  onUnload() {
    this.pauseRuntime();
    if (this.effect) {
      this.effect.stop();
    }
  },

  setupCanvas(callback) {
    wx.createSelectorQuery()
      .in(this)
      .select("#gameCanvas")
      .fields({ node: true, size: true, rect: true })
      .exec((result) => {
        const info = result && result[0];
        if (!info || !info.node) {
          this.ui.message("当前微信版本不支持2D Canvas，请升级后再试", "error");
          return;
        }
        this.canvasRect = info;
        this.canvas = info.node;
        this.ctx = this.canvas.getContext("2d");
        const dpr = wx.getSystemInfoSync().pixelRatio || 1;
        this.canvas.width = this.layout.width * dpr;
        this.canvas.height = this.layout.height * dpr;
        this.ctx.scale(dpr, dpr);
        callback();
      });
  },

  loadImages() {
    Tile.TILE_LIBRARY.forEach((tile) => {
      const image = this.canvas.createImage();
      image.onload = () => {
        this.images[tile.id] = image;
        this.render();
      };
      image.src = tile.image;
    });
  },

  startTimer(seconds) {
    if (!this.timer) {
      this.timer = Timer.createCountdown({
        seconds: TOTAL_TIME,
        onTick: (time) => {
          this.game.time = time;
          this.ui.hud(this.game);
        },
        onDone: () => this.finish(false)
      });
    }
    this.timer.start(seconds || TOTAL_TIME);
  },

  pauseRuntime() {
    if (this.timer) {
      this.timer.stop();
    }
    this.clearAutoHint();
  },

  canvasPoint(event) {
    const touch = event.touches && event.touches[0] ? event.touches[0] : null;
    if (!touch || !this.canvasRect) {
      return { x: 0, y: 0 };
    }
    return {
      x: (touch.clientX - this.canvasRect.left) * this.layout.width / this.canvasRect.width,
      y: (touch.clientY - this.canvasRect.top) * this.layout.height / this.canvasRect.height
    };
  },

  onCanvasTouch(event) {
    if (this.game.finished || this.game.time <= 0) {
      return;
    }

    const point = this.canvasPoint(event);
    const tile = Board.tileAt(this.board, this.layout, point.x, point.y);
    if (!tile) {
      return;
    }

    this.clearAutoHint();
    this.game.hintIds = [];
    this.effect.clearLine();

    if (!this.game.selected) {
      this.game.selected = tile;
      this.ui.message("已选中，再点一张相同麻将", "");
      this.scheduleAutoHint();
      return;
    }

    if (this.game.selected.id === tile.id) {
      this.game.selected = null;
      this.ui.message("已取消选择", "");
      this.scheduleAutoHint();
      return;
    }

    const result = Match.canConnect(this.board, ROWS, COLS, this.game.selected, tile);
    if (result.ok) {
      this.removePair(this.game.selected, tile, result.path);
    } else {
      this.wrongPick();
    }
  },

  removePair(first, second, path) {
    this.effect.playLine(path);
    this.game.score += 10 + this.game.combo * 4;
    this.game.combo += 1;
    this.game.selected = null;
    this.ui.hud(this.game);
    this.ui.message("连上了，继续", "success");

    first.removing = true;
    second.removing = true;
    this.animateRemove(first, second, 0);
  },

  animateRemove(first, second, frame) {
    const progress = Math.min(1, frame / 14);
    first.removeProgress = progress;
    second.removeProgress = progress;

    if (progress < 1) {
      this.requestFrame(() => this.animateRemove(first, second, frame + 1));
      return;
    }

    first.removed = true;
    second.removed = true;
    first.removing = false;
    second.removing = false;
    this.effect.playParticles(this.layout, [first, second]);
    setTimeout(() => this.effect.clearLine(), 130);
    this.afterRemove();
  },

  wrongPick() {
    this.game.selected = null;
    this.game.combo = 0;
    this.ui.hud(this.game);
    this.ui.message("没连上，只能最多转2次弯", "error");
    this.effect.playError();
    if (wx.vibrateShort) {
      wx.vibrateShort({ type: "medium" });
    }
    this.scheduleAutoHint();
  },

  afterRemove() {
    if (!Board.activeTiles(this.board).length) {
      this.finish(true);
      return;
    }

    if (!Match.findAvailablePair(this.board, ROWS, COLS)) {
      Shuffle.ensurePlayable(this.board, ROWS, COLS, 80);
      this.ui.message("没有可消除组合，已自动洗牌", "");
    }
    this.scheduleAutoHint();
  },

  onShuffle() {
    if (this.game.finished) {
      return;
    }
    this.clearAutoHint();
    this.game.selected = null;
    this.game.hintIds = [];
    this.game.combo = 0;
    this.game.score = Math.max(0, this.game.score - 5);
    Shuffle.ensurePlayable(this.board, ROWS, COLS, 80);
    this.ui.hud(this.game);
    this.ui.message("已洗牌", "");
    this.scheduleAutoHint();
  },

  onHint() {
    if (this.game.finished) {
      return;
    }
    this.clearAutoHint();
    const move = Match.findAvailablePair(this.board, ROWS, COLS);
    if (!move) {
      Shuffle.ensurePlayable(this.board, ROWS, COLS, 80);
      this.ui.message("已自动洗牌，请再试", "");
      this.scheduleAutoHint();
      return;
    }

    this.game.hintIds = [move.first.id, move.second.id];
    this.effect.playLine(move.path);
    this.ui.message("提示已标出一对", "success");
    setTimeout(() => {
      this.game.hintIds = [];
      this.effect.clearLine();
      this.scheduleAutoHint();
    }, 1300);
  },

  onRestart() {
    this.pauseRuntime();
    this.board = Board.createBoard(ROWS, COLS);
    this.game = {
      time: TOTAL_TIME,
      score: 0,
      combo: 0,
      selected: null,
      hintIds: [],
      finished: false
    };
    this.effect.clearLine();
    this.ui.reset();
    this.ui.init(this.layout);
    this.ui.message("新一局开始，60秒内全部消除", "");
    this.startTimer(TOTAL_TIME);
    this.scheduleAutoHint();
  },

  finish(win) {
    this.game.finished = true;
    this.pauseRuntime();
    this.game.selected = null;
    this.game.hintIds = [];
    this.effect.clearLine();
    this.ui.message(win ? "恭喜过关" : "时间到，点重来再挑战", win ? "success" : "error");
  },

  scheduleAutoHint() {
    this.clearAutoHint();
    if (this.game.finished) {
      return;
    }
    this.autoHintTimer = setTimeout(() => this.onHint(), 8500);
  },

  clearAutoHint() {
    if (this.autoHintTimer) {
      clearTimeout(this.autoHintTimer);
      this.autoHintTimer = null;
    }
  },

  render() {
    if (!this.ctx || !this.board) {
      return;
    }
    Board.drawBoard(this.ctx, this.board, this.layout, {
      selectedId: this.game.selected ? this.game.selected.id : "",
      hintIds: this.game.hintIds,
      images: this.images,
      errorProgress: this.effect ? this.effect.state.errorProgress : 0
    });
    if (this.effect) {
      this.effect.drawLine(this.ctx, this.layout);
      this.effect.drawParticles(this.ctx);
    }
  }
});
