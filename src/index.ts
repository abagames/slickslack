import * as _ from 'lodash';
import Vector from './vector';
import Random from './random';
import * as ui from './ui';
import * as generator from './generator';

window.onload = init;

let canvas: HTMLCanvasElement;
let context: CanvasRenderingContext2D;
let canvasSize: Vector;
let gridSize: number;
let gridPixelSize: number;
let grid: number[][];
let targetGrid: number[][];
const random = new Random();

function init() {
  canvas = <HTMLCanvasElement>document.getElementById('main');
  canvasSize = new Vector(canvas.width, canvas.height);
  context = canvas.getContext('2d');
  ui.init(canvas, canvasSize);
  generator.createStage(30);
  gridSize = generator.gridSize;
  gridPixelSize = canvasSize.x / gridSize;
  grid = generator.grid;
  targetGrid = generator.targetGrid;
  update();
}

let pressingCrate: Vector;
let pressingPos = new Vector();

function update() {
  requestAnimationFrame(update);
  if (ui.isPressed) {
    ui.resetPressed();
    const cp = ui.cursorPos.clone();
    cp.x /= gridPixelSize;
    cp.x -= 0.5;
    cp.y /= gridPixelSize;
    cp.y -= 0.5;
    let minDist = 2;
    _.forEach(generator.getCrates(), c => {
      const d = cp.dist(c);
      if (d < minDist) {
        pressingPos.set(ui.cursorPos);
        minDist = d;
        pressingCrate = c;
      }
    });
  }
  if (pressingCrate) {
    if (ui.isPressing) {
      const d = ui.cursorPos.dist(pressingPos);
      if (d > 10) {
        const a = pressingPos.getAngle(ui.cursorPos);
        let w = 0;
        if (a <= -Math.PI * 0.75) {
          w = 2;
        } else if (a <= -Math.PI * 0.25) {
          w = 3;
        } else if (a <= Math.PI * 0.25) {
        } else if (a <= Math.PI * 0.75) {
          w = 1;
        } else {
          w = 2;
        }
        generator.slipCrate(pressingCrate, w);
        pressingPos.set(ui.cursorPos);
      }
    } else {
      pressingCrate = null;
    }
  }
  drawGrid();
}

const gridColors = ['white', 'red', 'blue', 'yellow', 'green'];

function drawGrid() {
  context.clearRect(0, 0, canvas.width, canvas.height);
  if (pressingCrate) {
    context.fillStyle = 'black';
    context.fillRect(
      pressingCrate.x * gridPixelSize, pressingCrate.y * gridPixelSize,
      gridPixelSize, gridPixelSize);
  }
  _.times(gridSize, x => _.times(gridSize, y => {
    let g = grid[x][y];
    const tg = targetGrid[x][y];
    if (tg === 3) {
      if (g === 2) {
        g = 4;
      } else {
        g = 3;
      }
    }
    if (g > 0) {
      context.fillStyle = gridColors[g];
      context.fillRect(
        x * gridPixelSize, y * gridPixelSize,
        gridPixelSize, gridPixelSize);
    }
  }));
  if (pressingCrate != null) {
    context.fillStyle = 'black';
    drawRect(
      pressingCrate.x * gridPixelSize, pressingCrate.y * gridPixelSize,
      gridPixelSize, gridPixelSize, gridPixelSize * 0.2);
  }
}

function drawRect
  (x: number, y: number, width: number, height: number, thickness: number) {
  context.fillRect(x, y, width, thickness);
  context.fillRect(x, y + height - thickness, width, thickness);
  context.fillRect(x, y, thickness, height);
  context.fillRect(x + width - thickness, y, thickness, height);
}
