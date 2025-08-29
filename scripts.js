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

let selectedSquare = null;
let currentTurn = "white";

function getLegalMoves(piece, row, col) {
  const moves = [];

  const directions = {
    rook:  [[1,0], [-1,0], [0,1], [0,-1]],
    bishop:[[1,1], [1,-1], [-1,1], [-1,-1]],
    queen: [[1,0], [-1,0], [0,1], [0,-1], [1,1], [1,-1], [-1,1], [-1,-1]],
    knight:[[2,1],[2,-1],[-2,1],[-2,-1],[1,2],[1,-2],[-1,2],[-1,-2]],
    king:  [[1,0], [-1,0], [0,1], [0,-1], [1,1], [1,-1], [-1,1], [-1,-1]]
  };

  const inBounds = (r,c) => r>=0 && r<8 && c>=0 && c<8;

  switch(piece.type) {
    case "pawn":
      const dir = piece.color === "white" ? -1 : 1;
      const startRow = piece.color === "white" ? 6 : 1;
      // forward
      if (inBounds(row+dir, col) && !squares[row+dir][col].piece)
        moves.push([row+dir,col]);
      // double move
      if (row===startRow && !squares[row+dir][col].piece && !squares[row+2*dir][col].piece)
        moves.push([row+2*dir,col]);
      // captures
      for (let dc of [-1,1]) {
        if (inBounds(row+dir,col+dc)) {
          let target = squares[row+dir][col+dc].piece;
          if (target && target.color!==piece.color) moves.push([row+dir,col+dc]);
        }
      }
      break;

    case "rook":
    case "bishop":
    case "queen":
      for (let [dr,dc] of directions[piece.type]) {
        let r=row+dr,c=col+dc;
        while (inBounds(r,c)) {
          if (!squares[r][c].piece) moves.push([r,c]);
          else {
            if (squares[r][c].piece.color!==piece.color) moves.push([r,c]);
            break;
          }
          r+=dr; c+=dc;
        }
      }
      break;

    case "knight":
    case "king":
      for (let [dr,dc] of directions[piece.type]) {
        let r=row+dr,c=col+dc;
        if (inBounds(r,c)) {
          let target = squares[r][c].piece;
          if (!target || target.color!==piece.color) moves.push([r,c]);
        }
      }
      break;
  }
  return moves;
}

function clearHighlights() {
  document.querySelectorAll(".highlight").forEach(el=>el.classList.remove("highlight"));
}

function selectSquare(row,col) {
  clearHighlights();
  const cell = squares[row][col];
  if (!cell.piece || cell.piece.color !== currentTurn) {
    selectedSquare = null;
    return;
  }
  selectedSquare = {row,col};
  const moves = getLegalMoves(cell.piece,row,col);
  moves.forEach(([r,c])=> squares[r][c].element.classList.add("highlight"));
}

function movePiece(toRow,toCol) {
  const from = squares[selectedSquare.row][selectedSquare.col];
  const to = squares[toRow][toCol];

  // capture
  if (to.piece) to.element.textContent = "";

  to.piece = from.piece;
  to.element.textContent = from.piece.icon;
  to.element.className = `square ${(toRow+toCol)%2===0?"white":"black"} piece-${to.piece.color}`;
  from.piece = null;
  from.element.textContent = "";
  from.element.className = `square ${(selectedSquare.row+selectedSquare.col)%2===0?"white":"black"}`;

  currentTurn = currentTurn === "white" ? "black" : "white";
  selectedSquare = null;
  clearHighlights();
}

board.addEventListener("click", e=>{
  if (!e.target.classList.contains("square")) return;
  const row = parseInt(e.target.dataset.row);
  const col = parseInt(e.target.dataset.col);
  const cell = squares[row][col];

  if (selectedSquare) {
    const moves = getLegalMoves(squares[selectedSquare.row][selectedSquare.col].piece, selectedSquare.row, selectedSquare.col);
    const isLegal = moves.some(([r,c])=>r===row && c===col);
    if (isLegal) movePiece(row,col);
    else selectSquare(row,col);
  } else {
    selectSquare(row,col);
  }
});
