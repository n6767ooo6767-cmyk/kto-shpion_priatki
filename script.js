// ========================================================
// УЛЬТРА-СТАБИЛЬНЫЙ SCRIPT.JS
// ========================================================

const questionsPool = [
    { q: "Любимое время суток?", v: ["Рассвет", "День", "Закат", "Глубокая ночь"] },
    { q: "Как ты ведешь себя в компании?", v: ["Душа компании", "Слушатель", "Задаю ритм", "Наблюдатель"] },
    { q: "Лучший отдых — это...", v: ["Активность", "Тишина", "Вечеринка", "Хобби"] },
    { q: "Твой главный приоритет?", v: ["Семья/Друзья", "Карьера", "Саморазвитие", "Удовольствие"] },
    { q: "Любимый вид досуга?", v: ["Кино/Сериалы", "Игры", "Чтение", "Спорт"] },
    { q: "Твой характер?", v: ["Спокойный", "Взрывной", "Рассудительный", "Авантюрный"] },
    { q: "Отношение к спорам?", v: ["Всегда доказываю", "Ищу компромисс", "Ухожу от темы", "Соглашаюсь сразу"] },
    { q: "Твой стиль в одежде?", v: ["Спортивный", "Строгий", "Кэжуал", "Креативный"] },
    { q: "Что важнее в друге?", v: ["Верность", "Юмор", "Честность", "Поддержка"] },
    { q: "Любимый напиток?", v: ["Кофе", "Чай", "Сладкое", "Что-то крепкое"] },
    { q: "Реакция на стресс?", v: ["Паника", "Хладнокровие", "Юмор", "Уход в себя"] },
    { q: "Как принимаешь решения?", v: ["Сердцем", "Логикой", "Советуюсь", "Интуиция"] },
    { q: "Твой идеальный отпуск?", v: ["Горы/Походы", "Пляж", "Евротур", "Дома"] },
    { q: "Отношение к деньгам?", v: ["Коплю", "Трачу сразу", "Инвестирую", "Даю в долг"] },
    { q: "Главный страх?", v: ["Одиночество", "Высота", "Неизвестность", "Быть не собой"] },
    { q: "Суперспособность?", v: ["Телепортация", "Читать мысли", "Управлять временем", "Бессмертие"] },
    { q: "Любимый жанр кино?", v: ["Хорроры", "Комедии", "Фантастика", "Драмы"] },
    { q: "Что ты ценишь в людях?", v: ["Ум", "Доброту", "Чувство юмора", "Стиль"] },
    { q: "Твоя главная черта?", v: ["Упрямство", "Доброта", "Сарказм", "Пунктуальность"] },
    { q: "Любимый день недели?", v: ["Пятница", "Суббота", "Воскресенье", "Будни"] },
    { q: "Как ты просыпаешься?", v: ["Сразу бодр", "Долго раскачиваюсь", "Нужен кофе", "Ненавижу утро"] },
    { q: "Где бы ты хотел жить?", v: ["Мегаполис", "Природа", "Другая страна", "Свой дом"] },
    { q: "Отношение к сюрпризам?", v: ["Обожаю", "Терпеть не могу", "Смотрю по ситуации", "Боюсь"] },
    { q: "Твой идеальный завтрак?", v: ["Сладкий", "Сытный", "Кофе", "Не завтракаю"] },
    { q: "Чего не прощаешь?", v: ["Ложь", "Предательство", "Высокомерие", "Глупость"] }
];

let currentQIndex = 0;
let creatorAnswers = [];
let friendAnswers = [];
let creatorNameGlobal = "Друг";

function switchScreen(screenId) {
    document.querySelectorAll('.screen-view').forEach(s => s.classList.add('hidden'));
    document.getElementById(screenId).classList.remove('hidden');
}

function startCreatingTest() {
    creatorNameGlobal = document.getElementById('creator-name-input').value.trim() || "Друг";
    creatorAnswers = [];
    currentQIndex = 0;
    switchScreen('create-screen');
    document.getElementById('creator-auth').classList.add('hidden');
    document.getElementById('quiz-builder').classList.remove('hidden');
    loadBuilderQuestion();
}

function loadBuilderQuestion() {
    if (currentQIndex >= questionsPool.length) {
        // Завершение создания
        document.getElementById('share-link-input').value = "Готово! Ссылка создана (демо)";
        switchScreen('share-screen');
        return;
    }
    
    document.getElementById('question-number').innerText = `Вопрос ${currentQIndex + 1}/${questionsPool.length}`;
    document.getElementById('builder-question-text').innerText = questionsPool[currentQIndex].q;
    
    const container = document.getElementById('builder-variants');
    container.innerHTML = '';
    questionsPool[currentQIndex].v.forEach((v, idx) => {
        container.innerHTML += `<button class="btn-variant" onclick="handleBuilderChoice(${idx})">${v}</button>`;
    });
}

function handleBuilderChoice(idx) {
    creatorAnswers.push(idx);
    currentQIndex++;
    loadBuilderQuestion();
}

function startFriendQuiz() {
    document.getElementById('friend-auth').classList.add('hidden');
    document.getElementById('friend-quiz').classList.remove('hidden');
    currentQIndex = 0;
    friendAnswers = [];
    loadFriendQuestion();
}

function loadFriendQuestion() {
    if (currentQIndex >= questionsPool.length) {
        finishFriendQuiz();
        return;
    }
    document.getElementById('friend-q-number').innerText = `Вопрос ${currentQIndex + 1}/${questionsPool.length}`;
    document.getElementById('friend-question-text').innerText = questionsPool[currentQIndex].q;
    
    const container = document.getElementById('friend-variants');
    container.innerHTML = '';
    questionsPool[currentQIndex].v.forEach((v, idx) => {
        container.innerHTML += `<button class="btn-variant" onclick="handleFriendChoice(${idx})">${v}</button>`;
    });
}

function handleFriendChoice(idx) {
    friendAnswers.push(idx);
    currentQIndex++;
    loadFriendQuestion();
}

function finishFriendQuiz() {
    let correct = 0;
    for (let i = 0; i < creatorAnswers.length; i++) {
        if (creatorAnswers[i] === friendAnswers[i]) correct++;
    }
    const percent = Math.round((correct / questionsPool.length) * 100);
    document.getElementById('result-percent-text').innerText = `Ты знаешь ${creatorNameGlobal} на ${percent}%!`;
    switchScreen('result-screen');
}
