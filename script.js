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
const ball = { x: 0, y: 0, dx: 0, dy: 0, radius: 10, speed: 4, baseSpeed: 4 };
const paddle = { x: 0, y: 0, width: 100, height: 15, speed: 8, dx: 0 };
const bricks = { rows: 5, cols: 7, width: 0, height: 20, padding: 10, offsetTop: 40, offsetLeft: 30, items: [] };
const particles = [];

// --- Game State ---
let gameState = 'init';
let score = 0;
let lives = 3;

// --- Setup ---
function resizeCanvas() {
    const bottomMargin = 90;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - bottomMargin;
}

function init(isRestart = false) {
    resizeCanvas();
    if (!isRestart) gameState = 'init';

    paddle.width = canvas.width / 6;
    paddle.x = (canvas.width - paddle.width) / 2;
    paddle.y = canvas.height - 40;

    resetBall();

    if (!isRestart) {
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
        lives = 3;
    }
    draw();
}

function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = paddle.y - ball.radius - 5;
    ball.dx = 0;
    ball.dy = 0;
    ball.speed = ball.baseSpeed;
}

// --- Drawing ---
function drawBall() {
    ctx.beginPath();
    const gradient = ctx.createRadialGradient(ball.x, ball.y, ball.radius * 0.3, ball.x, ball.y, ball.radius);
    gradient.addColorStop(0, '#fff');
    gradient.addColorStop(1, '#a2d2ff');
    ctx.fillStyle = gradient;
    ctx.shadowColor = '#a2d2ff';
    ctx.shadowBlur = 15;
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
    ctx.shadowBlur = 0; // Reset shadow
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

function drawLives() {
    ctx.font = '20px Arial';
    ctx.fillStyle = '#fff';
    ctx.fillText(`Lives: ${lives}`, canvas.width - 85, 30);
}

function createParticles(x, y, color) {
    for (let i = 0; i < 15; i++) {
        particles.push({
            x: x,
            y: y,
            radius: Math.random() * 3 + 1,
            color: color,
            dx: (Math.random() - 0.5) * 4,
            dy: (Math.random() - 0.5) * 4,
            life: 30
        });
    }
}

function drawParticles() {
    particles.forEach((p, index) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / 30;
        ctx.fill();
        ctx.closePath();
        p.x += p.dx;
        p.y += p.dy;
        p.life--;
        if (p.life <= 0) {
            particles.splice(index, 1);
        }
    });
    ctx.globalAlpha = 1.0;
}

function draw() {
    // Ball trail effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawBall();
    drawPaddle();
    drawBricks();
    drawScore();
    drawLives();
    drawParticles();
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
        ball.speed += 0.1; // Speed up
    }

    // Brick collision
    bricks.items.forEach((column, c) => {
        column.forEach((brick, r) => {
            if (brick.status === 1 && ball.x > brick.x && ball.x < brick.x + bricks.width && ball.y > brick.y && ball.y < brick.y + bricks.height) {
                ball.dy *= -1;
                brick.status = 0;
                score++;
                createParticles(ball.x, ball.y, '#ffd3b6');
                if (score === bricks.rows * bricks.cols) {
                    gameState = 'win';
                    winScreen.style.display = 'flex';
                }
            }
        });
    });

    // Lose a life
    if (ball.y + ball.radius > canvas.height) {
        lives--;
        if (lives > 0) {
            resetBall();
        } else {
            gameState = 'gameover';
            gameOverScreen.style.display = 'flex';
        }
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

window.addEventListener('resize', () => init(true));
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
