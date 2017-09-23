import * as _ from 'lodash';
import Vector from './vector';
import Random from './random';
import * as generator from './generator';
import * as text from './text';
import * as ui from './ui';

window.onload = init;

let canvas: HTMLCanvasElement;
let context: CanvasRenderingContext2D;
let canvasSize: Vector;
let gridSize: number;
let gridPixelSize: number;
let grid: number[][];
let targetGrid: number[][];
let stage: number;
let stageCompletedTicks = 0;
let completingWay: number;
let stageOffset = new Vector();
const random = new Random();

function init() {
  canvas = <HTMLCanvasElement>document.getElementById('main');
  canvasSize = new Vector(canvas.width, canvas.height);
  context = canvas.getContext('2d');
  ui.init(canvas, canvasSize);
  text.init(context);
  stage = 1;
  createStage();
  update();
}

function createStage() {
  generator.createStage(stage);
  gridSize = generator.gridSize;
  gridPixelSize = canvasSize.x / gridSize;
  grid = generator.grid;
  targetGrid = generator.targetGrid;
  stageCompletedTicks = 0;
  stageOffset.set(0, 0);
}

let pressingCrate: Vector;
let pressingPos = new Vector();
const buttonSize = new Vector(40, 15);
let isButtonPressing = false;

function update() {
  requestAnimationFrame(update);
  if (stageCompletedTicks <= 0) {
    updateUi();
    drawGrid();
    drawResetButton();
  } else {
    updateAfterCompleted();
    drawGrid(stageOffset.x, stageOffset.y);
    if (stageCompletedTicks > 30) {
      stage++;
      createStage();
    }
  }
}

function updateUi() {
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
    if (ui.cursorPos.x > canvasSize.x - buttonSize.x - 20 &&
      ui.cursorPos.y > canvasSize.y - buttonSize.y - 10) {
      isButtonPressing = true;
    }
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
        slipCrate(pressingCrate, w);
        pressingPos.set(ui.cursorPos);
        if (checkStageCompleted()) {
          stageCompletedTicks = 1;
          completingWay = w;
          pressingCrate = null;
        }
      }
    } else {
      pressingCrate = null;
    }
  }
  if (isButtonPressing) {
    if (ui.cursorPos.x < canvasSize.x - buttonSize.x - 20 ||
      ui.cursorPos.y < canvasSize.y - buttonSize.y - 10) {
      isButtonPressing = false;
    } else if (!ui.isPressing) {
      createStage();
      isButtonPressing = false;
    }
  }
}

const afterimageMoveTicks = 10;

function slipCrate(c: Vector, w: number) {
  const mv = generator.slipCrate(pressingCrate, w);
  const pos = mv.pos;
  let thickness = gridPixelSize * 0.15;
  _.times(mv.count, i => {
    pos.x -= mv.wayVector[0];
    pos.y -= mv.wayVector[1];
    const sp = (i + 1) * gridPixelSize / afterimageMoveTicks;
    addAfterimage(
      new Vector(pos.x * gridPixelSize, pos.y * gridPixelSize),
      new Vector(mv.wayVector[0] * sp, mv.wayVector[1] * sp),
      thickness);
    thickness *= 0.8;
    if (thickness < 1) {
      thickness = 1;
    }
  });
}

function checkStageCompleted() {
  return _.every(generator.getCrates(), cp => targetGrid[cp.x][cp.y] === 3);
}

function updateAfterCompleted() {
  const wc = generator.wayVectors[completingWay];
  const sp = stageCompletedTicks * stageCompletedTicks * 0.1;
  stageOffset.x += wc[0] * sp;
  stageOffset.y += wc[1] * sp;
  stageCompletedTicks++;
}

const gridColors = ['white', 'red', 'blue', 'yellow', 'green'];

function drawGrid(ox: number = 0, oy: number = 0) {
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = gridColors[3];
  _.times(gridSize, x => _.times(gridSize, y => {
    if (targetGrid[x][y] === 3) {
      context.fillRect(
        x * gridPixelSize + ox, y * gridPixelSize + oy,
        gridPixelSize, gridPixelSize);
    }
  }));
  updateAfterimages();
  _.times(gridSize, x => _.times(gridSize, y => {
    let g = grid[x][y];
    if (targetGrid[x][y] === 3 && g === 2) {
      g = 4;
    }
    if (g > 0) {
      context.fillStyle = gridColors[g];
      context.fillRect(
        x * gridPixelSize + ox, y * gridPixelSize + oy,
        gridPixelSize, gridPixelSize);
    }
  }));
  if (pressingCrate != null) {
    context.fillStyle = 'black';
    drawRect(
      pressingCrate.x * gridPixelSize, pressingCrate.y * gridPixelSize,
      gridPixelSize, gridPixelSize, gridPixelSize * 0.2);
  }
  text.draw(`STAGE ${stage}/30`, 1, 1, text.Align.left);
}

function drawResetButton() {
  context.fillStyle = isButtonPressing ? 'green' : 'blue';
  context.fillRect
    (canvasSize.x - buttonSize.x, canvasSize.y - buttonSize.y,
    buttonSize.x, buttonSize.y);
  text.draw('RESET',
    canvasSize.x - buttonSize.x / 2, canvasSize.y - buttonSize.y * 0.6,
    null, 'white');
}

function drawRect
  (x: number, y: number, width: number, height: number, thickness: number) {
  context.fillRect(x, y, width, thickness);
  context.fillRect(x, y + height - thickness, width, thickness);
  context.fillRect(x, y, thickness, height);
  context.fillRect(x + width - thickness, y, thickness, height);
}

const afterimages = [];

function addAfterimage(p: Vector, v: Vector, thickness: number) {
  afterimages.push({ p, v, thickness, ticks: afterimageMoveTicks });
}

function updateAfterimages() {
  context.fillStyle = '#88f';
  for (let i = 0; i < afterimages.length;) {
    const a = afterimages[i];
    drawRect(a.p.x, a.p.y, gridPixelSize, gridPixelSize, a.thickness);
    a.p.add(a.v);
    a.ticks--;
    if (a.ticks <= 0) {
      afterimages.splice(i, 1);
    } else {
      i++;
    }
  }
}
