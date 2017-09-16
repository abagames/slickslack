window.onload = init;

let canvas: HTMLCanvasElement;
let context: CanvasRenderingContext2D;

function init() {
  canvas = <HTMLCanvasElement>document.getElementById('main');
  context = canvas.getContext('2d');
  context.fillStyle = 'red';
  context.fillRect(10, 20, 30, 40);
}
