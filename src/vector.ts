export default class Vector {
  x: number;
  y: number;

  constructor(...args) {
    this.set(...args);
  }

  set(x: number | Vector = 0, y = 0) {
    if (x instanceof Vector) {
      this.x = x.x;
      this.y = x.y;
      return;
    }
    this.x = x;
    this.y = y;
  }

  clone() {
    return new Vector(this.x, this.y);
  }

  add(v: Vector) {
    this.x += v.x;
    this.y += v.y;
  }

  sub(v: Vector) {
    this.x -= v.x;
    this.y -= v.y;
  }

  dist(v: Vector) {
    const ox = this.x - v.x;
    const oy = this.y - v.y;
    return Math.sqrt(ox * ox + oy * oy);
  }

  getAngle(v: Vector) {
    const ox = v.x - this.x;
    const oy = v.y - this.y;
    return Math.atan2(oy, ox);
  }
}
