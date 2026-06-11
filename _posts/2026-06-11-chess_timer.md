---
toc: false
comments: false
layout: none
title: Chess Clock Multiplayer Epic Awesome Clock Program System 5000
description: Watch out, fucking person
courses: { }
permalink: /chess-clock-5000
hide: true
---


<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Multi-Player Chess Clock</title>

<style>
* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    font-family: system-ui, sans-serif;
}

body {
    background: #111;
    color: white;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
}

header {
    padding: 12px;
    background: #1b1b1b;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.controls {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
}

button,
select,
input {
    font-size: 16px;
}

button {
    border: none;
    border-radius: 10px;
    padding: 12px 16px;
    background: #333;
    color: white;
    cursor: pointer;
}

button:hover {
    background: #444;
}

.players {
    flex: 1;
    display: grid;
    gap: 8px;
    padding: 8px;
}

.player {
    background: #222;
    border-radius: 14px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    border: 3px solid transparent;
    min-height: 130px;
    user-select: none;
}

.player.active {
    border-color: #00d26a;
    background: #173221;
}

.player.eliminated {
    opacity: 0.4;
    border-color: #aa0000;
}

.player-name {
    font-size: 1.1rem;
    font-weight: bold;
    margin-bottom: 10px;
}

.player-time {
    font-size: clamp(2rem, 7vw, 4rem);
    font-weight: bold;
}

.player-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
}

.player-info input {
    width: 100%;
    background: #333;
    border: none;
    color: white;
    border-radius: 8px;
    padding: 8px;
}

.status {
    text-align: center;
    padding: 10px;
    background: #181818;
}

@media (min-width: 600px) {
    .players {
        grid-template-columns: repeat(2, 1fr);
    }
}
</style>
</head>
<body>

<header>

<div class="controls">
    <label>
        Players:
        <select id="playerCount">
            <option>2</option>
            <option>3</option>
            <option>4</option>
            <option>5</option>
            <option>6</option>
            <option>7</option>
            <option selected>8</option>
        </select>
    </label>

    <label>
        Minutes:
        <input id="minutesInput" type="number" value="5" min="1" max="180" style="width:80px">
    </label>

    <button id="newGameBtn">New Game</button>
    <button id="startBtn">Start</button>
    <button id="pauseBtn">Pause</button>
    <button id="resetBtn">Reset</button>
</div>

</header>

<div class="status" id="status">
Ready
</div>

<div class="players" id="players"></div>

<script>

const playersContainer = document.getElementById("players");
const playerCountSelect = document.getElementById("playerCount");
const minutesInput = document.getElementById("minutesInput");
const statusText = document.getElementById("status");

let players = [];
let currentPlayer = 0;
let timer = null;
let running = false;
let initialSeconds = 300;

function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;

    return `${m}:${String(s).padStart(2, "0")}`;
}

function createPlayers() {

    const count = Number(playerCountSelect.value);

    players = [];

    for (let i = 0; i < count; i++) {
        players.push({
            name: `Player ${i + 1}`,
            time: initialSeconds,
            eliminated: false
        });
    }

    currentPlayer = 0;

    renderPlayers();
}

function renderPlayers() {

    const count = players.length;

    if (count <= 2) {
        playersContainer.style.gridTemplateColumns = "1fr";
    } else {
        playersContainer.style.gridTemplateColumns =
            "repeat(auto-fit,minmax(250px,1fr))";
    }

    playersContainer.innerHTML = "";

    players.forEach((player, index) => {

        const card = document.createElement("div");

        card.className = "player";

        if (index === currentPlayer && running && !player.eliminated) {
            card.classList.add("active");
        }

        if (player.eliminated) {
            card.classList.add("eliminated");
        }

        card.innerHTML = `
            <div class="player-info">
                <input
                    value="${player.name}"
                    onchange="renamePlayer(${index}, this.value)"
                >
            </div>

            <div class="player-time">
                ${formatTime(player.time)}
            </div>
        `;

        card.addEventListener("click", () => {
            handlePlayerTap(index);
        });

        playersContainer.appendChild(card);
    });
}

function renamePlayer(index, value) {
    players[index].name = value || `Player ${index + 1}`;
}

function startClock() {

    if (running) return;

    running = true;

    timer = setInterval(tick, 1000);

    statusText.textContent =
        `${players[currentPlayer].name}'s turn`;

    renderPlayers();
}

function pauseClock() {

    running = false;

    clearInterval(timer);

    statusText.textContent = "Paused";

    renderPlayers();
}

function tick() {

    const p = players[currentPlayer];

    if (p.eliminated) {
        nextPlayer();
        return;
    }

    p.time--;

    if (p.time <= 0) {

        p.time = 0;
        p.eliminated = true;

        statusText.textContent =
            `${p.name} eliminated`;

        const alive = players.filter(x => !x.eliminated);

        if (alive.length <= 1) {

            pauseClock();

            const winner = alive[0];

            if (winner) {
                statusText.textContent =
                    `${winner.name} wins`;
            } else {
                statusText.textContent =
                    "No winner";
            }
        }

        nextPlayer();
    }

    renderPlayers();
}

function nextPlayer() {

    let attempts = 0;

    do {

        currentPlayer =
            (currentPlayer + 1) % players.length;

        attempts++;

    } while (
        players[currentPlayer].eliminated &&
        attempts <= players.length
    );

    if (running) {
        statusText.textContent =
            `${players[currentPlayer].name}'s turn`;
    }

    renderPlayers();
}

function handlePlayerTap(index) {

    if (!running) return;

    if (index !== currentPlayer) return;

    nextPlayer();
}

function resetGame() {

    pauseClock();

    players.forEach(player => {
        player.time = initialSeconds;
        player.eliminated = false;
    });

    currentPlayer = 0;

    statusText.textContent = "Reset";

    renderPlayers();
}

document.getElementById("newGameBtn")
.addEventListener("click", () => {

    pauseClock();

    initialSeconds =
        Number(minutesInput.value) * 60;

    createPlayers();

    statusText.textContent =
        "New game created";
});

document.getElementById("startBtn")
.addEventListener("click", startClock);

document.getElementById("pauseBtn")
.addEventListener("click", pauseClock);

document.getElementById("resetBtn")
.addEventListener("click", resetGame);

createPlayers();

</script>

</body>
</html>