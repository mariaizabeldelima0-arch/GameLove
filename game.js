// Estado do jogo
const gameState = {
    camera: { x: 0, y: 0 },
    platforms: [],
    obstacles: [],
    collectibles: [],
    player: {
        x: 100,
        y: 300,
        width: 40,
        height: 60,
        velocityX: 0,
        velocityY: 0,
        isJumping: false,
        color: '#FF6B6B'
    },
    keys: {},
    gravity: 0.6,
    score: 0
};

let currentGameState = {
    currentPhaseId: 1,
    quizCompleted: false,
    knotCompleted: false,
    platformCompleted: false,
    allChallengesCompleted: false
};

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Inicializar jogo
function initGame() {
    canvas.width = window.innerWidth * 0.9;
    canvas.height = window.innerHeight * 0.85;

    gameState.camera = { x: 0, y: 0 };
    gameState.player = {
        x: 100,
        y: 300,
        width: 40,
        height: 60,
        velocityX: 0,
        velocityY: 0,
        isJumping: false,
        color: '#FF6B6B'
    };

    generateLevel(currentGameState.currentPhaseId);
    setupEventListeners();

    // Mostrar informações da fase
    const phase = getPhaseData(currentGameState.currentPhaseId);
    document.getElementById('phaseInfo').textContent = `${phase.emoji} ${phase.title} - ${phase.date}`;

    gameLoop();
}

function generateLevel(phaseId) {
    gameState.platforms = [];
    gameState.obstacles = [];
    gameState.collectibles = [];

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // Plataforma inicial
    gameState.platforms.push(
        { x: 0, y: canvasHeight - 50, width: 150, height: 50, color: '#2ECC71' }
    );

    // Fase 1 - Fácil
    if (phaseId === 1) {
        gameState.platforms.push(
            { x: 200, y: canvasHeight - 200, width: 150, height: 40, color: '#2ECC71' },
            { x: 450, y: canvasHeight - 350, width: 150, height: 40, color: '#2ECC71' },
            { x: 700, y: canvasHeight - 280, width: 150, height: 40, color: '#2ECC71' },
            { x: 950, y: canvasHeight - 400, width: 150, height: 40, color: '#2ECC71' },
            { x: 1200, y: canvasHeight - 200, width: 200, height: 50, color: '#FFD700' } // Meta
        );

        gameState.obstacles.push(
            { x: 600, y: canvasHeight - 150, width: 40, height: 40, color: '#FF6B6B', type: 'spike' }
        );
    }
    // Fase 2 - Médio
    else if (phaseId === 2) {
        gameState.platforms.push(
            { x: 180, y: canvasHeight - 180, width: 120, height: 40, color: '#2ECC71' },
            { x: 400, y: canvasHeight - 300, width: 120, height: 40, color: '#2ECC71' },
            { x: 600, y: canvasHeight - 150, width: 120, height: 40, color: '#2ECC71' },
            { x: 850, y: canvasHeight - 350, width: 120, height: 40, color: '#2ECC71' },
            { x: 1100, y: canvasHeight - 250, width: 120, height: 40, color: '#2ECC71' },
            { x: 1350, y: canvasHeight - 400, width: 200, height: 50, color: '#FFD700' } // Meta
        );

        gameState.obstacles.push(
            { x: 500, y: canvasHeight - 100, width: 40, height: 40, color: '#FF6B6B', type: 'spike' },
            { x: 900, y: canvasHeight - 150, width: 40, height: 40, color: '#FF6B6B', type: 'spike' }
        );

        // Plataformas móveis
        gameState.platforms.push(
            { x: 650, y: canvasHeight - 500, width: 100, height: 30, color: '#4ECDC4', moving: true, minX: 600, maxX: 750 }
        );
    }
    // Fase 3 - Difícil
    else if (phaseId === 3) {
        gameState.platforms.push(
            { x: 150, y: canvasHeight - 150, width: 100, height: 35, color: '#2ECC71' },
            { x: 350, y: canvasHeight - 280, width: 100, height: 35, color: '#2ECC71' },
            { x: 600, y: canvasHeight - 150, width: 100, height: 35, color: '#2ECC71' },
            { x: 850, y: canvasHeight - 320, width: 100, height: 35, color: '#2ECC71' },
            { x: 1100, y: canvasHeight - 180, width: 100, height: 35, color: '#2ECC71' },
            { x: 1350, y: canvasHeight - 350, width: 100, height: 35, color: '#2ECC71' },
            { x: 1600, y: canvasHeight - 200, width: 250, height: 50, color: '#FFD700' } // Meta
        );

        gameState.obstacles.push(
            { x: 450, y: canvasHeight - 100, width: 40, height: 40, color: '#FF6B6B', type: 'spike' },
            { x: 750, y: canvasHeight - 100, width: 40, height: 40, color: '#FF6B6B', type: 'spike' },
            { x: 1250, y: canvasHeight - 150, width: 40, height: 40, color: '#FF6B6B', type: 'spike' }
        );

        // Múltiplas plataformas móveis
        gameState.platforms.push(
            { x: 500, y: canvasHeight - 450, width: 80, height: 25, color: '#4ECDC4', moving: true, minX: 450, maxX: 600 },
            { x: 1000, y: canvasHeight - 500, width: 80, height: 25, color: '#4ECDC4', moving: true, minX: 950, maxX: 1100 }
        );
    }
    // Fase 4 - Expert (bloqueada)
    else if (phaseId === 4) {
        gameState.platforms.push(
            { x: 100, y: canvasHeight - 120, width: 80, height: 30, color: '#2ECC71' },
            { x: 280, y: canvasHeight - 250, width: 80, height: 30, color: '#2ECC71' },
            { x: 480, y: canvasHeight - 150, width: 80, height: 30, color: '#2ECC71' },
            { x: 700, y: canvasHeight - 300, width: 80, height: 30, color: '#2ECC71' },
            { x: 920, y: canvasHeight - 180, width: 80, height: 30, color: '#2ECC71' },
            { x: 1150, y: canvasHeight - 320, width: 80, height: 30, color: '#2ECC71' },
            { x: 1380, y: canvasHeight - 200, width: 80, height: 30, color: '#2ECC71' },
            { x: 1600, y: canvasHeight - 400, width: 280, height: 60, color: '#FFD700' } // Meta
        );

        gameState.obstacles.push(
            { x: 350, y: canvasHeight - 100, width: 40, height: 40, color: '#FF6B6B', type: 'spike' },
            { x: 600, y: canvasHeight - 100, width: 40, height: 40, color: '#FF6B6B', type: 'spike' },
            { x: 850, y: canvasHeight - 100, width: 40, height: 40, color: '#FF6B6B', type: 'spike' },
            { x: 1250, y: canvasHeight - 150, width: 40, height: 40, color: '#FF6B6B', type: 'spike' }
        );
    }

    // Chão
    gameState.platforms.push(
        { x: -1000, y: canvasHeight - 10, width: 5000, height: 10, color: '#8B4513' }
    );
}

function setupEventListeners() {
    window.addEventListener('keydown', (e) => {
        gameState.keys[e.key] = true;

        if (e.key === ' ') {
            e.preventDefault();
            if (!gameState.player.isJumping) {
                gameState.player.velocityY = -15;
                gameState.player.isJumping = true;
            }
        }
    });

    window.addEventListener('keyup', (e) => {
        gameState.keys[e.key] = false;
    });

    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth * 0.9;
        canvas.height = window.innerHeight * 0.85;
    });
}

function update() {
    // Movimento horizontal
    gameState.player.velocityX = 0;

    if (gameState.keys['ArrowLeft'] || gameState.keys['a']) {
        gameState.player.velocityX = -6;
    }
    if (gameState.keys['ArrowRight'] || gameState.keys['d']) {
        gameState.player.velocityX = 6;
    }

    // Aplicar velocidade
    gameState.player.x += gameState.player.velocityX;
    gameState.player.velocityY += gameState.gravity;
    gameState.player.y += gameState.player.velocityY;

    // Colisões com plataformas
    gameState.player.isJumping = true;

    gameState.platforms.forEach(platform => {
        if (platform.moving) {
            platform.x += 2;
            if (platform.x > platform.maxX || platform.x < platform.minX) {
                platform.x = platform.x > platform.maxX ? platform.minX : platform.maxX;
            }
        }

        if (
            gameState.player.velocityY >= 0 &&
            gameState.player.y + gameState.player.height <= platform.y + 10 &&
            gameState.player.y + gameState.player.height >= platform.y - 5 &&
            gameState.player.x + gameState.player.width > platform.x &&
            gameState.player.x < platform.x + platform.width
        ) {
            gameState.player.velocityY = 0;
            gameState.player.y = platform.y - gameState.player.height;
            gameState.player.isJumping = false;
        }
    });

    // Colisões com obstáculos
    gameState.obstacles.forEach(obstacle => {
        if (
            gameState.player.x < obstacle.x + obstacle.width &&
            gameState.player.x + gameState.player.width > obstacle.x &&
            gameState.player.y < obstacle.y + obstacle.height &&
            gameState.player.y + gameState.player.height > obstacle.y
        ) {
            resetPlayerPosition();
        }
    });

    // Verificar se chegou na meta
    const goal = gameState.platforms[gameState.platforms.length - 2]; // Penúltima plataforma é a meta
    if (
        gameState.player.x < goal.x + goal.width &&
        gameState.player.x + gameState.player.width > goal.x &&
        gameState.player.y < goal.y + goal.height &&
        gameState.player.y + gameState.player.height > goal.y
    ) {
        currentGameState.platformCompleted = true;
        checkAllChallengesCompleted();
    }

    // Câmera segue o jogador
    gameState.camera.x = gameState.player.x - canvas.width / 4;
    gameState.camera.y = gameState.player.y - canvas.height / 3;

    // Límites da câmera
    gameState.camera.x = Math.max(0, gameState.camera.x);
    gameState.camera.y = Math.max(0, gameState.camera.y);

    // Morte por sair da tela
    if (gameState.player.y > canvas.height + 200) {
        resetPlayerPosition();
    }
}

function resetPlayerPosition() {
    gameState.player.x = 100;
    gameState.player.y = canvas.height - 100;
    gameState.player.velocityY = 0;
}

function draw() {
    ctx.save();
    ctx.translate(-gameState.camera.x, -gameState.camera.y);

    // Céu
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(gameState.camera.x, gameState.camera.y, canvas.width, canvas.height);

    // Nuvens
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    for (let i = 0; i < 3; i++) {
        const x = gameState.camera.x + i * 300;
        const y = gameState.camera.y + 50;
        ctx.fillRect(x, y, 100, 40);
        ctx.arc(x + 20, y + 20, 25, 0, Math.PI * 2);
    }

    // Plataformas
    gameState.platforms.forEach(platform => {
        ctx.fillStyle = platform.color;
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);

        // Borda
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 2;
        ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);

        // Padrão
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        for (let i = 0; i < platform.width; i += 20) {
            ctx.fillRect(platform.x + i, platform.y, 10, 5);
        }
    });

    // Obstáculos
    gameState.obstacles.forEach(obstacle => {
        ctx.fillStyle = obstacle.color;
        ctx.save();
        ctx.translate(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2);
        ctx.rotate((Date.now() / 500) % (Math.PI * 2));
        ctx.fillRect(-obstacle.width / 2, -obstacle.height / 2, obstacle.width, obstacle.height);
        ctx.restore();

        // Triângulo de aviso
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.moveTo(obstacle.x + obstacle.width / 2, obstacle.y);
        ctx.lineTo(obstacle.x + obstacle.width, obstacle.y + obstacle.height);
        ctx.lineTo(obstacle.x, obstacle.y + obstacle.height);
        ctx.closePath();
        ctx.fill();
    });

    // Jogador
    ctx.fillStyle = gameState.player.color;
    ctx.fillRect(
        gameState.player.x,
        gameState.player.y,
        gameState.player.width,
        gameState.player.height
    );

    // Olhos do jogador
    ctx.fillStyle = 'white';
    ctx.fillRect(gameState.player.x + 8, gameState.player.y + 15, 8, 8);
    ctx.fillRect(gameState.player.x + 24, gameState.player.y + 15, 8, 8);

    ctx.fillStyle = 'black';
    ctx.fillRect(gameState.player.x + 10, gameState.player.y + 17, 4, 4);
    ctx.fillRect(gameState.player.x + 26, gameState.player.y + 17, 4, 4);

    ctx.restore();
}

function checkAllChallengesCompleted() {
    const phase = getPhaseData(currentGameState.currentPhaseId);
    let allCompleted = currentGameState.platformCompleted;

    phase.challenges.forEach(challenge => {
        if (challenge.type === 'quiz') {
            allCompleted = allCompleted && currentGameState.quizCompleted;
        }
        if (challenge.type === 'knot') {
            allCompleted = allCompleted && currentGameState.knotCompleted;
        }
    });

    if (allCompleted && currentGameState.platformCompleted) {
        currentGameState.allChallengesCompleted = true;
        completePhase(currentGameState.currentPhaseId);
        showPhaseComplete();
    }
}

function gameLoop() {
    update();
    draw();

    if (!document.getElementById('gameScreen').classList.contains('active')) {
        return;
    }

    requestAnimationFrame(gameLoop);
}

// Funções de navegação
function startGame() {
    showScreen('phaseSelect');
    displayPhases();
}

function displayPhases() {
    const phasesGrid = document.getElementById('phasesGrid');
    phasesGrid.innerHTML = '';

    getAllPhases().forEach(phase => {
        const card = document.createElement('div');
        card.className = `phase-card ${phase.locked ? 'locked' : ''}`;

        card.innerHTML = `
            <div class="emoji">${phase.emoji}</div>
            <h3>${phase.title}</h3>
            <p>${phase.description}</p>
            <div class="status">
                <div class="${phase.unlocked ? 'unlocked' : 'locked-text'}">
                    ${phase.unlocked ? '✅ Desbloqueada' : '🔒 Bloqueada'}
                </div>
                <div>${phase.date}</div>
            </div>
        `;

        if (phase.unlocked) {
            card.onclick = () => playPhase(phase.id);
        } else {
            card.onclick = () => showLockedPhase(phase.id);
        }

        phasesGrid.appendChild(card);
    });
}

function playPhase(phaseId) {
    if (!isPhaseUnlocked(phaseId)) {
        showLockedPhase(phaseId);
        return;
    }

    currentGameState.currentPhaseId = phaseId;
    currentGameState.quizCompleted = false;
    currentGameState.knotCompleted = false;
    currentGameState.platformCompleted = false;
    currentGameState.allChallengesCompleted = false;

    showScreen('gameScreen');
    initGame();
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

function showPhaseComplete() {
    const phase = getPhaseData(currentGameState.currentPhaseId);
    document.getElementById('completeMessage').textContent = `Parabéns! Você completou a fase: ${phase.title}`;
    document.getElementById('nextPhase').textContent = `Desbloqueaste e aprendeste muito sobre segurança do trabalho!`;
    showScreen('completeScreen');
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

function backToGame() {
    showScreen('gameScreen');
    gameLoop();
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

// Inicialização ao carregar
document.addEventListener('DOMContentLoaded', () => {
    showScreen('mainMenu');
});
