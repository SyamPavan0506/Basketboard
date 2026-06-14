let currentQuarter = 1;
let totalQuarters, timeLeft, timerInterval;

let scoreA = 0, scoreB = 0;
let foulsA = 0, foulsB = 0;

let teamAPlayers = [], teamBPlayers = [];

document.getElementById("startGame").onclick = function () {

    totalQuarters = +document.getElementById("quarters").value;
    let minutes = +document.getElementById("minutes").value;

    let A = document.getElementById("teamAInput").value.split(",");
    let B = document.getElementById("teamBInput").value.split(",");

    teamAPlayers = A.map(n => ({
        name: n.trim(),
        jersey: Math.floor(Math.random() * 100),
        points: 0,
        fouls: 0,
        isOut: false
    }));

    teamBPlayers = B.map(n => ({
        name: n.trim(),
        jersey: Math.floor(Math.random() * 100),
        points: 0,
        fouls: 0,
        isOut: false
    }));

    document.getElementById("setupScreen").style.display = "none";
    document.getElementById("gameScreen").style.display = "block";

    renderPlayers('A');
    renderPlayers('B');

    timeLeft = minutes * 60;
    startTimer();
};

function startTimer() {
    updateQuarter();
    updateTimer();

    timerInterval = setInterval(() => {
        if (timeLeft > 0) {
            timeLeft--;
            updateTimer();
        } else {
            nextQuarter();
        }
    }, 1000);
}

function pauseGame() {
    clearInterval(timerInterval);
    addEvent("Paused");
}

function resumeGame() {
    startTimer();
    addEvent("Resumed");
}

function updateTimer() {
    let m = Math.floor(timeLeft / 60);
    let s = timeLeft % 60;
    if (s < 10) s = "0" + s;
    document.getElementById("timer").innerText = m + ":" + s;
}

function updateQuarter() {
    document.getElementById("quarter").innerText = "Q" + currentQuarter;
}

function nextQuarter() {
    clearInterval(timerInterval);

    if (currentQuarter < totalQuarters) {
        currentQuarter++;

        // RESET FOULS EACH QUARTER
        foulsA = 0;
        foulsB = 0;

        document.getElementById("foulA").innerText = 0;
        document.getElementById("foulB").innerText = 0;

        document.getElementById("bonusA").style.display = "none";
        document.getElementById("bonusB").style.display = "none";

        let minutes = +document.getElementById("minutes").value;
        timeLeft = minutes * 60;

        startTimer();
        addEvent("New Quarter Started");

    } else {
        document.getElementById("timer").innerText = "Game Over";
    }
}

function addEvent(msg) {
    let t = document.getElementById("timeline");
    let d = document.createElement("div");
    d.innerText = msg;
    t.prepend(d);
}

function addScore(team, pts) {
    if (team === 'A') {
        scoreA += pts;
        document.getElementById("scoreA").innerText = scoreA;
    } else {
        scoreB += pts;
        document.getElementById("scoreB").innerText = scoreB;
    }

    addEvent(`Team ${team} scored ${pts}`);
}

function addFoul(team) {
    if (team === 'A') {
        foulsA++;
        document.getElementById("foulA").innerText = foulsA;

        if (foulsA >= 5) {
            document.getElementById("bonusA").style.display = "block";
        }
    } else {
        foulsB++;
        document.getElementById("foulB").innerText = foulsB;

        if (foulsB >= 5) {
            document.getElementById("bonusB").style.display = "block";
        }
    }

    addEvent(`Team ${team} foul`);
}

function renderPlayers(team) {
    let list = team === 'A' ? teamAPlayers : teamBPlayers;
    let container = document.getElementById(team === 'A' ? "teamAPlayers" : "teamBPlayers");

    container.innerHTML = "";

    list.forEach((p, i) => {
        let div = document.createElement("div");
        div.className = "player-card";
        if (p.isOut) div.classList.add("out");

        div.innerHTML = `
        #${p.jersey} ${p.name} | P:${p.points} F:${p.fouls}
        <br>
        <button onclick="updatePlayer('${team}',${i},1)">+1</button>
        <button onclick="updatePlayer('${team}',${i},2)">+2</button>
        <button onclick="updatePlayer('${team}',${i},3)">+3</button>
        <button onclick="updatePlayer('${team}',${i},'foul')">F</button>
        `;

        container.appendChild(div);
    });
}

function updatePlayer(team, i, type) {
    let list = team === 'A' ? teamAPlayers : teamBPlayers;
    let p = list[i];

    if (p.isOut) return;

    if (type === 'foul') {
        p.fouls++;
        if (p.fouls >= 5) p.isOut = true;
    } else {
        p.points += type;
    }

    addEvent(`${p.name} ${type}`);
    renderPlayers(team);
}