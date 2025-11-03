const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 24;
const COLORS = [
    null,
    '#F08080',
    '#ADD8E6',
    '#90EE90',
    '#dddd90ff',
    '#E6E6FA',
    '#a383d6ff',
    '#69c7c7ff',
];

const canvas = document.getElementById('game-board');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('next-piece');
const nextCtx = nextCanvas.getContext('2d');
const scoreElement = document.getElementById('score');
const startButton = document.getElementById('start-button');
const pausedMessage = document.getElementById('paused-message');

ctx.scale(BLOCK_SIZE, BLOCK_SIZE);
nextCtx.scale(BLOCK_SIZE, BLOCK_SIZE);

let board = createBoard();
let piece;
let nextPiece;
let score = 0;
let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let isPaused = true;

function createBoard() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

function createPiece() {
    const rand = Math.floor(Math.random() * 7);
    switch (rand) {
        case 0: return { shape: [[1, 1, 1, 1]], color: COLORS[1], x: 3, y: 0 };
        case 1: return { shape: [[2, 2], [2, 2]], color: COLORS[2], x: 4, y: 0 };
        case 2: return { shape: [[0, 3, 0], [3, 3, 3]], color: COLORS[3], x: 3, y: 0 };
        case 3: return { shape: [[0, 4, 4], [4, 4, 0]], color: COLORS[4], x: 3, y: 0 };
        case 4: return { shape: [[5, 5, 0], [0, 5, 5]], color: COLORS[5], x: 3, y: 0 };
        case 5: return { shape: [[6, 0, 0], [6, 6, 6]], color: COLORS[6], x: 3, y: 0 };
        case 6: return { shape: [[0, 0, 7], [7, 7, 7]], color: COLORS[7], x: 3, y: 0 };
    }
}

function draw() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawMatrix(board, { x: 0, y: 0 }, ctx);
    drawMatrix(piece.shape, piece, ctx);
    drawNextPiece();
}

function drawMatrix(matrix, offset, context) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                const color = COLORS[value];
                const x_pos = x + offset.x;
                const y_pos = y + offset.y;

                context.shadowColor = color;
                context.shadowBlur = 6;

                // Main color
                context.fillStyle = color;
                context.fillRect(x_pos, y_pos, 1, 1);

                // Lighter highlight on top and left
                context.fillStyle = shadeColor(color, 20);
                context.fillRect(x_pos, y_pos, 1, 0.1); // Top
                context.fillRect(x_pos, y_pos, 0.1, 1); // Left

                // Darker shadow on bottom and right
                context.fillStyle = shadeColor(color, -20);
                context.fillRect(x_pos, y_pos + 0.9, 1, 0.1); // Bottom
                context.fillRect(x_pos + 0.9, y_pos, 0.1, 1); // Right

                context.shadowBlur = 0;
            }
        });
    });
}

function shadeColor(color, percent) {
    let R = parseInt(color.substring(1, 3), 16);
    let G = parseInt(color.substring(3, 5), 16);
    let B = parseInt(color.substring(5, 7), 16);

    R = parseInt(R * (100 + percent) / 100);
    G = parseInt(G * (100 + percent) / 100);
    B = parseInt(B * (100 + percent) / 100);

    R = (R < 255) ? R : 255;
    G = (G < 255) ? G : 255;
    B = (B < 255) ? B : 255;

    const RR = ((R.toString(16).length === 1) ? "0" + R.toString(16) : R.toString(16));
    const GG = ((G.toString(16).length === 1) ? "0" + G.toString(16) : G.toString(16));
    const BB = ((B.toString(16).length === 1) ? "0" + B.toString(16) : B.toString(16));

    return "#" + RR + GG + BB;
}

function drawNextPiece() {
    nextCtx.fillStyle = '#000';
    nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
    if (nextPiece) {
        const xOffset = nextPiece.shape[0].length === 2 ? 1.5 : 1;
        const yOffset = nextPiece.shape.length === 2 ? 1 : 0.5;
        drawMatrix(nextPiece.shape, { x: xOffset, y: yOffset }, nextCtx);
    }
}

function update(time = 0) {
    if (isPaused) {
        pausedMessage.classList.remove('hidden');
        requestAnimationFrame(update);
        return;
    }
    pausedMessage.classList.add('hidden');

    const deltaTime = time - lastTime;
    lastTime = time;
    dropCounter += deltaTime;

    if (dropCounter > dropInterval) {
        playerDrop();
    }

    draw();
    requestAnimationFrame(update);
}

function playerDrop() {
    piece.y++;
    if (collide()) {
        piece.y--;
        merge();
        resetPlayer();
        clearLines();
    }
    dropCounter = 0;
}

function collide() {
    for (let y = 0; y < piece.shape.length; y++) {
        for (let x = 0; x < piece.shape[y].length; x++) {
            if (piece.shape[y][x] !== 0 &&
                (board[y + piece.y] && board[y + piece.y][x + piece.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

function merge() {
    piece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                board[y + piece.y][x + piece.x] = value;
            }
        });
    });
}

function resetPlayer() {
    piece = nextPiece;
    nextPiece = createPiece();
    if (collide()) {
        board.forEach(row => row.fill(0));
        score = 0;
        updateScore();
        isPaused = true;
        alert('Game Over');
    }
}

function clearLines() {
    let linesCleared = 0;
    outer: for (let y = board.length - 1; y > 0; y--) {
        for (let x = 0; x < board[y].length; x++) {
            if (board[y][x] === 0) {
                continue outer;
            }
        }

        const row = board.splice(y, 1)[0].fill(0);
        board.unshift(row);
        y++;
        linesCleared++;
    }

    if (linesCleared > 0) {
        score += linesCleared * 10;
        dropInterval = Math.max(200, 1000 - score);
        updateScore();
    }
}

function updateScore() {
    scoreElement.innerText = score;
}

function playerMove(dir) {
    piece.x += dir;
    if (collide()) {
        piece.x -= dir;
    }
}

function playerRotate() {
    const pos = piece.x;
    const originalShape = piece.shape;
    piece.shape = rotate(piece.shape);
    let offset = 1;
    while (collide()) {
        piece.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > piece.shape[0].length + 1) {
            piece.shape = originalShape;
            piece.x = pos;
            return;
        }
    }
}

function rotate(matrix) {
    const newMatrix = [];
    for (let y = 0; y < matrix[0].length; y++) {
        newMatrix[y] = [];
        for (let x = 0; x < matrix.length; x++) {
            newMatrix[y][x] = matrix[matrix.length - 1 - x][y];
        }
    }
    return newMatrix;
}

document.addEventListener('keydown', event => {
    if (event.key === 'p') {
        isPaused = !isPaused;
    }
    if (isPaused) return;
    if (event.key === 'ArrowLeft') {
        playerMove(-1);
    } else if (event.key === 'ArrowRight') {
        playerMove(1);
    } else if (event.key === 'ArrowUp') {
        playerRotate();
    } else if (event.key === 'ArrowDown') {
        playerDrop();
    }
});

startButton.addEventListener('click', () => {
    isPaused = false;
    startGame();
});

function startGame() {
    board = createBoard();
    piece = createPiece();
    nextPiece = createPiece();
    score = 0;
    dropInterval = 1000;
    updateScore();
    update();
}
