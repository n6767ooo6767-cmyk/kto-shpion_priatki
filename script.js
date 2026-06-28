const container = document.getElementById('game-container');
const resetBtn = document.getElementById('btn-reset');
let objects = [];

// Карта объектов (x, y, тип, смайлик, гравитация по X и Y)
// Положительный gy — падает вниз. Отрицательный gy — летит вверх!
const levelData = [
    { x: 150, y: 100, type: 'green', face: '🙂', gx: 0, gy: 0.3 },  
    { x: 150, y: 220, type: 'blue',  face: '🔷', gx: 0, gy: 0 },    
    { x: 300, y: 180, type: 'red',   face: '🙃', gx: 0, gy: -0.3 }, 
    { x: 450, y: 50,  type: 'red',   face: '🙂', gx: 0, gy: 0.3 },  
    { x: 300, y: 50,  type: 'bomb',  face: '💣', gx: 0, gy: 0.2 }   
];

function initGame() {
    container.innerHTML = '';
    objects = [];

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
            radius: 25, // половина от ширины 50px
            isDead: false
        };

        // Кликать можно только на синие блоки
        if (obj.type === 'blue') {
            el.addEventListener('click', () => removeObject(index));
        }

        objects.push(obj);
    });
}

function removeObject(index) {
    if (objects[index] && !objects[index].isDead) {
        objects[index].isDead = true;
        
        // Если убрали синий блок, проверяем, не заставит ли это упасть бомбу на взрывное расстояние
        if (objects[index].type === 'blue') {
            checkBombProximity(objects[index].x, objects[index].y);
        }
        
        objects[index].el.remove();
    }
}

// Проверка: если синий блок исчез под бомбой, или бомба подлетела близко к синему
function checkBombProximity(cx, cy) {
    objects.forEach((obj, idx) => {
        if (!obj || obj.isDead || obj.type !== 'bomb') return;
        
        const dist = Math.hypot(obj.x - cx, obj.y - cy);
        if (dist < 120) { // Если дистанция взрыва близкая
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

    // Расталкиваем силой взрыва всех вокруг
    objects.forEach((obj) => {
        if (!obj || obj.isDead || obj === bomb) return;

        const dx = obj.x - bomb.x;
        const dy = obj.y - bomb.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 180) { // Радиус поражения взрывной волны
            const force = (180 - dist) * 0.15; // Чем ближе, тем сильнее толчок
            obj.vx += (dx / dist) * force;
            obj.vy += (dy / dist) * force;
        }
    });

    // Окончательно удаляем бомбу после завершения CSS-анимации взрыва
    setTimeout(() => {
        bomb.el.remove();
    }, 300);
}

function updatePhysics() {
    objects.forEach((obj, i) => {
        if (!obj || obj.isDead) return;

        // Накапливаем скорость от персональной гравитации
        obj.vx += obj.gx;
        obj.vy += obj.gy;

        // Меняем координаты
        obj.x += obj.vx;
        obj.y += obj.vy;

        // Зеленые не должны падать за нижний край поля (для них там невидимый пол)
        if (obj.type === 'green') {
            if (obj.y > 346) { 
                obj.y = 346;
                obj.vy = 0;
                obj.vx *= 0.8; // Трение при контакте с полом
            }
        }

        // Логика столкновений шаров между собой
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

                // Раздвигаем шары, чтобы не проваливались друг в друга
                if (obj.type !== 'blue') {
                    obj.x -= nx * overlap * 0.5;
                    obj.y -= ny * overlap * 0.5;
                }

                // Рассчитываем отскок (импульс)
                const kx = obj.vx - other.vx;
                const ky = obj.vy - other.vy;
                const p = 2 * (nx * kx + ny * ky) / 2;
                
                if (obj.type !== 'blue') {
                    obj.vx -= p * nx;
                    obj.vy -= p * ny;
                }
            }
        });

        // Отрисовка на экране через стили
        obj.el.style.left = obj.x + 'px';
        obj.el.style.top = obj.y + 'px';

        // Проверка вылета за границы (условия победы/проигрыша)
        if (obj.y < -60 || obj.y > 420 || obj.x < -60 || obj.x > 620) {
            if (obj.type === 'red') {
                removeObject(i); // Красный успешно улетел
            } else if (obj.type === 'green') {
                alert('Упс! Зеленый смайлик улетел. Попробуй еще раз!');
                initGame();
            }
        }
    });

    // Каждым кадром проверяем, если ли поблизости летящая бомба к опорам
    objects.forEach((obj, idx) => {
        if (obj && obj.type === 'bomb' && !obj.isDead) {
            objects.forEach(blueObj => {
                if (blueObj && blueObj.type === 'blue' && !blueObj.isDead) {
                    checkBombProximity(blueObj.x, blueObj.y);
                }
            });
        }
    });

    requestAnimationFrame(updatePhysics);
}

// Вешаем событие на кнопку рестарта
resetBtn.addEventListener('click', initGame);

// Запуск игры
initGame();
updatePhysics();
