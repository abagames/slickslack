import * as _ from 'lodash';
import Vector from './vector';
import Random from './random';

window.onload = init;

let canvas: HTMLCanvasElement;
let context: CanvasRenderingContext2D;
let canvasSize: Vector;
let gridPixelSize: Vector;
let gridSize = new Vector(16, 16);
const grid = _.times(gridSize.x, () => _.times(gridSize.y, () => 0));
const random = new Random();

function init() {
  canvas = <HTMLCanvasElement>document.getElementById('main');
  canvasSize = new Vector(canvas.width, canvas.height);
  gridPixelSize =
    new Vector(canvasSize.x / gridSize.x, canvasSize.y / gridSize.y);
  context = canvas.getContext('2d');
  createStage();
  drawGrid();
}

function createStage() {
  const size = new Vector(
    random.getInt(gridSize.x * 0.3, gridSize.x),
    random.getInt(gridSize.y * 0.3, gridSize.y));
  const sPos = new Vector(
    random.getInt(gridSize.x - size.x),
    random.getInt(gridSize.y - size.y),
  );
  _.times(size.x + 1, x => {
    grid[sPos.x + x][sPos.y] = 1;
    grid[sPos.x + x][sPos.y + size.y] = 1;
  });
  _.times(size.y + 1, y => {
    grid[sPos.x][sPos.y + y] = 1;
    grid[sPos.x + size.x][sPos.y + y] = 1;
  });
}

const gridColors = ['white', 'red', 'orange', 'green', 'yellow'];

function drawGrid() {
  context.clearRect(0, 0, canvas.width, canvas.height);
  _.times(gridSize.x, x => _.times(gridSize.y, y => {
    const g = grid[x][y];
    if (g > 0) {
      context.fillStyle = gridColors[g];
      context.fillRect(x * gridPixelSize.x, y * gridPixelSize.y,
        gridPixelSize.x, gridPixelSize.y);
    }
  }));
}
