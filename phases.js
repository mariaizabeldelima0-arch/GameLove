const PHASES = [
    {
        id: 1,
        title: "Estagiário",
        emoji: "🌱",
        date: "17/09/2025",
        company: "FG Empreendimentos",
        unlocked: true,
        description: "Iniciando sua jornada na segurança do trabalho",
        gameType: "knots",
        challenges: [
            {
                type: "knot",
                difficulty: "easy",
                description: "Aprenda o Nó 8 Simples",
                knotType: "simple"
            },
            {
                type: "knot",
                difficulty: "easy",
                description: "Aprenda o Nó 8 Duplo",
                knotType: "double"
            }
        ]
    },
    {
        id: 2,
        title: "Auxiliar de Técnico de Segurança",
        emoji: "🧰",
        date: "Promocionado",
        company: "FG Empreendimentos",
        unlocked: true,
        description: "Avançando em sua carreira de segurança",
        gameType: "epi",
        challenges: [
            {
                type: "epi",
                difficulty: "medium",
                description: "Colete os 5 EPIs que caem do céu",
                timeLimit: 60,
                epiCount: 5
            }
        ]
    },
    {
        id: 3,
        title: "Assistente de Técnico de Segurança",
        emoji: "👷",
        date: "26/06/2026",
        company: "FG Empreendimentos",
        unlocked: true,
        description: "Sua promoção recente - continue crescendo!",
        gameType: "quiz",
        challenges: [
            {
                type: "quiz",
                difficulty: "hard",
                description: "Responda 5 perguntas sobre segurança do trabalho",
                questions: [
                    {
                        question: "O que EPI significa?",
                        options: [
                            "Equipamento de Proteção Individual",
                            "Empresa de Proteção Industrial",
                            "Equipamento de Produção Industrial",
                            "Estrutura de Prevenção e Inspeção"
                        ],
                        correct: 0
                    },
                    {
                        question: "Qual é o principal objetivo da NR-6?",
                        options: [
                            "Regulamentar horários de trabalho",
                            "Normatizar o uso de EPIs",
                            "Estabelecer salários mínimos",
                            "Definir turnos de trabalho"
                        ],
                        correct: 1
                    },
                    {
                        question: "Qual é a cor do símbolo internacional de risco biológico?",
                        options: [
                            "Vermelho e branco",
                            "Amarelo e preto",
                            "Azul e branco",
                            "Verde e branco"
                        ],
                        correct: 1
                    },
                    {
                        question: "O que é CIPA?",
                        options: [
                            "Comissão Interna de Proteção Ambiental",
                            "Comissão Interna de Prevenção de Acidentes",
                            "Conselho Internacional de Proteção do Ambiente",
                            "Comissão de Inspeção de Proteção Avançada"
                        ],
                        correct: 1
                    },
                    {
                        question: "Qual é o fator de queda máximo permitido para cintos de segurança?",
                        options: [
                            "1.5 metros",
                            "1.8 metros",
                            "2 metros",
                            "2.5 metros"
                        ],
                        correct: 2
                    }
                ]
            }
        ]
    },
    {
        id: 4,
        title: "Técnico de Segurança",
        emoji: "🏆",
        date: "Após SENAI",
        company: "FG Empreendimentos",
        unlocked: false,
        locked: true,
        description: "Seu objetivo final - finalize o curso no SENAI!",
        lockReason: "Você precisa finalizar o curso técnico no SENAI para desbloquear esta fase.",
        gameType: "locked",
        challenges: []
    }
];

function getPhaseData(phaseId) {
    return PHASES.find(p => p.id === phaseId);
}

function getAllPhases() {
    return PHASES;
}

function isPhaseUnlocked(phaseId) {
    const phase = getPhaseData(phaseId);
    return phase && phase.unlocked;
}

function isPhaseCompleted(phaseId) {
    const completed = localStorage.getItem(`phase_${phaseId}_completed`);
    return completed === 'true';
}

function completePhase(phaseId) {
    localStorage.setItem(`phase_${phaseId}_completed`, 'true');
}

function resetProgress() {
    for (let i = 1; i <= PHASES.length; i++) {
        localStorage.removeItem(`phase_${i}_completed`);
    }
}
