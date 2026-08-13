import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { JoyMeter } from '@/components/JoyMeter';
import { kindLabel } from '@/data/content';
import { practices } from '@/data/practices';
import { useAffirmation } from '@/lib/pickAffirmation';
import { greeting, useAppStore } from '@/store/useAppStore';
import { colors, radius, spacing } from '@/theme';

export default function Home() {
  const router = useRouter();
  const s = useAppStore();

  useEffect(() => {
    s.rollDayIfNeeded();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Frase da Home: sorteada a cada abertura do app, sem repetir as de hoje
  const { current: daily } = useAffirmation('motivacional');

  const freePractice = practices.find((p) => !p.premium) ?? practices[0];
  const suggested =
    practices.find((p) => p.category === s.goal && (s.hasPremiumAccess() || !p.premium)) ??
    freePractice;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>{greeting(s.name)}</Text>
          {s.hasPremiumAccess() && (
            <View style={styles.premiumTag}>
              <Text style={styles.premiumTagText}>PREMIUM</Text>
            </View>
          )}
        </View>
        <Text style={styles.sub}>Pare por um instante. Você não precisa carregar tudo sozinho.</Text>

        <JoyMeter points={s.pointsToday} />

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{s.streak}</Text>
            <Text style={styles.statLabel}>dias em sequência</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{s.practicesToday}</Text>
            <Text style={styles.statLabel}>práticas hoje</Text>
          </View>
        </View>

        <View style={styles.affirmation}>
          <Text style={styles.affKind}>{kindLabel[daily.kind]}</Text>
          <Text style={styles.affText}>"{daily.text}"</Text>
          {daily.reference ? <Text style={styles.affRef}>{daily.reference} · Almeida</Text> : null}
        </View>

        <Pressable
          style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
          onPress={() => router.push(`/respirar/${suggested.id}`)}
        >
          <Text style={styles.ctaTitle}>Preciso de uma pausa agora</Text>
          <Text style={styles.ctaSub}>
            {suggested.title} · {suggested.cycles} ciclos
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  greeting: { flex: 1, fontSize: 33, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
  premiumTag: {
    borderWidth: 1.2,
    borderColor: colors.gold,
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  premiumTagText: {
    color: colors.gold,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.6,
  },
  sub: { fontSize: 15, color: colors.textMuted, marginTop: -spacing.sm, lineHeight: 22 },
  affirmation: {
    backgroundColor: colors.bgSoft,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: 2,
  },
  affKind: { fontSize: 11, letterSpacing: 2, color: colors.olive, textTransform: 'uppercase' },
  affText: { fontSize: 17, color: colors.text, lineHeight: 24, fontStyle: 'italic' },
  affRef: { fontSize: 13, color: colors.textMuted },
  cta: {
    backgroundColor: colors.gold,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    gap: 4,
    alignItems: 'center',
    // sombra: iOS
    shadowColor: colors.coffee,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.38,
    shadowRadius: 16,
    // sombra: Android
    elevation: 12,
  },
  ctaPressed: {
    transform: [{ scale: 0.98 }],
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 7,
    elevation: 4,
  },
  ctaTitle: { color: colors.coffee, fontSize: 18, fontWeight: '800', letterSpacing: 0.3 },
  ctaSub: { color: colors.text, fontSize: 13, fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: spacing.md },
  stat: {
    flex: 1,
    backgroundColor: colors.bgSoft,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  statNum: { fontSize: 26, fontWeight: '700', color: colors.olive },
  statLabel: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
});
