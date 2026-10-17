"use strict";

document.addEventListener("DOMContentLoaded", function () {
  const boardElement = document.getElementById("board");
  const messageElement = document.getElementById("message");
  const turnElement = document.getElementById("turn");
  const historyElement = document.getElementById("moveHistory");
  const resetButton = document.getElementById("resetBtn");
  const undoButton = document.getElementById("undoBtn");

  if (!boardElement || !messageElement || !turnElement || !historyElement) {
    console.error("Game HTML elements are missing.");
    return;
  }

  if (typeof Chess === "undefined") {
    messageElement.textContent =
      "Chess library not loaded. Check your internet connection.";
    return;
  }

  const game = new Chess();

  const files = ["a", "b", "c", "d", "e", "f", "g", "h"];

  const symbols = {
    w: {
      k: "♔",
      q: "♕",
      r: "♖",
      b: "♗",
      n: "♘",
      p: "♙"
    },
    b: {
      k: "♚",
      q: "♛",
      r: "♜",
      b: "♝",
      n: "♞",
      p: "♟"
    }
  };

  let selectedSquare = null;
  let legalTargets = [];
  let moveHistory = [];

  function getPieceName(piece) {
    const names = {
      k: "King",
      q: "Queen",
      r: "Rook",
      b: "Bishop",
      n: "Knight",
      p: "Pawn"
    };

    return names[piece.type] || "Piece";
  }

  function renderBoard() {
    boardElement.innerHTML = "";

    const position = game.board();

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const square = document.createElement("button");
        const squareName = files[col] + (8 - row);
        const piece = position[row][col];

        square.type = "button";
        square.className = "square";
        square.dataset.square = squareName;
        square.setAttribute("aria-label", squareName);
        square.setAttribute("role", "gridcell");

        const isLight = (row + col) % 2 === 0;
        square.classList.add(isLight ? "light" : "dark");

        if (piece) {
          square.textContent = symbols[piece.color][piece.type];
          square.classList.add(
            piece.color === "w" ? "white-piece" : "black-piece"
          );
          square.setAttribute(
            "aria-label",
            getPieceName(piece) + " on " + squareName
          );
        }

        if (squareName === selectedSquare) {
          square.classList.add("selected");
        }

        if (legalTargets.includes(squareName)) {
          square.classList.add("legal-target");

          if (piece) {
            square.classList.add("capture-target");
          }
        }

        if (
          game.isCheck() &&
          piece &&
          piece.type === "k" &&
          piece.color === game.turn()
        ) {
          square.classList.add("king-in-check");
        }

        square.addEventListener("click", function () {
          handleSquareClick(squareName);
        });

        boardElement.appendChild(square);
      }
    }
  }

  function showMessage(text) {
    messageElement.textContent = text;
  }

  function updateGameStatus() {
    if (game.isCheckmate()) {
      const winner = game.turn() === "w" ? "BLACK" : "WHITE";
      showMessage("CHECKMATE! " + winner + " WINS!");
    } else if (game.isDraw()) {
      showMessage("DRAW! THE BATTLE IS OVER.");
    } else if (game.isCheck()) {
      showMessage("CHECK! THE KING IS UNDER ATTACK.");
    } else {
      showMessage("Choose a piece to make your move.");
    }

    turnElement.textContent =
      game.turn() === "w" ? "White ♔" : "Black ♚";
  }

  function showHistory() {
    historyElement.innerHTML = "";

    if (moveHistory.length === 0) {
      const empty = document.createElement("p");
      empty.className = "empty-history";
      empty.textContent = "Your moves will appear here...";
      historyElement.appendChild(empty);
      return;
    }

    const list = document.createElement("ol");
    list.className = "history-list";

    for (let i = 0; i < moveHistory.length; i += 2) {
      const item = document.createElement("li");

      const whiteMove = document.createElement("span");
      whiteMove.textContent = moveHistory[i].san;

      item.appendChild(whiteMove);

      if (moveHistory[i + 1]) {
        const blackMove = document.createElement("span");
        blackMove.textContent = "  " + moveHistory[i + 1].san;
        item.appendChild(blackMove);
      }

      list.appendChild(item);
    }

    historyElement.appendChild(list);
  }

  function handleSquareClick(squareName) {
    if (game.isGameOver()) {
      showMessage("Game over! Start a new game to play again.");
      return;
    }

    const piece = game.get(squareName);

    if (selectedSquare && legalTargets.includes(squareName)) {
      makeMove(selectedSquare, squareName);
      return;
    }

    if (piece && piece.color === game.turn()) {
      selectedSquare = squareName;

      legalTargets = game
        .moves({
          square: squareName,
          verbose: true
        })
        .map(function (move) {
          return move.to;
        });

      renderBoard();

      if (legalTargets.length > 0) {
        showMessage(
          getPieceName(piece) + " selected. Choose a highlighted square."
        );
      } else {
        showMessage("This piece has no legal moves.");
      }

      return;
    }

    selectedSquare = null;
    legalTargets = [];

    renderBoard();
    updateGameStatus();
  }

  function makeMove(from, to) {
    const movingPiece = game.get(from);

    let move = game.move({
      from: from,
      to: to,
      promotion: "q"
    });

    if (!move) {
      selectedSquare = null;
      legalTargets = [];
      renderBoard();
      updateGameStatus();
      return;
    }

    moveHistory = game.history({ verbose: true });

    selectedSquare = null;
    legalTargets = [];

    renderBoard();
    showHistory();
    updateGameStatus();

    if (!game.isGameOver()) {
      showMessage(move.san + " — your move.");
    }

    if (game.isCheckmate()) {
      showMessage("CHECKMATE! " + (game.turn() === "w" ? "BLACK" : "WHITE") + " WINS!");
    }
  }

  function resetGame() {
    game.reset();

    selectedSquare = null;
    legalTargets = [];
    moveHistory = [];

    renderBoard();
    showHistory();
    updateGameStatus();

    showMessage("A new battle begins. White moves first.");
  }

  function undoMove() {
    const undone = game.undo();

    if (!undone) {
      showMessage("There are no moves to undo.");
      return;
    }

    game.undo();

    moveHistory = game.history({ verbose: true });
    selectedSquare = null;
    legalTargets = [];

    renderBoard();
    showHistory();
    updateGameStatus();

    showMessage("Last turn undone.");
  }

  if (resetButton) {
    resetButton.addEventListener("click", resetGame);
  }

  if (undoButton) {
    undoButton.addEventListener("click", undoMove);
  }

  boardElement.setAttribute("role", "grid");

  renderBoard();
  showHistory();
  updateGameStatus();

  showMessage("Welcome to THE FORBIDDEN CHECKMATE. White moves first.");
});
