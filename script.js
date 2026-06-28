// ========================================================
// КОНФИГУРАЦИЯ SUPABASE
// ========================================================
// Когда скопируешь данные из панели Supabase, вставь их сюда:
const SUPABASE_URL = "https://cfsvmuewbskyqumhkyah.supabase.co";  
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."; 

let db = null;
try {
    // Проверяем, что библиотека подключена и ключи изменены
    if (typeof supabase !== 'undefined' && SUPABASE_URL && !SUPABASE_URL.includes("your-project-id")) {
        db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        console.log("Supabase успешно подключен! 🔥");
    } else {
        console.log("Работаем в ДЕМО-режиме (клиентские ключи не заданы).");
    }
} catch(e) {
    console.error("Ошибка инициализации Supabase, переходим в демо-режим:", e);
}

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

// Автоматическая проверка ссылки при старте страницы
window.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    testId = urlParams.get('testId');

    if (testId) {
        if (testId.startsWith("demo-")) {
            // Демо-тест без базы данных
            creatorNameGlobal = "Друг (Демо)";
            creatorAnswers = [0, 1, 2, 0, 1]; // Фейковые ответы для проверки
            document.getElementById('display-creator-name').innerText = creatorNameGlobal;
            switchScreen('friend-screen');
        } else if (db) {
            // Реальный режим друга из Supabase
            try {
                let { data: test, error } = await db.from('friend_tests').select('*').eq('id', testId).single();
                if (!error && test) {
                    creatorNameGlobal = test.creator_name;
                    creatorAnswers = test.answers;
                    document.getElementById('display-creator-name').innerText = creatorNameGlobal;
                    switchScreen('friend-screen');
                    return;
                }
            } catch(e) { console.error("Ошибка загрузки теста:", e); }
            switchScreen('create-screen');
        } else {
            alert("Этот тест создан в реальной базе данных, но твой скрипт не подключен к Supabase.");
            switchScreen('create-screen');
        }
    } else {
        switchScreen('create-screen');
    }
});

function switchScreen(screenId) {
    document.querySelectorAll('.screen-view').forEach(s => s.classList.add('hidden'));
    const target = document.getElementById(screenId);
    if (target) target.classList.remove('hidden');
}

// ========================================================
// ЛОГИКА СОЗДАТЕЛЯ ТЕСТА
// ========================================================
function startCreatingTest() {
    const nameInput = document.getElementById('creator-name-input');
    creatorNameGlobal = nameInput ? nameInput.value.trim() : "";
    
    if (!creatorNameGlobal) {
        alert("Пожалуйста, введи своё имя! 😉");
        return;
    }

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
    let generatedId = "demo-" + Math.floor(Math.random() * 100000);
    
    if (db) {
        try {
            let { data: newTest, error } = await db.from('friend_tests').insert({
                creator_name: creatorNameGlobal,
                answers: creatorAnswers
            }).select().single();

            if (!error && newTest) {
                generatedId = newTest.id;
            }
        } catch(e) { console.error("Ошибка сохранения:", e); }
    }

    const shareLink = `${window.location.origin}${window.location.pathname}?testId=${generatedId}`;
    document.getElementById('share-link-input').value = shareLink;
    
    switchScreen('share-screen');
    renderLeaderboard([]);
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
    
    const percent = Math.round((correctCount / questionsPool.length) * 100);
    const fName = document.getElementById('friend-name-input').value.trim();

    if (db && testId && !testId.startsWith("demo-")) {
        try {
            let { data: test } = await db.from('friend_tests').select('leaderboard').eq('id', testId).single();
            let currentLeaderboard = test.leaderboard || [];
            currentLeaderboard.push({ name: fName, percent: percent });
            await db.from('friend_tests').update({ leaderboard: currentLeaderboard }).eq('id', testId);
        } catch(e) { console.error("Ошибка сохранения результатов друга:", e); }
    }

    document.getElementById('result-title').innerText = `Результат игры`;
    document.getElementById('result-percent-text').innerText = `Ты знаешь ${creatorNameGlobal} на ${percent}%!`;
    switchScreen('result-screen');
}

// Утилиты
function copyLink() {
    const input = document.getElementById('share-link-input');
    input.select();
    navigator.clipboard.writeText(input.value);
    alert("Ссылка скопирована! Отправляй друзьям. 😉");
}

function renderLeaderboard(list) {
    const box = document.getElementById('share-leaderboard');
    if (!box) return;
    box.innerHTML = '';
    if(!list || list.length === 0) {
        box.innerHTML = '<p style="color:#a0a0c0; font-size:13px; text-align:center;">Пока никто не прошёл... Будь первым, отправь ссылку!</p>';
        return;
    }
    [...list].sort((a,b)=>b.percent - a.percent).forEach(p => {
        box.innerHTML += `<div class="player-row"><span><b>${p.name}</b></span><div class="score-badge">${p.percent}%</div></div>`;
    });
}
