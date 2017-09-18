import * as _ from 'lodash';
import Vector from './vector';
import Random from './random';
import * as ui from './ui';

window.onload = init;

let canvas: HTMLCanvasElement;
let context: CanvasRenderingContext2D;
let canvasSize: Vector;
let gridPixelSize: Vector;
let gridSize = new Vector(16, 16);
const grid = _.times(gridSize.x, () => _.times(gridSize.y, () => 0));
const targetGrid = _.times(gridSize.x, () => _.times(gridSize.y, () => 0));
const random = new Random();

function init() {
  canvas = <HTMLCanvasElement>document.getElementById('main');
  canvasSize = new Vector(canvas.width, canvas.height);
  gridPixelSize =
    new Vector(canvasSize.x / gridSize.x, canvasSize.y / gridSize.y);
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
    cp.x /= gridPixelSize.x;
    cp.x -= 0.5;
    cp.y /= gridPixelSize.y;
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

function createStage() {
  _.times(gridSize.x, x => _.times(gridSize.y, y => {
    grid[x][y] = 0;
    targetGrid[x][y] = 0;
  }));
  const size = new Vector(
    random.getInt(gridSize.x * 0.5, gridSize.x + 1),
    random.getInt(gridSize.y * 0.5, gridSize.y + 1));
  const sPos = new Vector(
    random.getInt(gridSize.x - size.x),
    random.getInt(gridSize.y - size.y),
  );
  _.times(size.x, x => {
    const gx = sPos.x + x;
    grid[gx][sPos.y] = 1;
    grid[gx][sPos.y + size.y - 1] = 1;
    _.times(size.y - 2, y => {
      grid[gx][sPos.y + 1 + y] = -1;
    });
  });
  _.times(size.y - 2, y => {
    const gy = sPos.y + 1 + y;
    grid[sPos.x][gy] = 1;
    grid[sPos.x + size.x - 1][gy] = 1;
    _.times(size.x - 2, x => {
      grid[sPos.x + 1 + x][gy] = -1;
    });
  });
  const cc = random.getInt(4, 16);
  let cx = -1;
  let cy = -1;
  _.times(cc, () => {
    if (cx <= sPos.x || cx >= sPos.x + size.x - 1 ||
      cy <= sPos.y || cy >= sPos.y + size.y - 1) {
      cx = random.getInt(sPos.x + 1, sPos.x + size.x - 1);
      cy = random.getInt(sPos.y + 1, sPos.y + size.y - 1);
    }
    grid[cx][cy] = 2;
    targetGrid[cx][cy] = 3;
    const wv = random.select(wayVectors);
    cx += wv[0];
    cy += wv[1];
  });
  _.times(100, () => {
    reverseSlipCrate();
  });
  _.times(gridSize.x, x => _.times(gridSize.y, y => {
    let g = grid[x][y];
    if (g < 0) {
      g = 1;
    }
    grid[x][y] = g;
  }));
}

function reverseSlipCrate() {
  let ocp = random.select(getCrates());
  const wv = random.select(wayVectors);
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

function getCrates() {
  const poss: Vector[] = [];
  _.times(gridSize.x, x => _.times(gridSize.y, y => {
    if (grid[x][y] === 2) {
      poss.push(new Vector(x, y));
    }
  }));
  return poss;
}

const gridColors = ['white', 'red', 'blue', 'yellow', 'green'];

function drawGrid() {
  context.clearRect(0, 0, canvas.width, canvas.height);
  if (pressingCrate) {
    context.fillStyle = 'black';
    context.fillRect(
      pressingCrate.x * gridPixelSize.x, pressingCrate.y * gridPixelSize.y,
      gridPixelSize.x, gridPixelSize.y);
  }
  _.times(gridSize.x, x => _.times(gridSize.y, y => {
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
        x * gridPixelSize.x, y * gridPixelSize.y,
        gridPixelSize.x, gridPixelSize.y);
    }
  }));
  if (pressingCrate != null) {
    context.fillStyle = 'black';
    context.fillRect(
      pressingCrate.x * gridPixelSize.x, pressingCrate.y * gridPixelSize.y,
      gridPixelSize.x, gridPixelSize.y);
  }
}
