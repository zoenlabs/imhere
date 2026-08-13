// Padrões de respiração do MVP. Tempos em segundos.
// Protocolo definido a partir do estudo de técnicas de respiração (ago/2026).

export interface BreathPhase {
  kind: 'inhale' | 'hold' | 'exhale';
  seconds: number;
  text?: string; // frase espiritual opcional exibida na fase
}

export interface Practice {
  id: string;
  title: string;
  subtitle: string;
  category: 'conexao' | 'calma' | 'ansiedade' | 'oracao' | 'palavra' | 'afirmacao';
  cycles: number;
  phases: BreathPhase[];
  points: number;
  premium: boolean;
  intro: string;
  disclaimer?: string;
  /** Quando presente, cada ciclo declara uma palavra diferente na expiração */
  declareWords?: boolean;
}

export const practices: Practice[] = [
  {
    // Protocolo 2 — presença de Deus / silêncio antes da oração (box breathing)
    // A pausa vazia depois da expiração é o que mais aquieta.
    id: 'pausa-presenca',
    title: 'Pausa e Presença',
    subtitle: 'Conexão com Deus',
    category: 'conexao',
    cycles: 6,
    phases: [
      { kind: 'inhale', seconds: 4, text: 'Senhor, estou aqui.' },
      { kind: 'hold', seconds: 4 },
      { kind: 'exhale', seconds: 4, text: 'Eu reconheço a tua presença.' },
      { kind: 'hold', seconds: 4 },
    ],
    points: 10,
    premium: true,
    intro: 'Respire devagar e reconheça: Deus está presente neste momento.',
  },
  {
    // Protocolo 3 — busca por calma (ansiedade leve/moderada)
    // Sem retenção: segurar o ar pode aumentar a sensação de aperto.
    id: 'calma',
    title: 'Calma',
    subtitle: 'Desacelerar o corpo e a mente',
    category: 'calma',
    cycles: 8,
    phases: [
      { kind: 'inhale', seconds: 4 },
      { kind: 'exhale', seconds: 7, text: 'Solte devagar.' },
    ],
    points: 10,
    premium: true,
    intro: 'A expiração longa acalma o corpo. Deixe cada ciclo soltar um pouco da tensão.',
  },
  {
    // Protocolo 6 — momento de ansiedade aguda (pico)
    // Retenção curta e expiração longa, sem risco de hiperventilação.
    id: 'ansiedade',
    title: 'Momento de Ansiedade',
    subtitle: 'Pausa curta para desacelerar',
    category: 'ansiedade',
    cycles: 6,
    phases: [
      { kind: 'inhale', seconds: 4 },
      { kind: 'hold', seconds: 2 },
      { kind: 'exhale', seconds: 7, text: 'Entrego a ti minhas preocupações.' },
    ],
    // Sempre disponível, para todos os planos, inclusive com o saldo do dia
    // completo. Não pontua: socorro não é gamificação.
    points: 0,
    premium: false,
    intro: 'Uma pausa curta. Respire no seu ritmo e alongue a saída do ar.',
    disclaimer:
      'Este exercício é um apoio para momentos difíceis. Ele não trata ansiedade e não substitui acompanhamento médico ou psicológico.',
  },
  {
    // Protocolo 4 — aquietar a mente (pré-oração)
    // Ritmo constante em ~6 respirações por minuto: coerência cardiorrespiratória.
    id: 'oracao',
    title: 'Pré Oração',
    subtitle: 'Preparar o coração',
    category: 'oracao',
    cycles: 6,
    phases: [
      { kind: 'inhale', seconds: 5, text: 'Receber.' },
      { kind: 'hold', seconds: 2 },
      { kind: 'exhale', seconds: 5, text: 'Entregar.' },
    ],
    points: 8,
    premium: true,
    intro: 'Inspire recebendo. Expire entregando. Ao final, apresente a Deus o seu motivo de oração.',
  },
  {
    // Protocolo 5 — prática de meditação (sessão mais longa)
    // Os 6 ciclos são a porta de entrada; depois a respiração segue livre e lenta.
    id: 'palavra',
    title: 'Prática de Meditação',
    subtitle: 'Respirar com um versículo',
    category: 'palavra',
    cycles: 6,
    phases: [
      { kind: 'inhale', seconds: 4, text: 'O Senhor é o meu pastor;' },
      { kind: 'hold', seconds: 4 },
      { kind: 'exhale', seconds: 6, text: 'nada me faltará.' },
      { kind: 'hold', seconds: 2 },
    ],
    points: 10,
    premium: true,
    intro: 'Medite no Salmo 23:1, uma parte a cada respiração. Deixe a Palavra ocupar os pensamentos.',
  },
  {
    // Protocolo 1 — afirmação / pausa consciente
    // Expiração mais longa que a inspiração: reset rápido entre tarefas.
    id: 'afirmacao',
    title: 'Afirmação',
    subtitle: 'Respirar declarando verdade',
    category: 'afirmacao',
    cycles: 6,
    phases: [
      { kind: 'inhale', seconds: 4, text: 'Eu sou' },
      { kind: 'hold', seconds: 2 },
      { kind: 'exhale', seconds: 6 }, // a palavra do ciclo entra aqui
    ],
    points: 8,
    premium: false, // prática gratuita do plano Essencial
    intro: 'A cada ciclo, uma palavra. Inspire dizendo "Eu sou" e expire declarando.',
    declareWords: true,
  },
];

export const cycleSeconds = (p: Practice) => p.phases.reduce((a, f) => a + f.seconds, 0);
export const totalSeconds = (p: Practice) => cycleSeconds(p) * p.cycles;
