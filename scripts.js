const board = document.querySelector(".chessboard");
const pieceIcons = {
    white: {
        king: "♔", queen: "♕", rook: "♖", bishop: "♗", knight: "♘", pawn: "♙"
    },
    black: {
        king: "♚", queen: "♛", rook: "♜", bishop: "♝", knight: "♞", pawn: "♟︎"
    }
};

// ==== Piece Classes ====
class Piece {
    constructor(color, type) {
        this.color = color;
        this.type = type;
        this.icon = pieceIcons[color][type];
    }
}

class Pawn extends Piece {
    constructor(color) { super(color, "pawn"); }
}
class Rook extends Piece {
    constructor(color) { super(color, "rook"); }
}
class Knight extends Piece {
    constructor(color) { super(color, "knight"); }
}
class Bishop extends Piece {
    constructor(color) { super(color, "bishop"); }
}
class Queen extends Piece {
    constructor(color) { super(color, "queen"); }
}
class King extends Piece {
    constructor(color) { super(color, "king"); }
}

// ==== Board State ====
let squares = []; // 2D массив для хранения клеток и фигур

function createBoard() {
    board.innerHTML = "";
    squares = [];

    for (let row = 0; row < 8; row++) {
        squares[row] = [];
        for (let col = 0; col < 8; col++) {
            const square = document.createElement("div");
            square.classList.add("square", (row + col) % 2 === 0 ? "white" : "black");
            square.dataset.row = row;
            square.dataset.col = col;

            board.appendChild(square);
            squares[row][col] = { element: square, piece: null };
        }
    }
}

// ==== Initial Setup ====
function placePieces() {
    // clear icons/classes first
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
        squares[r][c].piece = null;
        squares[r][c].element.textContent = "";
        squares[r][c].element.classList.remove("piece-white", "piece-black");
        delete squares[r][c].element.dataset.piece;
    }

    function addPiece(piece, row, col) {
        const cell = squares[row][col];
        cell.piece = piece;
        cell.element.textContent = piece.icon;
        cell.element.dataset.piece = `${piece.color}-${piece.type}`;
        cell.element.classList.remove("piece-white", "piece-black");
        cell.element.classList.add(`piece-${piece.color}`);
    }
    const backRank = [Rook, Knight, Bishop, Queen, King, Bishop, Knight, Rook];

    // black: ranks 8/7 -> rows 0/1
    for (let c = 0; c < 8; c++) {
        addPiece(new backRank[c]("black"), 0, c);
        addPiece(new Pawn("black"), 1, c);
    }
    // white: ranks 1/2 -> rows 7/6
    for (let c = 0; c < 8; c++) {
        addPiece(new backRank[c]("white"), 7, c);
        addPiece(new Pawn("white"), 6, c);
    }
}
// ==== Restart ====
function restartGame() {
    createBoard();
    placePieces();
}

// ==== Init ====
document.getElementById("restart-btn").addEventListener("click", restartGame);
restartGame();
