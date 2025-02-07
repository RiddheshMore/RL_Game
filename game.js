
// Grid settings
const gridSize = 5;
let playerPos = { x: 0, y: 0 };
const goalPos = { x: 4, y: 4 };
const walls = [{ x: 2, y: 2 }, { x: 3, y: 2 }];
const rewardMap = { goal: 10, wall: -5, move: -1 };

// Q-Learning settings
const Q = {};
const learningRate = 0.1;
const discountFactor = 0.9;
const explorationRate = 0.2;
let totalRewards = [];

// Create the grid UI
function createGrid() {
    const grid = document.getElementById("grid");
    grid.innerHTML = "";  
    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            const cell = document.createElement("div");
            cell.classList.add("cell");
            if (playerPos.x === x && playerPos.y === y) {
                cell.classList.add("player");
                cell.innerHTML = "🟦";
            } else if (goalPos.x === x && goalPos.y === y) {
                cell.classList.add("goal");
                cell.innerHTML = "🏆";
            } else if (walls.some(w => w.x === x && w.y === y)) {
                cell.classList.add("wall");
            }
            grid.appendChild(cell);
        }
    }
}

// Handle player movement
document.addEventListener("keydown", (event) => {
    let newX = playerPos.x;
    let newY = playerPos.y;

    if (event.key === "ArrowUp") newY--;
    if (event.key === "ArrowDown") newY++;
    if (event.key === "ArrowLeft") newX--;
    if (event.key === "ArrowRight") newX++;

    movePlayer(newX, newY);
});

// Move player and update rewards
function movePlayer(newX, newY) {
    let reward = rewardMap.move;

    if (newX >= 0 && newX < gridSize && newY >= 0 && newY < gridSize) {
        if (walls.some(w => w.x === newX && w.y === newY)) {
            reward = rewardMap.wall;
        } else {
            playerPos = { x: newX, y: newY };
        }
    } else {
        reward = rewardMap.wall;
    }

    if (playerPos.x === goalPos.x && playerPos.y === goalPos.y) {
        reward = rewardMap.goal;
        totalRewards.push(reward);
        resetGame();
    }

    updateQTable(`${playerPos.x},${playerPos.y}`, reward);
    updateChart();
    createGrid();
}

// Reset the game
function resetGame() {
    playerPos = { x: 0, y: 0 };
    createGrid();
}

// Q-Learning functions
function getQValue(state, action) {
    return Q[state]?.[action] || 0;
}

function chooseAction(state) {
    if (Math.random() < explorationRate) {
        return ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"][Math.floor(Math.random() * 4)];
    }
    return Object.keys(Q[state] || {}).reduce((bestAction, action) =>
        getQValue(state, action) > getQValue(state, bestAction) ? action : bestAction, "ArrowUp");
}

function updateQTable(state, reward) {
    if (!Q[state]) Q[state] = {};
    const maxFutureQ = Math.max(...Object.values(Q[state] || { "ArrowUp": 0 }));
    Q[state]["best"] = (1 - learningRate) * getQValue(state, "best") + learningRate * (reward + discountFactor * maxFutureQ);
}

// Visualization: Reward Progress Chart
function updateChart() {
    if (!window.myChart) {
        const ctx = document.getElementById("chartCanvas").getContext("2d");
        window.myChart = new Chart(ctx, {
            type: 'line',
            data: { labels: [], datasets: [{ label: "Total Rewards", borderColor: "blue", data: [] }] },
            options: { responsive: false }
        });
    }
    window.myChart.data.labels.push(totalRewards.length);
    window.myChart.data.datasets[0].data.push(totalRewards.reduce((a, b) => a + b, 0));
    window.myChart.update();
}

// Train agent automatically
function trainAgent() {
    let state = `${playerPos.x},${playerPos.y}`;
    let action = chooseAction(state);
    document.dispatchEvent(new KeyboardEvent("keydown", { key: action }));
}

// Run training every 500ms
setInterval(trainAgent, 500);
createGrid();
