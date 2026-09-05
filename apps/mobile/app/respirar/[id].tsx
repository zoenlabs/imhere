import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { BreathingCircle } from '@/components/BreathingCircle';
import { affirmationExhale, affirmationInhale } from '@/data/content';
import { BreathPhase, cycleSeconds, practices, totalSeconds } from '@/data/practices';
import { useAppStore } from '@/store/useAppStore';
import { colors, radius, spacing } from '@/theme';

type Stage = 'intro' | 'running' | 'done';

export default function Respirar() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const s = useAppStore();
  const practice = practices.find((p) => p.id === id) ?? practices[0];

  const [stage, setStage] = useState<Stage>('intro');
  // Fonte única da verdade: os segundos decorridos. Ciclo, fase e contagem
  // são derivados daqui, sem estados paralelos que possam sair de sincronia.
  const [elapsed, setElapsed] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastPhaseRef = useRef(-1);

  // Frases por ciclo: cada fase tira uma frase diferente do tema da prática.
  // Embaralhadas no início da sessão, sem repetir durante a prática.
  // Na Afirmação as listas vêm do conteúdo ("Eu sou..."); nas demais, do
  // próprio cadastro da prática.
  const shuffle = (list: string[]) =>
    [...list]
      .map((v) => ({ v, k: Math.random() }))
      .sort((a, b) => a.k - b.k)
      .map(({ v }) => v);

  type Decks = Partial<Record<BreathPhase['kind'], string[]>>;
  const decks = useMemo<Decks | null>(() => {
    if (practice.declareWords) {
      return { inhale: shuffle(affirmationInhale), exhale: shuffle(affirmationExhale) };
    }
    if (!practice.phrases) return null;
    const out: Decks = {};
    for (const kind of ['inhale', 'hold', 'exhale'] as const) {
      const list = practice.phrases[kind];
      if (list && list.length > 0) out[kind] = shuffle(list);
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [practice.id]);

  const cycleLen = cycleSeconds(practice);
  const total = totalSeconds(practice);

  // Onde estamos agora, calculado a partir dos segundos decorridos
  const clamped = Math.min(elapsed, total - 1);
  const cycle = Math.floor(clamped / cycleLen);
  const inCycle = clamped % cycleLen;

  let phaseIdx = 0;
  let phaseStart = 0;
  for (let i = 0; i < practice.phases.length; i++) {
    const end = phaseStart + practice.phases[i].seconds;
    if (inCycle < end) {
      phaseIdx = i;
      break;
    }
    phaseStart = end;
  }

  const rawPhase = practice.phases[phaseIdx];
  const secondsLeft = rawPhase.seconds - (inCycle - phaseStart);

  const deck = decks?.[rawPhase.kind];
  const phase = deck ? { ...rawPhase, text: deck[cycle % deck.length] } : rawPhase;

  const progress = Math.min(1, elapsed / total);

  const stop = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  };

  const start = () => {
    setStage('running');
    setElapsed(0);
    lastPhaseRef.current = 0;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    timer.current = setInterval(() => setElapsed((e) => e + 1), 1000);
  };

  // Vibração na troca de fase e encerramento ao completar os ciclos.
  // Fica em efeito, não dentro do setState, senão o React reclama de
  // atualizar outro componente durante a renderização.
  useEffect(() => {
    if (stage !== 'running') return;

    if (elapsed >= total) {
      stop();
      finish();
      return;
    }

    if (lastPhaseRef.current !== phaseIdx) {
      lastPhaseRef.current = phaseIdx;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsed, stage]);

  const finish = () => {
    setStage('done');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // Marca o agendamento de hoje correspondente a esta prática, se houver
    s.markScheduleDone(practice.id);
    const isFree = !practice.premium;
    if (isFree && s.freePracticeUsedToday && !s.hasPremiumAccess()) {
      // prática livre repetida no mesmo dia não pontua de novo
      return;
    }
    s.addPoints(practice.points, { practice: true });
    if (isFree) s.markFreePracticeUsed();
  };

  useEffect(() => () => stop(), []);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {stage === 'intro' && (
          <View style={styles.centerBlock}>
            <Text style={styles.title}>{practice.title}</Text>
            <Text style={styles.intro}>{practice.intro}</Text>
            <Text style={styles.meta}>
              {practice.cycles} ciclos · {cycleSeconds(practice)}s por ciclo · +{practice.points}{' '}
              pontos
            </Text>
            {practice.disclaimer ? (
              <Text style={styles.disclaimer}>{practice.disclaimer}</Text>
            ) : null}
            <Pressable style={styles.button} onPress={start}>
              <Text style={styles.buttonText}>Começar</Text>
            </Pressable>
            <Pressable onPress={() => router.back()}>
              <Text style={styles.cancel}>Voltar</Text>
            </Pressable>
          </View>
        )}

        {stage === 'running' && (
          <View style={styles.centerBlock}>
            <Text style={styles.cycleText}>
              Ciclo {Math.min(cycle + 1, practice.cycles)} de {practice.cycles}
            </Text>
            <BreathingCircle
              phase={phase}
              secondsLeft={Math.max(secondsLeft, 1)}
              progress={progress}
            />

            {/* Altura fixa: a frase muda a cada fase sem empurrar o layout */}
            <View style={styles.phraseSlot}>
              {phase.text ? (
                <Text style={[styles.phrase, practice.declareWords && styles.phraseBold]}>
                  {phase.text}
                </Text>
              ) : null}
            </View>
            <Pressable
              onPress={() => {
                stop();
                router.back();
              }}
            >
              <Text style={styles.cancel}>Encerrar</Text>
            </Pressable>
          </View>
        )}

        {stage === 'done' && (
          <View style={styles.centerBlock}>
            <Text style={styles.doneEmoji}>✦</Text>
            <Text style={styles.title}>Prática concluída</Text>
            <Text style={styles.intro}>
              Você esteve presente. Leve essa calma com você.
            </Text>
            <Text style={styles.points}>+{practice.points} pontos de alegria</Text>
            {!s.premium ? (
              <Pressable style={styles.trialNote} onPress={() => router.push('/paywall')}>
                <Text style={styles.trialNoteText}>
                  Experimente o Premium por 7 dias grátis e libere todas as práticas.
                </Text>
              </Pressable>
            ) : null}
            <Pressable style={styles.button} onPress={() => router.back()}>
              <Text style={styles.buttonText}>Concluir</Text>
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, padding: spacing.xl, justifyContent: 'center' },
  centerBlock: { alignItems: 'center', gap: spacing.lg },
  title: { fontSize: 26, fontWeight: '600', color: colors.text, textAlign: 'center' },
  intro: { fontSize: 16, color: colors.textMuted, textAlign: 'center', lineHeight: 24 },
  meta: { fontSize: 13, color: colors.olive },
  disclaimer: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: spacing.md,
  },
  cycleText: { fontSize: 14, color: colors.olive, letterSpacing: 1 },
  phraseSlot: { minHeight: 56, justifyContent: 'center', paddingHorizontal: spacing.md },
  phrase: {
    fontSize: 19,
    fontStyle: 'italic',
    color: colors.text,
    textAlign: 'center',
    lineHeight: 27,
  },
  // Afirmação: declaração em negrito, sem itálico
  phraseBold: { fontWeight: '800', fontStyle: 'normal', fontSize: 21 },
  button: {
    backgroundColor: colors.coffee,
    borderRadius: radius.full,
    paddingVertical: 16,
    paddingHorizontal: 48,
    alignItems: 'center',
  },
  buttonText: { color: colors.bgSoft, fontSize: 16, fontWeight: '600' },
  cancel: { color: colors.textMuted, fontSize: 14, padding: spacing.sm },
  doneEmoji: { fontSize: 40, color: colors.gold },
  points: { fontSize: 18, fontWeight: '700', color: colors.olive },
  trialNote: {
    backgroundColor: colors.bgSoft,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  trialNoteText: { fontSize: 13, color: colors.text, textAlign: 'center' },
});
