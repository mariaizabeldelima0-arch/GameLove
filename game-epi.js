// Estado do jogo
const gameState = {
    player: {
        x: 0,
        y: 0,
        width: 50,
        height: 80,
        equipmentWorn: {
            glasses: false,
            gloves: false,
            belt: false,
            earProtector: false,
            helmet: false
        }
    },
    maria: {
        x: 0,
        y: 0,
        width: 60,
        height: 80
    },
    fallingObjects: [],
    score: 0,
    lives: 3,
    timeRemaining: 60,
    gameActive: true,
    objectSpawnRate: 0.03,
    epiCollected: new Set()
};

const EPIs = {
    GLASSES: { id: 'glasses', name: '🥽 Óculos', color: '#FFD700' },
    GLOVES: { id: 'gloves', name: '🧤 Luvas', color: '#8B4513' },
    BELT: { id: 'belt', name: '🎽 Cinto', color: '#FF4500' },
    EAR_PROTECTOR: { id: 'earProtector', name: '👂 Protetor Auricular', color: '#4169E1' },
    HELMET: { id: 'helmet', name: '🟡 Capacete', color: '#FFD700' }
};

const DEBRIS = [
    { id: 'nail', emoji: '📌', color: '#808080', danger: true },
    { id: 'wood', emoji: '🪵', color: '#8B4513', danger: true },
    { id: 'glass', emoji: '💔', color: '#87CEEB', danger: true }
];

let currentGameState = {
    currentPhaseId: 1,
    phaseStartTime: 0
};

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function initEPIGame() {
    console.log('initEPIGame: Iniciando...');
    console.log('Canvas:', canvas);

    // Obter dimensões do container
    const gameScreen = document.getElementById('gameScreen');
    const containerWidth = gameScreen.offsetWidth || window.innerWidth;
    const containerHeight = gameScreen.offsetHeight || window.innerHeight;

    console.log(`Container: ${containerWidth}x${containerHeight}`);

    // Definir dimensões do canvas
    canvas.width = containerWidth;
    canvas.height = containerHeight;

    console.log(`Canvas dimensões: ${canvas.width}x${canvas.height}`);

    gameState.player.x = canvas.width / 2;
    gameState.player.y = canvas.height - 150;

    gameState.maria.x = Math.random() < 0.5 ? 50 : canvas.width - 50;
    gameState.maria.y = 50;

    gameState.lives = 3;
    gameState.timeRemaining = 60;
    gameState.gameActive = true;
    gameState.score = 0;
    gameState.epiCollected.clear();
    gameState.fallingObjects = [];
    gameState.player.equipmentWorn = {
        glasses: false,
        gloves: false,
        belt: false,
        earProtector: false,
        helmet: false
    };

    updateUI();
    setupEventListeners();
    currentGameState.phaseStartTime = Date.now();

    gameLoop();
}

function setupEventListeners() {
    const keys = {};

    // Detectar se é mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // Controles de teclado
    window.addEventListener('keydown', (e) => {
        keys[e.key] = true;
        updatePlayerPosition(keys);
    });

    window.addEventListener('keyup', (e) => {
        keys[e.key] = false;
    });

    // Controle do mouse (desktop)
    if (!isMobile) {
        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            gameState.player.x = Math.max(gameState.player.width / 2, Math.min(canvas.width - gameState.player.width / 2, mouseX));
        });
    }

    // Controle de toque (mobile)
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        const touchX = touch.clientX - rect.left;
        gameState.player.x = Math.max(gameState.player.width / 2, Math.min(canvas.width - gameState.player.width / 2, touchX));
    });

    // Setup do joystick virtual
    if (isMobile) {
        setupVirtualJoystick();
    }

    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth * 0.95;
        canvas.height = window.innerHeight * 0.8;
    });

    function updatePlayerPosition(keys) {
        const speed = 8;
        if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
            gameState.player.x = Math.max(gameState.player.width / 2, gameState.player.x - speed);
        }
        if (keys['ArrowRight'] || keys['d'] || keys['D']) {
            gameState.player.x = Math.min(canvas.width - gameState.player.width / 2, gameState.player.x + speed);
        }
    }
}

function setupVirtualJoystick() {
    const joystickBg = document.querySelector('.joystick-background');
    const joystickStick = document.getElementById('joystickStick');
    let isJoystickActive = false;
    let joystickCenterX = 0;
    let joystickCenterY = 0;
    let joystickRadius = 0;

    if (!joystickBg) return;

    // Atualizar posição do joystick no início do jogo
    const updateJoystickDimensions = () => {
        const rect = joystickBg.getBoundingClientRect();
        joystickCenterX = rect.left + rect.width / 2;
        joystickCenterY = rect.top + rect.height / 2;
        joystickRadius = rect.width / 2 - 10;
    };

    updateJoystickDimensions();
    window.addEventListener('resize', updateJoystickDimensions);

    // Touch start
    joystickBg.addEventListener('touchstart', (e) => {
        isJoystickActive = true;
        e.preventDefault();
    });

    // Touch move
    document.addEventListener('touchmove', (e) => {
        if (!isJoystickActive || !gameState.gameActive) return;

        const touch = e.touches[0];
        const touchX = touch.clientX;
        const touchY = touch.clientY;

        const deltaX = touchX - joystickCenterX;
        const deltaY = touchY - joystickCenterY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        let moveX = 0;
        let moveY = 0;

        if (distance > 10) {
            const angle = Math.atan2(deltaX, deltaY);
            const clampedDistance = Math.min(distance, joystickRadius);

            moveX = Math.sin(angle) * clampedDistance;
            moveY = Math.cos(angle) * clampedDistance;

            // Atualizar posição do stick
            joystickStick.style.transform = `translate(calc(-50% + ${moveX}px), calc(-50% + ${moveY}px))`;

            // Mover player
            const speed = 8;
            if (moveX < -20) {
                gameState.player.x = Math.max(gameState.player.width / 2, gameState.player.x - speed);
            } else if (moveX > 20) {
                gameState.player.x = Math.min(canvas.width - gameState.player.width / 2, gameState.player.x + speed);
            }
        } else {
            joystickStick.style.transform = `translate(-50%, -50%)`;
        }
    }, { passive: false });

    // Touch end
    document.addEventListener('touchend', () => {
        isJoystickActive = false;
        joystickStick.style.transform = `translate(-50%, -50%)`;
    });
}

function spawnObject() {
    if (!gameState.gameActive) return;

    if (Math.random() < gameState.objectSpawnRate) {
        const isEPI = Math.random() < 0.6;
        let object;

        if (isEPI && gameState.epiCollected.size < 5) {
            const epiKeys = Object.keys(EPIs);
            const randomEPI = epiKeys[Math.floor(Math.random() * epiKeys.length)];
            const epi = EPIs[randomEPI];

            if (!gameState.epiCollected.has(epi.id)) {
                object = {
                    type: 'epi',
                    id: epi.id,
                    name: epi.name,
                    x: Math.random() * (canvas.width - 40) + 20,
                    y: -40,
                    width: 40,
                    height: 40,
                    velocityY: 3 + Math.random() * 2,
                    color: epi.color,
                    emoji: epi.name.split(' ')[0]
                };
            }
        } else {
            const debris = DEBRIS[Math.floor(Math.random() * DEBRIS.length)];
            object = {
                type: 'debris',
                id: debris.id,
                x: Math.random() * (canvas.width - 30) + 15,
                y: -30,
                width: 30,
                height: 30,
                velocityY: 4 + Math.random() * 2,
                color: debris.color,
                emoji: debris.emoji,
                danger: debris.danger
            };
        }

        if (object) {
            gameState.fallingObjects.push(object);
        }
    }
}

function updateObjects() {
    gameState.fallingObjects = gameState.fallingObjects.filter(obj => {
        obj.y += obj.velocityY;

        // Colisão com o player
        if (
            gameState.player.x - gameState.player.width / 2 < obj.x + obj.width &&
            gameState.player.x + gameState.player.width / 2 > obj.x &&
            gameState.player.y < obj.y + obj.height &&
            gameState.player.y + gameState.player.height > obj.y
        ) {
            if (obj.type === 'epi') {
                gameState.epiCollected.add(obj.id);
                gameState.player.equipmentWorn[obj.id] = true;
                gameState.score += 100;
                updateEquipmentDisplay();
                checkPhaseComplete();
            } else if (obj.type === 'debris' && obj.danger) {
                gameState.lives--;
                updateUI();
                if (gameState.lives <= 0) {
                    endGameOver();
                }
            }
            return false;
        }

        // Remove se saiu da tela
        return obj.y < canvas.height + 50;
    });
}

function checkPhaseComplete() {
    if (gameState.epiCollected.size === 5) {
        gameState.gameActive = false;
        showPhaseComplete();
    }
}

function updateUI() {
    document.getElementById('lifeCount').textContent = gameState.lives;

    const elapsed = Math.floor((Date.now() - currentGameState.phaseStartTime) / 1000);
    const remaining = Math.max(0, 60 - elapsed);
    gameState.timeRemaining = remaining;
    document.getElementById('timeCount').textContent = remaining;

    if (remaining <= 0) {
        gameState.gameActive = false;
        if (gameState.epiCollected.size < 5) {
            endGameOver();
        }
    }
}

function updateEquipmentDisplay() {
    const list = document.getElementById('equipmentList');
    list.innerHTML = '';

    // Mostrar apenas ícones compactos
    Object.values(EPIs).forEach(epi => {
        const isCollected = gameState.epiCollected.has(epi.id);
        const emoji = epi.name.split(' ')[0];
        const div = document.createElement('div');
        div.className = `equipment-item ${isCollected ? 'collected' : 'missing'}`;
        div.textContent = emoji;
        div.title = epi.name;
        list.appendChild(div);
    });

    // Atualizar progresso
    const progress = document.getElementById('equipmentProgress');
    if (progress) {
        progress.textContent = gameState.epiCollected.size;
    }
}

function draw() {
    // Fundo
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Nuvens
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(50 + i * 300, 50, 25, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(80 + i * 300, 50, 35, 0, Math.PI * 2);
        ctx.fill();
    }

    // Chão
    ctx.fillStyle = '#90EE90';
    ctx.fillRect(0, canvas.height - 100, canvas.width, 100);

    // Maria (jogando as coisas)
    drawMaria();

    // Player (Alan)
    drawPlayer();

    // Objetos caindo
    gameState.fallingObjects.forEach(obj => {
        ctx.fillStyle = obj.color;
        ctx.fillRect(obj.x, obj.y, obj.width, obj.height);

        ctx.fillStyle = 'white';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(obj.emoji, obj.x + obj.width / 2, obj.y + obj.height / 2);
    });
}

function drawMaria() {
    const x = gameState.maria.x;
    const y = gameState.maria.y;

    // Cabeça (rosto simplificado)
    ctx.fillStyle = '#FDBCB4';
    ctx.beginPath();
    ctx.arc(x, y - 20, 15, 0, Math.PI * 2);
    ctx.fill();

    // Cabelo
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(x - 18, y - 32, 36, 15);

    // Olhos
    ctx.fillStyle = 'black';
    ctx.fillRect(x - 8, y - 23, 4, 4);
    ctx.fillRect(x + 4, y - 23, 4, 4);

    // Sorriso
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y - 18, 6, 0, Math.PI);
    ctx.stroke();

    // Corpo
    ctx.fillStyle = '#FF69B4';
    ctx.fillRect(x - 12, y - 5, 24, 30);

    // Braços
    ctx.fillStyle = '#FDBCB4';
    ctx.fillRect(x - 18, y, 6, 25);
    ctx.fillRect(x + 12, y, 6, 25);

    // Mãos
    ctx.fillStyle = '#FDBCB4';
    ctx.beginPath();
    ctx.arc(x - 15, y + 28, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 15, y + 28, 5, 0, Math.PI * 2);
    ctx.fill();

    // Pernas
    ctx.fillStyle = '#4169E1';
    ctx.fillRect(x - 8, y + 25, 5, 20);
    ctx.fillRect(x + 3, y + 25, 5, 20);

    // Sapatos
    ctx.fillStyle = '#000';
    ctx.fillRect(x - 8, y + 45, 5, 5);
    ctx.fillRect(x + 3, y + 45, 5, 5);
}

function drawPlayer() {
    const x = gameState.player.x;
    const y = gameState.player.y;

    // Cabeça (rosto do Alan/Diego)
    ctx.fillStyle = '#FDBCB4';
    ctx.beginPath();
    ctx.arc(x, y - 30, 18, 0, Math.PI * 2);
    ctx.fill();

    // Cabelo (castanho)
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(x - 20, y - 45, 40, 18);

    // Olhos
    ctx.fillStyle = 'black';
    ctx.fillRect(x - 10, y - 35, 5, 5);
    ctx.fillRect(x + 5, y - 35, 5, 5);

    // Sorriso
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y - 28, 8, 0, Math.PI);
    ctx.stroke();

    // Corpo (preto para contraste)
    ctx.fillStyle = '#333333';
    ctx.fillRect(x - 15, y - 10, 30, 40);

    // Braços
    ctx.fillStyle = '#FDBCB4';
    ctx.fillRect(x - 25, y, 10, 35);
    ctx.fillRect(x + 15, y, 10, 35);

    // Luvas (se coletou)
    if (gameState.player.equipmentWorn.gloves) {
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(x - 25, y + 35, 10, 5);
        ctx.fillRect(x + 15, y + 35, 10, 5);
    }

    // Pernas
    ctx.fillStyle = '#4169E1';
    ctx.fillRect(x - 10, y + 30, 8, 30);
    ctx.fillRect(x + 2, y + 30, 8, 30);

    // Sapatos
    ctx.fillStyle = '#000';
    ctx.fillRect(x - 10, y + 60, 8, 5);
    ctx.fillRect(x + 2, y + 60, 8, 5);

    // EQUIPAMENTOS NO BONECO

    // Capacete (se coletou)
    if (gameState.player.equipmentWorn.helmet) {
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(x, y - 32, 20, Math.PI, 0);
        ctx.fill();
        ctx.fillRect(x - 20, y - 32, 40, 5);
    }

    // Óculos (se coletou)
    if (gameState.player.equipmentWorn.glasses) {
        ctx.fillStyle = '#FFD700';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.fillRect(x - 12, y - 37, 6, 6);
        ctx.strokeRect(x - 12, y - 37, 6, 6);
        ctx.fillRect(x + 6, y - 37, 6, 6);
        ctx.strokeRect(x + 6, y - 37, 6, 6);
        ctx.strokeRect(x - 6, y - 35, 12, 2);
    }

    // Cinto de Segurança (se coletou)
    if (gameState.player.equipmentWorn.belt) {
        ctx.fillStyle = '#FF4500';
        ctx.fillRect(x - 15, y + 10, 30, 6);
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(x - 2, y + 10, 4, 6);
    }

    // Protetor Auricular (se coletou)
    if (gameState.player.equipmentWorn.earProtector) {
        ctx.fillStyle = '#4169E1';
        ctx.beginPath();
        ctx.arc(x - 17, y - 25, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + 17, y - 25, 6, 0, Math.PI * 2);
        ctx.fill();
    }
}

function gameLoop() {
    if (!gameState.gameActive) {
        return;
    }

    updateUI();
    spawnObject();
    updateObjects();
    draw();

    if (gameState.gameActive) {
        requestAnimationFrame(gameLoop);
    }
}

function showPhaseComplete() {
    const phase = getPhaseData(currentGameState.currentPhaseId);
    document.getElementById('completeMessage').textContent = `Parabéns! Alan completou a coleta de EPIs da fase: ${phase.title}`;
    document.getElementById('nextPhase').textContent = `Score: ${gameState.score} | Tempo: ${gameState.timeRemaining}s | Vidas restantes: ${gameState.lives}`;
    showScreen('completeScreen');
    completePhase(currentGameState.currentPhaseId);
}

function endGameOver() {
    document.getElementById('gameOverMessage').textContent = `Ops! Não foi desta vez. Equipamentos coletados: ${gameState.epiCollected.size}/5`;
    showScreen('gameOverScreen');
}

function retryPhase() {
    playPhase(currentGameState.currentPhaseId);
}

function nextPhase() {
    const nextPhaseId = currentGameState.currentPhaseId + 1;
    if (nextPhaseId <= getAllPhases().length) {
        playPhase(nextPhaseId);
    } else {
        showScreen('phaseSelect');
        displayPhases();
    }
}

function startGame() {
    showScreen('phaseSelect');
    setTimeout(() => {
        displayPhases();
        setupPhaseSelectCanvas();
    }, 100);
}

let selectedPhaseForDetail = null;

function displayPhases() {
    console.log('displayPhases: Starting...');
    const phasesPath = document.getElementById('phasesPath');
    if (!phasesPath) {
        console.error('displayPhases: phasesPath element not found!');
        return;
    }

    phasesPath.innerHTML = '';
    const phases = getAllPhases();
    console.log(`displayPhases: Creating ${phases.length} phases`);

    // EPIs nas plataformas (como na referência): óculos, cinturão, colete, capacete
    const EPI_MARKERS = ['🥽', '🎽', '🦺', '⛑️'];

    phases.forEach((phase, index) => {
        console.log(`  Creating phase circle for: ${phase.title}`);
        const markerIcon = EPI_MARKERS[index] || phase.emoji;
        const phaseCircle = document.createElement('div');
        phaseCircle.className = `phase-circle ${phase.unlocked ? 'unlocked' : 'locked'}`;
        phaseCircle.innerHTML = `
            <div class="phase-emoji">${markerIcon}</div>
            <div class="phase-number">${phase.id}</div>
        `;

        phaseCircle.onclick = () => {
            console.log(`Phase circle clicked: Phase ${phase.id} - ${phase.title}`);
            showPhaseDetail(phase);
        };

        phasesPath.appendChild(phaseCircle);
    });

    // Posicionar os círculos sobre o caminho (se o canvas já estiver dimensionado)
    if (typeof positionPhaseCircles === 'function') {
        positionPhaseCircles();
    }
    console.log('displayPhases: Complete');
}

function showPhaseDetail(phase) {
    console.log(`showPhaseDetail: Opening modal for Phase ${phase.id} - ${phase.title}`);
    selectedPhaseForDetail = phase;

    const statusClass = phase.unlocked ? 'unlocked' : 'locked';
    const statusText = phase.unlocked ? '✅ Desbloqueada' : '🔒 Bloqueada';

    const detailContent = document.getElementById('phaseDetailContent');
    if (!detailContent) {
        console.error('showPhaseDetail: phaseDetailContent element not found!');
        return;
    }

    detailContent.innerHTML = `
        <div class="detail-emoji">${phase.emoji}</div>
        <h2>${phase.title}</h2>
        <p><strong>${phase.company}</strong></p>
        <p>${phase.description}</p>
        <p><strong>Data:</strong> ${phase.date}</p>
        <div class="detail-badge ${statusClass}">${statusText}</div>
    `;

    const playButton = document.querySelector('.btn-play-phase');
    if (!playButton) {
        console.error('showPhaseDetail: btn-play-phase button not found!');
    } else {
        if (phase.unlocked) {
            playButton.disabled = false;
            playButton.textContent = '▶️ Jogar Fase';
        } else {
            playButton.disabled = true;
            playButton.textContent = '🔒 Bloqueada';
        }
    }

    const modal = document.getElementById('phaseDetailModal');
    if (!modal) {
        console.error('showPhaseDetail: phaseDetailModal element not found!');
        return;
    }
    modal.classList.add('active');
    console.log(`showPhaseDetail: Modal should now be visible`);
}

function closePhaseDetail() {
    const modal = document.getElementById('phaseDetailModal');
    modal.classList.remove('active');
    selectedPhaseForDetail = null;
}

function playCurrentPhase() {
    if (selectedPhaseForDetail && selectedPhaseForDetail.unlocked) {
        console.log('Iniciando fase:', selectedPhaseForDetail.id);
        const phaseId = selectedPhaseForDetail.id;  // Save phase ID before closing modal
        closePhaseDetail();  // This sets selectedPhaseForDetail to null
        playPhase(phaseId);  // Use the saved phase ID
    }
}

function startKnotPhaseSequence(phaseId) {
    currentGameState.knotsCompleted = 0;
    currentGameState.totalKnots = 2; // simple and double
    startKnotGame(phaseId, 'simple');
}

function playPhase(phaseId) {
    console.log('playPhase chamada com ID:', phaseId);

    if (!isPhaseUnlocked(phaseId)) {
        showLockedPhase(phaseId);
        return;
    }

    currentGameState.currentPhaseId = phaseId;
    const phase = getPhaseData(phaseId);
    document.getElementById('phaseInfo').textContent = `${phase.emoji} ${phase.title} - ${phase.date}`;

    // Dispatch based on gameType
    const gameType = phase.gameType;

    switch(gameType) {
        case 'knots':
            startKnotPhaseSequence(phaseId);
            break;
        case 'epi':
            showScreen('gameScreen');
            setTimeout(() => {
                console.log('Iniciando initEPIGame()');
                initEPIGame();
            }, 100);
            break;
        case 'quiz':
            startQuiz(phaseId);
            break;
        case 'locked':
            showLockedPhase(phaseId);
            break;
        default:
            console.warn('Unknown game type:', gameType);
            break;
    }
}

function showLockedPhase(phaseId) {
    const phase = getPhaseData(phaseId);
    document.getElementById('lockedMessage').innerHTML = `
        <strong>${phase.title}</strong><br>
        ${phase.lockReason || 'Esta fase ainda não foi desbloqueada.'}<br><br>
        <em>"${phase.description}"</em>
    `;
    showScreen('lockedScreen');
}

function showInstructions() {
    showScreen('instructionsScreen');
}

function backToPhaseSelect() {
    showScreen('phaseSelect');
}

function backToMenu() {
    showScreen('mainMenu');
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

// Pontos do caminho sinuoso (frações da tela) — compartilhados entre o
// desenho da estrada no canvas e o posicionamento dos círculos de fase.
const PHASE_PATH_POINTS = [
    { x: 0.55, y: 0.20 },
    { x: 0.42, y: 0.42 },
    { x: 0.57, y: 0.63 },
    { x: 0.45, y: 0.84 }
];

// Posiciona os círculos de fase (HTML) exatamente sobre o caminho do canvas
function positionPhaseCircles() {
    const circles = document.querySelectorAll('#phasesPath .phase-circle');
    circles.forEach((circle, i) => {
        const p = PHASE_PATH_POINTS[i] || PHASE_PATH_POINTS[PHASE_PATH_POINTS.length - 1];
        circle.style.left = (p.x * 100) + '%';
        circle.style.top = (p.y * 100) + '%';
    });
}

// Clarear/escurecer uma cor hex para faces 3D
function shadeColor(hex, amt) {
    const c = hex.replace('#', '');
    let r = parseInt(c.substr(0, 2), 16) + amt;
    let g = parseInt(c.substr(2, 2), 16) + amt;
    let b = parseInt(c.substr(4, 2), 16) + amt;
    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));
    return `rgb(${r}, ${g}, ${b})`;
}

// Desenhar cenário da página de fases
function setupPhaseSelectCanvas() {
    const canvas = document.getElementById('phaseSelectCanvas');
    if (!canvas) return;

    // Ajustar tamanho do canvas
    function resizeCanvas() {
        const container = document.getElementById('phaseSelect');
        canvas.width = container.offsetWidth;
        canvas.height = container.offsetHeight;
        drawPhaseSelectScene();
        positionPhaseCircles();
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
}

function drawPhaseSelectScene() {
    const canvas = document.getElementById('phaseSelectCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    if (!W || !H) return;

    // Oceano (água turquesa) cobrindo todo o fundo
    const ocean = ctx.createLinearGradient(0, 0, W, H);
    ocean.addColorStop(0, '#43D0D0');
    ocean.addColorStop(0.5, '#27ADAD');
    ocean.addColorStop(1, '#1B9090');
    ctx.fillStyle = ocean;
    ctx.fillRect(0, 0, W, H);

    drawOceanTexture(ctx, W, H);

    // Ilha de areia (preenche quase toda a tela, água só nos cantos)
    drawSandIsland(ctx, W, H);

    // Caminho sinuoso de concreto
    drawWindingRoad(ctx, W, H);

    // Canteiro de obras (prédios, guindastes, caminhões, operários)
    drawConstructionScene(ctx, W, H);

    // Sol
    ctx.save();
    ctx.shadowColor = 'rgba(255, 210, 70, 0.7)';
    ctx.shadowBlur = 45;
    ctx.fillStyle = '#FFD23F';
    ctx.beginPath();
    ctx.arc(W - 78, 66, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

function drawOceanTexture(ctx, W, H) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 9; i++) {
        const y = (i + 1) * H / 10;
        ctx.beginPath();
        ctx.moveTo(0, y);
        for (let x = 0; x <= W; x += 26) {
            ctx.lineTo(x, y + Math.sin((x / 45) + i) * 4);
        }
        ctx.stroke();
    }
}

function drawSandIsland(ctx, W, H) {
    const cx = W / 2;
    const cy = H / 2;
    // Elipse maior que a tela: sobra água só nos cantos (canteiro cheio)
    const rx = W * 0.58;
    const ry = H * 0.62;

    // Espuma / praia molhada (borda clara)
    ctx.fillStyle = '#F2E6C2';
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();

    // Areia principal
    const sand = ctx.createRadialGradient(cx, cy, ry * 0.2, cx, cy, ry);
    sand.addColorStop(0, '#EFDCA8');
    sand.addColorStop(1, '#D8C08A');
    ctx.fillStyle = sand;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx - 22, ry - 22, 0, 0, Math.PI * 2);
    ctx.fill();

    // Manchas de terra/areia batida
    ctx.fillStyle = 'rgba(180, 155, 110, 0.20)';
    const spots = [[0.2, 0.35], [0.3, 0.72], [0.72, 0.4], [0.8, 0.7], [0.5, 0.2]];
    spots.forEach(s => {
        ctx.beginPath();
        ctx.ellipse(s[0] * W, s[1] * H, 55, 26, 0, 0, Math.PI * 2);
        ctx.fill();
    });
}

function drawWindingRoad(ctx, W, H) {
    const pts = PHASE_PATH_POINTS.map(p => ({ x: p.x * W, y: p.y * H }));

    const path = new Path2D();
    path.moveTo(pts[0].x, pts[0].y);
    for (let i = 0; i < pts.length - 1; i++) {
        const midY = (pts[i].y + pts[i + 1].y) / 2;
        path.bezierCurveTo(pts[i].x, midY, pts[i + 1].x, midY, pts[i + 1].x, pts[i + 1].y);
    }

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Sombra da estrada
    ctx.strokeStyle = 'rgba(0,0,0,0.10)';
    ctx.lineWidth = 74;
    ctx.stroke(path);
    // Meio-fio
    ctx.strokeStyle = '#8E8E84';
    ctx.lineWidth = 68;
    ctx.stroke(path);
    // Asfalto/concreto
    ctx.strokeStyle = '#BBBBB0';
    ctx.lineWidth = 56;
    ctx.stroke(path);
    // Linha central tracejada
    ctx.setLineDash([18, 22]);
    ctx.strokeStyle = '#F4ECCC';
    ctx.lineWidth = 4;
    ctx.stroke(path);
    ctx.setLineDash([]);
}

// ---- Utilitários de desenho isométrico ----
function fillPoly(ctx, pts, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
    ctx.fill();
}

// Grade de janelas numa parede isométrica (P0 = canto frontal, P1 = canto lateral)
function drawIsoWindows(ctx, P0, P1, height, floors) {
    const cols = 3;
    const rows = Math.max(2, floors);
    const pt = (u, v) => [
        P0[0] + (P1[0] - P0[0]) * u,
        P0[1] + (P1[1] - P0[1]) * u - height * v
    ];
    ctx.fillStyle = 'rgba(70, 92, 115, 0.55)';
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const u0 = (c + 0.24) / cols, u1 = (c + 0.76) / cols;
            const v0 = (r + 0.28) / rows, v1 = (r + 0.74) / rows;
            fillPoly(ctx, [pt(u0, v0), pt(u1, v0), pt(u1, v1), pt(u0, v1)],
                'rgba(70, 92, 115, 0.5)');
        }
    }
}

// Prédio de concreto em construção (isométrico)
function isoBuilding(ctx, cx, baseY, w, floors, opts) {
    opts = opts || {};
    // Altura do andar proporcional à largura -> proporções corretas em qualquer tela
    const floorH = opts.floorH || Math.max(7, w * 0.34);
    const height = floors * floorH;
    const hh = w * 0.5;

    const bottom = [cx, baseY];
    const right = [cx + w, baseY - hh];
    const left = [cx - w, baseY - hh];
    const back = [cx, baseY - w];

    // Sombra no chão
    ctx.fillStyle = 'rgba(0,0,0,0.10)';
    ctx.beginPath();
    ctx.moveTo(bottom[0], bottom[1] + 4);
    ctx.lineTo(right[0] + 5, right[1] + 4);
    ctx.lineTo(back[0], back[1] + 4);
    ctx.lineTo(left[0] - 5, left[1] + 4);
    ctx.closePath();
    ctx.fill();

    const base = opts.color || '#C6C6BC';
    const leftColor = shadeColor(base, -36);
    const rightColor = shadeColor(base, -12);
    const topColor = shadeColor(base, 20);

    const bT = [bottom[0], bottom[1] - height];
    const rT = [right[0], right[1] - height];
    const lT = [left[0], left[1] - height];
    const kT = [back[0], back[1] - height];

    // Parede direita
    fillPoly(ctx, [bottom, right, rT, bT], rightColor);
    drawIsoWindows(ctx, bottom, right, height, floors);
    // Parede esquerda
    fillPoly(ctx, [bottom, left, lT, bT], leftColor);
    drawIsoWindows(ctx, bottom, left, height, floors);
    // Laje/topo
    fillPoly(ctx, [bT, rT, kT, lT], topColor);

    // Ferragens/pilares no topo (em construção)
    ctx.strokeStyle = 'rgba(70,70,62,0.75)';
    ctx.lineWidth = 1.3;
    const tops = [bT, rT, kT, lT, [(bT[0] + kT[0]) / 2, (bT[1] + kT[1]) / 2]];
    tops.forEach(t => {
        ctx.beginPath();
        ctx.moveTo(t[0], t[1]);
        ctx.lineTo(t[0], t[1] - 9);
        ctx.stroke();
    });

    // Logo FG na parede direita
    if (opts.label) {
        const mx = (bottom[0] + right[0]) / 2;
        const my = (bottom[1] + right[1]) / 2 - height * 0.5;
        ctx.fillStyle = '#2C5AA0';
        ctx.font = `bold ${Math.round(w * 0.42)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('FG', mx, my);
    }
}

// Guindaste torre em treliça
function isoCrane(ctx, cx, baseY, h) {
    const c = '#F2A81E';
    const top = baseY - h;

    // Sombra
    ctx.fillStyle = 'rgba(0,0,0,0.10)';
    ctx.beginPath();
    ctx.ellipse(cx, baseY, 14, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Mastro (dois trilhos + treliça)
    ctx.strokeStyle = c;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(cx - 5, baseY); ctx.lineTo(cx - 5, top); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + 5, baseY); ctx.lineTo(cx + 5, top); ctx.stroke();
    ctx.lineWidth = 1.1;
    for (let y = baseY - 6; y > top; y -= 11) {
        ctx.beginPath(); ctx.moveTo(cx - 5, y); ctx.lineTo(cx + 5, y - 6); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx + 5, y); ctx.lineTo(cx - 5, y - 6); ctx.stroke();
    }

    // Cabine
    ctx.fillStyle = c;
    ctx.fillRect(cx - 7, top - 9, 14, 10);

    const jib = 72;
    const apex = top - 18;
    // Lança (braço) e contra-lança
    ctx.lineWidth = 3;
    ctx.strokeStyle = c;
    ctx.beginPath(); ctx.moveTo(cx, top - 3); ctx.lineTo(cx + jib, top - 3); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, top - 3); ctx.lineTo(cx - 26, top - 3); ctx.stroke();
    // Treliça da lança
    ctx.lineWidth = 1.1;
    for (let i = 0; i < 8; i++) {
        const x = cx + i * (jib / 8);
        ctx.beginPath();
        ctx.moveTo(x, top - 3);
        ctx.lineTo(x + jib / 8, top + 3);
        ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(cx, top + 3); ctx.lineTo(cx + jib, top - 1); ctx.stroke();
    // Tirantes até o apex
    ctx.beginPath(); ctx.moveTo(cx, apex); ctx.lineTo(cx + jib, top - 3); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, apex); ctx.lineTo(cx - 26, top - 3); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, top - 3); ctx.lineTo(cx, apex); ctx.stroke();
    // Contrapeso
    ctx.fillStyle = '#C98A12';
    ctx.fillRect(cx - 30, top - 7, 9, 11);
    // Cabo + carga
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(cx + jib - 8, top - 3); ctx.lineTo(cx + jib - 8, top + 20); ctx.stroke();
    ctx.fillStyle = '#7A5230';
    ctx.fillRect(cx + jib - 14, top + 20, 13, 8);
}

// Caminhão basculante pequeno
function drawTruckSmall(ctx, cx, baseY, s) {
    s = s || 1;
    ctx.save();
    ctx.translate(cx, baseY);
    ctx.scale(s, s);
    // Sombra
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.beginPath();
    ctx.ellipse(4, 3, 22, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    // Caçamba
    ctx.fillStyle = '#E7A80E';
    ctx.fillRect(-16, -12, 26, 12);
    ctx.fillStyle = '#C98A12';
    ctx.fillRect(-16, -12, 26, 3);
    // Cabine
    ctx.fillStyle = '#F2BE33';
    ctx.fillRect(10, -10, 11, 10);
    ctx.fillStyle = 'rgba(120,150,180,0.9)';
    ctx.fillRect(12, -8, 6, 5);
    // Rodas
    ctx.fillStyle = '#333';
    [-9, 3, 16].forEach(wx => {
        ctx.beginPath();
        ctx.arc(wx, 1, 4, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.restore();
}

// Operário minúsculo (capacete + corpo)
function drawWorker(ctx, x, y) {
    ctx.fillStyle = '#E8A200';
    ctx.beginPath();
    ctx.arc(x, y - 6, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#3A4A5A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y - 5);
    ctx.lineTo(x, y - 1);
    ctx.stroke();
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y - 1); ctx.lineTo(x - 2, y + 2);
    ctx.moveTo(x, y - 1); ctx.lineTo(x + 2, y + 2);
    ctx.stroke();
}

// Monta o canteiro inteiro com ordenação de profundidade (trás -> frente)
function drawConstructionScene(ctx, W, H) {
    const grays = ['#C9C9BF', '#C0C0B6', '#D3D3C9', '#BFC1BB'];
    const props = [];

    const B = (fx, fy, wf, floors, label, ci) => props.push({
        z: fy * H, fn: () => isoBuilding(ctx, fx * W, fy * H, W * wf, floors,
            { color: grays[ci % grays.length], label })
    });
    const C = (fx, fy, hf) => props.push({
        z: fy * H, fn: () => isoCrane(ctx, fx * W, fy * H, H * hf)
    });
    const T = (fx, fy, s) => props.push({
        z: fy * H, fn: () => drawTruckSmall(ctx, fx * W, fy * H, s)
    });
    const P = (fx, fy) => props.push({
        z: fy * H, fn: () => drawWorker(ctx, fx * W, fy * H)
    });

    // ----- LADO ESQUERDO -----
    C(0.29, 0.24, 0.20);
    C(0.11, 0.13, 0.16);
    B(0.10, 0.31, 0.040, 6, true, 0);
    B(0.25, 0.27, 0.032, 4, false, 1);
    B(0.06, 0.51, 0.044, 7, true, 2);
    B(0.22, 0.47, 0.030, 4, false, 3);
    B(0.12, 0.71, 0.042, 6, true, 1);
    B(0.28, 0.65, 0.028, 3, false, 0);
    B(0.09, 0.89, 0.036, 5, false, 2);
    B(0.26, 0.85, 0.030, 4, true, 3);
    T(0.20, 0.57, 1.0);
    T(0.15, 0.60, 0.8);
    T(0.31, 0.52, 0.8);

    // ----- LADO DIREITO (espelhado) -----
    C(0.71, 0.24, 0.20);
    C(0.89, 0.13, 0.16);
    B(0.90, 0.31, 0.040, 6, true, 1);
    B(0.75, 0.27, 0.032, 4, false, 0);
    B(0.94, 0.51, 0.044, 7, true, 3);
    B(0.78, 0.47, 0.030, 4, false, 2);
    B(0.88, 0.71, 0.042, 6, true, 0);
    B(0.72, 0.65, 0.028, 3, false, 1);
    B(0.91, 0.89, 0.036, 5, false, 3);
    B(0.74, 0.85, 0.030, 4, true, 2);
    T(0.80, 0.57, 1.0);
    T(0.85, 0.60, 0.8);
    T(0.69, 0.52, 0.8);

    // ----- Operários espalhados -----
    [[0.35, 0.32], [0.37, 0.56], [0.34, 0.74], [0.40, 0.42], [0.63, 0.36],
     [0.64, 0.60], [0.61, 0.72], [0.66, 0.47], [0.49, 0.54], [0.51, 0.30],
     [0.52, 0.80], [0.46, 0.66]].forEach(w => P(w[0], w[1]));

    props.sort((a, b) => a.z - b.z);
    props.forEach(p => p.fn());
}

document.addEventListener('DOMContentLoaded', () => {
    showScreen('mainMenu');

    // Quando mostrar a tela de fases, inicializar o canvas
    setTimeout(() => {
        if (document.getElementById('phaseSelect').classList.contains('active')) {
            setupPhaseSelectCanvas();
        }
    }, 100);
});
