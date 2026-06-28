// НАВИГАЦИЯ МЕЖДУ ЭКРАНАМИ
function switchScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById(screenId).classList.remove('hidden');
    // Сброс таймеров пряток при выходе
    clearInterval(hideTimerInterval);
}

// ==========================================
// ЛОГИКА ИГРЫ "КТО ШПИОН"
// ==========================================
const spyWords = ["Школа", "Больница", "Космос", "Ресторан", "Аквапарк", "Кинотеатр", "Поезд", "Пляж"];
let spyGameData = { totalPlayers: 0, currentPlayer: 0, roles: [], cardFlipped: false };

function startSpyGame() {
    const countInput = document.getElementById('player-count');
    let count = parseInt(countInput.value);
    if (count < 3) count = 3;
    if (count > 8) count = 8;

    spyGameData.totalPlayers = count;
    spyGameData.currentPlayer = 0;
    spyGameData.cardFlipped = false;
    document.getElementById('spy-card').classList.remove('flipped');

    // Выбираем случайную локацию и случайного шпиона
    const randomLocation = spyWords[Math.floor(Math.random() * spyWords.length)];
    const spyIndex = Math.floor(Math.random() * count);

    // Заполняем массив ролей
    spyGameData.roles = [];
    for (let i = 0; i < count; i++) {
        spyGameData.roles.push(i === spyIndex ? "Ты ШПИОН! 🕵️‍♂️" : `Локация: ${randomLocation}`);
    }

    document.getElementById('spy-setup').classList.add('hidden');
    document.getElementById('spy-gameplay').classList.remove('hidden');
    updateSpyTurn();
}

function updateSpyTurn() {
    document.getElementById('player-turn-text').innerText = `Игрок ${spyGameData.currentPlayer + 1}, твоя очередь!`;
    document.getElementById('card-word').innerText = spyGameData.roles[spyGameData.currentPlayer];
    document.getElementById('btn-next-player').classList.add('hidden');
}

function flipCard() {
    const card = document.getElementById('spy-card');
    card.classList.toggle('flipped');
    spyGameData.cardFlipped = !spyGameData.cardFlipped;

    // Кнопка перехода появляется только после того, как игрок посмотрел карту
    if (spyGameData.cardFlipped) {
        document.getElementById('btn-next-player').classList.remove('hidden');
    }
}

function nextPlayer() {
    spyGameData.currentPlayer++;
    document.getElementById('spy-card').classList.remove('flipped');
    spyGameData.cardFlipped = false;

    if (spyGameData.currentPlayer < spyGameData.totalPlayers) {
        setTimeout(updateSpyTurn, 300); // небольшая задержка пока карта переворачивается обратно
    } else {
        // Все посмотрели свои карты
        document.getElementById('player-turn-text').innerText = "Все роли распределены! Начинайте обсуждение. Задавайте вопросы друг другу!";
        document.getElementById('spy-card').style.display = 'none';
        document.getElementById('btn-next-player').classList.add('hidden');
        
        // Кнопка возврата к новой раздаче
        const btnReset = document.createElement('button');
        btnReset.className = "btn-main";
        btnReset.innerText = "Раздать заново";
        btnReset.onclick = () => {
            document.getElementById('spy-card').style.display = 'flex';
            document.getElementById('spy-setup').classList.remove('hidden');
            document.getElementById('spy-gameplay').classList.add('hidden');
            btnReset.remove();
        };
        document.getElementById('game-spy').appendChild(btnReset);
    }
}

// ==========================================
// ЛОГИКА ИГРЫ "ПРЯТКИ"
// ==========================================
let hideCount = 0;
let hideTimeLeft = 30;
let hideTimerInterval;
const targetEmoji = "🎯"; // Что ищем
const decoEmojis = ["🌳", "📦", "🛋️", "🚗", "🏠", "🎨", "🧱", "💎"]; // Отвлекающие предметы

function startHideGame() {
    const field = document.getElementById('hide-field');
    const startBtn = document.getElementById('btn-start-hide');
    field.innerHTML = '';
    startBtn.classList.add('hidden');
    
    hideCount = 5; // Сколько целей надо найти
    hideTimeLeft = 25; // Время на уровень
    document.getElementById('hide-count').innerText = hideCount;
    document.getElementById('hide-timer').innerText = hideTimeLeft;

    // Спавним отвлекающие декорации
    for(let i=0; i < 60; i++) {
        spawnEmoji(decoEmojis[Math.floor(Math.random() * decoEmojis.length)], false);
    }

    // Спавним наши скрытые цели
    for(let i=0; i < hideCount; i++) {
        spawnEmoji(targetEmoji, true);
    }

    // Запуск таймера
    clearInterval(hideTimerInterval);
    hideTimerInterval = setInterval(() => {
        hideTimeLeft--;
        document.getElementById('hide-timer').innerText = hideTimeLeft;
        if (hideTimeLeft <= 0) {
            clearInterval(hideTimerInterval);
            alert("Время вышло! 💥 Смайлики спрятались слишком хорошо.");
            startBtn.classList.remove('hidden');
            field.innerHTML = '';
        }
    }, 1000);
}

function spawnEmoji(emoji, isTarget) {
    const field = document.getElementById('hide-field');
    const span = document.createElement('span');
    span.className = "hidden-emoji";
    span.innerText = emoji;

    // Рандомные координаты внутри поля (ширина 440, высота 270 с учетом размеров эмодзи)
    const x = Math.random() * (field.clientWidth - 30);
    const y = Math.random() * (field.clientHeight - 30);
    span.style.left = `${x}px`;
    span.style.top = `${y}px`;

    // Если это цель, вешаем событие нахождения
    if (isTarget) {
        span.onclick = (e) => {
            e.stopPropagation(); // чтобы клик не улетал дальше
            span.style.transform = "scale(2)";
            span.style.opacity = "0";
            setTimeout(() => span.remove(), 200);
            
            hideCount--;
            document.getElementById('hide-count').innerText = hideCount;

            if (hideCount <= 0) {
                clearInterval(hideTimerInterval);
                alert("Ура! Ты нашёл всех скрытых смайликов! 🎉");
                document.getElementById('btn-start-hide').classList.remove('hidden');
            }
        };
    } else {
        // Декорации слегка меняют прозрачность, чтобы сливаться с полем
        span.style.opacity = Math.random() * 0.4 + 0.5; 
    }

    field.appendChild(span);
}
