const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const gridSize = 20;                     // Each cell is 20px x 20px
const tileCount = canvas.width / gridSize; // Assumes square canvas

let snake = [{ x: 10, y: 10 }];
let food = { x: 15, y: 15 };
let dx = 0, dy = 0;                      // Current direction
let nextDx = 0, nextDy = 0;              // Buffered direction

let score = 0;
let gameStarted = false;

const moveInterval = 150;              // Time (ms) for each move (grid step)
let lastMoveTime = 0;

// --- Drawing Functions ---

function drawGrid() {
  ctx.strokeStyle = '#222';
  for (let i = 0; i < tileCount; i++) {
    ctx.beginPath();
    ctx.moveTo(i * gridSize, 0);
    ctx.lineTo(i * gridSize, canvas.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i * gridSize);
    ctx.lineTo(canvas.width, i * gridSize);
    ctx.stroke();
  }
}

function drawSnake(progress) {
  for (let i = snake.length - 1; i >= 0; i--) {
    let segment = snake[i];
    let nextSegment = snake[i - 1] || segment; // For head, use its own value
    // Base position in pixels
    let x = segment.x * gridSize;
    let y = segment.y * gridSize;
    
    if (i === 0) { // For the head, interpolate based on progress
      x = (segment.x - dx * (1 - progress)) * gridSize;
      y = (segment.y - dy * (1 - progress)) * gridSize;
    } else {
      // For body segments, interpolate between current and previous segment positions
      let targetX = nextSegment.x * gridSize;
      let targetY = nextSegment.y * gridSize;
      x = x + (targetX - x) * progress;
      y = y + (targetY - y) * progress;
    }
    
    ctx.fillStyle = i === 0 ? '#00ff00' : '#007700';
    ctx.strokeStyle = '#0f0';
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ctx.roundRect(x, y, gridSize, gridSize, gridSize / 4);
    ctx.fill();
    ctx.stroke();
  }
}

function drawFood(time) {
  const pulse = Math.sin(time / 200) * 0.2 + 1;
  ctx.fillStyle = '#f00';
  ctx.beginPath();
  ctx.arc(
    (food.x + 0.5) * gridSize,
    (food.y + 0.5) * gridSize,
    (gridSize / 2) * pulse,
    0,
    Math.PI * 2
  );
  ctx.fill();
}

// --- Game Logic ---

function moveSnake() {
  dx = nextDx;
  dy = nextDy;
  
  const newHead = { x: snake[0].x + dx, y: snake[0].y + dy };
  snake.unshift(newHead);
  
  if (newHead.x === food.x && newHead.y === food.y) {
    score++;
    document.getElementById('score').textContent = score;
    placeFood();
  } else {
    snake.pop();
  }
}

function placeFood() {
  do {
    food.x = Math.floor(Math.random() * tileCount);
    food.y = Math.floor(Math.random() * tileCount);
  } while (snake.some(segment => segment.x === food.x && segment.y === food.y));
}

function checkCollision() {
  const head = snake[0];
  // Check wall collisions
  if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
    return true;
  }
  // Check self-collision: head hits any body segment
  for (let i = 1; i < snake.length; i++) {
    if (head.x === snake[i].x && head.y === snake[i].y) {
      return true;
    }
  }
  return false;
}

function clearCanvas() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function gameLoop(time) {
  if (!gameStarted) return;
  
  const deltaTime = time - lastMoveTime;
  if (deltaTime >= moveInterval) {
    moveSnake();
    if (checkCollision()) {
      gameOver();
      return;
    }
    lastMoveTime = time;
  }
  
  const progress = Math.min(deltaTime / moveInterval, 1);
  
  clearCanvas();
  drawGrid();
  drawFood(time);
  drawSnake(progress);
  
  requestAnimationFrame(gameLoop);
}

function startGame(initialDx, initialDy) {
  // Reset game variables
  snake = [{ x: 10, y: 10 }];
  dx = initialDx;
  dy = initialDy;
  nextDx = initialDx;
  nextDy = initialDy;
  score = 0;
  document.getElementById('score').textContent = score;
  placeFood();
  
  gameStarted = true;
  lastMoveTime = performance.now();
  requestAnimationFrame(gameLoop);
}

function resetGame() {
  gameStarted = false;
  dx = 0; dy = 0;
  nextDx = 0; nextDy = 0;
  snake = [{ x: 10, y: 10 }];
  
  clearCanvas();
  drawGrid();
  drawFood(Date.now());
  drawSnake(1);
  
  ctx.fillStyle = '#fff';
  ctx.font = '20px Arial';
  ctx.fillText('Press an arrow key or swipe to start!', 40, canvas.height / 2);
}

function gameOver() {
  gameStarted = false;
  alert('💀 Game Over! Your score was: ' + score);
  resetGame();
}

// --- Input Handling ---

// Keyboard Controls
document.addEventListener('keydown', e => {
  let newDx = dx;
  let newDy = dy;
  
  switch (e.key) {
    case 'ArrowUp':
    case 'w':
      if (dy === 1) return;
      newDx = 0; newDy = -1;
      break;
    case 'ArrowDown':
    case 's':
      if (dy === -1) return;
      newDx = 0; newDy = 1;
      break;
    case 'ArrowLeft':
    case 'a':
      if (dx === 1) return;
      newDx = -1; newDy = 0;
      break;
    case 'ArrowRight':
    case 'd':
      if (dx === -1) return;
      newDx = 1; newDy = 0;
      break;
    default:
      return;
  }
  
  if (!gameStarted && (newDx !== 0 || newDy !== 0)) {
    startGame(newDx, newDy);
  } else {
    nextDx = newDx;
    nextDy = newDy;
  }
});

// Mobile Swipe Controls
let touchStartX = 0, touchStartY = 0;
canvas.addEventListener('touchstart', e => {
  const touch = e.touches[0];
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
});

canvas.addEventListener('touchend', e => {
  const touch = e.changedTouches[0];
  const deltaX = touch.clientX - touchStartX;
  const deltaY = touch.clientY - touchStartY;
  let newDx = dx;
  let newDy = dy;
  
  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    if (deltaX > 30) {
      newDx = 1; newDy = 0;
    } else if (deltaX < -30) {
      newDx = -1; newDy = 0;
    }
  } else {
    if (deltaY > 30) {
      newDx = 0; newDy = 1;
    } else if (deltaY < -30) {
      newDx = 0; newDy = -1;
    }
  }
  
  if (!gameStarted && (newDx !== 0 || newDy !== 0)) {
    startGame(newDx, newDy);
  } else {
    nextDx = newDx;
    nextDy = newDy;
  }
});

// --- Rounded Rectangle Helper ---
CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  this.beginPath();
  this.moveTo(x + r, y);
  this.arcTo(x + w, y, x + w, y + h, r);
  this.arcTo(x + w, y + h, x, y + h, r);
  this.arcTo(x, y + h, x, y, r);
  this.arcTo(x, y, x + w, y, r);
  this.closePath();
  return this;
};

// Initialize with the reset screen
resetGame();
