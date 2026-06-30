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

    phases.forEach((phase) => {
        console.log(`  Creating phase circle for: ${phase.title}`);
        const phaseCircle = document.createElement('div');
        phaseCircle.className = `phase-circle ${phase.unlocked ? 'unlocked' : 'locked'}`;
        phaseCircle.innerHTML = `
            <div class="phase-emoji">${phase.emoji}</div>
            <div class="phase-number">${phase.id}</div>
        `;

        phaseCircle.onclick = () => {
            console.log(`Phase circle clicked: Phase ${phase.id} - ${phase.title}`);
            showPhaseDetail(phase);
        };

        phasesPath.appendChild(phaseCircle);
    });
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

// Desenhar cenário da página de fases
function setupPhaseSelectCanvas() {
    const canvas = document.getElementById('phaseSelectCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // Ajustar tamanho do canvas
    function resizeCanvas() {
        const container = document.getElementById('phaseSelect');
        canvas.width = container.offsetWidth;
        canvas.height = container.offsetHeight;
        drawPhaseSelectScene();
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
}

function drawPhaseSelectScene() {
    const canvas = document.getElementById('phaseSelectCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Céu azul degradê
    const skyGradient = ctx.createLinearGradient(0, 0, 0, height * 0.6);
    skyGradient.addColorStop(0, '#87CEEB');
    skyGradient.addColorStop(1, '#E0F6FF');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, width, height * 0.6);

    // Areia
    ctx.fillStyle = '#D2B48C';
    ctx.fillRect(0, height * 0.6, width, height * 0.25);

    // Mar
    ctx.fillStyle = '#4A90E2';
    ctx.fillRect(0, height * 0.85, width, height * 0.15);

    // Nuvens
    drawClouds(ctx, width, height);

    // Sol
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(width - 80, 60, 40, 0, Math.PI * 2);
    ctx.fill();

    // Prédios esquerda
    drawBuildings(ctx, 20, height * 0.3, 'left');

    // Prédios direita
    drawBuildings(ctx, width - 120, height * 0.3, 'right');

    // Ondas do mar
    drawWaves(ctx, width, height * 0.85);
}

function drawClouds(ctx, width, height) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';

    // Nuvem 1
    ctx.beginPath();
    ctx.arc(width * 0.2, height * 0.15, 30, 0, Math.PI * 2);
    ctx.arc(width * 0.25, height * 0.12, 35, 0, Math.PI * 2);
    ctx.arc(width * 0.3, height * 0.15, 30, 0, Math.PI * 2);
    ctx.fill();

    // Nuvem 2
    ctx.beginPath();
    ctx.arc(width * 0.7, height * 0.2, 25, 0, Math.PI * 2);
    ctx.arc(width * 0.74, height * 0.17, 30, 0, Math.PI * 2);
    ctx.arc(width * 0.78, height * 0.2, 25, 0, Math.PI * 2);
    ctx.fill();

    // Nuvem 3
    ctx.beginPath();
    ctx.arc(width * 0.5, height * 0.08, 20, 0, Math.PI * 2);
    ctx.arc(width * 0.53, height * 0.06, 25, 0, Math.PI * 2);
    ctx.arc(width * 0.56, height * 0.08, 20, 0, Math.PI * 2);
    ctx.fill();
}

function drawBuildings(ctx, startX, startY, side) {
    // Prédio 1 - maior
    ctx.fillStyle = '#FF6B6B';
    ctx.fillRect(startX, startY - 80, 60, 100);

    // Janelas prédio 1
    ctx.fillStyle = '#FFD700';
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 3; j++) {
            ctx.fillRect(startX + 8 + j * 18, startY - 70 + i * 20, 10, 10);
        }
    }

    // Prédio 2 - médio
    ctx.fillStyle = '#4ECDC4';
    ctx.fillRect(startX + 70, startY - 60, 50, 80);

    // Janelas prédio 2
    ctx.fillStyle = '#FFD700';
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 2; j++) {
            ctx.fillRect(startX + 78 + j * 18, startY - 50 + i * 20, 10, 10);
        }
    }

    // Prédio 3 - guindaste
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(startX + 30, startY - 40, 8, 40);
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(startX + 34, startY - 40);
    ctx.lineTo(startX + 70, startY - 35);
    ctx.stroke();
}

function drawWaves(ctx, width, waveY) {
    ctx.strokeStyle = 'rgba(100, 150, 220, 0.4)';
    ctx.lineWidth = 2;

    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(0, waveY + i * 15);
        for (let x = 0; x <= width; x += 20) {
            ctx.quadraticCurveTo(x + 10, waveY - 5 + i * 15, x + 20, waveY + i * 15);
        }
        ctx.stroke();
    }
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
