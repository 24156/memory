/* =====================================================
   MEMORY GAME – game.js  (version arabe + 2 mots français)
   Algorithme : Tour par tour, scores, podium, localStorage
   ===================================================== */

'use strict';

// ── Emoji sets ────────────────────────────────────────────────────────────────
const EMOJIS = {
    easy: ['🐶', '🐱', '🦊', '🐻', '🐼', '🦁', '🐯', '🐸'],
    medium: ['🌺', '🌻', '🌈', '⚡', '🍕', '🎸', '🚀', '🦋', '🎯', '🏆', '🌊', '🎮'],
    hard: ['🦄', '🐉', '👾', '🤖', '🎃', '🦑', '🌙', '☄️', '🍄', '🧿', '🔮', '💎', '🎲', '🧩', '🎭', '🏰', '🦅', '🐙']
};

// ── Palette par joueur ────────────────────────────────────────────────────────
const PLAYER_COLORS = [
    { color: '#a855f7', glow: 'rgba(168,85,247,0.4)', bg: 'rgba(168,85,247,0.15)' },
    { color: '#ec4899', glow: 'rgba(236,72,153,0.4)', bg: 'rgba(236,72,153,0.15)' },
    { color: '#22d3ee', glow: 'rgba(34,211,238,0.4)', bg: 'rgba(34,211,238,0.15)' },
    { color: '#fbbf24', glow: 'rgba(251,191,36,0.4)', bg: 'rgba(251,191,36,0.15)' },
    { color: '#34d399', glow: 'rgba(52,211,153,0.4)', bg: 'rgba(52,211,153,0.15)' },
    { color: '#fb7185', glow: 'rgba(251,113,133,0.4)', bg: 'rgba(251,113,133,0.15)' }
];

const PLAYER_AVATARS = ['🐶', '🐱', '🦊', '🐻', '🐼', '🦁'];
const RANK_ICONS = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣'];
const CONFETTI_COLORS = ['#7c3aed', '#a855f7', '#ec4899', '#f59e0b', '#06b6d4', '#10b981', '#f43f5e', '#3b82f6'];

// ── DOM refs ──────────────────────────────────────────────────────────────────
const setupOverlay = document.getElementById('setupOverlay');
const gameScreen = document.getElementById('gameScreen');
const playerNamesEl = document.getElementById('playerNames');
const setupLevelBtns = document.querySelectorAll('#setupLevelBtns .level-btn');
const btnStart = document.getElementById('btnStart');

const cardGrid = document.getElementById('cardGrid');
const movesEl = document.getElementById('movesCount');
const timerEl = document.getElementById('timerDisplay');
const pairsEl = document.getElementById('pairsCount');
const turnBanner = document.getElementById('turnBanner');
const turnAvatar = document.getElementById('turnAvatar');
const turnName = document.getElementById('turnName');
const turnStreak = document.getElementById('turnStreak');
const playersBar = document.getElementById('playersBar');

const winOverlay = document.getElementById('winOverlay');
const winTrophy = document.getElementById('winTrophy');
const winTitleEl = document.getElementById('winTitle');
const winSubEl = document.getElementById('winSub');
const podiumEl = document.getElementById('podium');
const winTimeEl = document.getElementById('winTime');
const winMovesEl = document.getElementById('winMoves');
const confettiEl = document.getElementById('confetti');
const btnReplay = document.getElementById('btnReplay');
const btnWinReplay = document.getElementById('btnWinReplay');
const btnWinMenu = document.getElementById('btnWinMenu');

// ── État ──────────────────────────────────────────────────────────────────────
let players = [];
let currentPlayer = 0;
let flippedCards = [];
let matchedPairs = 0;
let totalPairs = 0;
let moves = 0;
let timerInterval = null;
let seconds = 0;
let gameStarted = false;
let isLocked = false;
let currentLevel = 'easy';
let numPlayers = 1;

// ═══════════════════════════════════════════════════════════════
//  شاشة الإعداد
// ═══════════════════════════════════════════════════════════════

document.querySelectorAll('.count-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.count-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        numPlayers = parseInt(btn.dataset.count, 10);
        renderPlayerInputs(numPlayers);
    });
});

setupLevelBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        setupLevelBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentLevel = btn.dataset.level;
    });
});

function renderPlayerInputs(count) {
    playerNamesEl.innerHTML = '';
    for (let i = 0; i < count; i++) {
        const pal = PLAYER_COLORS[i];
        const row = document.createElement('div');
        row.classList.add('player-input-row');

        const dot = document.createElement('div');
        dot.classList.add('player-color-dot');
        dot.style.background = pal.color;
        dot.style.boxShadow = `0 0 8px ${pal.glow}`;

        const emojiSpan = document.createElement('span');
        emojiSpan.classList.add('player-emoji');
        emojiSpan.textContent = PLAYER_AVATARS[i];

        const input = document.createElement('input');
        input.type = 'text';
        input.maxLength = 16;
        input.placeholder = `لاعب ${i + 1}`;
        input.value = savedName(i) || '';
        input.id = `playerInput${i}`;
        input.classList.add('player-input');

        row.appendChild(dot);
        row.appendChild(emojiSpan);
        row.appendChild(input);
        playerNamesEl.appendChild(row);
    }
}

function savedName(i) {
    return localStorage.getItem(`memoryPlayerName_${i}`) || '';
}

btnStart.addEventListener('click', () => {
    players = [];
    for (let i = 0; i < numPlayers; i++) {
        const inputEl = document.getElementById(`playerInput${i}`);
        const name = inputEl ? inputEl.value.trim() : '';
        const finalName = name || `لاعب ${i + 1}`;
        localStorage.setItem(`memoryPlayerName_${i}`, finalName);
        players.push({
            name: finalName,
            color: PLAYER_COLORS[i].color,
            glow: PLAYER_COLORS[i].glow,
            bg: PLAYER_COLORS[i].bg,
            avatar: PLAYER_AVATARS[i],
            pairs: 0,
            streak: 0
        });
    }

    setupOverlay.style.opacity = '0';
    setupOverlay.style.transition = 'opacity 0.4s ease';
    setTimeout(() => {
        setupOverlay.style.display = 'none';
        gameScreen.style.display = 'flex';
        initGame();
    }, 400);
});

renderPlayerInputs(numPlayers);

// ═══════════════════════════════════════════════════════════════
//  منطق اللعبة
// ═══════════════════════════════════════════════════════════════

btnReplay.addEventListener('click', backToMenu);
btnWinReplay.addEventListener('click', () => {
    winOverlay.classList.remove('active');
    initGame();
});
btnWinMenu.addEventListener('click', () => {
    winOverlay.classList.remove('active');
    backToMenu();
});

function backToMenu() {
    clearInterval(timerInterval);
    gameScreen.style.display = 'none';
    setupOverlay.style.display = 'flex';
    setupOverlay.style.opacity = '1';
}

function initGame() {
    clearInterval(timerInterval);
    timerInterval = null;

    flippedCards = [];
    matchedPairs = 0;
    moves = 0;
    seconds = 0;
    gameStarted = false;
    isLocked = false;
    currentPlayer = 0;

    players.forEach(p => { p.pairs = 0; p.streak = 0; });

    const emojis = EMOJIS[currentLevel];
    totalPairs = emojis.length;

    movesEl.textContent = '0';
    timerEl.textContent = '00:00';
    // ✅ Chiffres normaux comme demandé
    pairsEl.textContent = `0 / ${totalPairs}`;

    renderPlayersBar();
    renderTurnBanner();

    const pairs = shuffle([...emojis, ...emojis]);
    cardGrid.className = `card-grid grid-${currentLevel}`;
    cardGrid.innerHTML = '';
    pairs.forEach((emoji, idx) => cardGrid.appendChild(createCard(emoji, idx)));
}

function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function formatTime(secs) {
    const m = String(Math.floor(secs / 60)).padStart(2, '0');
    const s = String(secs % 60).padStart(2, '0');
    return `${m}:${s}`;
}

function renderPlayersBar() {
    playersBar.innerHTML = '';
    players.forEach((p, i) => {
        const card = document.createElement('div');
        card.classList.add('player-card');
        card.id = `playerCard${i}`;
        card.style.setProperty('--player-color', p.color);
        card.style.setProperty('--player-glow', p.glow);
        if (i === currentPlayer) card.classList.add('active-turn');

        // ✅ "paire/paires" reste en français comme demandé
        card.innerHTML = `
          <div class="pc-avatar" style="background:${p.bg}; border: 2px solid ${p.color}">
            ${p.avatar}
          </div>
          <div class="pc-info">
            <div class="pc-name">${p.name}</div>
            <div class="pc-score" id="pcScore${i}">${p.pairs}</div>
            <div class="pc-score-label" id="pcLabel${i}">paire${p.pairs !== 1 ? 's' : ''}</div>
          </div>`;

        playersBar.appendChild(card);
    });
}

function updatePlayerScore(idx) {
    const p = players[idx];
    const scoreEl = document.getElementById(`pcScore${idx}`);
    const labelEl = document.getElementById(`pcLabel${idx}`);
    // ✅ Chiffres normaux + "paire/paires" en français
    if (scoreEl) scoreEl.textContent = p.pairs;
    if (labelEl) labelEl.textContent = `paire${p.pairs !== 1 ? 's' : ''}`;

    document.querySelectorAll('.player-card').forEach((c, i) => {
        c.classList.toggle('active-turn', i === currentPlayer);
    });
}

function renderTurnBanner() {
    const p = players[currentPlayer];
    turnAvatar.textContent = p.avatar;
    turnAvatar.style.background = p.bg;
    turnAvatar.style.borderColor = p.color;
    turnName.textContent = p.name;
    turnName.style.color = p.color;
    turnStreak.textContent = p.streak > 1 ? `🔥 ×${p.streak}` : '';

    turnBanner.classList.remove('pulse');
    void turnBanner.offsetWidth;
    turnBanner.classList.add('pulse');
}

function createCard(emoji, index) {
    const card = document.createElement('div');
    card.classList.add('card', 'entering');
    card.dataset.emoji = emoji;
    card.style.animationDelay = `${index * 40}ms`;

    const inner = document.createElement('div');
    inner.classList.add('card-inner');

    const back = document.createElement('div');
    back.classList.add('card-back');

    const front = document.createElement('div');
    front.classList.add('card-front');
    front.textContent = emoji;

    inner.appendChild(back);
    inner.appendChild(front);
    card.appendChild(inner);

    card.addEventListener('click', () => onCardClick(card));
    card.addEventListener('animationend', () => card.classList.remove('entering'), { once: true });

    return card;
}

function onCardClick(card) {
    if (isLocked) return;
    if (card.classList.contains('flipped')) return;
    if (card.classList.contains('matched')) return;

    if (!gameStarted) {
        gameStarted = true;
        startTimer();
    }

    card.classList.add('flipped');
    flippedCards.push(card);

    if (flippedCards.length === 2) {
        moves++;
        movesEl.textContent = moves;
        checkMatch();
    }
}

function checkMatch() {
    const [a, b] = flippedCards;
    const p = players[currentPlayer];

    if (a.dataset.emoji === b.dataset.emoji) {
        setTimeout(() => {
            [a, b].forEach(card => {
                card.classList.add('matched');
                card.querySelector('.card-front').style.borderColor = p.color;
                card.querySelector('.card-front').style.boxShadow =
                    `0 8px 32px rgba(0,0,0,0.5), 0 0 18px ${p.glow}`;
            });

            flippedCards = [];
            matchedPairs++;
            p.pairs++;
            p.streak++;

            // ✅ Chiffres normaux
            pairsEl.textContent = `${matchedPairs} / ${totalPairs}`;
            updatePlayerScore(currentPlayer);
            renderTurnBanner();

            showToast(`${p.avatar} ${p.name} وجد زوجاً! ${p.streak > 1 ? '🔥'.repeat(Math.min(p.streak, 3)) : ''}`);

            if (matchedPairs === totalPairs) endGame();
        }, 400);

    } else {
        isLocked = true;
        p.streak = 0;
        a.classList.add('wrong');
        b.classList.add('wrong');

        setTimeout(() => {
            a.classList.remove('flipped', 'wrong');
            b.classList.remove('flipped', 'wrong');
            flippedCards = [];
            isLocked = false;
            nextPlayer();
        }, 900);
    }
}

function nextPlayer() {
    players[currentPlayer].streak = 0;
    currentPlayer = (currentPlayer + 1) % players.length;
    renderTurnBanner();
    updatePlayerScore(currentPlayer);
}

function startTimer() {
    timerInterval = setInterval(() => {
        seconds++;
        timerEl.textContent = formatTime(seconds);
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
}

function endGame() {
    stopTimer();

    const sorted = [...players]
        .map((p, i) => ({ ...p, originalIndex: i }))
        .sort((a, b) => b.pairs - a.pairs);

    const winner = sorted[0];

    if (players.length === 1) {
        winTitleEl.textContent = 'تهانينا!';
        winSubEl.textContent = `${winner.avatar} ${winner.name} – انتهت اللعبة!`;
    } else if (sorted[0].pairs === sorted[1].pairs) {
        winTitleEl.textContent = 'تعادل!';
        winSubEl.textContent = `${sorted[0].name} و ${sorted[1].name} متعادلان 🤝`;
        winTrophy.textContent = '🤝';
    } else {
        winTitleEl.textContent = 'فوز!';
        winSubEl.textContent = `🎉 ${winner.avatar} ${winner.name} فاز باللعبة!`;
    }

    winTimeEl.textContent = formatTime(seconds);
    winMovesEl.textContent = moves;

    podiumEl.innerHTML = '';
    sorted.forEach((p, rank) => {
        const row = document.createElement('div');
        row.classList.add('podium-row');
        row.style.animationDelay = `${rank * 100}ms`;

        // ✅ "paire/paires" en français + chiffres normaux
        row.innerHTML = `
          <div class="podium-rank">${RANK_ICONS[rank]}</div>
          <div class="podium-avatar" style="background:${p.bg}; border:2px solid ${p.color}">
            ${p.avatar}
          </div>
          <div class="podium-name" style="color:${p.color}">${p.name}</div>
          <div>
            <div class="podium-pairs">${p.pairs}</div>
            <span class="podium-pairs-label">paire${p.pairs !== 1 ? 's' : ''}</span>
          </div>`;

        podiumEl.appendChild(row);
    });

    if (players.length === 1) saveBestTime(currentLevel, seconds);

    setTimeout(() => {
        winOverlay.classList.add('active');
        spawnConfetti();
    }, 700);
}

function saveBestTime(level, secs) {
    const key = `memoryBest_${level}`;
    const existing = localStorage.getItem(key);
    if (!existing || secs < parseInt(existing, 10)) {
        localStorage.setItem(key, secs);
        return true;
    }
    return false;
}

let toastTimeout = null;
function showToast(msg) {
    let toast = document.getElementById('gameToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'gameToast';
        toast.classList.add('toast');
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast.classList.remove('show'), 2200);
}

function spawnConfetti() {
    confettiEl.innerHTML = '';
    for (let i = 0; i < 65; i++) {
        const piece = document.createElement('div');
        piece.classList.add('confetti-piece');
        piece.style.left = `${Math.random() * 100}%`;
        piece.style.width = `${6 + Math.random() * 8}px`;
        piece.style.height = `${6 + Math.random() * 8}px`;
        piece.style.background = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
        piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
        const dur = 1.5 + Math.random() * 2;
        const delay = Math.random() * 1;
        piece.style.animation = `confettiFall ${dur}s ${delay}s ease-in forwards`;
        confettiEl.appendChild(piece);
    }
}

document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && winOverlay.classList.contains('active')) {
        winOverlay.classList.remove('active');
        initGame();
    }
});
