export default class Vector {
  constructor(public x = 0, public y = 0) { }

  clone() {
    return new Vector(this.x, this.y);
  }
}
