import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AffirmationKind, kindLabel } from '@/data/content';
import { useAffirmation } from '@/lib/pickAffirmation';
import { useAppStore } from '@/store/useAppStore';
import { colors, radius, spacing } from '@/theme';

const isKind = (v: unknown): v is AffirmationKind =>
  v === 'motivacional' || v === 'fe' || v === 'palavra';

export default function Frases() {
  const router = useRouter();
  const params = useLocalSearchParams<{ kind?: string }>();
  const s = useAppStore();

  const kind: AffirmationKind = isKind(params.kind) ? params.kind : 'palavra';

  // Sorteio a cada abertura do card, sem repetir o que já saiu hoje
  const { current, next } = useAffirmation(kind);

  // Confirma no botão e, logo depois, traz a próxima frase
  const [confirming, setConfirming] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const reflect = () => {
    if (confirming) return;
    setConfirming(true);

    if (!s.affirmationReadToday) {
      s.addPoints(2);
      s.markAffirmationRead();
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    timer.current = setTimeout(() => {
      next();
      setConfirming(false);
    }, 900);
  };

  const buttonLabel = confirming
    ? 'Refletida ✓'
    : s.affirmationReadToday
      ? 'Li e refleti'
      : 'Li e refleti (+2 pontos)';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>
        <Pressable style={styles.back} hitSlop={12} onPress={() => router.back()}>
          <Feather name="chevron-left" size={26} color={colors.text} />
        </Pressable>

        <Text style={styles.title}>{kindLabel[kind]}</Text>

        <View style={styles.middle}>
          <View style={styles.card}>
            <Text style={styles.cardKind}>{kindLabel[current.kind]}</Text>
            <Text style={styles.cardText}>"{current.text}"</Text>
            {current.reference ? (
              <Text style={styles.cardRef}>{current.reference} · Almeida</Text>
            ) : null}
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.button,
              confirming && styles.buttonDone,
              pressed && styles.buttonPressed,
            ]}
            onPress={reflect}
          >
            <Text style={styles.buttonText}>{buttonLabel}</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.md },
  back: { alignSelf: 'flex-start', marginLeft: -6 },
  title: { fontSize: 30, fontWeight: '800', color: colors.text },
  middle: { flex: 1, justifyContent: 'center', gap: spacing.md },
  card: {
    backgroundColor: colors.bgSoft,
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.sm,
    minHeight: 190,
    justifyContent: 'center',
  },
  cardKind: { fontSize: 11, letterSpacing: 2, color: colors.olive, textTransform: 'uppercase' },
  cardText: { fontSize: 22, color: colors.text, lineHeight: 32, fontStyle: 'italic' },
  cardRef: { fontSize: 14, color: colors.textMuted },
  button: {
    backgroundColor: colors.gold,
    borderRadius: radius.full,
    paddingVertical: 15,
    alignItems: 'center',
  },
  buttonDone: { backgroundColor: colors.sage },
  buttonPressed: { transform: [{ scale: 0.98 }] },
  buttonText: { color: colors.coffee, fontSize: 15, fontWeight: '700' },
});
