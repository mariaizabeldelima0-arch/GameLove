const PHASES = [
    {
        id: 1,
        title: "Estagiário",
        emoji: "🌱",
        date: "17/09/2025",
        company: "FG Empreendimentos",
        unlocked: true,
        description: "Iniciando sua jornada na segurança do trabalho",
        challenges: [
            {
                type: "platform",
                difficulty: "easy",
                description: "Percorra o prédio com cuidado"
            },
            {
                type: "quiz",
                difficulty: "easy",
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
                    }
                ]
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
        challenges: [
            {
                type: "platform",
                difficulty: "medium",
                description: "Navegue pelos prédios evitando perigos"
            },
            {
                type: "quiz",
                difficulty: "medium",
                questions: [
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
                    }
                ]
            },
            {
                type: "knot",
                difficulty: "medium",
                description: "Aprenda a fazer o nó 8 simples"
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
        challenges: [
            {
                type: "platform",
                difficulty: "hard",
                description: "Desafio: Segurança em altura - navegue com precisão"
            },
            {
                type: "quiz",
                difficulty: "hard",
                questions: [
                    {
                        question: "Qual é o fator de queda máximo permitido para cintos de segurança?",
                        options: [
                            "1.5 metros",
                            "1.8 metros",
                            "2 metros",
                            "2.5 metros"
                        ],
                        correct: 2
                    },
                    {
                        question: "O que é PCMSO?",
                        options: [
                            "Programa de Controle Médico de Segurança Operacional",
                            "Programa de Controle Médico de Saúde Ocupacional",
                            "Protocolo de Controle de Máquinas e Segurança Organizacional",
                            "Programa de Comunicação Médica de Segurança Oficial"
                        ],
                        correct: 1
                    },
                    {
                        question: "Qual é a norma brasileira para proteção contra quedas?",
                        options: [
                            "NR-30",
                            "NR-33",
                            "NR-35",
                            "NR-36"
                        ],
                        correct: 2
                    }
                ]
            },
            {
                type: "knot",
                difficulty: "hard",
                description: "Domine o nó 8 duplo para segurança avançada"
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
        challenges: [
            {
                type: "platform",
                difficulty: "expert",
                description: "Desafio máximo - Prove sua maestria em segurança"
            },
            {
                type: "quiz",
                difficulty: "expert",
                questions: [
                    {
                        question: "O que é uma ART (Anotação de Responsabilidade Técnica)?",
                        options: [
                            "Um documento de auditoria trabalhista",
                            "Um registro profissional do responsável técnico junto ao CREA",
                            "Uma avaliação de riscos técnicos",
                            "Uma autorização de responsabilidade de trabalho"
                        ],
                        correct: 1
                    }
                ]
            }
        ]
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
