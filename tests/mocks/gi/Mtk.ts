class Rectangle {
  x: number;

  y: number;

  width: number;

  height: number;

  constructor({ x = 0, y = 0, width = 0, height = 0 } = {}) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }
}

export default { Rectangle };
