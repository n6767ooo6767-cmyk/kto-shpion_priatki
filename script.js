// Настройки игры
let players = [];
let targetTime = 0;
let holdStartTime = 0;
let currentPlayerIndex = 0;
let isGameActive = false;

// 1. СТАРТ ИГРЫ (Локальное создание лобби)
function startTimeGame(isHost) {
    const nameInput = document.getElementById('name-input').value.trim();
    const roomInput = document.getElementById('room-input').value.trim(); // Используем как имя группы/сессии

    if (!nameInput) return alert("Введите ваше имя!");

    // Инициализируем локальную сессию
    const sessionKey = `time_battle_${roomInput || 'local'}`;
    const savedData = localStorage.getItem(sessionKey);
    
    if (savedData) {
        players = JSON.parse(savedData);
    } else {
        players = [];
    }

    // Если игрока с таким именем нет — добавляем
    if (!players.some(p => p.name === nameInput)) {
        players.push({ name: nameInput, score: 0, lastResult: null, done: false });
    }

    localStorage.setItem(sessionKey, JSON.stringify(players));
    
    // Переход на игровой экран
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    document.getElementById('room-id').innerText = roomInput || "Локальная";
    
    // Генерируем цель для первого раунда
    generateNewTarget();
    updateLeaderboard();
}

// 2. ГЕНЕРАЦИЯ СЛУЧАЙНОЙ ЦЕЛИ ВРЕМЕНИ
function generateNewTarget() {
    // Случайное время от 1.50 до 5.00 секунд
    targetTime = (Math.random() * (5.0 - 1.5) + 1.5).toFixed(2);
    document.getElementById('target-time').innerText = targetTime;
    document.getElementById('game-status').innerText = "Передайте телефон игроку!";
    isGameActive = true;
}

// 3. МЕХАНИКА НАЖАТИЯ И УДЕРЖАНИЯ КНОПКИ
function startHolding(event) {
    if (!isGameActive) return;
    if (event) event.preventDefault(); // Защита от двойного тапа на мобилках
    
    holdStartTime = performance.now();
    document.getElementById('game-status').innerText = "Внутренние часы пошли... ⏱️";
}

function stopHolding(event) {
    if (!isGameActive || holdStartTime === 0) return;
    if (event) event.preventDefault();

    const holdEndTime = performance.now();
    const durationSeconds = ((holdEndTime - holdStartTime) / 1000).toFixed(3);
    holdStartTime = 0; // Сброс

    // Считаем разницу с целью
    const difference = Math.abs(durationSeconds - targetTime).toFixed(3);
    
    // Формула очков: максимум 1000, за каждую тысячную долю секунды ошибки теряется 1 очко
    const pointsEarned = Math.max(0, Math.round(1000 - difference * 1000));

    // Находим текущего активного игрока, который еще не ходил в этом раунде
    let activePlayer = players.find(p => !p.done);
    
    if (activePlayer) {
        activePlayer.lastResult = { duration: durationSeconds, diff: difference, points: pointsEarned };
        activePlayer.score += pointsEarned;
        activePlayer.done = true;
        
        alert(`Результат ${activePlayer.name}:\nДержал: ${durationSeconds} сек\nЦель: ${targetTime} сек\nОчки: +${pointsEarned}`);
    }

    // Проверяем, сходили ли все
    const allDone = players.every(p => p.done);
    if (allDone) {
        isGameActive = false;
        document.getElementById('game-status').innerText = "Раунд завершен!";
        document.getElementById('host-next-btn').classList.remove('hidden'); // Показываем кнопку нового раунда
    } else {
        document.getElementById('game-status').innerText = "Передайте телефон следующему!";
    }

    // Сохраняем прогресс в localStorage
    const roomInput = document.getElementById('room-input').value.trim();
    localStorage.setItem(`time_battle_${roomInput || 'local'}`, JSON.stringify(players));

    updateLeaderboard();
}

// 4. ОБНОВЛЕНИЕ ТАБЛИЦЫ ЛИДЕРОВ
function updateLeaderboard() {
    const container = document.getElementById('leaderboard');
    container.innerHTML = '';

    // Сортируем игроков по общему количеству очков (от большего к меньшему)
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

    sortedPlayers.forEach(p => {
        const row = document.createElement('div');
        row.className = `player-row ${p.done ? 'done' : ''}`;
        
        let resultText = p.done && p.lastResult ? `| Последний: ${p.lastResult.duration}с` : '🤔 Думает';
        
        row.innerHTML = `
            <div class="player-info">
                <div class="status-dot"></div>
                <span><b>${p.name}</b> ${resultText}</span>
            </div>
            <div class="score-badge">${p.score} 🏆</div>
        `;
        container.appendChild(row);
    });
}

// 5. СЛЕДУЮЩИЙ РАУНД
function nextTimeRound() {
    // Сбрасываем флаги готовности для нового раунда
    players.forEach(p => {
        p.done = false;
    });

    document.getElementById('host-next-btn').classList.add('hidden');
    generateNewTarget();
    updateLeaderboard();
}
