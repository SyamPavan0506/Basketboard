# 🏀 BasketBoard — Basketball Score Tracker

A basketball score tracking web app built as my **first frontend project**.  

No frameworks. No libraries. Pure HTML, CSS, and JavaScript.

Features include player statistics, foul tracking, quarter management, game logging, and score management with no external frameworks or libraries.

---

## 📁 Project Structure

```
Basketboard/
├── v1-my-version/       ← Built entirely by me from scratch
│   ├── index.html
│   ├── style.css
│   └── script.js
│
└── v2-full-version/     ← Enhanced version with improved architecture, UX refinements, and additional features developed through AI-assisted iteration
    ├── index1.html
    ├── style1.css
    └── script1.js
```

---

## v1 — My Version

> Built completely from scratch by me as my first frontend project using JavaScript.

### Features
- Team score tracking with +1, +2, +3 buttons
- Quarter foul tracking with Bonus indicator
- Countdown timer with Pause and Resume
- Auto advance to next quarter when timer hits zero
- Player cards with individual points and foul tracking
- Fouled out detection (5 personal fouls)
- Live event timeline log

### What I learned building this
- How to manipulate the DOM using `getElementById` and `innerHTML`
- How `setInterval` works for building a countdown timer
- How to store player data as an array of objects
- How re-rendering a list works after every state change

---

## v2 — Full Version

> Extended version where I identified the gaps in v1 and rebuilt with  
> proper structure, better UX, and real basketball rules implemented correctly.

### ⭐ Key Improvements Over v1

---

#### 1. Setup Page with Jersey Number Assignment
**v1** — Players entered as a comma-separated string. Jersey numbers assigned randomly.  
**v2** — Dedicated setup page with individual input rows per player. Each player gets their own jersey number field. Team names, quarter duration (8 / 10 / 12 min or custom), and rosters are all configured before the game starts.

---

#### 2. ⚡ IMPORTANT — Scoring Modal (Single Entry System)
**v1** — Clicking +1 on the team added to the team total. Then you had to separately click +1 on the player card. **Double entry for every single score.**  
**v2** — Clicking +1 / +2 / +3 opens a popup asking **"Who scored?"**  
- Choose **Team Score** → updates team total only  
- Choose **Player Scored** → select the player → updates **both the player's individual stats AND the team total in one single click**  

This eliminates all double entry and keeps player stats and team totals always in sync automatically.

---

#### 3. ⚡ IMPORTANT — Foul Modal (Team vs Personal Foul)
**v1** — One Foul button. Clicking it added a foul to the team count directly. No distinction between types. Also showed the BONUS badge on the wrong team (the team committing fouls instead of the team receiving free throws).  
**v2** — Clicking Foul opens a popup with two choices:  
- **Team Foul** → increments team foul count  
- **Personal Foul** → shows the player list → select the player → increments both that player's personal foul count AND the team foul count simultaneously  

Additional foul rules implemented correctly:
- Team fouls reset to 0 at the start of every new quarter
- Personal fouls persist across all quarters for the whole game
- When a player reaches 5 personal fouls they are marked **Fouled Out / Disqualified**
- Their scoring and foul buttons are disabled automatically
- When a team reaches 5 fouls in a quarter, the **BONUS badge appears on the opposing team** (correct — they are the ones getting free throws)
- Every foul after bonus triggers a **"2 Free Throws awarded"** alert in the game log

---

#### 4. ⚡ IMPORTANT — Timer: Auto-driven vs Manually-driven
**v1** — Timer driven. The game advances automatically when the countdown hits zero. Each quarter starts and ends based on the clock.  
**v2** — Manually driven. The user controls when to advance to the next quarter using Prev / Next buttons. The timer can be started, paused, and reset independently.  

**Why manual control is better for real use:**  
In an actual basketball game, referees stop the clock constantly — for fouls, timeouts, out of bounds, free throws. A purely automatic timer would go out of sync with the real game immediately. Manual control lets the scorekeeper match what's happening on the court exactly.

---

#### 5. ⚡ IMPORTANT — Undo Button
**v1** — No undo. If you accidentally clicked +2 instead of +1, you had to manually subtract — which wasn't even possible without resetting.  
**v2** — Every score action pushes the previous total onto a history stack. The Undo button pops the last value and restores it instantly. Works independently for each team.

---

#### 6. UI / UX Design
**v1** — Functional but unstyled. Plain HTML buttons, no colour system, no typography, basic layout.  
**v2** — Full dark court theme designed from scratch:
- Deep navy background (`#0D1B2A`) mimicking a court atmosphere
- Amber (`#F5A623`) as the primary accent — the colour of a basketball
- `Oswald` font for all score numbers (bold, athletic feel)
- `Inter` font for UI labels and text
- Green flash animation when points are added
- Pulsing orange BONUS badge animation
- Color-coded game log entries (green for points, red for fouls, amber for quarter events, orange for bonus alerts)
- Player status indicators: Active (green) / Danger at 4 fouls (orange) / Fouled Out (red, faded row)
- Modal popups with smooth overlay for all interactions
- Quarter progress dots in the center scoreboard

---

### Additional Features in v2
- **End Game button** — shows a winner banner with final score
- **Reset Game** — takes you back to setup with a fresh form
- **Player Statistics table** — full breakdown sorted by points with status column
- **Game log with timestamps** — every event logged with quarter number and clock time
- **Bonus/Penalty indicator** — clearly displayed on the correct team

---

## 🛠 Tech Stack

| Technology | Usage |
|---|---|
| HTML5 | Page structure and layout |
| CSS3 | Styling, animations, CSS variables, Grid, Flexbox |
| JavaScript (Vanilla) | All game logic, DOM manipulation, state management |

No frameworks. No npm. No build tools. Open `index.html` directly in a browser.

---

## 🚀 How to Run

### Option 1 — Download ZIP
1. Click **Code → Download ZIP**
2. Extract the ZIP file
3. Open either `v1-my-version` or `v2-full-version`
4. Open `index.html` in your browser

### Option 2 — Clone with Git

```bash
git clone https://github.com/SyamPavan0506/Basketboard.git
```

1. Open either `v1-my-version` or `v2-full-version`
2. Open `index.html` in your browser
   
---

## 👨‍💻 Author

**Kotagiri Syam Pavan Deep** — B.Tech AI & Data Science  
[GitHub](https://github.com/SyamPavan0506) • [LinkedIn](https://www.linkedin.com/in/syampavan/)
