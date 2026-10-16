(() => {
  "use strict";

  // Make sure chess.js is loaded in index.html
  if (typeof Chess === "undefined") {
    const message = document.getElementById("message");

    if (message) {
      message.textContent =
        "Chess engine not loaded. Check your internet connection.";
    }

    return;
  }

  const chess = new Chess();

  const board = document.getElementById("board");
  const message = document.getElementById("message");
  const turnMessage = document.getElementById("turn-message");
  const history = document.getElementById("move-history");

  if (!board) {
    console.error('Could not find an element with id="board".');
    return;
  }

  const symbols = {
    wk: "♔",
    wq: "♕",
    wr: "♖",
    wb: "♗",
    wn: "♘",
    wp: "♙",
    bk: "♚",
    bq: "♛",
    br: "♜",
    bb: "♝",
    bn: "♞",
    bp: "♟"
  };

  let selectedSquare = null;
  let legalMoves = [];
  let flipped = false;
  let lastMove = null;

  const files = ["a", "b", "c", "d", "e", "f", "g", "h"];

  function squareName(row, col) {
    return files[col] + (8 - row);
  }

  function getGameStatus() {
    if (chess.in_checkmate()) {
      return chess.turn() === "w"
        ? "Checkmate! Black wins."
        : "Checkmate! White wins.";
    }

    if (chess.in_stalemate()) {
      return "Draw by stalemate.";
    }

    if (chess.in_draw()) {
      return "The game is a draw.";
    }

    if (chess.in_check()) {
      return chess.turn() === "w"
        ? "White is in check!"
        : "Black is in check!";
    }

    return chess.turn() === "w"
      ? "White to move."
      : "Black to move.";
  }

  function updateStatus() {
    if (message) {
      message.textContent = getGameStatus();
    }

    if (turnMessage) {
      turnMessage.textContent =
        chess.turn() === "w" ? "White's turn ♔" : "Black's turn ♚";
    }
  }

  function renderHistory() {
    if (!history) return;

    const moves = chess.history();

    if (moves.length === 0) {
      history.innerHTML = "";
      return;
    }

    let html = "";

    for (let i = 0; i < moves.length; i += 2) {
      const number = Math.floor(i / 2) + 1;
      const whiteMove = moves[i];
      const blackMove = moves[i + 1] || "";

      html +=
        `<div>${number}. ${whiteMove} ` +
        `${blackMove}</div>`;
    }

    history.innerHTML = html;
  }

  function renderBoard() {
    board.innerHTML = "";

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const actualRow = flipped ? 7 - row : row;
        const actualCol = flipped ? 7 - col : col;
        const square = squareName(actualRow, actualCol);
        const piece = chess.get(square);

        const button = document.createElement("button");
        button.type = "button";
        button.className =
          "square " +
          ((actualRow + actualCol) % 2 === 0 ? "light" : "dark");

        button.dataset.square = square;
        button.setAttribute(
          "aria-label",
          piece
            ? square + " " + piece.color + " " + piece.type
            : square
        );

        if (
          lastMove &&
          (square === lastMove.from || square === lastMove.to)
        ) {
          button.classList.add("last-move");
        }

        if (square === selectedSquare) {
          button.classList.add("selected");
        }

        if (legalMoves.some(move => move.to === square)) {
          button.classList.add("legal");
        }

        if (piece) {
          const span = document.createElement("span");
          span.className =
            "piece " + (piece.color === "w" ? "white" : "black");
          span.textContent = symbols[piece.color + piece.type];
          button.appendChild(span);
        }

        button.addEventListener("click", () => {
          handleSquareClick(square);
        });

        board.appendChild(button);
      }
    }

    updateStatus();
    renderHistory();
  }

  function clearSelection() {
    selectedSquare = null;
    legalMoves = [];
  }

  function handleSquareClick(square) {
    if (chess.game_over()) return;

    const piece = chess.get(square);

    // Try moving the currently selected piece.
    if (selectedSquare) {
      const possible = legalMoves.filter(move => move.to === square);

      if (possible.length > 0) {
        makeMove(selectedSquare, square);
        return;
      }
    }

    // Select a piece belonging to the current player.
    if (piece && piece.color === chess.turn()) {
      selectedSquare = square;
      legalMoves = chess.moves({
        square: square,
        verbose: true
      });

      renderBoard();
      return;
    }

    clearSelection();
    renderBoard();
  }

  function makeMove(from, to) {
    const piece = chess.get(from);
    let promotion = "q";

    // Promote a pawn to a queen automatically.
    if (
      piece &&
      piece.type === "p" &&
      (to.endsWith("8") || to.endsWith("1"))
    ) {
      promotion = "q";
    }

    const move = chess.move({
      from: from,
      to: to,
      promotion: promotion
    });

    clearSelection();

    if (move) {
      lastMove = {
        from: move.from,
        to: move.to
      };
    }

    renderBoard();
  }

  function undoMove() {
    const move = chess.undo();

    if (!move) return;

    const previous = chess.history({ verbose: true });
    const last = previous[previous.length - 1];

    lastMove = last
      ? { from: last.from, to: last.to }
      : null;

    clearSelection();
    renderBoard();
  }

  function restartGame() {
    chess.reset();
    clearSelection();
    lastMove = null;
    renderBoard();
  }

  function flipBoard() {
    flipped = !flipped;
    renderBoard();
  }

  // Connect buttons if they exist in your HTML.
  const restartButton = document.getElementById("restart");
  const undoButton = document.getElementById("undo");
  const flipButton = document.getElementById("flip");

  if (restartButton) {
    restartButton.addEventListener("click", restartGame);
  }

  if (undoButton) {
    undoButton.addEventListener("click", undoMove);
  }

  if (flipButton) {
    flipButton.addEventListener("click", flipBoard);
  }

  // Initial render
  renderBoard();
})();
