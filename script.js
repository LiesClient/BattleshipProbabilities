const canvas = document.getElementById("display");
const piece = document.getElementById("piece");
const hitlist = document.getElementById("hitlist");
const ctx = canvas.getContext("2d");
const pctx = piece.getContext("2d");

const gridWidth = 10;
const gridHeight = 10;
const pieceWidth = 5;
const pieceHeight = 5;

canvas.width = gridWidth;
canvas.height = gridHeight;
piece.width = pieceWidth;
piece.height = pieceHeight;

var width = window.innerWidth, height = window.innerHeight;
var cPos = { x: 0.15 * width, y: (height - width * 0.5) / 2 };
var pPos = { x: 0.70 * width, y: 0.10 * height };

var updated = true;

var pieceGrid = new Array(pieceWidth * pieceHeight).fill(0);
var pieceRots = [];
var colors = [
  "probability arr lookup", // 0 = not shot
  "rgb(248, 240, 227)", // 1 = miss
  "rgb(255, 102, 102)", // 2 = hit not sink
  "rgb(102, 255, 102)", // 3 = hit and sunk
  "rgb(148, 140, 127)"  // 4 = cleared (if spacing = true)
]

var spacing = true;
var grid = new Array(gridWidth * gridHeight).fill(0);
var probs = new Array(gridWidth * gridHeight).fill(0);
// each index is a number from 0 to 1
// greater the number, higher chance there is a boat there
// 1 being a guaranteed chance

loop();

function loop() {
  if(!updated) return requestAnimationFrame(loop);
  ctx.clearRect(0, 0, gridWidth, gridHeight);
  pctx.clearRect(0, 0, pieceWidth, pieceHeight);
  pctx.fillStyle = "rgba(108, 108, 108, 0.75)";

  for (x = 0; x < pieceWidth; x++) {
    for (y = 0; y < pieceHeight; y++) {
      if (pieceGrid[ix(x, y, true)]) pctx.fillRect(x, y, 1, 1);
    }
  }

  for (x = 0; x < gridWidth; x++) {
    for (y = 0; y < gridHeight; y++) {
      if (grid[ix(x, y)] == 0) ctx.fillStyle = `rgba(51, 51, 255, ${probs[ix(x, y)]})`;
      else ctx.fillStyle = colors[grid[ix(x, y)]];
      ctx.fillRect(x, y, 1, 1);
    }
  }

  var probArr = [];
  for (x = 0; x < gridWidth; x++) {
    for (y = 0; y < gridHeight; y++) {
      var col = String.fromCharCode(97 + x);
      var loc = col + (y + 1);
      probArr.push({ loc, val: probs[ix(x, y)] });
    }
  }

  probArr.sort((a, b) => {
    return b.val - a.val;
  });

  hitlist.textContent = "Best Shots: \n";

  probArr.forEach(x => {
    hitlist.textContent += `${x.loc} - ${Math.round(x.val * 100)}%\n`;
  });

  updated = false;

  requestAnimationFrame(loop);
}

function calculateProbs(piece, arr) {
  for (x = -5; x <= 15; x++) {
    for (y = -5; y <= 15; y++) {
      var valid = true;

      for (px = 0; px < 5 && valid; px++) {
        for (py = 0; py < 5 && valid; py++) {
          var i = ix(x + px, y + py);
          var pi = ix(px, py, true);
          if (piece[pi] == 0) continue;
          if (!inGrd(x + px, y + py)) { valid = false; continue; }

          if (grid[i] != 0 && grid[i] != 2) valid = false;
        }
      }

      if (valid) for (px = 0; px < 5; px++) {
        for (py = 0; py < 5; py++) {
          var i = ix(x + px, y + py);
          if (!inGrd(x + px, y + py)) continue; 
          if (piece[ix(px, py, true)] == 1) arr[i]++;
        }
      }
    }
  }

  return arr;
}

function calculateAllProbs() {
  var arr = new Array(gridWidth * gridHeight).fill(0);
  calculateProbs(pieceRots[0], arr);
  calculateProbs(pieceRots[1], arr);
  calculateProbs(pieceRots[2], arr);
  calculateProbs(pieceRots[3], arr);
  probs = flattenArr(arr);
}

function flattenArr(arr) {
  var n = 1;

  for (i = 0; i < gridWidth * gridHeight; i++)
    if (arr[i] > n) n = arr[i];

  for (i = 0; i < gridWidth * gridHeight; i++)
    arr[i] /= n;

  return arr;
}

function generateRotations(piece) {
  var rotations = [];
  var p = copy(piece);

  rotations.push(p);
  p = copy(rotate(p));
  rotations.push(p);
  p = copy(rotate(p));
  rotations.push(p);
  p = copy(rotate(p));
  rotations.push(p);

  return rotations;
}

function eq(a1, a2) {
  return JSON.stringify(a1) == JSON.stringify(a2);
}

function alignPiece(piece) {
  var pcopy = copy(piece);
  var [up, left] = calcOffset(pcopy);

  for (x = left; x < pieceWidth; x++) {
    for (y = up; y < pieceHeight; y++) {
      pcopy[ix(x, y, true)] == piece[ix(x - left, y - up, true)];
    }
  }

  return pcopy;
}

function calcOffset(piece){
  var up = 0; 
  var left = 0;

  return [up, left];
}

function rotate(arr) {
  var cArr = copy(arr);
  var rArr = new Array(pieceWidth * pieceHeight).fill(0);

  for (x = 0; x < pieceWidth * pieceHeight; x++) {
    for (y = 0; y < pieceWidth * pieceHeight; y++) {
      rArr[ix(x, y, true)] = cArr[rix(x, y)];
    }
  }

  return rArr;
}

function copy(v) {
  return JSON.parse(JSON.stringify(v));
}

function dist(p1, p2) {
  var d1 = p2[0] - p1[0];
  var d2 = p2[1] - p1[1];
  return Math.sqrt(d1 * d1 + d2 * d2);
}

function inGrid(i) {
  return (i >= 0) && (i < gridWidth * gridHeight);
}

function inGrd(x, y){
  return (x >= 0) && (y >= 0) && (x < gridWidth) && (y < gridHeight);
}

function click(p){
  var i = ix(p.x, p.y);
  var val = grid[i];
  
  if(val == 4) return;

  if(spacing){
    if(val == 1){
      for(x = -1; x <= 1; x++){
        for(y = -1; y <= 1; y++){
          if(p.y + y < 0 || p.y + y > gridHeight - 1) continue;
          if(Math.abs(x) + Math.abs(y) != 2) continue;
          if(!inGrid(ix(p.x + x, p.y + y))) continue;
          grid[ix(p.x + x, p.y + y)] = 4;
        }
      }
    }
    
    if(val == 2){
      for(x = -1; x <= 1; x++){
        for(y = -1; y <= 1; y++){
          if(x == 0 && y == 0) continue;
          if(p.y + y < 0 || p.y + y > gridHeight - 1) continue;
          if(!inGrid(ix(p.x + x, p.y + y))) continue;
          grid[ix(p.x + x, p.y + y)] = 4;
        }
      }
    }
  
    if(val == 3){
      for(x = -1; x <= 1; x++){
        for(y = -1; y <= 1; y++){
          if(x == 0 && y == 0) continue;
          if(p.y + y < 0 || p.y + y > gridHeight - 1) continue;
          if(!inGrid(ix(p.x + x, p.y + y))) continue;
          grid[ix(p.x + x, p.y + y)] = 0;
        }
      }
    }
  }
  
  grid[i]++;
  grid[i] = grid[i] % 4;
}

canvas.addEventListener("click", e => {
  var p = { x: Math.floor((e.x - cPos.x) / canvas.clientWidth * gridWidth), y: Math.floor((e.y - cPos.y) / canvas.clientHeight * gridHeight) };
  if(spacing) click(p);
  else {
  var i = ix(p.x, p.y);
    grid[i]++;
    grid[i] = grid[i] % 4;
  }
  calculateAllProbs();
}, false);

piece.addEventListener("click", e => {
  var p = { x: Math.floor((e.x - pPos.x) / piece.clientWidth * pieceWidth), y: Math.floor((e.y - pPos.y) / piece.clientHeight * pieceHeight) };
  pieceGrid[ix(p.x, p.y, true)] = (pieceGrid[ix(p.x, p.y, true)]) ? 0 : 1;
  pieceRots = generateRotations(pieceGrid);
  calculateAllProbs();
}, false);

document.addEventListener("click", e => updated = true);

function ix(x, y, pgrid) {
  if (pgrid) return y + (x * pieceHeight);
  return y + (x * gridHeight);
}

function rix(x, y) {
  var vec = { x: 2 - x, y: 2 - y };
  var rotVec = { x: 2 + vec.y, y: 2 + vec.x * -1 };
  return rotVec.y + (rotVec.x * pieceHeight);
}
