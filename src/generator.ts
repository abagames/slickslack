import * as _ from 'lodash';
import Vector from './vector';
import Random from './random';

export let gridSize: number;
export let grid: number[][];
export let targetGrid: number[][];
const random = new Random();
const wayVectors = [[1, 0], [0, 1], [-1, 0], [0, -1]];

export function createStage(stage) {
  random.setSeed((stage + 1) * 7);
  let isCreated = false;
  for (let i = 0; i < 10; i++) {
    isCreated = tryToCreateStage(stage);
    if (isCreated) {
      break;
    }
  }
  if (!isCreated) {
    random.setSeed(0);
    tryToCreateStage(30);
  }
}

function tryToCreateStage(stage) {
  const difficulty = Math.sqrt(1 + stage * 0.5) - 1 + 0.01;
  let gs = Math.floor(7 + random.get(difficulty) + difficulty);
  if (gs > 32) {
    gs = 32;
  }
  initGrid(gs);
  const size = new Vector(
    gridSize,
    random.getInt(gridSize * 0.5, gridSize + 1));
  if (random.get() < 0.5) {
    size.swapXy();
  }
  setAroundWalls(size);
  let ccr = random.get(difficulty) * 0.1;
  if (ccr > 0.33) {
    ccr = 0.33;
  }
  const cc = Math.floor(gs * gs * ccr) + 1;
  setCrates(size, cc);
  _.times(cc * 3, () => {
    reverseSlipCrate();
  });
  removeEmptyRowsAndColumns(size);
  _.times(Math.floor(size.x * size.y * random.get(0, 0.5)), () => {
    addWall(size);
  });
  slideStage(size);
  _.times(5, () => {
    slipCratesOnTarget();
  });
  return checkIsValidStage();
}

function initGrid(size: number) {
  gridSize = size;
  grid = _.times(gridSize, () => _.times(gridSize, () => -2));
  targetGrid = _.times(gridSize, () => _.times(gridSize, () => -2));
}

function setAroundWalls(size: Vector, isFillingCenter = true) {
  _.times(size.x, wx => {
    grid[wx][0] = 1;
    grid[wx][size.y - 1] = 1;
    if (isFillingCenter) {
      _.times(size.y - 2, y => {
        grid[wx][y + 1] = -1;
      });
    } else {
      targetGrid[wx][0] = -2;
      targetGrid[wx][size.y - 1] = -2;
    }
  });
  _.times(size.y - 2, y => {
    const wy = y + 1;
    grid[0][wy] = 1;
    grid[size.x - 1][wy] = 1;
    if (isFillingCenter) {
      _.times(size.x - 2, x => {
        grid[x + 1][wy] = -1;
      });
    } else {
      targetGrid[0][wy] = -2;
      targetGrid[size.x - 1][wy] = -2;
    }
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
  const lcs: number[] = [];
  for (; ;) {
    cp.x += wv[0];
    cp.y += wv[1];
    if (grid[cp.x][cp.y] > 0) {
      break;
    }
    lc++;
    if (existsAroundCrates(cp)) {
      lcs.push(lc);
    }
  }
  if (lc <= 0) {
    return;
  }
  if (grid[ocp.x - wv[0]][ocp.y - wv[1]] < 0) {
    grid[ocp.x - wv[0]][ocp.y - wv[1]] = 1;
  }
  if (lcs.length > 0) {
    lc = random.select(lcs);
  } else {
    lc = random.getInt(1, lc + 1);
  }
  cp = ocp.clone();
  _.times(lc, () => {
    grid[cp.x][cp.y] = 0;
    cp.x += wv[0];
    cp.y += wv[1];
  });
  grid[cp.x][cp.y] = 2;
}

function existsAroundCrates(p: Vector) {
  return _.some(wayVectors, wv => grid[p.x + wv[0]][p.y + wv[1]] === 2);
}

function removeEmptyRowsAndColumns(size: Vector) {
  let sx = null, ex = null;
  _.times(size.x, x => {
    if (sx == null && !checkEmptyColumn(size, x)) {
      sx = x;
    }
    if (ex == null && !checkEmptyColumn(size, size.x - 1 - x)) {
      ex = size.x - 1 - x;
    }
  });
  let sy = null, ey = null;
  _.times(size.y, y => {
    if (sy == null && !checkEmptyRow(size, y)) {
      sy = y;
    }
    if (ey == null && !checkEmptyRow(size, size.y - 1 - y)) {
      ey = size.y - 1 - y;
    }
  });
  size.x = ex - sx + 1;
  size.y = ey - sy + 1;
  _.times(size.x, x => _.times(size.y, y => {
    grid[x + 1][y + 1] = grid[x + sx][y + sy];
    targetGrid[x + 1][y + 1] = targetGrid[x + sx][y + sy];
  }));
  size.x += 2;
  size.y += 2;
  setAroundWalls(size, false);
  gridSize = Math.max(size.x, size.y);
}

function checkEmptyColumn(size: Vector, x: number) {
  let result = true;
  _.times(size.y, y => {
    const g = grid[x][y];
    const tg = targetGrid[x][y];
    if ((g !== -1 && g !== 1) || tg === 3) {
      result = false;
      return false;
    }
  });
  return result;
}

function checkEmptyRow(size: Vector, y: number) {
  let result = true;
  _.times(size.x, x => {
    const g = grid[x][y];
    const tg = targetGrid[x][y];
    if ((g !== -1 && g !== 1) || tg === 3) {
      result = false;
      return false;
    }
  });
  return result;
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

function slideStage(size: Vector) {
  if (size.x < gridSize) {
    const sx = Math.floor((gridSize - size.x) / 2);
    const ex = sx + size.x - 1;
    slideStageX(sx, ex);
  } else {
    const sy = Math.floor((gridSize - size.y) / 2);
    const ey = sy + size.y - 1;
    slideStageY(sy, ey);
  }
}

function slideStageX(sx: number, ex: number) {
  _.times(gridSize, rx => {
    const x = gridSize - rx - 1;
    _.times(gridSize, y => {
      if (x > ex || x < sx) {
        grid[x][y] = targetGrid[x][y] = -2;
      } else {
        grid[x][y] = grid[x - sx][y];
        targetGrid[x][y] = targetGrid[x - sx][y];
      }
    });
  });
}

function slideStageY(sy: number, ey: number) {
  _.times(gridSize, ry => {
    const y = gridSize - ry - 1;
    _.times(gridSize, x => {
      if (y > ey || y < sy) {
        grid[x][y] = targetGrid[x][y] = -2;
      } else {
        grid[x][y] = grid[x][y - sy];
        targetGrid[x][y] = targetGrid[x][y - sy];
      }
    });
  });
}

function slipCratesOnTarget() {
  _.forEach(getCrates(), cp => {
    if (targetGrid[cp.x][cp.y] !== 3) {
      return;
    }
    const wvs = [];
    _.forEach(wayVectors, wv => {
      if (grid[cp.x - wv[0]][cp.y - wv[1]] > 0) {
        wvs.push(wv);
      }
    });
    if (wvs.length > 0) {
      slipCrateByVector(cp, random.select(wvs));
    }
  });
}

export function slipCrate(c: Vector, w: number) {
  slipCrateByVector(c, wayVectors[w]);
}

function slipCrateByVector(c: Vector, wv: number[]) {
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

function checkIsValidStage() {
  return _.some(getCrates(), cp => targetGrid[cp.x][cp.y] !== 3)
}

export function getCrates() {
  const poss: Vector[] = [];
  _.times(gridSize, x => _.times(gridSize, y => {
    if (grid[x][y] === 2) {
      poss.push(new Vector(x, y));
    }
  }));
  return poss;
}
