const Ship = require('./ship.js');
const Settings = require('./settings.js');

module.exports = class PLayer {
  constructor(id) {
    this.id = id;
    this.shots = Array(Settings.gridRows * Settings.gridCols);
    this.shipGrid = Array(Settings.gridRows * Settings.gridCols);
    this.ships = [];

    for (let i = 0; i < Settings.gridRows * Settings.gridCols; i++) {
      this.shots[i] = 0;
      this.shipGrid[i] = -1;
    }
    // In case createRandomShips fails call on createShips as a fallback...
    if (!this.createRandomShips()) {
      this.ships = [];
      this.createShips();
    }
  }

  createRandomShips() {
    for (let shipIndex = 0; shipIndex < Settings.ships.length; shipIndex++) {
      let ship = new Ship(Settings.ships[shipIndex]);

      if (!this.placeShipRandom(ship, shipIndex)) {
        return false;
      }

      this.ships.push(ship);
    }

    return true;
  }

  createShips() {
    const x = [1, 3, 5, 8, 8];
    const y = [1, 2, 5, 2, 8];
    const horizontal = [false, true, false, false, true];

    for (let shipIndex = 0; shipIndex < Settings.ships.length; shipIndex++) {
      let ship = new Ship(Settings.ships[shipIndex]);
      ship.horizontal = horizontal[shipIndex];
      ship.x = x[shipIndex];
      ship.y = y[shipIndex];

      // place ship array-index in shipGrid
      let gridIndex = ship.y * Settings.gridCols + ship.x;
      for (let i = 0; i < ship.size; i++) {
        this.shipGrid[gridIndex] = shipIndex;
        gridIndex += ship.horizontal
          ? 1
          : Settings.gridCols;
      }

      this.ships.push(ship);
    }
  }

  checkShipOverlap(ship) {
    let gridIndex = ship.y * Settings.gridCols + ship.x;

    for (let i = 0; i < ship.size; i++) {
      if (this.shipGrid[gridIndex] >= 0) {
        return true;
      }
      gridIndex += ship.horizontal
        ? 1
        : Settings.gridCols;
    }

    return false;
  }

  checkShipAdjacent(ship) {
    const x1 = ship.x - 1,
      y1 = ship.y - 1,
      x2 = ship.horizontal
        ? ship.x + ship.size
        : ship.x + 1,
      y2 = ship.horizontal
        ? ship.y + 1
        : ship.y + ship.size;

    for (let i = x1; i <= x2; i++) {
      if (i < 0 || i > Settings.gridCols - 1)
        continue;
      for (let j = y1; j <= y2; j++) {
        if (j < 0 || j > Settings.gridRows - 1)
          continue;
        if (this.shipGrid[j * Settings.gridCols + i] >= 0) {
          return true;
        }
      }
    }

    return false;
  }

  getSunkenShips() {
    const sunkenShips = [];

    for (let i = 0; i < this.ships.length; i++) {
      if (this.ships[i].hasSunk()) {
        sunkenShips.push(this.ships[i]);
      }
    }

    return sunkenShips;
  }

  getShipsLeft() {
    let shipCount = 0;

    for (let i = 0; i < this.ships.length; i++) {
      if (!this.ships[i].hasSunk()) {
        shipCount++;
      }
    }

    return shipCount;
  }

  placeShipRandom(ship, shipIndex) {
    const max = 25;

    for (let i = 0; i < max; i++) {
      ship.horizontal = Math.random() < 0.5;

      let xMax = ship.horizontal
        ? Settings.gridCols - ship.size + 1
        : Settings.gridCols;
      let yMax = ship.horizontal
        ? Settings.gridRows
        : Settings.gridRows - ship.size + 1;

      ship.x = Math.floor(Math.random() * xMax);
      ship.y = Math.floor(Math.random() * yMax);

      if (!this.checkShipOverlap(ship) && !this.checkShipAdjacent(ship)) {

        let gridIndex = ship.y * Settings.gridCols + ship.x;
        for (let j = 0; j < ship.size; j++) {
          this.shipGrid[gridIndex] = shipIndex;
          gridIndex += ship.horizontal
            ? 1
            : Settings.gridCols;
        }
        return true;
      }
    }

    return false;
  }

  shoot(gridIndex) {
    if (this.shipGrid[gridIndex] >= 0) {
      // That's a hit
      this.ships[this.shipGrid[gridIndex]].hits++;
      this.shots[gridIndex] = 2;
      return true;
    } else {
      // That's a miss
      this.shots[gridIndex] = 1;
      return false;
    }
  }
}
