// --- ОБЩАЯ СИСТЕМА ПЕРЕКЛЮЧЕНИЯ ЭКРАНОВ ---
function switchScreen(screenId) {
    document.querySelectorAll('.screen-view').forEach(s => s.classList.add('hidden'));
    document.getElementById(screenId).classList.remove('hidden');
}

function backToAuth(authScreenId) {
    switchScreen(authScreenId);
}

// ========================================================
// ИГРА №3: ТАЙМ-БАТТЛ (С Кодом Группы)
// ========================================================
let timePlayers = [];
let timeTarget = 0;
let holdStart = 0;
let isTimeActive = false;

function startTimeGame() {
    const room = document.getElementById('time-room-input').value.trim();
    const name = document.getElementById('time-name-input').value.trim();
    if (!room || !name) return alert("Введите код группы и ваше имя!");

    const key = `arcade_time_group_${room}`;
    timePlayers = JSON.parse(localStorage.getItem(key)) || [];
    if (!timePlayers.some(p => p.name === name)) {
        timePlayers.push({ name: name, score: 0, last: null, done: false });
    }
    localStorage.setItem(key, JSON.stringify(timePlayers));

    switchScreen('game-time');
    document.getElementById('time-room-id').innerText = room;
    
    if (!isTimeActive && timePlayers.every(p => !p.done)) generateTimeTarget();
    updateTimeLeaderboard();
}

function generateTimeTarget() {
    timeTarget = (Math.random() * (4.5 - 1.5) + 1.5).toFixed(2);
    document.getElementById('target-time').innerText = timeTarget;
    document.getElementById('time-status').innerText = "Зажимай кнопку!";
    isTimeActive = true;
}

function startHolding(e) { if(isTimeActive) { if(e) e.preventDefault(); holdStart = performance.now(); document.getElementById('time-status').innerText = "Часы тикают... ⏱️"; } }
function stopHolding(e) {
    if(!isTimeActive || holdStart === 0) return;
    if(e) e.preventDefault();
    const duration = ((performance.now() - holdStart) / 1000).toFixed(3);
    holdStart = 0;

    const diff = Math.abs(duration - timeTarget).toFixed(3);
    const pts = Math.max(0, Math.round(1000 - diff * 1000));

    const room = document.getElementById('time-room-input').value.trim();
    let p = timePlayers.find(p => !p.done);
    if (p) {
        p.last = duration; p.score += pts; p.done = true;
        alert(`${p.name}: ${duration}с (Цель: ${timeTarget}с) -> +${pts} очков!`);
    }

    if (timePlayers.every(p => p.done)) {
        isTimeActive = false;
        document.getElementById('time-status').innerText = "Раунд окончен!";
        document.getElementById('time-next-btn').classList.remove('hidden');
    }
    localStorage.setItem(`arcade_time_group_${room}`, JSON.stringify(timePlayers));
    updateTimeLeaderboard();
}

function updateTimeLeaderboard() {
    const box = document.getElementById('time-leaderboard'); box.innerHTML = '';
    [...timePlayers].sort((a,b)=>b.score-a.score).forEach(p => {
        box.innerHTML += `<div class="player-row ${p.done?'done':''}"><div class="player-info"><div class="status-dot"></div><span><b>${p.name}</b> ${p.done?'| '+p.last+'с':'| 🤔'}</span></div><div class="score-badge">${p.score} 🏆</div></div>`;
    });
}

function nextTimeRound() {
    timePlayers.forEach(p => p.done = false);
    document.getElementById('time-next-btn').classList.add('hidden');
    generateTimeTarget(); updateTimeLeaderboard();
}


// ========================================================
// ИГРА №1: ЗАГАДАЙ & УГАДАЙ (Переделанная под твою идею)
// ========================================================
const moviesPool = [
    "Наруто", "Гарри Поттер", "Аватар", "Твоё имя", "Шрек", "Титаник", "Интерстеллар", 
    "Бэтмен", "Губка Боб", "Пираты Карибского Моря", "Смешарики", "Атака Титанов", 
    "Властелин Колец", "Человек-Паук", "Звёздные Войны", "Матрица", "Железный Человек"
];

let framePlayers = [];
let hostIndex = 0;
let secretChoice = "";
let currentRoundVariants = [];
let gameState = "hosting"; // hosting, guessing, finished

function startFrameGame() {
    const room = document.getElementById('frame-room-input').value.trim();
    const name = document.getElementById('frame-name-input').value.trim();
    if (!room || !name) return alert("Введите код группы и ваше имя!");

    const key = `arcade_frame_group_${room}`;
    framePlayers = JSON.parse(localStorage.getItem(key)) || [];
    if (!framePlayers.some(p => p.name === name)) {
        framePlayers.push({ name: name, score: 0, guessed: false });
    }
    localStorage.setItem(key, JSON.stringify(framePlayers));

    switchScreen('game-frame');
    document.getElementById('frame-room-id').innerText = room;
    
    initFrameRound();
    updateFrameLeaderboard();
}

// Инициализация раунда
function initFrameRound() {
    if (framePlayers.length === 0) return;
    
    gameState = "hosting";
    secretChoice = "";
    
    // Определяем ведущего текущего раунда
    let currentHost = framePlayers[hostIndex % framePlayers.length];
    document.getElementById('current-host-name').innerText = currentHost.name;
    document.getElementById('frame-role-status').innerText = "Ведущий загадывает";
    document.getElementById('frame-main-instruction').innerText = "Возьми девайс и тайно кликни на один фильм из списка ниже!";
    document.getElementById('frame-submit-choice-btn').classList.add('hidden');
    document.getElementById('frame-next-btn').classList.add('hidden');

    // Генерируем 4 случайных названия
    let shuffled = [...moviesPool].sort(() => 0.5 - Math.random());
    currentRoundVariants = shuffled.slice(0, 4);

    renderVariantsButtons(true);
}

// Вывод кнопок
function renderVariantsButtons(isHostPhase) {
    const container = document.getElementById('variants-container');
    container.innerHTML = '';

    currentRoundVariants.forEach(variant => {
        const btn = document.createElement('button');
        btn.className = 'btn-variant';
        btn.innerText = variant;

        if (isHostPhase) {
            btn.onclick = () => {
                secretChoice = variant;
                // Подсвечиваем выбор ведущего
                document.querySelectorAll('.btn-variant').forEach(b => b.style.border = '2px solid #251b54');
                btn.style.border = '2px solid var(--neon-pink)';
                document.getElementById('frame-main-instruction').innerText = `Ты загадал: "${variant}". Теперь нажми кнопку ниже и передай телефон друзьям!`;
                document.getElementById('frame-submit-choice-btn').classList.remove('hidden');
            };
        } else {
            // Фаза угадывания для остальных игроков
            btn.onclick = () => {
                if (gameState !== "guessing") return;
                
                let p = framePlayers.find(pl => pl.name !== framePlayers[hostIndex % framePlayers.length].name && !pl.guessed);
                
                if (variant === secretChoice) {
                    btn.classList.add('correct');
                    if (p) p.score += 250; // Даем очки за угадывание
                    alert(`Правильно! Это был "${secretChoice}". +250 очков!`);
                } else {
                    btn.classList.add('wrong');
                    alert(`Мимо! Ведущий загадал не это. Правильный ответ скрывался!`);
                }
                
                if(p) p.guessed = true;
                
                // Проверяем, все ли угадали (кроме самого ведущего)
                let guessers = framePlayers.filter(pl => pl.name !== framePlayers[hostIndex % framePlayers.length].name);
                if (guessers.every(pl => pl.guessed)) {
                    gameState = "finished";
                    document.getElementById('frame-role-status').innerText = "Раунд завершён";
                    document.getElementById('frame-main-instruction').innerText = `Все сделали ходы! Ответ ведущего: ${secretChoice}`;
                    document.getElementById('frame-next-btn').classList.remove('hidden');
                } else {
                    document.getElementById('frame-main-instruction').innerText = "Передай телефон следующему игроку для ответа!";
                }
                
                const room = document.getElementById('frame-room-input').value.trim();
                localStorage.setItem(`arcade_frame_group_${room}`, JSON.stringify(framePlayers));
                updateFrameLeaderboard();
            };
        }
        container.appendChild(btn);
    });
}

// Ведущий сделал выбор и передает телефон
function startGuessingPhase() {
    gameState = "guessing";
    document.getElementById('frame-role-status').innerText = "Игроки угадывают";
    document.getElementById('frame-main-instruction').innerText = "Передай телефон друзьям. Кто взял телефон — выберите, что загадал ведущий!";
    document.getElementById('frame-submit-choice-btn').classList.add('hidden');
    
    // Перерисовываем кнопки, убирая подсветку выбора хоста
    renderVariantsButtons(false);
}

function updateFrameLeaderboard() {
    const box = document.getElementById('frame-leaderboard'); box.innerHTML = '';
    let currentHost = framePlayers[hostIndex % framePlayers.length];
    
    [...framePlayers].sort((a,b)=>b.score-a.score).forEach(p => {
        let role = (currentHost && p.name === currentHost.name) ? '👑 Ведущий' : (p.guessed ? '✅ Сходил' : '🤔 Думает');
        box.innerHTML += `<div class="player-row"><div class="player-info"><div class="status-dot"></div><span><b>${p.name}</b> (${role})</span></div><div class="score-badge">${p.score} 🏆</div></div>`;
    });
}

function nextFrameRound() {
    hostIndex++; // Меняем ведущего
    framePlayers.forEach(p => p.guessed = false);
    
    const room = document.getElementById('frame-room-input').value.trim();
    localStorage.setItem(`arcade_frame_group_${room}`, JSON.stringify(framePlayers));
    
    initFrameRound();
    updateFrameLeaderboard();
}
