const board = document.querySelector(".chessboard");

function createBoard() {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const square = document.createElement("div");
      square.classList.add("square");
      square.classList.add((row + col) % 2 === 0 ? "white" : "black");
      square.dataset.row = row;
      square.dataset.col = col;

      square.addEventListener("click", () => {
        square.classList.toggle("selected");
      });

      board.appendChild(square);
    }
  }
}

document.getElementById("restart-btn").addEventListener("click", () => {
  board.innerHTML = "";
  createBoard();
});

createBoard();
