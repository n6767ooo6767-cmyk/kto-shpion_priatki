// --- ОБЩАЯ СИСТЕМА ПЕРЕКЛЮЧЕНИЯ ЭКРАНОВ ---
function switchScreen(screenId) {
    document.querySelectorAll('.screen-view').forEach(s => s.classList.add('hidden'));
    document.getElementById(screenId).classList.remove('hidden');
}

function backToAuth(authScreenId) {
    switchScreen(authScreenId);
}

// ========================================================
// ИГРА №3: ТАЙМ-БАТТЛ
// ========================================================
let timePlayers = [];
let timeTarget = 0;
let holdStart = 0;
let isTimeActive = false;

function startTimeGame() {
    const room = document.getElementById('time-room-input').value.trim() || 'local';
    const name = document.getElementById('time-name-input').value.trim();
    if (!name) return alert("Введите имя!");

    const key = `arcade_time_${room}`;
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

    const room = document.getElementById('time-room-input').value.trim() || 'local';
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
    localStorage.setItem(`arcade_time_${room}`, JSON.stringify(timePlayers));
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
// ИГРА №1: КАДР ЗА КАДРОМ
// ========================================================
const frameDatabase = [
    { img: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600", right: "Наруто", variants: ["Ван Пис", "Наруто", "Атака Титанов", "Клинок рассекающий демонов"] },
    { img: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600", right: "Гарри Поттер", variants: ["Властелин Колец", "Гарри Поттер", "Хроники Нарнии", "Звёздные Войны"] },
    { img: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600", right: "Аватар", variants: ["Интерстеллар", "Мстители", "Аватар", "Трансформеры"] },
    { img: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600", right: "Твоё имя", variants: ["Унесённые призраками", "Твоё имя", "Форма голоса", "Дитя погоды"] }
];

let framePlayers = [];
let currentFrameRound = 0;
let frameTimeLeft = 20;
let frameTimerInterval = null;
let currentBlur = 25;

function startFrameGame() {
    const room = document.getElementById('frame-room-input').value.trim() || 'local';
    const name = document.getElementById('frame-name-input').value.trim();
    if (!name) return alert("Введите имя!");

    const key = `arcade_frame_${room}`;
    framePlayers = JSON.parse(localStorage.getItem(key)) || [];
    if (!framePlayers.some(p => p.name === name)) {
        framePlayers.push({ name: name, score: 0, done: false });
    }
    localStorage.setItem(key, JSON.stringify(framePlayers));

    switchScreen('game-frame');
    if (framePlayers.every(p => !p.done)) loadFrameRound();
    updateFrameLeaderboard();
}

function loadFrameRound() {
    clearInterval(frameTimerInterval);
    const roundData = frameDatabase[currentFrameRound % frameDatabase.length];
    
    document.getElementById('cinema-shot').src = roundData.img;
    document.getElementById('frame-round-num').innerText = `${(currentFrameRound % frameDatabase.length) + 1}/${frameDatabase.length}`;
    
    // Сброс размытия и времени
    frameTimeLeft = 20;
    currentBlur = 25;
    const blurLayer = document.getElementById('blur-layer');
    blurLayer.style.backdropFilter = `blur(${currentBlur}px)`;
    blurLayer.style.webkitBackdropFilter = `blur(${currentBlur}px)`;

    // Рендер кнопок вариантов
    const container = document.getElementById('variants-container');
    container.innerHTML = '';
    roundData.variants.forEach(variant => {
        container.innerHTML += `<button class="btn-variant" onclick="checkFrameAnswer(this, '${variant}')">${variant}</button>`;
    });

    // Запуск таймера фокусировки кадра
    frameTimerInterval = setInterval(() => {
        frameTimeLeft--;
        document.getElementById('frame-timer').innerText = `Таймер: ${frameTimeLeft}с`;
        
        // Каждые 4 секунды картинка становится чётче!
        if (frameTimeLeft % 4 === 0 && currentBlur > 0) {
            currentBlur -= 5;
            blurLayer.style.backdropFilter = `blur(${currentBlur}px)`;
            blurLayer.style.webkitBackdropFilter = `blur(${currentBlur}px)`;
        }

        if (frameTimeLeft <= 0) {
            clearInterval(frameTimerInterval);
            revealFrameResult();
        }
    }, 1000);
}

function checkFrameAnswer(btn, answer) {
    clearInterval(frameTimerInterval);
    const roundData = frameDatabase[currentFrameRound % frameDatabase.length];
    const room = document.getElementById('frame-room-input').value.trim() || 'local';
    
    let p = framePlayers.find(p => !p.done);
    let pts = 0;

    if (answer === roundData.right) {
        btn.classList.add('correct');
        // Чем быстрее ответил (больше blur) — тем больше очков!
        pts = frameTimeLeft * 10;
        if (p) p.score += pts;
        alert(`Правильно! +${pts} очков.`);
    } else {
        btn.classList.add('wrong');
        alert(`Неверно! Правильный ответ: ${roundData.right}`);
    }

    if (p) p.done = true;
    localStorage.setItem(`arcade_frame_${room}`, JSON.stringify(framePlayers));
    revealFrameResult();
}

function revealFrameResult() {
    // Полностью убираем размытие в конце раунда
    document.getElementById('blur-layer').style.backdropFilter = 'blur(0px)';
    document.getElementById('blur-layer').style.webkitBackdropFilter = 'blur(0px)';
    
    document.getElementById('frame-next-btn').classList.remove('hidden');
    updateFrameLeaderboard();
}

function updateFrameLeaderboard() {
    const box = document.getElementById('frame-leaderboard'); box.innerHTML = '';
    [...framePlayers].sort((a,b)=>b.score-a.score).forEach(p => {
        box.innerHTML += `<div class="player-row ${p.done?'done':''}"><div class="player-info"><div class="status-dot"></div><span><b>${p.name}</b></span></div><div class="score-badge">${p.score} 🏆</div></div>`;
    });
}

function nextFrameRound() {
    currentFrameRound++;
    framePlayers.forEach(p => p.done = false);
    document.getElementById('frame-next-btn').classList.add('hidden');
    loadFrameRound();
    updateFrameLeaderboard();
}
