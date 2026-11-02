const $ = (id) => document.getElementById(id);

const games = [
    {id:"whack", name:"Whack-a-Mole", emoji:"🐹", category:"arcade", tint:"#ffe2a8", desc:"Tap the cheeky mole before it disappears."},
    {id:"memory", name:"Memory Match", emoji:"🃏", category:"brain", tint:"#e4ddff", desc:"Flip cards and find all matching pairs."},
    {id:"snake", name:"Snake Game", emoji:"🐍", category:"arcade", tint:"#d7f7e8", desc:"Guide your snake and collect the treats."},
    {id:"bubble", name:"Bubble Shooter", emoji:"🫧", category:"arcade", tint:"#d9efff", desc:"Pop as many colourful bubbles as you can."},
    {id:"rps", name:"Rock Paper Scissors", emoji:"✊", category:"arcade", tint:"#ffdce8", desc:"Challenge the computer in a classic battle."},
    {id:"wheel", name:"Spin the Wheel", emoji:"🎡", category:"arcade", tint:"#fff0bd", desc:"Spin for a random fun challenge."},
    {id:"blocks", name:"Block Puzzle", emoji:"🧩", category:"puzzle", tint:"#e7ddff", desc:"Fill the board and complete rows."},
    {id:"maze", name:"Maze Escape", emoji:"🌀", category:"puzzle", tint:"#d9f4ed", desc:"Find the exit through a tricky maze."},
    {id:"number", name:"Number Guessing", emoji:"🔢", category:"brain", tint:"#ffe5cb", desc:"Use the clues to find the secret number."},
    {id:"typing", name:"Typing Speed", emoji:"⌨️", category:"challenge", tint:"#dceaff", desc:"Type the words before time runs out."},
    {id:"simon", name:"Simon Says", emoji:"🎨", category:"brain", tint:"#ffdce8", desc:"Remember the colour sequence."},
    {id:"spot", name:"Spot the Difference", emoji:"👀", category:"brain", tint:"#fff0bd", desc:"Find the odd symbol in the crowd."},
    {id:"connect", name:"Connect the Dots", emoji:"🔗", category:"puzzle", tint:"#d9f4ed", desc:"Connect the start to the finish."},
    {id:"word", name:"Word Search", emoji:"🔤", category:"brain", tint:"#e4ddff", desc:"Find the hidden words in the letter grid."},
    {id:"reaction", name:"Reaction Time", emoji:"⚡", category:"challenge", tint:"#ffe2a8", desc:"Test how quickly you can react."},
    {id:"catch", name:"Catch the Falling Objects", emoji:"🧺", category:"arcade", tint:"#d7f7e8", desc:"Catch the goodies and dodge the bombs."}
];

let activeGame = null;
let level = "easy";
let score = 0;
let timer = null;
let interval = null;
let cleanup = null;
let gameState = {};

const durations = {
    easy: 30,
    medium: 25,
    hard: 20
};

const levelIndex = () => ({
    easy: 0,
    medium: 1,
    hard: 2
}[level]);

// DISPLAY GAMES

function renderGames(filter = "all", search = "") {
    const grid = $("gameGrid");
    grid.innerHTML = "";

    const list = games.filter(g =>
        (filter === "all" || g.category === filter) &&
        (`${g.name} ${g.desc}`.toLowerCase().includes(search.toLowerCase()))
    );

    $("visibleCount").textContent = list.length;

    if (!list.length) {
        grid.innerHTML = '<div class="empty-state">No games found. Try another search! ✨</div>';
        return;
    }

    list.forEach(g => {
        const card = document.createElement("article");
        card.className = "game-card";
        card.style.setProperty("--card-tint", g.tint);

        card.innerHTML = `
            <div class="game-emoji">${g.emoji}</div>
            <h3>${g.name}</h3>
            <p>${g.desc}</p>
            <button type="button">Play game <span>→</span></button>
        `;

        card.querySelector("button").addEventListener("click", () => openGame(g.id));
        grid.appendChild(card);
    });
}

renderGames();

$("year").textContent = new Date().getFullYear();

$("gameSearch").addEventListener("input", e => {
    renderGames(
        document.querySelector(".filter.active").dataset.filter,
        e.target.value
    );
});

$("categoryFilters").addEventListener("click", e => {
    const b = e.target.closest("button[data-filter]");
    if (!b) return;

    document.querySelectorAll(".filter").forEach(x => {
        x.classList.toggle("active", x === b);
    });

    renderGames(b.dataset.filter, $("gameSearch").value);
});

// MOBILE MENU

$("menuToggle").onclick = () => {
    $("mainNav").classList.toggle("show");
};

document.querySelectorAll("#mainNav a").forEach(a => {
    a.onclick = () => $("mainNav").classList.remove("show");
});

// GAME SYSTEM

function setMessage(s) {
    $("gameMessage").textContent = s;
}

function setScore(n) {
    score = n;
    $("currentScore").textContent = n;
}

function setTimerText(s) {
    $("timerDisplay").textContent = s == null ? "Time: --" : `Time: ${s}s`;
}

function stopLoops() {
    clearInterval(timer);
    clearInterval(interval);

    timer = null;
    interval = null;

    if (cleanup) {
        cleanup();
        cleanup = null;
    }
}

function startClock(seconds, onEnd) {
    let left = seconds;
    setTimerText(left);

    timer = setInterval(() => {
        left--;
        setTimerText(left);

        if (left <= 0) {
            stopLoops();
            onEnd();
        }
    }, 1000);
}

function bestKey() {
    return `funzone-best-${activeGame}`;
}

function updateBest() {
    const best = Number(localStorage.getItem(bestKey()) || 0);

    $("bestScore").textContent = best;

    if (score > best) {
        localStorage.setItem(bestKey(), score);
        $("bestScore").textContent = score;
    }
}

function addPoints(n) {
    setScore(score + n);
}

// OPEN AND CLOSE GAME

function openGame(id) {
    activeGame = id;
    level = "easy";

    document.querySelectorAll(".level-btn").forEach(b => {
        b.classList.toggle("active", b.dataset.level === "easy");
    });

    $("modalTitle").textContent = games.find(g => g.id === id).name;
    $("bestScore").textContent = localStorage.getItem(bestKey()) || 0;

    $("gameModal").classList.add("open");
    $("gameModal").setAttribute("aria-hidden", "false");

    $("gameInstructions").textContent = instructions[id];

    prepareGame();
}

function closeGame() {
    stopLoops();

    $("gameModal").classList.remove("open");
    $("gameModal").setAttribute("aria-hidden", "true");
}

$("closeModal").onclick = closeGame;

$("gameModal").addEventListener("click", e => {
    if (e.target === $("gameModal")) closeGame();
});

document.addEventListener("keydown", e => {
    if (e.key === "Escape") closeGame();

    if (!$("gameModal").classList.contains("open")) return;

    if (activeGame === "snake") snakeKey(e);
    if (activeGame === "maze") mazeKey(e);
    if (activeGame === "catch") catchKey(e);
});

document.querySelectorAll(".level-btn").forEach(b => {
    b.onclick = () => {
        level = b.dataset.level;

        document.querySelectorAll(".level-btn").forEach(x => {
            x.classList.toggle("active", x === b);
        });

        prepareGame();
    };
});

$("startGame").onclick = () => startGame();
$("resetGame").onclick = () => prepareGame();

// GAME INSTRUCTIONS

const instructions = {
    whack: "Tap the mole as many times as you can before the timer ends.",
    memory: "Flip two cards at a time and match every pair. Hard mode has more pairs.",
    snake: "Use the arrow keys to collect food. Don't hit the wall or your tail.",
    bubble: "Tap the bubbles to pop them before time runs out.",
    rps: "Choose rock, paper or scissors. First to the target wins.",
    wheel: "Spin the wheel and complete the silly challenge it chooses.",
    blocks: "Tap empty squares to place blocks. Complete a full row or column to score.",
    maze: "Use the arrow keys or on-screen controls to reach the green exit.",
    number: "Guess the secret number. Each guess gives you a higher or lower hint.",
    typing: "Type each word correctly and press Enter before the clock runs out.",
    simon: "Watch the colour sequence, then repeat it in the same order.",
    spot: "Find and tap the one symbol that is different from the others.",
    connect: "Tap adjacent squares to draw a path from START to FINISH.",
    word: "Find the target words hidden horizontally in the letter grid.",
    reaction: "Wait for the green screen, then click as quickly as possible. Don't click early!",
    catch: "Move your basket left and right. Catch stars and avoid bombs."
};

// PREPARE AND START GAMES

function prepareGame() {
    stopLoops();
    setScore(0);
    setTimerText(null);
    setMessage("Ready? Press start when you're set!");

    $("gameArea").innerHTML = `
        <div class="welcome-game">
            <div style="font-size:3rem">🎮</div>
            <strong>Ready to play?</strong>
            <span style="color:#766f88;font-size:.85rem">
                Choose your level above, then press Start game.
            </span>
        </div>
    `;
}

function startGame() {
    stopLoops();
    setScore(0);
    setMessage("Game on!");

    const area = $("gameArea");
    area.innerHTML = "";

    const gameFunctions = {
        whack: gameWhack,
        memory: gameMemory,
        snake: gameSnake,
        bubble: gameBubble,
        rps: gameRps,
        wheel: gameWheel,
        blocks: gameBlocks,
        maze: gameMaze,
        number: gameNumber,
        typing: gameTyping,
        simon: gameSimon,
        spot: gameSpot,
        connect: gameConnect,
        word: gameWord,
        reaction: gameReaction,
        catch: gameCatch
    };

    gameFunctions[activeGame]();
}

function finishGame(message = "Time's up!") {
    stopLoops();
    setMessage(message);
    updateBest();
}

function el(tag, cls, text) {
    const n = document.createElement(tag);

    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;

    return n;
}

function button(text, fn, cls = "") {
    const b = el("button", cls, text);
    b.onclick = fn;
    return b;
}

// 1. WHACK-A-MOLE

function gameWhack() {
    const area = $("gameArea");
    const grid = el("div", "grid-game mole-grid");

    area.append(grid);

    let target = -1;
    let ended = false;
    const cells = [];

    for (let i = 0; i < 9; i++) {
        const b = button("🕳️", () => {
            if (i === target && !ended) {
                addPoints(1);
                b.textContent = "💥";
                target = -1;
                setMessage("Nice hit!");
            }
        });

        cells.push(b);
        grid.append(b);
    }

    function move() {
        if (target >= 0) cells[target].textContent = "🕳️";

        target = Math.floor(Math.random() * 9);
        cells[target].textContent = "🐹";
    }

    move();

    interval = setInterval(
        move,
        level === "easy" ? 850 : level === "medium" ? 620 : 430
    );

    startClock(durations[level], () => {
        ended = true;
        finishGame(`Time's up! You scored ${score}.`);
    });
}

// 2. MEMORY MATCH

function gameMemory() {
    const count = [4, 6, 8][levelIndex()];
    const symbols = ["🍓", "🍋", "🍇", "🍉", "🍒", "🥝", "🍍", "🍑"].slice(0, count);

    let deck = [...symbols, ...symbols].sort(() => Math.random() - .5);
    let open = [];
    let matched = 0;
    let lock = false;

    const grid = el("div", "grid-game memory-grid");
    $("gameArea").append(grid);

    deck.forEach((v, i) => {
        const b = button("❔", () => {
            if (lock || b.dataset.done || open.includes(i)) return;

            b.textContent = v;
            open.push(i);

            if (open.length === 2) {
                lock = true;

                const [a, c] = open;

                if (deck[a] === deck[c]) {
                    [a, c].forEach(k => {
                        const x = grid.children[k];
                        x.dataset.done = "1";
                        x.style.background = "#d8f8e9";
                    });

                    matched++;
                    addPoints(10);
                    open = [];
                    lock = false;

                    if (matched === count) {
                        finishGame("Amazing! All pairs matched!");
                    }
                } else {
                    setTimeout(() => {
                        grid.children[a].textContent = "❔";
                        grid.children[c].textContent = "❔";
                        open = [];
                        lock = false;
                    }, 650);
                }
            }
        });

        grid.append(b);
    });

    setMessage(`${count} pairs to find.`);
}

// 3. SNAKE GAME

function gameSnake() {
    const area = $("gameArea");
    const canvas = document.createElement("canvas");

    canvas.width = 360;
    canvas.height = 260;
    canvas.style.maxWidth = "100%";
    canvas.style.background = "#f0faef";
    canvas.style.borderRadius = "12px";

    area.append(canvas);

    const ctx = canvas.getContext("2d");

    let snake = [
        {x:8, y:7},
        {x:7, y:7},
        {x:6, y:7}
    ];

    let dir = {x:1, y:0};
    let food = {x:13, y:7};

    const cell = 16;
    const cols = 22;
    const rows = 16;

    function draw() {
        ctx.clearRect(0, 0, 360, 260);

        ctx.fillStyle = "#ff8eae";
        ctx.fillRect(food.x * cell, food.y * cell, cell - 2, cell - 2);

        snake.forEach((p, i) => {
            ctx.fillStyle = i ? "#8c75e8" : "#5bc89d";
            ctx.fillRect(p.x * cell, p.y * cell, cell - 2, cell - 2);
        });
    }

    function tick() {
        const h = {
            x: snake[0].x + dir.x,
            y: snake[0].y + dir.y
        };

        if (
            h.x < 0 || h.y < 0 ||
            h.x >= cols || h.y >= rows ||
            snake.some(p => p.x === h.x && p.y === h.y)
        ) {
            finishGame(`Snake bumped! Score: ${score}`);
            return;
        }

        snake.unshift(h);

        if (h.x === food.x && h.y === food.y) {
            addPoints(10);

            food = {
                x: Math.floor(Math.random() * cols),
                y: Math.floor(Math.random() * rows)
            };
        } else {
            snake.pop();
        }

        draw();
    }

    function key(e) {
        const map = {
            ArrowUp: {x:0, y:-1},
            ArrowDown: {x:0, y:1},
            ArrowLeft: {x:-1, y:0},
            ArrowRight: {x:1, y:0}
        };

        const d = map[e.key];

        if (d && !(d.x === -dir.x && d.y === -dir.y)) {
            dir = d;
            e.preventDefault();
        }
    }

    gameState.snakeKey = key;

    draw();

    interval = setInterval(
        tick,
        level === "easy" ? 190 : level === "medium" ? 135 : 90
    );

    startClock(60, () => finishGame(`Time! Score: ${score}`));
}

function snakeKey(e) {
    gameState.snakeKey?.(e);
}

// 4. BUBBLE SHOOTER

function gameBubble() {
    const field = el("div", "bubble-field");
    $("gameArea").append(field);

    const count = level === "easy" ? 10 : level === "medium" ? 16 : 22;

    for (let i = 0; i < count; i++) {
        const b = button("", () => {
            if (!b.isConnected) return;

            b.remove();
            addPoints(1);

            if (!field.children.length) {
                finishGame(`Bubble master! Score: ${score}`);
            }
        }, "bubble");

        b.style.left = Math.random() * 88 + "%";
        b.style.top = Math.random() * 75 + "%";

        field.append(b);
    }

    startClock(durations[level], () => {
        finishGame(`Bubble time! Score: ${score}`);
    });
}

// 5. ROCK PAPER SCISSORS

function gameRps() {
    const area = $("gameArea");
    const choices = ["Rock ✊", "Paper ✋", "Scissors ✌️"];

    let wins = 0;
    const target = [2, 3, 5][levelIndex()];

    const line = el("div", "", `First to ${target} wins.`);
    const result = el("h3", "", "Choose your move!");

    area.append(line, result);

    const row = el("div", "");
    row.style.display = "flex";
    row.style.gap = "8px";

    choices.forEach((c, i) => {
        row.append(button(c, () => {
            const cpu = Math.floor(Math.random() * 3);

            const win = (i - cpu + 3) % 3 === 1;
            const draw = i === cpu;

            if (win) {
                wins++;
                addPoints(1);
            }

            result.textContent =
                `You: ${choices[i]} | Computer: ${choices[cpu]} — ` +
                `${draw ? "Draw" : win ? "You win!" : "Computer wins!"}`;

            if (wins >= target) {
                finishGame("You won the match!");
            }
        }));
    });

    area.append(row);
}

// 6. SPIN THE WHEEL

function gameWheel() {
    const area = $("gameArea");
    const wheel = el("div", "");

    wheel.style.cssText = "font-size:5rem;transition:transform 2s";
    wheel.textContent = "🎡";

    const result = el("h3", "", "Spin to get a challenge!");

    area.append(
        wheel,
        result,
        button("SPIN!", () => {
            const tasks = [
                "Do 5 star jumps!",
                "Say a tongue twister!",
                "Make your silliest face!",
                "Name 3 favourite foods!",
                "Dance for 10 seconds!",
                "Give yourself a high five!"
            ];

            wheel.style.transform = `rotate(${1080 + Math.random() * 720}deg)`;

            setTimeout(() => {
                result.textContent = tasks[Math.floor(Math.random() * tasks.length)];
                addPoints(5);
                setMessage("Challenge completed? +5 points!");
            }, 1900);
        })
    );
}

// 7. BLOCK PUZZLE

function gameBlocks() {
    const grid = el("div", "grid-game block-grid");
    let cells = Array(25).fill(false);

    function draw() {
        grid.innerHTML = "";

        cells.forEach((v, i) => {
            grid.append(button(v ? "" : "＋", () => {
                if (cells[i]) return;

                cells[i] = true;
                addPoints(1);

                const r = Math.floor(i / 5);
                const c = i % 5;

                const fullRow = cells.slice(r * 5, r * 5 + 5).every(Boolean);
                const fullCol = [0, 1, 2, 3, 4].every(x => cells[x * 5 + c]);

                if (fullRow) {
                    for (let x = 0; x < 5; x++) {
                        cells[r * 5 + x] = false;
                    }
                    addPoints(5);
                }

                if (fullCol) {
                    for (let x = 0; x < 5; x++) {
                        cells[x * 5 + c] = false;
                    }
                    addPoints(5);
                }

                draw();

                if (cells.every(Boolean)) {
                    finishGame("Board full! Great effort.");
                }
            }));
        });

        grid.querySelectorAll("button").forEach((b, i) => {
            if (cells[i]) b.classList.add("filled");
        });
    }

    draw();
    $("gameArea").append(grid);

    setMessage("Fill squares and clear complete rows or columns.");
}

// 8. MAZE ESCAPE

const mazes = [
    ["#########", "#S..#...#", "##.#.#..#", "#..#.#.##", "#..#...E#", "#########"],
    ["###########", "#S..#.....#", "###.#.###.#", "#...#...#.#", "#.#####.#.#", "#.....#...#", "###########"],
    ["#############", "#S....#.....#", "#####.#.###.#", "#.....#...#.#", "#.#######.#.#", "#.........#E#", "#############"]
];

function gameMaze() {
    let map = mazes[levelIndex()].map(r => r.split(""));
    let pos = {r:1, c:1};

    const area = $("gameArea");
    const grid = el("div", "grid-game maze-grid");

    grid.style.setProperty("--cols", map[0].length);

    function draw() {
        grid.innerHTML = "";

        map.forEach((row, r) => {
            row.forEach((v, c) => {
                const s = el(
                    "span",
                    v === "#" ? "wall" : v === "E" ? "exit" : "",
                    r === pos.r && c === pos.c
                        ? "🟡"
                        : v === "E"
                        ? "🏁"
                        : v === "#"
                        ? ""
                        : ""
                );

                grid.append(s);
            });
        });
    }

    function move(dr, dc) {
        const nr = pos.r + dr;
        const nc = pos.c + dc;

        if (map[nr]?.[nc] === "#" || !map[nr]?.[nc]) return;

        pos = {r:nr, c:nc};
        addPoints(1);
        draw();

        if (map[nr][nc] === "E") {
            finishGame("You escaped the maze!");
        }
    }

    gameState.mazeMove = move;

    draw();
    area.append(grid);

    const controls = el("div", "");

    controls.innerHTML = `
        <div style="display:grid;grid-template-columns:repeat(3,42px);gap:4px">
            <span></span><button data-m="u">↑</button><span></span>
            <button data-m="l">←</button>
            <button data-m="d">↓</button>
            <button data-m="r">→</button>
        </div>
    `;

    controls.querySelectorAll("button").forEach(b => {
        b.onclick = () => ({
            u: () => move(-1, 0),
            d: () => move(1, 0),
            l: () => move(0, -1),
            r: () => move(0, 1)
        }[b.dataset.m])();
    });

    area.append(controls);
    setMessage("Use arrow keys or buttons to move.");
}

function mazeKey(e) {
    const m = {
        ArrowUp: [-1, 0],
        ArrowDown: [1, 0],
        ArrowLeft: [0, -1],
        ArrowRight: [0, 1]
    }[e.key];

    if (m) {
        gameState.mazeMove?.(...m);
        e.preventDefault();
    }
}

// 9. NUMBER GUESSING CHALLENGE

function gameNumber() {
    const max = [20, 100, 500][levelIndex()];
    const tries = [7, 8, 9][levelIndex()];
    const secret = Math.floor(Math.random() * max) + 1;

    const area = $("gameArea");

    const info = el(
        "p",
        "",
        `I'm thinking of a number from 1 to ${max}. You have ${tries} tries.`
    );

    const input = document.createElement("input");
    input.type = "number";
    input.min = 1;
    input.max = max;
    input.placeholder = "Your guess";

    const result = el("h3", "", "Good luck!");
    const go = button("Guess", check);

    function check() {
        const n = Number(input.value);

        if (!n || n < 1 || n > max) {
            result.textContent = `Enter a number from 1 to ${max}.`;
            return;
        }

        gameState.numberUsed = (gameState.numberUsed || 0) + 1;

        const used = gameState.numberUsed;

        if (n === secret) {
            addPoints(Math.max(5, (tries - used + 1) * 5));
            result.textContent = `Correct! The number was ${secret}.`;
            finishGame("You found it!");
        } else if (used >= tries) {
            result.textContent = `Out of tries! It was ${secret}.`;
            finishGame("Game over.");
        } else {
            result.textContent =
                `${n < secret ? "Too low!" : "Too high!"} ${tries - used} tries left.`;
        }

        input.value = "";
    }

    gameState.numberUsed = 0;

    input.addEventListener("keydown", e => {
        if (e.key === "Enter") check();
    });

    area.append(info, input, go, result);
}

// 10. TYPING SPEED CHALLENGE

function gameTyping() {
    const words = [
        ["cat", "sun", "fun", "joy", "play"],
        ["colour", "puzzle", "rocket", "garden", "smile"],
        ["adventure", "wonderful", "challenge", "fantastic", "discovery"]
    ][levelIndex()];

    let i = 0;
    let correct = 0;

    const area = $("gameArea");
    const word = el("h2", "", words[i]);
    const input = document.createElement("input");

    input.placeholder = "Type the word";
    input.autocomplete = "off";

    const status = el("p", "", "Type the word and press Enter.");

    function next() {
        if (input.value.trim().toLowerCase() === words[i]) {
            correct++;
            addPoints(10);
            i++;

            if (i >= words.length) {
                finishGame("Typing champion!");
                word.textContent = "All done!";
                input.disabled = true;
                return;
            }

            word.textContent = words[i];
            status.textContent = "Correct! Next word.";
        } else {
            status.textContent = "Not quite. Try again!";
        }

        input.value = "";
    }

    input.addEventListener("keydown", e => {
        if (e.key === "Enter") next();
    });

    area.append(word, input, status);
    input.focus();

    startClock(durations[level], () => {
        input.disabled = true;
        finishGame(`Time! ${correct} words correct.`);
    });
}

// 11. SIMON SAYS

function gameSimon() {
    const area = $("gameArea");
    const colors = ["red", "blue", "green", "yellow"];
    const emojis = ["🟥", "🟦", "🟩", "🟨"];

    let seq = [];
    let step = 0;
    let round = 0;
    let accept = false;

    const row = el("div", "");
    row.style.display = "grid";
    row.style.gridTemplateColumns = "repeat(2,85px)";
    row.style.gap = "10px";

    const status = el("h3", "", "Watch the sequence!");

    const pads = colors.map((c, i) => {
        const b = button(emojis[i], () => {
            if (!accept) return;

            if (seq[step] !== i) {
                accept = false;
                finishGame(`Oops! You reached round ${round}.`);
                return;
            }

            step++;

            if (step === seq.length) {
                accept = false;
                round++;
                addPoints(10);
                status.textContent = "Great memory! Next round...";
                setTimeout(nextRound, 550);
            }
        });

        b.style.cssText = `
            width:85px;
            height:75px;
            font-size:2rem;
            background:${["#ffd9e5", "#dceaff", "#d8f8e9", "#fff0bd"][i]}
        `;

        row.append(b);
        return b;
    });

    function flash(i) {
        pads[i].style.transform = "scale(1.1)";
        setTimeout(() => pads[i].style.transform = "", 260);
    }

    function nextRound() {
        seq.push(Math.floor(Math.random() * 4));
        step = 0;

        status.textContent = `Round ${round + 1}: watch carefully`;

        let j = 0;

        const id = setInterval(() => {
            flash(seq[j]);
            j++;

            if (j >= seq.length) {
                clearInterval(id);
                accept = true;
                status.textContent = "Your turn! Repeat the sequence.";
            }
        }, level === "easy" ? 700 : level === "medium" ? 500 : 350);
    }

    area.append(status, row);
    nextRound();
}

// 12. SPOT THE DIFFERENCE

function gameSpot() {
    const area = $("gameArea");
    const grid = el("div", "grid-game");

    grid.style.gridTemplateColumns = "repeat(6,42px)";

    const symbols = ["🍒", "🍋", "🍇", "🍉", "🍓", "🍍"];
    const odd = symbols[Math.floor(Math.random() * symbols.length)];
    const normal = symbols[(symbols.indexOf(odd) + 1) % symbols.length];

    const total = [18, 24, 30][levelIndex()];
    const correct = Math.floor(Math.random() * total);

    for (let i = 0; i < total; i++) {
        grid.append(button(i === correct ? odd : normal, () => {
            if (i === correct) {
                addPoints(10);
                finishGame("Sharp eyes! You found it!");
            } else {
                setMessage("Not that one — try again!");
                addPoints(-2);
            }
        }));
    }

    area.append(el("p", "", "Tap the symbol that is different."), grid);
}

// 13. CONNECT THE DOTS

function gameConnect() {
    const area = $("gameArea");
    const grid = el("div", "connect-grid");

    let path = [];
    const cells = [];

    for (let i = 0; i < 25; i++) {
        const b = button(i === 0 ? "S" : i === 24 ? "🏁" : "", () => {
            const prev = path[path.length - 1];

            if (i === 0 && path.length === 0) {
                path = [0];
                b.classList.add("path");
                return;
            }

            if (!path.length) return;
            if (path.includes(i)) return;

            const adjacent = prev !== undefined &&
                (
                    Math.abs(Math.floor(prev / 5) - Math.floor(i / 5)) +
                    Math.abs(prev % 5 - i % 5) === 1
                );

            if (!adjacent) {
                setMessage("Choose a neighbouring square.");
                return;
            }

            path.push(i);
            b.classList.add("path");
            addPoints(1);

            if (i === 24) {
                finishGame("Path connected!");
            }
        });

        cells.push(b);
        grid.append(b);
    }

    cells[0].classList.add("start");
    cells[24].classList.add("finish");

    area.append(
        el("p", "", "Start at S, then tap neighbouring squares to reach the finish."),
        grid
    );
}

// 14. WORD SEARCH

function gameWord() {
    const words = {
        easy: ["SUN", "CAT", "FUN"],
        medium: ["APPLE", "MUSIC", "GAMES"],
        hard: ["PLANET", "PUZZLE", "FRIEND"]
    }[level];

    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const grid = el("div", "word-grid");

    let rows = Array.from({length:8}, () => Array(8).fill(""));

    words.forEach((w, idx) => {
        const r = idx * 2;
        const c = Math.floor(Math.random() * (8 - w.length));

        for (let j = 0; j < w.length; j++) {
            rows[r][c + j] = w[j];
        }
    });

    rows = rows.map(row =>
        row.map(v => v || letters[Math.floor(Math.random() * letters.length)])
    );

    const found = new Set();

    rows.flat().forEach((ch, i) => {
        grid.append(button(ch, () => {
            const r = Math.floor(i / 8);
            const c = i % 8;

            const word = words.find(w => {
                for (let s = 0; s <= 8 - w.length; s++) {
                    if (s === c && rows[r].slice(s, s + w.length).join("") === w) {
                        return true;
                    }
                }
                return false;
            });

            if (word) {
                found.add(word);

                for (let j = 0; j < word.length; j++) {
                    grid.children[r * 8 + c + j].classList.add("selected");
                }

                addPoints(10);
                list.textContent = `Found: ${[...found].join(", ")}`;

                if (found.size === words.length) {
                    finishGame("All hidden words found!");
                }
            }
        }));
    });

    const list = el("p", "", "Find: " + words.join(", "));
    area.append(list, grid);
}

// 15. REACTION TIME

function gameReaction() {
    const area = $("gameArea");

    const pad = button("WAIT FOR GREEN...", () => {
        if (!ready) {
            clearTimeout(wait);
            pad.textContent = "Too soon!";
            finishGame("False start! Restart to try again.");
            return;
        }

        const ms = Date.now() - start;

        addPoints(Math.max(1, Math.round(1000 / ms)));

        pad.textContent = `${ms} ms — Great reaction!`;
        finishGame(`Your reaction time: ${ms} ms.`);
    });

    pad.style.cssText = `
        width:100%;
        height:170px;
        background:#ffb4c8;
        color:#642b46;
        font-size:1.3rem
    `;

    area.append(pad);

    let ready = false;
    let start = 0;

    const wait = setTimeout(() => {
        ready = true;
        pad.style.background = "#71dfad";
        pad.textContent = "CLICK NOW!";
        start = Date.now();
    }, 1000 + Math.random() * (
        level === "easy" ? 3000 :
        level === "medium" ? 2200 : 1400
    ));

    cleanup = () => clearTimeout(wait);
}

// 16. CATCH THE FALLING OBJECTS

function gameCatch() {
    const area = $("gameArea");
    const field = el("div", "catch-field");
    const basket = el("div", "catcher", "🧺");

    field.append(basket);
    area.append(field, el("p", "", "Use ← → arrow keys or tap the sides of the play area."));

    let x = 50;
    let items = [];

    function move(dx) {
        x = Math.max(5, Math.min(95, x + dx));
        basket.style.left = `calc(${x}% - 20px)`;
    }

    gameState.catchMove = move;

    field.addEventListener("click", e => {
        const rect = field.getBoundingClientRect();

        move(
            e.clientX < rect.left + rect.width / 2 ? -8 : 8
        );
    });

    function spawn() {
        const item = el("span", "falling", Math.random() < .2 ? "💣" : "⭐");
        const left = 5 + Math.random() * 90;

        item.style.left = left + "%";
        field.append(item);

        let y = 0;

        const id = setInterval(() => {
            y += level === "easy" ? 4 : level === "medium" ? 6 : 8;
            item.style.top = y + "px";

            if (y > 160) {
                clearInterval(id);

                const caught = Math.abs(left - x) < 12;

                if (caught) {
                    if (item.textContent === "💣") {
                        addPoints(-5);
                    } else {
                        addPoints(2);
                    }
                }

                item.remove();
            }
        }, 45);

        items.push(id);
    }

    interval = setInterval(
        spawn,
        level === "easy" ? 950 : level === "medium" ? 700 : 500
    );

    startClock(durations[level], () => {
        items.forEach(clearInterval);
        finishGame(`Catch complete! Score: ${score}`);
    });

    cleanup = () => items.forEach(clearInterval);
}

function catchKey(e) {
    if (e.key === "ArrowLeft") {
        gameState.catchMove?.(-8);
        e.preventDefault();
    }

    if (e.key === "ArrowRight") {
        gameState.catchMove?.(8);
        e.preventDefault();
    }
}

// API FEATURES — EXACTLY THREE EXTERNAL APIS

// API 1: OFFICIAL JOKE API

async function fetchJoke() {
    const status = $("jokeStatus");

    status.textContent = "Finding a joke...";
    $("jokePunchline").textContent = "";

    try {
        const r = await fetch(
            "https://official-joke-api.appspot.com/random_joke"
        );

        if (!r.ok) throw Error("Request failed");

        const d = await r.json();

        $("jokeSetup").textContent = d.setup;

        $("jokePunchline").textContent =
            "Punchline hidden — reveal it when you're ready!";

        $("punchlineButton").dataset.answer = d.punchline;

        status.textContent = "A fresh joke has arrived!";

    } catch (e) {
        status.textContent = "Couldn't load a joke. Please try again.";
    }
}

$("jokeButton").onclick = fetchJoke;

$("punchlineButton").onclick = () => {
    $("jokePunchline").textContent =
        $("punchlineButton").dataset.answer || "Get a joke first!";
};


// API 2: USELESS FACTS API

async function fetchFact() {
    const status = $("factStatus");

    status.textContent = "Finding a fact...";

    try {
        const r = await fetch(
            "https://uselessfacts.jsph.pl/api/v2/facts/random?language=en"
        );

        if (!r.ok) throw Error("Request failed");

        const d = await r.json();

        $("factText").textContent = d.text;

        status.textContent = "Here's a new random fact!";

    } catch (e) {
        status.textContent = "Couldn't load a fact. Please try again.";
    }
}

$("factButton").onclick = fetchFact;


// API 3: OPEN TRIVIA DB

let triviaCorrect = "";

function decodeHTML(s) {
    const t = document.createElement("textarea");
    t.innerHTML = s;
    return t.value;
}

async function fetchTrivia() {
    const status = $("triviaStatus");

    status.textContent = "Loading a question...";
    $("triviaAnswers").innerHTML = "";

    try {
        const r = await fetch(
            "https://opentdb.com/api.php?amount=1&type=multiple"
        );

        if (!r.ok) throw Error("Request failed");

        const d = await r.json();

        if (!d.results?.length) throw Error("No question");

        const q = d.results[0];

        triviaCorrect = decodeHTML(q.correct_answer);

        $("triviaQuestion").textContent = decodeHTML(q.question);

        const answers = [
            ...q.incorrect_answers.map(decodeHTML),
            triviaCorrect
        ].sort(() => Math.random() - .5);

        answers.forEach(a => {
            const b = button(a, () => {
                [...$("triviaAnswers").children].forEach(x => {
                    x.disabled = true;

                    if (x.textContent === triviaCorrect) {
                        x.classList.add("correct");
                    }
                });

                if (a === triviaCorrect) {
                    status.textContent = "Correct! Great job 🎉";
                } else {
                    b.classList.add("wrong");
                    status.textContent = `Not quite! Answer: ${triviaCorrect}`;
                }
            });

            $("triviaAnswers").append(b);
        });

        status.textContent = "Choose your answer!";

    } catch (e) {
        status.textContent = "Couldn't load trivia. Please try again.";
    }
}

$("triviaButton").onclick = fetchTrivia;