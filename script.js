const container = document.getElementById('game-container');
const resetBtn = document.getElementById('btn-reset');
let objects = [];
let currentLevel = 0;

// Массив уровней (теперь их три!)
const worlds = [
    // Уровень 1: Разминка
    [
        { x: 150, y: 100, type: 'green', face: '🙂', gx: 0, gy: 0.3 },  
        { x: 150, y: 220, type: 'blue',  face: '🔷', gx: 0, gy: 0 },    
        { x: 300, y: 180, type: 'red',   face: '🙃', gx: 0, gy: -0.3 }, 
        { x: 450, y: 50,  type: 'red',   face: '🙂', gx: 0, gy: 0.3 }
    ],
    // Уровень 2: Знакомство с бомбой
    [
        { x: 100, y: 100, type: 'green', face: '🙂', gx: 0, gy: 0.3 },
        { x: 100, y: 220, type: 'blue',  face: '🔷', gx: 0, gy: 0 },
        { x: 300, y: 50,  type: 'bomb',  face: '💣', gx: 0, gy: 0.25 },
        { x: 300, y: 220, type: 'blue',  face: '🔷', gx: 0, gy: 0 },
        { x: 500, y: 150, type: 'red',   face: '🙃', gx: 0, gy: -0.4 }
    ],
    // Уровень 3: Хаос (Гравитация в разные стороны)
    [
        { x: 150, y: 300, type: 'green', face: '🙂', gx: 0, gy: 0.3 },
        { x: 150, y: 350, type: 'blue',  face: '🔷', gx: 0, gy: 0 },
        { x: 300, y: 200, type: 'red',   face: '🙃', gx: 0, gy: -0.3 }, // Летит вверх
        { x: 450, y: 200, type: 'red',   face: '👈', gx: -0.4, gy: 0 }, // Летит влево!
        { x: 300, y: 50,  type: 'bomb',  face: '💣', gx: 0, gy: 0.2 }
    ]
];

function initGame() {
    container.innerHTML = '';
    objects = [];
    
    // Обновляем текст инфо, показывая текущий уровень
    document.getElementById('info').innerText = `Уровень ${currentLevel + 1}. Убери красных, сохрани зеленых!`;

    const levelData = worlds[currentLevel];

    levelData.forEach((data, index) => {
        const el = document.createElement('div');
        el.className = `ball ${data.type}`;
        el.innerText = data.face;
        container.appendChild(el);

        const obj = {
            el: el,
            type: data.type,
            x: data.x,
            y: data.y,
            vx: 0,
            vy: 0,
            gx: data.gx,
            gy: data.gy,
            radius: 25,
            isDead: false
        };

        if (obj.type === 'blue') {
            el.addEventListener('click', () => removeObject(index));
        }

        objects.push(obj);
    });
}

function removeObject(index) {
    if (objects[index] && !objects[index].isDead) {
        objects[index].isDead = true;
        if (objects[index].type === 'blue') {
            checkBombProximity(objects[index].x, objects[index].y);
        }
        objects[index].el.remove();
        checkVictoryCondition(); // Проверяем победу после каждого удаления
    }
}

function checkBombProximity(cx, cy) {
    objects.forEach((obj, idx) => {
        if (!obj || obj.isDead || obj.type !== 'bomb') return;
        const dist = Math.hypot(obj.x - cx, obj.y - cy);
        if (dist < 120) {
            explodeBomb(idx);
        }
    });
}

function explodeBomb(bombIndex) {
    const bomb = objects[bombIndex];
    if (!bomb || bomb.isDead) return;

    bomb.isDead = true;
    bomb.el.innerText = '💥';
    bomb.el.classList.add('exploded');

    objects.forEach((obj) => {
        if (!obj || obj.isDead || obj === bomb) return;
        const dx = obj.x - bomb.x;
        const dy = obj.y - bomb.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 180) {
            const force = (180 - dist) * 0.15;
            obj.vx += (dx / dist) * force;
            obj.vy += (dy / dist) * force;
        }
    });

    setTimeout(() => {
        bomb.el.remove();
        checkVictoryCondition();
    }, 300);
}

function checkVictoryCondition() {
    // Проверяем, остались ли живые красные смайлики на поле
    const redAlive = objects.some(obj => obj && !obj.isDead && obj.type === 'red');
    
    if (!redAlive) {
        // Если красных нет, ждем полсекунды (чтобы анимации завершились) и переходим дальше
        setTimeout(() => {
            if (currentLevel < worlds.length - 1) {
                currentLevel++;
                alert(`Уровень ${currentLevel} пройден! Переходим к следующему.`);
                initGame();
            } else {
                alert('Поздравляем! Ты прошёл все уровни этой беты! 🏁');
                currentLevel = 0; // Сброс на первый уровень
                initGame();
            }
        }, 500);
    }
}

function updatePhysics() {
    objects.forEach((obj, i) => {
        if (!obj || obj.isDead) return;

        obj.vx += obj.gx;
        obj.vy += obj.gy;
        obj.x += obj.vx;
        obj.y += obj.vy;

        if (obj.type === 'green') {
            if (obj.y > 346) { 
                obj.y = 346;
                obj.vy = 0;
                obj.vx *= 0.8;
            }
        }

        objects.forEach((other, j) => {
            if (!other || other.isDead || i === j) return;

            const dx = other.x - obj.x;
            const dy = other.y - obj.y;
            const dist = Math.hypot(dx, dy);
            const minDist = obj.radius + other.radius;

            if (dist < minDist) {
                const overlap = minDist - dist;
                const nx = dx / dist;
                const ny = dy / dist;

                if (obj.type !== 'blue') {
                    obj.x -= nx * overlap * 0.5;
                    obj.y -= ny * overlap * 0.5;
                }

                const kx = obj.vx - other.vx;
                const ky = obj.vy - other.vy;
                const p = 2 * (nx * kx + ny * ky) / 2;
                
                if (obj.type !== 'blue') {
                    obj.vx -= p * nx;
                    obj.vy -= p * ny;
                }
            }
        });

        obj.el.style.left = obj.x + 'px';
        obj.el.style.top = obj.y + 'px';

        // Если объект вылетел за экран
        if (obj.y < -60 || obj.y > 420 || obj.x < -60 || obj.x > 620) {
            if (obj.type === 'red') {
                removeObject(i); 
            } else if (obj.type === 'green') {
                alert('Упс! Зеленый смайлик упал. Уровень перезапускается.');
                initGame();
            }
        }
    });

    // Сближение бомбы с синими блоками в полете
    objects.forEach((obj) => {
        if (obj && obj.type === 'bomb' && !obj.isDead) {
            objects.forEach(blueObj => {
                if (blueObj && blueObj.type === 'blue' && !blueObj.isDead) {
                    const dist = Math.hypot(blueObj.x - obj.x, blueObj.y - obj.y);
                    if (dist < 60) explodeBomb(objects.indexOf(obj));
                }
            });
        }
    });

    requestAnimationFrame(updatePhysics);
}

resetBtn.addEventListener('click', initGame);
initGame();
updatePhysics();
