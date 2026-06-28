const SUPABASE_URL = "https://cfsvmuewbskyqumhkyah.supabase.co"; 
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."; 
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Пул вопросов для викторины
const questionsPool = [
    { q: "Где бы ты предпочёл провести идеальные выходные?", v: ["Дома под пледом с сериалом", "На шумной тусовке с друзьями", "В путешествии в новом городе", "В спортзале / на активном отдыхе"] },
    { q: "Какой жанр кино ты выберешь вечером?", v: ["Ужасы / Триллер", "Комедия / Мультфильм", "Фантастика / Нолан", "Драма / Аниме"] },
    { q: "Твой главный напиток для хорошего настроения?", v: ["Кофе / Энергетик", "Чай с травами", "Сладкая газировка / Сок", "Что-нибудь покрепче 🥂"] },
    { q: "Если бы тебе дали миллион рублей, ты бы...", v: ["Отложил / Инвестировал", "Купил шмотки / гаджеты", "Поехал в кругосветку", "Раздал долги / закрыл кредиты"] },
    { q: "Какое суперсвойство ты бы выбрал?", v: ["Читать мысли", "Телепортация", "Стать невидимым", "Управлять временем"] }
];

let testId = null;
let currentQIndex = 0;
let creatorAnswers = [];
let friendAnswers = [];
let creatorNameGlobal = "";

// Автоматическая проверка при старте страницы
window.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    testId = urlParams.get('testId');

    if (testId) {
        // Режим ДРУГА
        let { data: test, error } = await supabase.from('friend_tests').select('*').eq('id', testId).single();
        if (error || !test) {
            alert("Тест не найден! Создайте свой.");
            window.location.href = window.location.pathname;
            return;
        }
        creatorNameGlobal = test.creator_name;
        creatorAnswers = test.answers;
        document.getElementById('display-creator-name').innerText = creatorNameGlobal;
        switchScreen('friend-screen');
    } else {
        // Режим СОЗДАТЕЛЯ
        switchScreen('create-screen');
    }
});

function switchScreen(screenId) {
    document.querySelectorAll('.screen-view').forEach(s => s.classList.add('hidden'));
    document.getElementById(screenId).classList.remove('hidden');
}

// ========================================================
// ЛОГИКА СОЗДАТЕЛЯ ТЕСТА
// ========================================================
function startCreatingTest() {
    creatorNameGlobal = document.getElementById('creator-name-input').value.trim();
    if (!creatorNameGlobal) return alert("Введите имя!");

    document.getElementById('creator-auth').classList.add('hidden');
    document.getElementById('quiz-builder').classList.remove('hidden');
    currentQIndex = 0;
    creatorAnswers = [];
    loadBuilderQuestion();
}

function loadBuilderQuestion() {
    if (currentQIndex >= questionsPool.length) {
        saveTestToSupabase();
        return;
    }
    document.getElementById('question-number').innerText = `Вопрос ${currentQIndex + 1}/${questionsPool.length}`;
    document.getElementById('builder-question-text').innerText = questionsPool[currentQIndex].q;
    
    const container = document.getElementById('builder-variants');
    container.innerHTML = '';
    
    questionsPool[currentQIndex].v.forEach((variant, idx) => {
        container.innerHTML += `<button class="btn-variant" onclick="handleBuilderChoice(${idx})">${variant}</button>`;
    });
}

function handleBuilderChoice(variantIdx) {
    creatorAnswers.push(variantIdx);
    currentQIndex++;
    loadBuilderQuestion();
}

async function saveTestToSupabase() {
    let { data: newTest, error } = await supabase.from('friend_tests').insert({
        creator_name: creatorNameGlobal,
        answers: creatorAnswers
    }).select().single();

    if (error) return alert("Ошибка при создании теста.");

    const shareLink = `${window.location.origin}${window.location.pathname}?testId=${newTest.id}`;
    document.getElementById('share-link-input').value = shareLink;
    
    switchScreen('share-screen');
    renderLeaderboard(newTest.leaderboard);
}

// ========================================================
// ЛОГИКА ДРУГА (ПРОХОЖДЕНИЕ)
// ========================================================
function startFriendQuiz() {
    const fName = document.getElementById('friend-name-input').value.trim();
    if (!fName) return alert("Введи своё имя!");

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
    
    questionsPool[currentQIndex].v.forEach((variant, idx) => {
        container.innerHTML += `<button class="btn-variant" onclick="handleFriendChoice(${idx})">${variant}</button>`;
    });
}

function handleFriendChoice(variantIdx) {
    friendAnswers.push(variantIdx);
    currentQIndex++;
    loadFriendQuestion();
}

async function finishFriendQuiz() {
    let correctCount = 0;
    for (let i = 0; i < creatorAnswers.length; i++) {
        if (creatorAnswers[i] === friendAnswers[i]) correctCount++;
    }
    
    // Считаем проценты угадывания
    const percent = Math.round((correctCount / creatorAnswers.length) * 100);
    const fName = document.getElementById('friend-name-input').value.trim();

    // Загружаем текущий лидерборд, добавляем себя и пушим обратно
    let { data: test } = await supabase.from('friend_tests').select('leaderboard').eq('id', testId).single();
    let currentLeaderboard = test.leaderboard || [];
    currentLeaderboard.push({ name: fName, percent: percent });
    
    await supabase.from('friend_tests').update({ leaderboard: currentLeaderboard }).eq('id', testId);

    // Показываем финальный экран
    document.getElementById('result-title').innerText = `Результат игры`;
    document.getElementById('result-percent-text').innerText = `Ты знаешь ${creatorNameGlobal} на ${percent}%!`;
    switchScreen('result-screen');
}

// Полезные утилиты
function copyLink() {
    const input = document.getElementById('share-link-input');
    input.select();
    navigator.clipboard.writeText(input.value);
    alert("Ссылка скопирована! Отправляй друзьям. 😉");
}

function renderLeaderboard(list) {
    const box = document.getElementById('share-leaderboard');
    box.innerHTML = '';
    if(!list || list.length === 0) {
        box.innerHTML = '<p style="color:#9ca3af; font-size:13px; text-align:center;">Пока никто не прошёл... Будь первым, отправь ссылку!</p>';
        return;
    }
    [...list].sort((a,b)=>b.percent - a.percent).forEach(p => {
        box.innerHTML += `<div class="player-row"><span><b>${p.name}</b></span><div class="score-badge">${p.percent}%</div></div>`;
    });
}
