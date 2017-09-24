import * as _ from 'lodash';
import Vector from './vector';

export let cursorPos: Vector;
export let isPressing = false;
export let isPressed = false;
let canvas: HTMLCanvasElement;
let pixelSize: Vector;
let currentTargetPos: Vector;
let prevCursorPos: Vector;
let targetPos: Vector;
let onDownFirst: Function;
let isDownFirst = true;

export function init(
  _canvas: HTMLCanvasElement, _pixelSize: Vector,
  _onDownFirst: Function = null) {
  canvas = _canvas;
  pixelSize = _pixelSize;
  onDownFirst = _onDownFirst;
  document.onmousedown = (e) => {
    handleOnDown(e.pageX, e.pageY);
  };
  document.ontouchstart = (e) => {
    e.preventDefault();
    handleOnDown(e.touches[0].pageX, e.touches[0].pageY);
  };
  document.onmousemove = (e) => {
    onMouseTouchMove(e.pageX, e.pageY);
  };
  document.ontouchmove = (e) => {
    e.preventDefault();
    onMouseTouchMove(e.touches[0].pageX, e.touches[0].pageY);
  };
  document.onmouseup = (e) => {
    onMouseTouchUp(e);
  };
  document.ontouchend = (e) => {
    onMouseTouchUp(e);
  };
  cursorPos = new Vector();
  targetPos = new Vector();
  currentTargetPos = new Vector();
  prevCursorPos = new Vector();
}

function handleOnDown(x: number, y: number) {
  onMouseTouchDown(x, y);
  if (isDownFirst) {
    isDownFirst = false;
    onDownFirst();
  }
}

export function setCurrentTargetPos(_currentTargetPos: Vector) {
  currentTargetPos = _currentTargetPos;
}

export function getTargetPos() {
  return targetPos;
}

export function resetPressed() {
  isPressed = false;
}

function onMouseTouchDown(x, y) {
  calcCursorPos(x, y, cursorPos);
  targetPos.set(currentTargetPos != null ? currentTargetPos : cursorPos);
  prevCursorPos.set(cursorPos);
  isPressing = isPressed = true;
}

function onMouseTouchMove(x, y) {
  calcCursorPos(x, y, cursorPos);
  if (isPressing) {
    prevCursorPos.sub(cursorPos);
    targetPos.sub(prevCursorPos);
  } else {
    targetPos.set(cursorPos);
  }
  prevCursorPos.set(cursorPos);
}

function calcCursorPos(x, y, v) {
  v.set(
    ((x - canvas.offsetLeft) / canvas.clientWidth + 0.5) * pixelSize.x,
    ((y - canvas.offsetTop) / canvas.clientHeight + 0.5) * pixelSize.y
  );
}

function onMouseTouchUp(e) {
  isPressing = false;
}
