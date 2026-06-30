let currentQuizQuestion = 0;
let currentPhaseQuiz = [];
let selectedAnswer = null;
let quizAnsweredCorrectly = 0;
let knotType = 'simple'; // simple or double

function startQuiz(phaseId) {
    const phase = getPhaseData(phaseId);
    const quizChallenge = phase.challenges.find(c => c.type === 'quiz');

    if (!quizChallenge) return;

    currentPhaseQuiz = quizChallenge.questions;
    currentQuizQuestion = 0;
    quizAnsweredCorrectly = 0;
    showQuizScreen();
    displayQuizQuestion();
}

function displayQuizQuestion() {
    if (currentQuizQuestion >= currentPhaseQuiz.length) {
        endQuiz();
        return;
    }

    const question = currentPhaseQuiz[currentQuizQuestion];
    document.getElementById('quizQuestion').textContent = question.question;

    const optionsDiv = document.getElementById('quizOptions');
    optionsDiv.innerHTML = '';

    question.options.forEach((option, index) => {
        const btn = document.createElement('div');
        btn.className = 'quiz-option';
        btn.textContent = option;
        btn.onclick = () => selectQuizAnswer(index);
        optionsDiv.appendChild(btn);
    });

    selectedAnswer = null;
}

function selectQuizAnswer(index) {
    selectedAnswer = index;
    const options = document.querySelectorAll('.quiz-option');
    options.forEach(opt => opt.classList.remove('selected'));
    options[index].classList.add('selected');

    const correct = currentPhaseQuiz[currentQuizQuestion].correct;
    setTimeout(() => {
        options.forEach(opt => opt.classList.remove('selected'));

        if (index === correct) {
            options[index].classList.add('correct');
            quizAnsweredCorrectly++;
        } else {
            options[index].classList.add('wrong');
            options[correct].classList.add('correct');
        }

        setTimeout(() => {
            currentQuizQuestion++;
            displayQuizQuestion();
        }, 1500);
    }, 300);
}

function endQuiz() {
    const totalQuestions = currentPhaseQuiz.length;
    const percentage = (quizAnsweredCorrectly / totalQuestions) * 100;

    if (percentage >= 70) {
        showNotification('✅ Quiz Concluído com Sucesso!');
        currentGameState.quizCompleted = true;
        backToGame();
    } else {
        showNotification('❌ Você precisa acertar mais questões. Tente novamente!');
        setTimeout(startQuiz, 1500, currentGameState.currentPhaseId);
    }
}

// Mini-game de Nós
function startKnotGame(phaseId, type = 'simple') {
    const phase = getPhaseData(phaseId);
    const knotChallenge = phase.challenges.find(c => c.type === 'knot');

    if (!knotChallenge) return;

    knotType = type;
    showKnotScreen();

    const canvas = document.getElementById('knotCanvas');
    canvas.width = 500;
    canvas.height = 400;

    const instruction = type === 'simple'
        ? 'Desenhe um Nó 8 Simples no canvas. Siga o padrão mostrado.'
        : 'Desenhe um Nó 8 Duplo no canvas. Este é mais complexo!';

    document.getElementById('knotInstruction').textContent = instruction;

    // Desenhar exemplo do nó
    drawKnotExample(canvas, type);

    // Ativar drawing no canvas
    setupKnotCanvas();
}

function drawKnotExample(canvas, type) {
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    ctx.fillStyle = '#F0F0F0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#999';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);
    ctx.setLineDash([]);

    // Desenhar padrão do nó
    ctx.strokeStyle = '#4ECDC4';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (type === 'simple') {
        // Nó 8 simples - padrão básico
        ctx.beginPath();
        ctx.arc(centerX, centerY - 40, 30, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(centerX, centerY + 40, 30, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(centerX - 25, centerY);
        ctx.lineTo(centerX + 25, centerY);
        ctx.stroke();
    } else {
        // Nó 8 duplo - padrão mais complexo
        ctx.beginPath();
        ctx.arc(centerX - 30, centerY - 40, 25, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(centerX + 30, centerY - 40, 25, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(centerX - 30, centerY + 40, 25, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(centerX + 30, centerY + 40, 25, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Texto
    ctx.fillStyle = '#333';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    const knotName = type === 'simple' ? 'Nó 8 Simples' : 'Nó 8 Duplo';
    ctx.fillText(knotName, centerX, canvas.height - 30);
}

let isDrawing = false;
let hasDrawn = false;

function setupKnotCanvas() {
    const canvas = document.getElementById('knotCanvas');
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();

    canvas.addEventListener('mousedown', (e) => {
        isDrawing = true;
        hasDrawn = true;
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        ctx.beginPath();
        ctx.moveTo(x, y);
    });

    canvas.addEventListener('mousemove', (e) => {
        if (!isDrawing) return;
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#FF6B6B';
        ctx.lineTo(x, y);
        ctx.stroke();
    });

    canvas.addEventListener('mouseup', () => {
        isDrawing = false;
    });

    canvas.addEventListener('mouseleave', () => {
        isDrawing = false;
    });

    if (hasDrawn) {
        document.getElementById('knotSubmit').style.display = 'block';
    }
}

function checkKnot() {
    if (!hasDrawn) {
        showNotification('✏️ Você precisa desenhar o nó!');
        return;
    }

    // Simulação simples - em um jogo real, teríamos análise de imagem
    showNotification('✅ Nó desenhado com sucesso! Muito bem!');
    currentGameState.knotCompleted = true;
    hasDrawn = false;
    document.getElementById('knotSubmit').style.display = 'none';
    backToGame();
}

function clearKnotCanvas() {
    const canvas = document.getElementById('knotCanvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasDrawn = false;
    document.getElementById('knotSubmit').style.display = 'none';
    drawKnotExample(canvas, knotType);
}

function showNotification(message) {
    const div = document.createElement('div');
    div.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 20px 40px;
        border-radius: 10px;
        font-size: 1.2em;
        z-index: 1000;
        animation: popIn 0.3s ease;
    `;
    div.textContent = message;
    document.body.appendChild(div);

    setTimeout(() => {
        div.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => div.remove(), 300);
    }, 1500);
}
