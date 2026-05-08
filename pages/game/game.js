const Board = require("../../components/board/board");
const Match = require("../../utils/match");
const Shuffle = require("../../utils/shuffle");
const Timer = require("../../utils/timer");

const ROWS = 7;
const COLS = 6;
const TOTAL_TIME = 60;

Page({
  data: {
    time: TOTAL_TIME,
    score: 0,
    combo: 0,
    message: "点击两张相同麻将牌，最多2折线即可消除",
    noticeType: "",
    canvasWidth: 360,
    canvasHeight: 480
  },

  onLoad() {
    const systemInfo = wx.getSystemInfoSync();
    this.metrics = Board.createMetrics(systemInfo.windowWidth, ROWS, COLS);
    this.board = Board.createBoard(ROWS, COLS);
    this.selected = null;
    this.linePath = [];
    this.hintIds = [];
    this.particles = [];
    this.autoHintTimer = null;
    this.finished = false;
    this.setData({
      canvasWidth: this.metrics.width,
      canvasHeight: this.metrics.height
    });
  },

  onReady() {
    this.ctx = wx.createCanvasContext("gameCanvas", this);
    this.updateCanvasRect();
    this.timer = Timer.createCountdown({
      seconds: TOTAL_TIME,
      onTick: (time) => this.setData({ time }),
      onDone: () => this.finishGame(false)
    });
    this.timer.start(TOTAL_TIME);
    this.draw();
    this.scheduleAutoHint();
  },

  onUnload() {
    this.clearTimers();
  },

  onHide() {
    if (this.timer) {
      this.timer.stop();
    }
    this.clearAutoHint();
  },

  onShow() {
    if (this.ctx && !this.finished && this.timer) {
      this.timer.start(this.data.time);
      this.scheduleAutoHint();
    }
  },

  updateCanvasRect(callback) {
    wx.createSelectorQuery()
      .in(this)
      .select("#gameCanvas")
      .boundingClientRect((rect) => {
        if (rect) {
          this.canvasRect = rect;
        }
        if (callback) {
          callback();
        }
      })
      .exec();
  },

  getCanvasPoint(event) {
    const touch = event.touches && event.touches[0] ? event.touches[0] :
      event.changedTouches && event.changedTouches[0] ? event.changedTouches[0] :
        null;

    if (touch && this.canvasRect && touch.clientX !== undefined && touch.clientY !== undefined) {
      return {
        x: (touch.clientX - this.canvasRect.left) * this.metrics.width / this.canvasRect.width,
        y: (touch.clientY - this.canvasRect.top) * this.metrics.height / this.canvasRect.height
      };
    }

    if (touch && touch.x !== undefined && touch.y !== undefined) {
      return {
        x: touch.x * this.metrics.width / (this.canvasRect ? this.canvasRect.width : this.metrics.width),
        y: touch.y * this.metrics.height / (this.canvasRect ? this.canvasRect.height : this.metrics.height)
      };
    }

    const detail = event.detail || {};
    return {
      x: detail.x || 0,
      y: detail.y || 0
    };
  },

  onCanvasTouch(event) {
    if (this.finished || this.data.time <= 0) {
      return;
    }

    const point = this.getCanvasPoint(event);
    const cell = Board.tileAtPoint(this.board, this.metrics, point.x, point.y);
    if (!cell) {
      return;
    }

    this.clearAutoHint();
    this.hintIds = [];

    if (!this.selected) {
      this.selected = cell;
      this.setData({ message: "已选中，再点一张相同麻将", noticeType: "" });
      this.draw();
      this.scheduleAutoHint();
      return;
    }

    if (this.selected.id === cell.id) {
      this.selected = null;
      this.draw();
      this.scheduleAutoHint();
      return;
    }

    const result = Match.canConnect(this.board, ROWS, COLS, this.selected, cell);
    if (result.ok) {
      this.handleSuccess(this.selected, cell, result.path);
    } else {
      this.handleError("这两张连不上，最多只能转2次弯");
    }
  },

  handleSuccess(first, second, path) {
    this.linePath = path;
    this.setData({
      score: this.data.score + 10 + this.data.combo * 3,
      combo: this.data.combo + 1,
      message: "消除成功",
      noticeType: "success"
    });
    this.draw();

    setTimeout(() => {
      first.removed = true;
      second.removed = true;
      this.selected = null;
      this.linePath = [];
      this.playParticles([first, second]);
      this.afterRemove();
    }, 220);
  },

  handleError(message) {
    this.selected = null;
    this.setData({ combo: 0, message, noticeType: "error" });
    if (wx.vibrateShort) {
      wx.vibrateShort({ type: "medium" });
    }

    this.errorFlash = true;
    this.draw();
    setTimeout(() => {
      this.errorFlash = false;
      this.draw();
      this.scheduleAutoHint();
    }, 180);
  },

  afterRemove() {
    if (Match.activeCells(this.board).length === 0) {
      this.finishGame(true);
      return;
    }

    const move = Match.findAvailablePair(this.board, ROWS, COLS);
    if (!move) {
      Shuffle.ensurePlayable(this.board, ROWS, COLS, 60);
      this.setData({ message: "没有可消除组合，已自动洗牌", noticeType: "" });
    }
    this.draw();
    this.scheduleAutoHint();
  },

  onShuffle() {
    if (this.finished) {
      return;
    }
    this.clearAutoHint();
    this.selected = null;
    Shuffle.ensurePlayable(this.board, ROWS, COLS, 80);
    this.setData({
      score: Math.max(0, this.data.score - 5),
      combo: 0,
      message: "已洗牌",
      noticeType: ""
    });
    this.draw();
    this.scheduleAutoHint();
  },

  onHint() {
    if (this.finished) {
      return;
    }
    this.clearAutoHint();
    const move = Match.findAvailablePair(this.board, ROWS, COLS);
    if (!move) {
      Shuffle.ensurePlayable(this.board, ROWS, COLS, 80);
      this.setData({ message: "已自动洗牌，请再试一次", noticeType: "" });
      this.draw();
      this.scheduleAutoHint();
      return;
    }

    this.hintIds = [move.first.id, move.second.id];
    this.linePath = move.path;
    this.setData({ message: "提示已标出一对可消除麻将", noticeType: "success" });
    this.draw();
    setTimeout(() => {
      this.hintIds = [];
      this.linePath = [];
      this.draw();
      this.scheduleAutoHint();
    }, 1200);
  },

  onRestart() {
    this.clearTimers();
    this.board = Board.createBoard(ROWS, COLS);
    this.selected = null;
    this.linePath = [];
    this.hintIds = [];
    this.particles = [];
    this.finished = false;
    this.setData({
      time: TOTAL_TIME,
      score: 0,
      combo: 0,
      message: "新一局开始，60秒内全部消除",
      noticeType: ""
    });
    this.timer.reset(TOTAL_TIME);
    this.draw();
    this.scheduleAutoHint();
  },

  finishGame(win) {
    this.finished = true;
    this.clearTimers();
    this.selected = null;
    this.linePath = [];
    this.hintIds = [];
    this.setData({
      message: win ? "恭喜过关" : "时间到，点重来再挑战",
      noticeType: win ? "success" : "error"
    });
    this.draw();
  },

  scheduleAutoHint() {
    this.clearAutoHint();
    if (this.finished) {
      return;
    }
    this.autoHintTimer = setTimeout(() => {
      this.onHint();
    }, 8000);
  },

  clearAutoHint() {
    if (this.autoHintTimer) {
      clearTimeout(this.autoHintTimer);
      this.autoHintTimer = null;
    }
  },

  clearTimers() {
    if (this.timer) {
      this.timer.stop();
    }
    this.clearAutoHint();
  },

  playParticles(cells) {
    const colors = ["#ffffff", "#fff176", "#ffdd6e", "#bfffd6"];
    this.particles = [];
    cells.forEach((cell) => {
      for (let i = 0; i < 8; i += 1) {
        this.particles.push({
          row: cell.row,
          col: cell.col,
          x: (Math.random() - 0.5) * 46,
          y: (Math.random() - 0.5) * 56,
          radius: 3 + Math.random() * 4,
          alpha: 1,
          color: colors[i % colors.length]
        });
      }
    });
    this.animateParticles(0);
  },

  animateParticles(frame) {
    if (frame > 9) {
      this.particles = [];
      this.draw();
      return;
    }
    this.particles.forEach((particle) => {
      particle.y -= 3;
      particle.alpha = Math.max(0, particle.alpha - 0.1);
    });
    this.draw();
    setTimeout(() => this.animateParticles(frame + 1), 35);
  },

  draw() {
    if (!this.ctx || !this.board || !this.metrics) {
      return;
    }
    Board.drawBoard(this.ctx, this.board, this.metrics, {
      selected: this.selected,
      hintIds: this.hintIds,
      linePath: this.linePath,
      particles: this.particles,
      errorFlash: this.errorFlash
    });
  }
});
