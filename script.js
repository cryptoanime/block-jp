const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- DOM Elements ---
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const winScreen = document.getElementById('winScreen');
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('gameOverScreen').querySelector('button');
const restartButtonWin = document.getElementById('winScreen').querySelector('button');
const leftButton = document.getElementById('leftButton');
const rightButton = document.getElementById('rightButton');

// --- Game Objects ---
const ball = { x: 0, y: 0, dx: 0, dy: 0, radius: 10, speed: 4 };
const paddle = { x: 0, y: 0, width: 100, height: 15, speed: 8, dx: 0 };
const bricks = { rows: 5, cols: 7, width: 0, height: 20, padding: 10, offsetTop: 40, offsetLeft: 30, items: [] };

// --- Game State ---
let gameState = 'init';
let score = 0;

// --- Setup ---
function resizeCanvas() {
    // The controls have a height of 50px and are 20px from the bottom.
    // So we need to leave about 90px at the bottom for them.
    const bottomMargin = 90;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - bottomMargin;
}

function init() {
    resizeCanvas();
    gameState = 'init';

    paddle.width = canvas.width / 6;
    paddle.x = (canvas.width - paddle.width) / 2;
    // Position paddle lower on the screen to create more space
    paddle.y = canvas.height - 40;

    ball.x = canvas.width / 2;
    // Adjust ball's starting position accordingly
    ball.y = paddle.y - ball.radius - 5;
    ball.dx = 0;
    ball.dy = 0;

    bricks.width = (canvas.width - bricks.offsetLeft * 2 - bricks.padding * (bricks.cols - 1)) / bricks.cols;
    bricks.items = [];
    for (let c = 0; c < bricks.cols; c++) {
        bricks.items[c] = [];
        for (let r = 0; r < bricks.rows; r++) {
            const brickX = (c * (bricks.width + bricks.padding)) + bricks.offsetLeft;
            const brickY = (r * (bricks.height + bricks.padding)) + bricks.offsetTop;
            bricks.items[c][r] = { x: brickX, y: brickY, status: 1 };
        }
    }
    score = 0;
    draw();
}

// --- Drawing ---
function drawBall() {
    ctx.beginPath();
    const gradient = ctx.createRadialGradient(ball.x, ball.y, ball.radius * 0.3, ball.x, ball.y, ball.radius);
    gradient.addColorStop(0, '#fff');
    gradient.addColorStop(1, '#a2d2ff');
    ctx.fillStyle = gradient;
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
}

function drawPaddle() {
    ctx.beginPath();
    const gradient = ctx.createLinearGradient(paddle.x, 0, paddle.x + paddle.width, 0);
    gradient.addColorStop(0, '#ff416c');
    gradient.addColorStop(1, '#ff4b2b');
    ctx.fillStyle = gradient;
    ctx.rect(paddle.x, paddle.y, paddle.width, paddle.height);
    ctx.fill();
    ctx.closePath();
}

function drawBricks() {
    const colors = ['#ff7e5f', '#feb47b', '#ffeda0', '#a8e6cf', '#dcedc1'];
    bricks.items.forEach((column, c) => {
        column.forEach((brick, r) => {
            if (brick.status === 1) {
                ctx.beginPath();
                ctx.rect(brick.x, brick.y, bricks.width, bricks.height);
                ctx.fillStyle = colors[r % colors.length];
                ctx.fill();
                ctx.closePath();
            }
        });
    });
}

function drawScore() {
    ctx.font = '20px Arial';
    ctx.fillStyle = '#fff';
    ctx.fillText(`Score: ${score}`, 20, 30);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBall();
    drawPaddle();
    drawBricks();
    drawScore();
}

// --- Game Logic ---
function update() {
    if (gameState !== 'playing') return;

    // Move paddle
    paddle.x += paddle.dx;
    if (paddle.x < 0) paddle.x = 0;
    if (paddle.x + paddle.width > canvas.width) paddle.x = canvas.width - paddle.width;

    // Move ball
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Wall collision
    if (ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0) ball.dx *= -1;
    if (ball.y - ball.radius < 0) ball.dy *= -1;

    // Paddle collision
    if (ball.y + ball.radius > paddle.y && ball.x > paddle.x && ball.x < paddle.x + paddle.width) {
        ball.dy = -ball.speed;
    }

    // Brick collision
    bricks.items.forEach(column => {
        column.forEach(brick => {
            if (brick.status === 1 && ball.x > brick.x && ball.x < brick.x + bricks.width && ball.y > brick.y && ball.y < brick.y + bricks.height) {
                ball.dy *= -1;
                brick.status = 0;
                score++;
                if (score === bricks.rows * bricks.cols) {
                    gameState = 'win';
                    winScreen.style.display = 'flex';
                }
            }
        });
    });

    // Game over
    if (ball.y + ball.radius > canvas.height) {
        gameState = 'gameover';
        gameOverScreen.style.display = 'flex';
    }

    draw();
    requestAnimationFrame(update);
}

// --- Controls ---
function moveRight() { paddle.dx = paddle.speed; }
function moveLeft() { paddle.dx = -paddle.speed; }
function stopPaddle() { paddle.dx = 0; }

function keyDown(e) {
    if (e.key === 'Right' || e.key === 'ArrowRight') moveRight();
    else if (e.key === 'Left' || e.key === 'ArrowLeft') moveLeft();
}

function keyUp(e) {
    if (e.key === 'Right' || e.key === 'ArrowRight' || e.key === 'Left' || e.key === 'ArrowLeft') stopPaddle();
}

// --- Event Listeners ---
startButton.addEventListener('click', () => {
    gameState = 'playing';
    startScreen.style.display = 'none';
    ball.dx = ball.speed;
    ball.dy = -ball.speed;
    update();
});

[restartButton, restartButtonWin].forEach(button => {
    button.addEventListener('click', () => {
        gameOverScreen.style.display = 'none';
        winScreen.style.display = 'none';
        init();
        startScreen.style.display = 'flex';
    });
});

window.addEventListener('resize', init);
document.addEventListener('keydown', keyDown);
document.addEventListener('keyup', keyUp);

leftButton.addEventListener('mousedown', moveLeft);
leftButton.addEventListener('mouseup', stopPaddle);
leftButton.addEventListener('mouseleave', stopPaddle);
leftButton.addEventListener('touchstart', (e) => { e.preventDefault(); moveLeft(); }, { passive: false });
leftButton.addEventListener('touchend', stopPaddle);

rightButton.addEventListener('mousedown', moveRight);
rightButton.addEventListener('mouseup', stopPaddle);
rightButton.addEventListener('mouseleave', stopPaddle);
rightButton.addEventListener('touchstart', (e) => { e.preventDefault(); moveRight(); }, { passive: false });
rightButton.addEventListener('touchend', stopPaddle);

// --- Initial Load ---
init();
