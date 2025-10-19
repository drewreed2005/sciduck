---
toc: false
comments: false
layout: none
title: Mother Dearest's Birthday Bonanza Colon - Tic-Tac-toe
description: Play it until you win.
courses: { }
---


<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Smart Tic-Tac-Toe</title>
<style>
  body {
    display: flex;
    flex-direction: column;
    height: 100vh;
    margin: 0;
    background-color: #fafafa;
    align-items: center;
    justify-content: center;
    font-family: 'Segoe UI', sans-serif;
  }

  #game {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
    width: min(80vw, 400px);
    height: min(80vw, 400px);
  }

  .cell {
    background: white;
    border: 2px solid #ccc;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 3em;
    cursor: pointer;
    transition: background 0.2s, transform 0.1s;
    border-radius: 8px;
    aspect-ratio: 1 / 1; /* keeps square shape */
  }

  .cell:hover {
    background: #f2f2f2;
    transform: scale(1.03);
  }

  .cell.taken {
    cursor: default;
    color: #333;
  }

  #message {
    text-align: center;
    margin-top: 1em;
    font-size: 1.2em;
    color: #333;
  }

  #reset-btn {
    margin-top: 0.8em;
    padding: 0.6em 1.4em;
    background: #4b8bf4;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 1em;
    cursor: pointer;
    transition: background 0.2s, transform 0.1s;
    display: none;
  }

  #reset-btn:hover {
    background: #3a77e0;
    transform: scale(1.05);
  }
</style>
</head>
<body>
  <div id="game"></div>
  <div id="message"></div>
  <button id="reset-btn" onclick="startGame()">Play Again</button>

<script>
const gameContainer = document.getElementById("game");
const message = document.getElementById("message");
const resetBtn = document.getElementById("reset-btn");

let board = Array(9).fill(null);
let player = "O"; // human
let ai = "X";     // computer

const winPatterns = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
];

function renderBoard() {
  gameContainer.innerHTML = "";
  board.forEach((val, i) => {
    const cell = document.createElement("div");
    cell.classList.add("cell");
    if (val) {
      cell.textContent = val;
      cell.classList.add("taken");
    } else {
      cell.addEventListener("click", () => playerMove(i));
    }
    gameContainer.appendChild(cell);
  });
}

function checkWinner(b) {
  for (let [a, c, d] of winPatterns) {
    if (b[a] && b[a] === b[c] && b[a] === b[d]) return b[a];
  }
  if (b.every(x => x)) return "draw";
  return null;
}

function playerMove(i) {
  if (board[i] || checkWinner(board)) return;
  board[i] = player;
  renderBoard();

  let result = checkWinner(board);
  if (result) return endGame(result);

  aiMove();
}

function aiMove() {
  if (checkWinner(board)) return;

  // Try to win
  for (let i = 0; i < 9; i++) {
    if (!board[i]) {
      board[i] = ai;
      if (checkWinner(board) === ai) {
        renderBoard();
        return endGame(ai);
      }
      board[i] = null;
    }
  }

  // Block player from winning
  for (let i = 0; i < 9; i++) {
    if (!board[i]) {
      board[i] = player;
      if (checkWinner(board) === player) {
        board[i] = ai;
        renderBoard();
        let result = checkWinner(board);
        if (result) return endGame(result);
        return;
      }
      board[i] = null;
    }
  }

  // Take center if open
  if (!board[4]) {
    board[4] = ai;
    renderBoard();
    let result = checkWinner(board);
    if (result) endGame(result);
    return;
  }

  // Take a corner if available
  for (let i of [0, 2, 6, 8]) {
    if (!board[i]) {
      board[i] = ai;
      renderBoard();
      let result = checkWinner(board);
      if (result) endGame(result);
      return;
    }
  }

  // Otherwise, take a side
  for (let i of [1,3,5,7]) {
    if (!board[i]) {
      board[i] = ai;
      renderBoard();
      let result = checkWinner(board);
      if (result) endGame(result);
      return;
    }
  }
}

function endGame(winner) {
  if (winner === "draw") {
    message.textContent = "It's a draw!";
  } else if (winner === ai) {
    message.textContent = "AI wins!";
  } else {
    message.textContent = "You win!";
  }

  // Disable further moves
  const cells = document.querySelectorAll(".cell");
  cells.forEach(c => c.classList.add("taken"));

  // Show reset button
  resetBtn.style.display = "inline-block";
}

function startGame() {
  board = Array(9).fill(null);
  message.textContent = "";
  resetBtn.style.display = "none";
  renderBoard();

  // AI starts with best move (corner or center)
  let startMoves = [0, 2, 4, 6, 8];
  board[startMoves[Math.floor(Math.random() * startMoves.length)]] = ai;
  renderBoard();
}

startGame();
</script>
</body>