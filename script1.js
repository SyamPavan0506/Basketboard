// ════════════════════════════════════════════════
// script.js — BasketBoard
//
// HOW THIS FILE IS ORGANISED:
//   1. STATE         — one object holding all game data
//   2. SETUP PAGE    — form logic before the game starts
//   3. SCORE MODAL   — who scored popup
//   4. FOUL MODAL    — foul type + player picker popup
//   5. SCORE LOGIC   — adding, undoing scores
//   6. FOUL LOGIC    — recording fouls, bonus system
//   7. RENDER        — drawing player rows and stats table
//   8. QUARTERS      — changing quarters, resetting fouls
//   9. TIMER         — countdown clock
//  10. GAME LOG      — adding entries to the live log
//  11. END / RESET   — end game banner, full reset
// ════════════════════════════════════════════════


// ── 1. STATE ─────────────────────────────────────
// Everything the app needs is stored here.
// We never guess a value — we always read from state.
const state = {
  scores:          { a: 0, b: 0 },
  history:         { a: [], b: [] },  // stack for undo
  quarterFouls:    { a: 0, b: 0 },   // resets each quarter
  players:         { a: [], b: [] }, // { number, name, pts, fouls, fouledOut }
  quarter:         1,
  quarterDuration: 720,              // seconds — set from setup dropdown
  skipPlayers:     false,
  timer: {
    seconds:  720,
    running:  false,
    interval: null
  }
};

// Track which team's modal is currently open
let scoreModalTeam  = null;
let scoreModalPts   = 0;
let foulModalTeam   = null;


// ── 2. SETUP PAGE ────────────────────────────────

// Add a blank jersey# + name input row in setup
function addSetupRow(team) {
  const container = document.getElementById('setup-players-' + team);
  const row = document.createElement('div');
  row.className = 'player-input-row';
  row.innerHTML =
    '<input type="number" placeholder="#" min="0" max="99" />' +
    '<input type="text" placeholder="Player name" maxlength="18" />' +
    '<button class="btn-remove-row" onclick="this.parentElement.remove()">✕</button>';
  container.appendChild(row);
}

// Show/hide custom time input when "Custom..." is selected
document.getElementById('setup-qtr-time').addEventListener('change', function () {
  const customGroup = document.getElementById('custom-time-group');
  customGroup.style.display = this.value === 'custom' ? 'flex' : 'none';
});

// Update column heading live as team name is typed
document.getElementById('setup-name-a').addEventListener('input', function () {
  document.getElementById('setup-col-title-a').textContent = this.value || 'Home Team';
});
document.getElementById('setup-name-b').addEventListener('input', function () {
  document.getElementById('setup-col-title-b').textContent = this.value || 'Away Team';
});

// Gray out player inputs when "skip players" is checked
function toggleSkipPlayers() {
  const skip = document.getElementById('skip-players-check').checked;
  const opacity = skip ? '0.35' : '1';
  const pointer = skip ? 'none' : '';
  document.querySelectorAll('.teams-grid, .btn-add-row').forEach(el => {
    el.style.opacity = opacity;
    el.style.pointerEvents = pointer;
  });
}

// Pre-fill 3 blank player rows per team on page load
addSetupRow('a'); addSetupRow('a'); addSetupRow('a');
addSetupRow('b'); addSetupRow('b'); addSetupRow('b');

// Called when user clicks "Start Game ▶"
function startGame() {
  const nameA = document.getElementById('setup-name-a').value.trim() || 'HOME';
  const nameB = document.getElementById('setup-name-b').value.trim() || 'AWAY';

  // Work out the quarter duration in seconds
  const sel = document.getElementById('setup-qtr-time');
  let duration;
  if (sel.value === 'custom') {
    const mins = parseInt(document.getElementById('setup-custom-minutes').value);
    // If invalid input, default to 12 minutes
    duration = (mins >= 1 && mins <= 60) ? mins * 60 : 720;
  } else {
    duration = parseInt(sel.value);
  }

  state.quarterDuration  = duration;
  state.timer.seconds    = duration;
  state.skipPlayers      = document.getElementById('skip-players-check').checked;

  // Read players from setup form (unless skipped)
  if (!state.skipPlayers) {
    ['a', 'b'].forEach(team => {
      const rows = document.querySelectorAll('#setup-players-' + team + ' .player-input-row');
      rows.forEach(row => {
        const num  = row.querySelector('input[type="number"]').value.trim();
        const name = row.querySelector('input[type="text"]').value.trim();
        if (name) {
          state.players[team].push({
            number:    num || '?',
            name:      name,
            pts:       0,
            fouls:     0,
            fouledOut: false
          });
        }
      });
    });
  }

  // Push names into every label on the game page
  document.getElementById('label-a').textContent      = nameA;
  document.getElementById('label-b').textContent      = nameB;
  document.getElementById('ctr-name-a').textContent   = nameA;
  document.getElementById('ctr-name-b').textContent   = nameB;
  document.getElementById('stats-header-a').textContent = nameA + ' — Stats';
  document.getElementById('stats-header-b').textContent = nameB + ' — Stats';

  // Switch from setup page to game page
  document.getElementById('setup-page').style.display = 'none';
  document.getElementById('game-page').style.display  = 'flex';

  updateTimerDisplay();
  renderPlayers('a');
  renderPlayers('b');
  renderStats('a');
  renderStats('b');
  logEvent('Game started — Q1', 'qtr');
}


// ── 3. SCORE MODAL ───────────────────────────────
// Opens when a +1, +2, or +3 button is clicked.
// If no players exist, scores directly. Otherwise shows the modal.

function openScoreModal(team, pts) {
  scoreModalTeam = team;
  scoreModalPts  = pts;

  const hasPlayers = state.players[team].length > 0;

  // If no players registered, just add the score directly
  if (!hasPlayers) {
    addTeamScoreDirectly(team, pts);
    return;
  }

  // Set modal title to show team name and points
  document.getElementById('score-modal-title').textContent =
    getTeamName(team) + ' — +' + pts + ' pts';

  // Reset to step 1
  document.getElementById('score-step1').style.display = 'block';
  document.getElementById('score-step2').style.display = 'none';

  document.getElementById('score-modal').classList.add('open');
}

function closeScoreModal() {
  document.getElementById('score-modal').classList.remove('open');
  scoreModalTeam = null;
  scoreModalPts  = 0;
}

// User chose "Team Score" (no specific player)
function confirmTeamScore() {
  addTeamScoreDirectly(scoreModalTeam, scoreModalPts);
  closeScoreModal();
}

// User chose "Player Scored" → show player list (step 2)
function showScorerList() {
  const team = scoreModalTeam;
  const list = document.getElementById('score-player-list');
  list.innerHTML = '';

  state.players[team].forEach((p, i) => {
    const btn = document.createElement('button');
    btn.className = 'modal-player-btn';
    btn.disabled  = p.fouledOut;

    btn.innerHTML =
      '<span class="mpb-left">' +
        '<span class="mpb-num">#' + p.number + '</span>' +
        '<span>' + p.name + '</span>' +
        (p.fouledOut ? '<span style="color:var(--red);font-size:.7rem;font-weight:600">FOULED OUT</span>' : '') +
      '</span>' +
      '<span class="mpb-pts">' + p.pts + ' pts</span>';

    btn.onclick = function () {
      addPlayerScore(team, i, scoreModalPts);
      closeScoreModal();
    };
    list.appendChild(btn);
  });

  document.getElementById('score-step1').style.display = 'none';
  document.getElementById('score-step2').style.display = 'block';
}

function backToScoreStep1() {
  document.getElementById('score-step1').style.display = 'block';
  document.getElementById('score-step2').style.display = 'none';
}

// Close score modal by clicking outside it
document.getElementById('score-modal').addEventListener('click', function (e) {
  if (e.target === this) closeScoreModal();
});


// ── 4. FOUL MODAL ────────────────────────────────

function openFoulModal(team) {
  foulModalTeam = team;
  document.getElementById('foul-modal-title').textContent = getTeamName(team) + ' — Foul';

  // Show the free throw notice only if team is already in bonus
  const inBonus = state.quarterFouls[team] >= 5;
  document.getElementById('free-throw-notice').style.display = inBonus ? 'block' : 'none';

  // Disable personal foul button if no players added
  const hasPlayers = state.players[team].length > 0;
  document.getElementById('btn-personal-foul').disabled = !hasPlayers;

  // Reset to step 1
  document.getElementById('foul-step1').style.display = 'block';
  document.getElementById('foul-step2').style.display = 'none';

  document.getElementById('foul-modal').classList.add('open');
}

function closeFoulModal() {
  document.getElementById('foul-modal').classList.remove('open');
  foulModalTeam = null;
}

function selectFoulType(type) {
  if (type === 'team') {
    recordFoul(foulModalTeam, null);
    closeFoulModal();
  } else {
    buildFoulPlayerPicker(foulModalTeam);
    document.getElementById('foul-step1').style.display = 'none';
    document.getElementById('foul-step2').style.display = 'block';
  }
}

function buildFoulPlayerPicker(team) {
  const list = document.getElementById('foul-player-list');
  list.innerHTML = '';

  if (state.players[team].length === 0) {
    list.innerHTML = '<p style="color:var(--muted);font-size:.82rem;padding:8px">No players registered.</p>';
    return;
  }

  state.players[team].forEach((p, i) => {
    const btn = document.createElement('button');
    btn.className = 'modal-player-btn';
    btn.disabled  = p.fouledOut;

    const foulClass = p.fouls >= 4 ? 'danger' : '';
    btn.innerHTML =
      '<span class="mpb-left">' +
        '<span class="mpb-num">#' + p.number + '</span>' +
        '<span>' + p.name + '</span>' +
        (p.fouledOut ? '<span style="color:var(--red);font-size:.7rem;font-weight:600">FOULED OUT</span>' : '') +
      '</span>' +
      '<span class="mpb-fouls ' + foulClass + '">' + p.fouls + ' F</span>';

    btn.onclick = function () {
      recordFoul(team, i);
      closeFoulModal();
    };
    list.appendChild(btn);
  });
}

function backToFoulStep1() {
  document.getElementById('foul-step1').style.display = 'block';
  document.getElementById('foul-step2').style.display = 'none';
}

document.getElementById('foul-modal').addEventListener('click', function (e) {
  if (e.target === this) closeFoulModal();
});


// ── 5. SCORE LOGIC ───────────────────────────────

// Add score to team total only (no player)
function addTeamScoreDirectly(team, pts) {
  state.history[team].push(state.scores[team]);
  state.scores[team] += pts;
  updateScoreDisplay(team);
  logEvent(getTeamName(team) + ' +' + pts + ' (team)', 'pts');
}

// Add score to a specific player AND the team total
function addPlayerScore(team, playerIndex, pts) {
  const p = state.players[team][playerIndex];
  if (p.fouledOut) return;

  state.history[team].push(state.scores[team]);
  p.pts += pts;
  state.scores[team] += pts;

  updateScoreDisplay(team);
  renderPlayers(team);
  logEvent('#' + p.number + ' ' + p.name + ' +' + pts, 'pts');
}

// Undo the last score action for a team
// We saved the previous total on the history stack before every change
function undoScore(team) {
  if (!state.history[team].length) return;
  state.scores[team] = state.history[team].pop();
  updateScoreDisplay(team);
  logEvent(getTeamName(team) + ' score undone', 'qtr');
}

// Update all score displays and the stats table
function updateScoreDisplay(team) {
  const el = document.getElementById('score-' + team);
  el.textContent = state.scores[team];

  // Brief green flash on the big number
  el.classList.add('flash');
  setTimeout(() => el.classList.remove('flash'), 300);

  // Update center scoreboard
  document.getElementById('ctr-' + team).textContent = state.scores[team];

  renderStats(team);
}


// ── 6. FOUL LOGIC ────────────────────────────────

// Core foul recorder — playerIndex = null means team foul only
function recordFoul(team, playerIndex) {
  const wasInBonus = state.quarterFouls[team] >= 5;
  state.quarterFouls[team]++;

  if (playerIndex !== null) {
    const p = state.players[team][playerIndex];
    p.fouls++;

    // 5 personal fouls = fouled out
    if (p.fouls >= 5) {
      p.fouledOut = true;
      logEvent('🚫 ' + p.name + ' FOULED OUT', 'foul');
    } else {
      logEvent('#' + p.number + ' ' + p.name + ' personal foul (' + p.fouls + ')', 'foul');
    }
    renderPlayers(team);
    renderStats(team);
  } else {
    logEvent(getTeamName(team) + ' team foul', 'foul');
  }

  updateFoulDisplay(team);

  // Bonus: first time reaching 5 fouls in a quarter
  const nowInBonus = state.quarterFouls[team] >= 5;
  const opp = team === 'a' ? 'b' : 'a';

  if (!wasInBonus && nowInBonus) {
    logEvent(getTeamName(opp) + ' enters BONUS — 2 Free Throws on next foul', 'bonus');
  } else if (wasInBonus) {
    logEvent(getTeamName(opp) + ' awarded 2 Free Throws (BONUS)', 'bonus');
  }
}

// Refresh all foul-related UI for a team
function updateFoulDisplay(team) {
  const count = state.quarterFouls[team];
  const opp   = team === 'a' ? 'b' : 'a';

  // Update foul count number and dots for the team that committed fouls
  document.getElementById('fouls-' + team).textContent = count;

  // Fill foul dots up to 5
  document.querySelectorAll('#fdots-' + team + ' .foul-dot').forEach((dot, i) => {
    dot.classList.toggle('active', i < Math.min(count, 5));
  });

  // BONUS badge shows on the OPPOSING team — they receive the free throws
  document.getElementById('bonus-' + opp).classList.toggle('visible', count >= 5);
}


// ── 7. RENDER ────────────────────────────────────

// Rebuild the player list inside the team panel
function renderPlayers(team) {
  const container = document.getElementById('players-' + team);
  const players   = state.players[team];

  if (players.length === 0) {
    container.innerHTML = state.skipPlayers
      ? ''
      : '<p style="font-size:.78rem;color:var(--muted);padding:4px 2px">No players added.</p>';
    return;
  }

  // Build one row per player using template strings
  container.innerHTML = players.map((p, i) => {
    const foulClass = p.fouls >= 4 ? 'danger' : '';
    const rowClass  = p.fouledOut ? 'fouled-out' : '';
    return (
      '<div class="player-row ' + rowClass + '">' +
        '<span class="player-number">' + p.number + '</span>' +
        '<span class="player-name-cell">' +
          '<span class="player-name">' + p.name + '</span>' +
          '<span class="fouled-out-label">Fouled Out</span>' +
        '</span>' +
        '<span class="player-pts">' + p.pts + ' pts</span>' +
        '<span class="player-fouls-pill ' + foulClass + '">' + p.fouls + 'F</span>' +
      '</div>'
    );
  }).join('');
}

// Rebuild the stats table below the main area
function renderStats(team) {
  const container = document.getElementById('stats-' + team);
  const header    = document.getElementById('stats-header-' + team);

  // Sort by points descending so top scorer is first
  const players = [...state.players[team]].sort((a, b) => b.pts - a.pts);

  header.textContent = getTeamName(team) + ' — ' + state.scores[team] + ' pts';

  if (players.length === 0) {
    container.innerHTML = '<p class="no-players">No players added.</p>';
    return;
  }

  container.innerHTML =
    '<table>' +
      '<thead><tr><th>#</th><th>Name</th><th>Pts</th><th>Fouls</th><th>Status</th></tr></thead>' +
      '<tbody>' +
        players.map(p =>
          '<tr class="' + (p.fouledOut ? 'fouled-out-row' : '') + '">' +
            '<td style="color:var(--amber);font-family:var(--font-score)">' + p.number + '</td>' +
            '<td class="name-cell">' + p.name + '</td>' +
            '<td class="pts-cell">' + p.pts + '</td>' +
            '<td class="fouls-cell">' + p.fouls + '</td>' +
            '<td style="font-size:.72rem">' +
              (p.fouledOut
                ? '<span style="color:var(--red);font-weight:600">FOULED OUT</span>'
                : p.fouls >= 4
                  ? '<span style="color:var(--orange)">Danger (' + p.fouls + '/5)</span>'
                  : '<span style="color:var(--green)">Active</span>') +
            '</td>' +
          '</tr>'
        ).join('') +
      '</tbody>' +
    '</table>';
}


// ── 8. QUARTERS ──────────────────────────────────

function changeQuarter(delta) {
  const next = state.quarter + delta;
  if (next < 1 || next > 4) return;

  state.quarter = next;

  // Team fouls reset at the start of each quarter
  // Personal fouls DO NOT reset — they persist the whole game
  state.quarterFouls.a = 0;
  state.quarterFouls.b = 0;
  updateFoulDisplay('a');
  updateFoulDisplay('b');

  // Update quarter labels in foul sections
  document.getElementById('qtr-foul-label-a').textContent = next;
  document.getElementById('qtr-foul-label-b').textContent = next;
  document.getElementById('qtr-label').textContent = next;

  updateQuarterDots();

  // Pause timer and reset it for the new quarter
  pauseTimer();
  state.timer.seconds = state.quarterDuration;
  updateTimerDisplay();

  logEvent('Quarter ' + next + ' started', 'qtr');
}

// Update the 4 dot indicators in the center scoreboard
function updateQuarterDots() {
  document.querySelectorAll('#qtr-dots .q-dot').forEach((dot, i) => {
    dot.classList.remove('done', 'current');
    if (i + 1 <  state.quarter) dot.classList.add('done');
    if (i + 1 === state.quarter) dot.classList.add('current');
  });
}


// ── 9. TIMER ─────────────────────────────────────

// setInterval fires every 1000ms (1 second)
// We store the interval ID so we can stop it (pauseTimer)
function startTimer() {
  if (state.timer.running) return;
  state.timer.running = true;
  document.getElementById('timer').classList.replace('paused', 'running');
  document.getElementById('btn-play-pause').textContent = '⏸';

  state.timer.interval = setInterval(function () {
    if (state.timer.seconds <= 0) {
      pauseTimer();
      logEvent('Q' + state.quarter + ' buzzer!', 'qtr');
      return;
    }
    state.timer.seconds--;
    updateTimerDisplay();
  }, 1000);
}

function pauseTimer() {
  if (!state.timer.running) return;
  clearInterval(state.timer.interval);
  state.timer.running = false;
  document.getElementById('timer').classList.replace('running', 'paused');
  document.getElementById('btn-play-pause').textContent = '▶';
}

// Convert raw seconds into MM:SS string
// e.g. 497 → "08:17"
// padStart(2, '0') adds a leading zero: 7 → '07'
function updateTimerDisplay() {
  const m = Math.floor(state.timer.seconds / 60);
  const s = state.timer.seconds % 60;
  document.getElementById('timer').textContent =
    String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}

document.getElementById('btn-play-pause').addEventListener('click', function () {
  state.timer.running ? pauseTimer() : startTimer();
});

document.getElementById('btn-reset-timer').addEventListener('click', function () {
  pauseTimer();
  state.timer.seconds = state.quarterDuration;
  updateTimerDisplay();
});


// ── 10. GAME LOG ─────────────────────────────────

// Prepend a new entry to the log (newest at the top)
function logEvent(text, type) {
  const log   = document.getElementById('game-log');
  const time  = document.getElementById('timer').textContent;
  const entry = document.createElement('div');
  entry.className = 'log-entry';
  entry.innerHTML =
    '<span class="log-time">Q' + state.quarter + ' ' + time + '</span>' +
    '<span class="log-text">' + text + '</span>' +
    '<span class="log-badge ' + type + '">' + type.toUpperCase() + '</span>';
  log.insertBefore(entry, log.firstChild);
}


// ── 11. END / RESET ──────────────────────────────

document.getElementById('btn-end-game').addEventListener('click', function () {
  pauseTimer();
  const a  = state.scores.a;
  const b  = state.scores.b;
  const nA = getTeamName('a');
  const nB = getTeamName('b');

  document.getElementById('winner-text').textContent =
    a === b ? "🤝 It's a Tie!" : '🏆 ' + (a > b ? nA : nB) + ' Wins!';
  document.getElementById('winner-sub').textContent =
    'Final: ' + nA + ' ' + a + ' – ' + b + ' ' + nB;

  document.getElementById('winner-banner').classList.add('visible');
  document.getElementById('winner-banner').scrollIntoView({ behavior: 'smooth' });
});

document.getElementById('btn-reset').addEventListener('click', function () {
  if (!confirm('Reset game? All data will be cleared.')) return;

  pauseTimer();

  // Clear all state
  state.scores       = { a: 0, b: 0 };
  state.history      = { a: [], b: [] };
  state.quarterFouls = { a: 0, b: 0 };
  state.players      = { a: [], b: [] };
  state.quarter      = 1;

  // Go back to setup page
  document.getElementById('game-page').style.display  = 'none';
  document.getElementById('setup-page').style.display = 'flex';

  // Clear setup form fields
  document.getElementById('setup-name-a').value = '';
  document.getElementById('setup-name-b').value = '';
  document.getElementById('skip-players-check').checked = false;
  document.getElementById('custom-time-group').style.display = 'none';
  document.getElementById('setup-qtr-time').value = '720';

  ['a', 'b'].forEach(function (t) {
    document.getElementById('setup-players-' + t).innerHTML = '';
    addSetupRow(t); addSetupRow(t); addSetupRow(t);
  });

  document.getElementById('setup-col-title-a').textContent = 'Home Team';
  document.getElementById('setup-col-title-b').textContent = 'Away Team';
  document.getElementById('winner-banner').classList.remove('visible');
  document.getElementById('game-log').innerHTML = '';
});

// Helper — reads the team name from its label element
function getTeamName(team) {
  return document.getElementById('label-' + team).textContent;
}
