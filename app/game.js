const Player = require('./player.js');
const Settings = require('./settings.js');
const GameStatus = require('./status.js');

module.exports = class BattleshipGame {
  constructor(id, idPlayer1, idPlayer2) {
    this.id = id;
    this.currentPlayer = Math.floor(Math.random() * 2);
    this.winningPlayer = null;
    this.gameStatus = GameStatus.inProgress;

    this.players = [new Player(idPlayer1), new Player(idPlayer2)];
  }

  getPlayerId(player) {
    return this.players[player].id;
  }

  getWinnerId() {
    if (this.winningPlayer === null) {
      return null;
    }

    return this.players[this.winningPlayer].id;
  }

  getLoserId() {
    if (this.winningPlayer === null) {
      return null;
    }

    let loser = this.winningPlayer === 0
      ? 1
      : 0;
    return this.players[loser].id;
  }

  switchTurn() {
    this.currentPlayer = this.currentPlayer === 0
      ? 1
      : 0;
  }

  abortGame(player) {
    // give win to opponent
    this.gameStatus = GameStatus.gameOver;
    this.winningPlayer = player === 0
      ? 1
      : 0;
  }

  shoot(position) {
    let opponent = this.currentPlayer === 0
        ? 1
        : 0,
      gridIndex = position.y * Settings.gridCols + position.x;

    if (this.players[opponent].shots[gridIndex] === 0 && this.gameStatus === GameStatus.inProgress) {
      // Square has not been shot at yet.
      if (!this.players[opponent].shoot(gridIndex)) {
        // Miss
        this.switchTurn();
      }

      // Check if game over
      if (this.players[opponent].getShipsLeft() <= 0) {
        this.gameStatus = GameStatus.gameOver;
        this.winningPlayer = opponent === 0
          ? 1
          : 0;
      }

      return true;
    }

    return false;
  }
  getGameState(player, gridOwner) {
    return {
      turn: this.currentPlayer === player, // is it this player's turn?
      gridIndex: player === gridOwner
        ? 0
        : 1, // which client grid to update (0 = own, 1 = opponent)
      grid: this.getGrid(gridOwner, player !== gridOwner) // hide unsunk ships if this is not own grid
    }
  }
  getGrid(player, hideShips) {
    return {
      shots: this.players[player].shots,
      ships: hideShips
        ? this.players[player].getSunkenShips()
        : this.players[player].ships
    }
  }
}
