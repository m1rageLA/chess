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
  const backRank = [Rook, Knight, Bishop, Queen, King, Bishop, Knight, Rook];

  // Place black pieces
  for (let col = 0; col < 8; col++) {
    addPiece(new backRank[col]("black"), 0, col);
    addPiece(new Pawn("black"), 1, col);
  }

  // Place white pieces
  for (let col = 0; col < 8; col++) {
    addPiece(new backRank[col]("white"), 7, col);
    addPiece(new Pawn("white"), 6, col);
  }
}

function addPiece(piece, row, col) {
  squares[row][col].piece = piece;
  squares[row][col].element.textContent = piece.icon;
  squares[row][col].element.dataset.piece = `${piece.color}-${piece.type}`;
}

// ==== Restart ====
function restartGame() {
  createBoard();
  placePieces();
}

// ==== Init ====
document.getElementById("restart-btn").addEventListener("click", restartGame);
restartGame();
