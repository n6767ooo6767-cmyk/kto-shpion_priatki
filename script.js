const container = document.getElementById('game-container');
const resetBtn = document.getElementById('btn-reset');
let objects = [];
let currentLevel = 0;

// Расширенная база уровней
const worlds = [
    // Уровень 1: Квадраты и интерактивные бомбы
    [
        { x: 150, y: 120, type: 'green', shape: 'circle', face: '🙂', gx: 0, gy: 0.3, clickable: false },
        // Синий блок, который НЕЛЬЗЯ сломать (clickable: false)
        { x: 150, y: 220, type: 'blue',  shape: 'square', face: '🔒', gx: 0, gy: 0,   clickable: false }, 
        // Красный КВАДРАТ, улетающий вверх
        { x: 300, y: 180, type: 'red',   shape: 'square', face: '😡', gx: 0, gy: -0.3, clickable: true }, 
        // Бомба, которую можно взорвать кликом!
        { x: 300, y: 40,  type: 'bomb',  shape: 'circle', face: '💣', gx: 0, gy: 0.2,  clickable: true }
    ],
    // Уровень 2: Конструкция из неломаемых блоков и кликабельных красных
    [
        { x: 200, y: 100, type: 'green', shape: 'circle', face: '🙂', gx: 0, gy: 0.3, clickable: false },
        { x: 200, y: 200, type: 'blue',  shape: 'square', face: '🔷', gx: 0, gy: 0,   clickable: true },
        // Красный зажат между неломаемыми синими, кликни по нему, чтобы он исчез/взорвался
        { x: 350, y: 200, type: 'red',   shape: 'square', face: '🟥', gx: 0, gy: 0,   clickable: true },
        { x: 350, y: 260, type: 'blue',  shape: 'square', face: '🔒', gx: 0, gy: 0,   clickable: false }
    ]
];

function initGame() {
    container.innerHTML = '';
    objects = [];
    
    document.getElementById('info').innerText = `Уровень ${currentLevel + 1}. Некоторые блоки кликабельны, остерегайся замков 🔒!`;

    const levelData = worlds[currentLevel];

    levelData.forEach((data, index) => {
        const el = document.createElement('div');
        // Назначаем классы: цвет (red/blue...) + форма (circle/square)
        el.className = `ball ${data.type} ${data.shape}`;
        el.innerText = data.face;
        
        // Если блок нельзя кликать, убираем указатель-ручку
        if (!data.clickable) {
            el.style.cursor = 'default';
        }
        
        container.appendChild(el);

        const obj = {
            el: el,
            type: data.type,
            shape: data.shape,
            x: data.x,
            y: data.y,
            vx: 0,
            vy: 0,
            gx: data.gx,
            gy: data.gy,
            size: 50, // Ширина и высота блока
            radius: 25,
            isDead: false,
            clickable: data.clickable
        };

        // Логика клика
        el.addEventListener('click', () => {
            if (!obj.clickable || obj.isDead) return;
            
            if (obj.type === 'bomb') {
                explodeBomb(index); // Взрыв бомбы по клику!
            } else {
                removeObject(index); // Обычное удаление кликом (красные, ломаемые синие)
            }
        });

        objects.push(obj);
    });
}

function removeObject(index) {
    if (objects[index] && !objects[index].isDead) {
        objects[index].isDead = true;
        objects[index].el.remove();
        checkVictoryCondition();
    }
}

function explodeBomb(bombIndex) {
    const bomb = objects[bombIndex];
    if (!bomb || bomb.isDead) return;

    bomb.isDead = true;
    bomb.el.innerText = '💥';
    bomb.el.classList.add('exploded');

    // Волна взрыва расталкивает объекты
    objects.forEach((obj) => {
        if (!obj || obj.isDead || obj === bomb) return;

        const dx = obj.x - bomb.x;
        const dy = obj.y - bomb.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 180) {
            // Неломаемые синие блоки ('🔒') не сдвигаются взрывом, если у них гравитация 0
            if (obj.type === 'blue' && obj.gx === 0 && obj.gy === 0) return;

            const force = (180 - dist) * 0.2; 
            obj.vx += (dx / (dist || 1)) * force;
            obj.vy += (dy / (dist || 1)) * force;
        }
    });

    setTimeout(() => {
        bomb.el.remove();
        checkVictoryCondition();
    }, 300);
}

function checkVictoryCondition() {
    const redAlive = objects.some(obj => obj && !obj.isDead && obj.type === 'red');
    if (!redAlive) {
        setTimeout(() => {
            if (currentLevel < worlds.length - 1) {
                currentLevel++;
                initGame();
            } else {
                alert('💥 Мега-аркада пройдена! Ты супер-инженер! 🏁');
                currentLevel = 0;
                initGame();
            }
        }, 500);
    }
}

function updatePhysics() {
    objects.forEach((obj, i) => {
        if (!obj || obj.isDead) return;

        // Физика движения
        obj.vx += obj.gx;
        obj.vy += obj.gy;
        obj.x += obj.vx;
        obj.y += obj.vy;

        // Невидимый пол для зеленых
        if (obj.type === 'green') {
            if (obj.y > 346) { 
                obj.y = 346;
                obj.vy = 0;
                obj.vx *= 0.7; // Сопротивление пола
            }
        }

        // Столкновения
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

                // Статичные синие блоки не двигаются от ударов
                const isObjStatic = (obj.type === 'blue' && obj.gx === 0 && obj.gy === 0);
                
                if (!isObjStatic) {
                    obj.x -= nx * overlap * 0.5;
                    obj.y -= ny * overlap * 0.5;
                    
                    const kx = obj.vx - other.vx;
                    const ky = obj.vy - other.vy;
                    const p = 2 * (nx * kx + ny * ky) / 2;
                    
                    obj.vx -= p * nx;
                    obj.vy -= p * ny;
                }
            }
        });

        // Отрезаем координаты под экран
        obj.el.style.left = obj.x + 'px';
        obj.el.style.top = obj.y + 'px';

        // Вылет за границы игрового поля
        if (obj.y < -60 || obj.y > 420 || obj.x < -60 || obj.x > 620) {
            if (obj.type === 'red') {
                removeObject(i); 
            } else if (obj.type === 'green') {
                alert('Критическая ошибка! Зеленый объект потерян.');
                initGame();
            }
        }
    });

    requestAnimationFrame(updatePhysics);
}

resetBtn.addEventListener('click', initGame);
initGame();
updatePhysics();
