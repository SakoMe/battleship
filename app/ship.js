// Ship constructor function...

module.exports = class Ship {
  constructor(size) {
    this.size = size;
    this.hits = 0;
  }
  hasSunk() {
    return this.hits >= this.size;
  }
}
