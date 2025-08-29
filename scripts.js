// ===== DOM =====
const board = document.querySelector(".chessboard");
const historyEl = document.getElementById("move-history");
const turnEl = document.getElementById("turn-indicator");
const capW = document.getElementById("cap-white");
const capB = document.getElementById("cap-black");

// ===== PIECES =====
const pieceIcons = {
  white: { king:"♔", queen:"♕", rook:"♖", bishop:"♗", knight:"♘", pawn:"♙" },
  black: { king:"♚", queen:"♛", rook:"♜", bishop:"♝", knight:"♞", pawn:"♟︎" }
};

class Piece {
  constructor(color, type){ this.color=color; this.type=type; this.icon=pieceIcons[color][type]; }
}
class Pawn extends Piece { constructor(color){ super(color,"pawn"); } }
class Rook extends Piece { constructor(color){ super(color,"rook"); } }
class Knight extends Piece { constructor(color){ super(color,"knight"); } }
class Bishop extends Piece { constructor(color){ super(color,"bishop"); } }
class Queen extends Piece { constructor(color){ super(color,"queen"); } }
class King extends Piece { constructor(color){ super(color,"king"); } }

// ===== STATE =====
let squares = [];                 // 8x8 [{element, piece}]
let selectedSquare = null;        // {row,col} | null
let currentTurn = "white";
let moveHistory = [];
let captured = { white: [], black: [] };

// ===== BOARD CREATION =====
function squareColorClass(r,c){ return (r+c)%2===0 ? "white" : "black"; }

function createBoard(){
  board.innerHTML = "";
  squares = [];
  for(let r=0;r<8;r++){
    squares[r] = [];
    for(let c=0;c<8;c++){
      const el = document.createElement("div");
      el.className = `square ${squareColorClass(r,c)}`;
      el.dataset.row = r;
      el.dataset.col = c;
      board.appendChild(el);
      squares[r][c] = { element: el, piece: null };
    }
  }
}

function addPiece(piece, row, col){
  const cell = squares[row][col];
  cell.piece = piece;
  cell.element.textContent = piece.icon;
  cell.element.className = `square ${squareColorClass(row,col)} piece-${piece.color}`;
  cell.element.dataset.piece = `${piece.color}-${piece.type}`;
}

function placePieces(){
  // clear first
  for(let r=0;r<8;r++)for(let c=0;c<8;c++){
    squares[r][c].piece = null;
    const el = squares[r][c].element;
    el.textContent = "";
    el.className = `square ${squareColorClass(r,c)}`;
    delete el.dataset.piece;
  }
  const back = [Rook, Knight, Bishop, Queen, King, Bishop, Knight, Rook];

  // black (rows 0,1)
  for(let c=0;c<8;c++){
    addPiece(new back[c]("black"), 0, c);
    addPiece(new Pawn("black"), 1, c);
  }
  // white (rows 7,6)
  for(let c=0;c<8;c++){
    addPiece(new back[c]("white"), 7, c);
    addPiece(new Pawn("white"), 6, c);
  }
}

// ===== MOVE GENERATION (base, without check safety) =====
const inBounds = (r,c)=> r>=0 && r<8 && c>=0 && c<8;

function getLegalMoves(piece, row, col){
  const moves = [];
  const dirs = {
    rook:  [[1,0],[-1,0],[0,1],[0,-1]],
    bishop:[[1,1],[1,-1],[-1,1],[-1,-1]],
    queen: [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]],
    knight:[[2,1],[2,-1],[-2,1],[-2,-1],[1,2],[1,-2],[-1,2],[-1,-2]],
    king:  [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]
  };

  switch(piece.type){
    case "pawn": {
      const dir = piece.color==="white" ? -1 : 1;
      const startRow = piece.color==="white" ? 6 : 1;

      // forward 1
      if (inBounds(row+dir, col) && !squares[row+dir][col].piece)
        moves.push([row+dir,col]);

      // forward 2 from start
      if (row===startRow && !squares[row+dir][col].piece && inBounds(row+2*dir,col) && !squares[row+2*dir][col].piece)
        moves.push([row+2*dir,col]);

      // captures
      for(const dc of [-1,1]){
        const r=row+dir, c=col+dc;
        if(!inBounds(r,c)) continue;
        const target = squares[r][c].piece;
        if(target && target.color!==piece.color) moves.push([r,c]);
      }
      break;
    }
    case "rook":
    case "bishop":
    case "queen": {
      for(const [dr,dc] of dirs[piece.type]){
        let r=row+dr, c=col+dc;
        while(inBounds(r,c)){
          const target = squares[r][c].piece;
          if(!target) moves.push([r,c]);
          else {
            if(target.color!==piece.color) moves.push([r,c]);
            break;
          }
          r+=dr; c+=dc;
        }
      }
      break;
    }
    case "knight":
    case "king": {
      for(const [dr,dc] of dirs[piece.type]){
        const r=row+dr, c=col+dc;
        if(!inBounds(r,c)) continue;
        const target = squares[r][c].piece;
        if(!target || target.color!==piece.color) moves.push([r,c]);
      }
      break;
    }
  }
  return moves;
}

// ===== CHECK / CHECKMATE SUPPORT =====
function getKingPosition(color){
  for(let r=0;r<8;r++)for(let c=0;c<8;c++){
    const p=squares[r][c].piece;
    if(p && p.type==="king" && p.color===color) return [r,c];
  }
  return null;
}

function getAttackMoves(piece,row,col){
  // like getLegalMoves but: pawns attack diagonally only; sliders go until blocked and include block square
  const moves = [];
  if(piece.type==="pawn"){
    const dir = piece.color==="white" ? -1 : 1;
    for(const dc of [-1,1]){
      const r=row+dir, c=col+dc;
      if(inBounds(r,c)) moves.push([r,c]);
    }
    return moves;
  }
  if(piece.type==="knight" || piece.type==="king"){
    const dirs = piece.type==="knight"
      ? [[2,1],[2,-1],[-2,1],[-2,-1],[1,2],[1,-2],[-1,2],[-1,-2]]
      : [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
    for(const [dr,dc] of dirs){
      const r=row+dr, c=col+dc;
      if(inBounds(r,c)) moves.push([r,c]);
    }
    return moves;
  }
  const dirs = piece.type==="rook" ? [[1,0],[-1,0],[0,1],[0,-1]]
             : piece.type==="bishop" ? [[1,1],[1,-1],[-1,1],[-1,-1]]
             : [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
  for(const [dr,dc] of dirs){
    let r=row+dr, c=col+dc;
    while(inBounds(r,c)){
      moves.push([r,c]);
      if(squares[r][c].piece) break;
      r+=dr; c+=dc;
    }
  }
  return moves;
}

function isSquareAttacked(row,col,byColor){
  for(let r=0;r<8;r++)for(let c=0;c<8;c++){
    const p = squares[r][c].piece;
    if(!p || p.color!==byColor) continue;
    const atk = getAttackMoves(p,r,c);
    if(atk.some(([rr,cc])=>rr===row && cc===col)) return true;
  }
  return false;
}

function isInCheck(color){
  const kp = getKingPosition(color);
  if(!kp) return false;
  return isSquareAttacked(kp[0], kp[1], color==="white"?"black":"white");
}

function simulateMove(fr,fc,tr,tc, cb){
  const from = squares[fr][fc];
  const to = squares[tr][tc];
  const saveFrom = from.piece;
  const saveTo = to.piece;
  to.piece = from.piece;
  from.piece = null;
  const res = cb();
  from.piece = saveFrom;
  to.piece = saveTo;
  return res;
}

function isInCheckAfter(color,fr,fc,tr,tc){
  return simulateMove(fr,fc,tr,tc, ()=> isInCheck(color));
}

function filterMovesSafe(piece,row,col,moves){
  return moves.filter(([r,c])=> !isInCheckAfter(piece.color,row,col,r,c));
}

function getLegalMovesSafe(piece,row,col){
  return filterMovesSafe(piece,row,col, getLegalMoves(piece,row,col));
}

// ===== UI HELPERS =====
function clearHighlights(){
  document.querySelectorAll(".highlight").forEach(el=>el.classList.remove("highlight"));
  document.querySelectorAll(".check").forEach(el=>el.classList.remove("check"));
}
function updateTurnUI(){
  if (turnEl) turnEl.textContent = `${currentTurn[0].toUpperCase()+currentTurn.slice(1)} to move`;
  if (isInCheck(currentTurn)){
    const [kr,kc] = getKingPosition(currentTurn);
    squares[kr][kc].element.classList.add("check");
  }
}
function pushHistory(from,to,piece,capturedPiece){
  const file = c=> String.fromCharCode(97+c);
  const rank = r=> 8-r;
  const move = `${piece.icon} ${file(from.col)}${rank(from.row)}→${file(to.col)}${rank(to.row)}${capturedPiece?' x':''}`;
  moveHistory.push(move);
  if(historyEl){
    const li = document.createElement("li");
    li.textContent = move;
    historyEl.appendChild(li);
  }
}
function updateCapturedUI(){
  if(capW) capW.textContent = captured.white.join(" ");
  if(capB) capB.textContent = captured.black.join(" ");
}

// ===== SELECT / MOVE =====
function selectSquare(row,col){
  clearHighlights();
  const cell = squares[row][col];
  if(!cell.piece || cell.piece.color!==currentTurn){ selectedSquare=null; return; }
  selectedSquare = {row,col};
  getLegalMovesSafe(cell.piece,row,col).forEach(([r,c])=>{
    squares[r][c].element.classList.add("highlight");
  });
}

function movePiece(toRow,toCol){
  const from = squares[selectedSquare.row][selectedSquare.col];
  const to = squares[toRow][toCol];
  const capturedPiece = to.piece ? to.piece.icon : null;

  // capture list
  if (to.piece) {
    captured[to.piece.color==="white" ? "black" : "white"].push(to.piece.icon);
  }

  // move DOM/state
  to.piece = from.piece;
  to.element.textContent = to.piece.icon;
  to.element.className = `square ${squareColorClass(toRow,toCol)} piece-${to.piece.color}`;
  from.piece = null;
  from.element.textContent = "";
  from.element.className = `square ${squareColorClass(selectedSquare.row,selectedSquare.col)}`;

  pushHistory({row:selectedSquare.row,col:selectedSquare.col},{row:toRow,col:toCol},to.piece,capturedPiece);
  updateCapturedUI();

  currentTurn = currentTurn==="white" ? "black" : "white";
  selectedSquare = null;
  clearHighlights();
  updateTurnUI();

  if (isCheckmate(currentTurn)) {
    setTimeout(()=>alert(`${currentTurn==="white"?"Black":"White"} wins by checkmate!`), 10);
  } else if (isStalemate(currentTurn)) {
    setTimeout(()=>alert(`Stalemate! Draw.`), 10);
  }
}

function isCheckmate(color){
  if(!isInCheck(color)) return false;
  for(let r=0;r<8;r++)for(let c=0;c<8;c++){
    const p=squares[r][c].piece;
    if(!p || p.color!==color) continue;
    if(getLegalMovesSafe(p,r,c).length>0) return false;
  }
  return true;
}
function isStalemate(color){
  if(isInCheck(color)) return false;
  for(let r=0;r<8;r++)for(let c=0;c<8;c++){
    const p=squares[r][c].piece;
    if(!p || p.color!==color) continue;
    if(getLegalMovesSafe(p,r,c).length>0) return false;
  }
  return true;
}

// ===== DRAG & DROP =====
function makeDraggable(){
  for(let r=0;r<8;r++)for(let c=0;c<8;c++){
    const el = squares[r][c].element;
    el.draggable = !!squares[r][c].piece;
    el.ondragstart = (e)=>{
      const cell = squares[r][c];
      if(!cell.piece || cell.piece.color!==currentTurn){ e.preventDefault(); return; }
      selectedSquare = {row:r,col:c};
      e.dataTransfer.setData("text/plain", JSON.stringify(selectedSquare));
      clearHighlights();
      getLegalMovesSafe(cell.piece,r,c).forEach(([rr,cc])=>{
        squares[rr][cc].element.classList.add("highlight");
      });
    };
    el.ondragover = (e)=> e.preventDefault();
    el.ondrop = (e)=>{
      e.preventDefault();
      const data = e.dataTransfer.getData("text/plain");
      if(!data) return;
      const {row:fr,col:fc} = JSON.parse(data);
      const legal = getLegalMovesSafe(squares[fr][fc].piece,fr,fc)
        .some(([rr,cc])=> rr===r && cc===c);
      if(legal){ selectedSquare = {row:fr,col:fc}; movePiece(r,c); makeDraggable(); }
      else { clearHighlights(); selectedSquare=null; }
    };
  }
}

// ===== EVENTS =====
board.addEventListener("click", e=>{
  if (!e.target.classList.contains("square")) return;
  const row = parseInt(e.target.dataset.row,10);
  const col = parseInt(e.target.dataset.col,10);
  if (Number.isNaN(row) || Number.isNaN(col)) return;

  if (selectedSquare){
    const piece = squares[selectedSquare.row][selectedSquare.col].piece;
    const legal = getLegalMovesSafe(piece, selectedSquare.row, selectedSquare.col)
      .some(([r,c])=> r===row && c===col);
    if (legal){ movePiece(row,col); makeDraggable(); }
    else selectSquare(row,col);
  } else {
    selectSquare(row,col);
  }
});

document.getElementById("restart-btn").addEventListener("click", restartGame);

// ===== RESTART / INIT =====
function restartGame(){
  moveHistory = [];
  captured = {white:[], black:[]};
  if(historyEl) historyEl.innerHTML = "";
  if(capW) capW.textContent = "";
  if(capB) capB.textContent = "";
  currentTurn = "white";
  createBoard();
  placePieces();
  clearHighlights();
  updateTurnUI();
  makeDraggable();
}

restartGame();
