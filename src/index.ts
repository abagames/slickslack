import * as _ from 'lodash';
import Vector from './vector';
import Random from './random';
import * as ui from './ui';

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
  createStage();
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
    _.forEach(getCrates(), c => {
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
        slipCrate(pressingCrate, w);
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
    context.fillRect(
      pressingCrate.x * gridPixelSize, pressingCrate.y * gridPixelSize,
      gridPixelSize, gridPixelSize);
  }
}

const wayVectors = [[1, 0], [0, 1], [-1, 0], [0, -1]];

function slipCrate(c: Vector, w: number) {
  const wv = wayVectors[w];
  grid[c.x][c.y] = 0;
  for (; ;) {
    c.x += wv[0];
    c.y += wv[1];
    if (grid[c.x][c.y] > 0) {
      c.x -= wv[0];
      c.y -= wv[1];
      break;
    }
  }
  grid[c.x][c.y] = 2;
}

function createStage(stage = 100) {
  const difficulty = Math.sqrt(1 + stage * 0.1) - 1;
  let gs = Math.floor(5 + random.get(difficulty) * 10);
  if (gs > 16) {
    gs = 16;
  }
  initGrid(gs);
  const size = new Vector(
    gridSize,
    random.getInt(gridSize * 0.5, gridSize + 1));
  if (random.get() < 0.5) {
    size.swapXy();
  }
  setAroundWalls(size);
  let cc = Math.floor(1 + random.get(difficulty) * 10);
  if (cc > 20) {
    cc = 20;
  }
  setCrates(size, cc);
  let sc = Math.floor(1 + random.get(difficulty) * 20);
  if (sc > 10) {
    sc = 10;
  }
  _.times(cc * sc, () => {
    reverseSlipCrate();
  });
  _.times(Math.floor(size.x * size.y * random.get(0, 0.5)), () => {
    addWall(size);
  });
}

function initGrid(size: number) {
  gridSize = size;
  gridPixelSize = canvasSize.x / gridSize;
  grid = _.times(gridSize, () => _.times(gridSize, () => -2));
  targetGrid = _.times(gridSize, () => _.times(gridSize, () => -2));
}

function setAroundWalls(size: Vector) {
  _.times(size.x, wx => {
    grid[wx][0] = 1;
    grid[wx][size.y - 1] = 1;
    _.times(size.y - 2, y => {
      grid[wx][y + 1] = -1;
    });
  });
  _.times(size.y - 2, y => {
    const wy = y + 1;
    grid[0][wy] = 1;
    grid[size.x - 1][wy] = 1;
    _.times(size.x - 2, x => {
      grid[x + 1][wy] = -1;
    });
  });
}

function setCrates(size: Vector, cc: number) {
  let cx = -1;
  let cy = -1;
  _.times(cc, () => {
    if (cx <= 0 || cx >= size.x - 1 ||
      cy <= 0 || cy >= size.y - 1) {
      cx = random.getInt(1, size.x - 1);
      cy = random.getInt(1, size.y - 1);
    }
    grid[cx][cy] = 2;
    targetGrid[cx][cy] = 3;
    const wv = random.select(wayVectors);
    cx += wv[0];
    cy += wv[1];
  });
}

function reverseSlipCrate() {
  let ocp = random.select(getCrates());
  const wvs = [];
  _.forEach(wayVectors, wv => {
    if (grid[ocp.x - wv[0]][ocp.y - wv[1]] === 2) {
      wvs.push(wv);
    }
  });
  const wv = wvs.length > 0 ? random.select(wvs) : random.select(wayVectors);
  if (grid[ocp.x - wv[0]][ocp.y - wv[1]] === 0) {
    return;
  }
  let cp = ocp.clone();
  let lc = 0;
  for (; ;) {
    cp.x += wv[0];
    cp.y += wv[1];
    if (grid[cp.x][cp.y] > 0) {
      break;
    }
    lc++;
  }
  if (lc <= 0) {
    return;
  }
  if (grid[ocp.x - wv[0]][ocp.y - wv[1]] < 0) {
    grid[ocp.x - wv[0]][ocp.y - wv[1]] = 1;
  }
  lc = random.getInt(1, lc + 1);
  cp = ocp.clone();
  _.times(lc, () => {
    grid[cp.x][cp.y] = 0;
    cp.x += wv[0];
    cp.y += wv[1];
  });
  grid[cp.x][cp.y] = 2;
}

function addWall(size: Vector) {
  const gx = random.getInt(1, size.x - 1);
  const gy = random.getInt(1, size.y - 1);
  let g = grid[gx][gy];
  if (g >= 0) {
    return;
  }
  if (_.some(wayVectors, wv => grid[gx + wv[0]][gy + wv[1]] > 0)) {
    grid[gx][gy] = 1;
  }
}

function getCrates() {
  const poss: Vector[] = [];
  _.times(gridSize, x => _.times(gridSize, y => {
    if (grid[x][y] === 2) {
      poss.push(new Vector(x, y));
    }
  }));
  return poss;
}
