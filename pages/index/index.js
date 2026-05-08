const Mahjong = require("../../utils/mahjong");

Page({
  data: {
    game: Mahjong.createGame(),
    leftCount: 0
  },

  onLoad() {
    this.refreshDerived();
  },

  startGame() {
    this.setData({ game: Mahjong.createGame() }, () => {
      this.refreshDerived();
    });
  },

  tapCell(event) {
    const key = event.currentTarget.dataset.key;
    this.updateGame(Mahjong.selectCell(this.data.game, key));
  },

  shuffleBoard() {
    this.updateGame(Mahjong.shuffleBoard(this.data.game));
  },

  nextLevel() {
    this.updateGame(Mahjong.nextLevel(this.data.game));
  },

  updateGame(game, callback) {
    this.setData({ game }, () => {
      this.refreshDerived();
      if (callback) {
        callback();
      }
    });
  },

  refreshDerived() {
    const game = this.data.game;
    this.setData({
      leftCount: game.board.filter((cell) => !cell.empty).length,
      canShuffle: game.status !== "win",
      canNext: game.status === "win",
      hasMove: Mahjong.hasMove(game)
    });
  }
});
