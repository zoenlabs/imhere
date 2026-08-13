import { useRouter } from 'expo-router';
import React, { useRef } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { InstallButton } from '@/components/InstallButton';
import { useAppStore } from '@/store/useAppStore';
import { colors, radius, spacing } from '@/theme';

export default function Perfil() {
  const router = useRouter();
  const s = useAppStore();
  const last7 = s.history.slice(0, 7);
  const totalPoints = s.history.reduce((a, d) => a + d.points, 0) + s.pointsToday;

  // Painel de teste: 5 toques no nome liberam o controle de Premium.
  // Serve para validar o app antes das lojas, sem expor isso ao usuário comum.
  const taps = useRef(0);
  const showDev = __DEV__ || s.devUnlocked;

  const secretTap = () => {
    taps.current += 1;
    if (taps.current >= 5 && !s.devUnlocked) {
      s.unlockDev();
      Alert.alert('Modo de teste liberado', 'O controle de Premium apareceu no fim da tela.');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Pressable onPress={secretTap}>
          <Text style={styles.title}>{s.name || 'Perfil'}</Text>
        </Pressable>
        <Text style={styles.sub}>
          {s.premium ? 'Assinante Premium' : 'Plano Essencial (gratuito)'}
        </Text>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{s.streak}</Text>
            <Text style={styles.statLabel}>sequência</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{totalPoints}</Text>
            <Text style={styles.statLabel}>pontos totais</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{s.pointsToday}</Text>
            <Text style={styles.statLabel}>hoje</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Últimos 7 dias</Text>
          {last7.length === 0 ? (
            <Text style={styles.empty}>Seu histórico aparece aqui a partir de amanhã.</Text>
          ) : (
            last7.map((d) => (
              <View key={d.date} style={styles.histRow}>
                <Text style={styles.histDate}>{d.date.slice(8, 10)}/{d.date.slice(5, 7)}</Text>
                <View style={styles.histTrack}>
                  <View style={[styles.histFill, { width: `${Math.min(100, d.points)}%` }]} />
                </View>
                <Text style={styles.histPts}>{d.points}</Text>
              </View>
            ))
          )}
        </View>

        {!s.premium && (
          <Pressable style={styles.premiumBtn} onPress={() => router.push('/paywall')}>
            <Text style={styles.premiumText}>Experimentar Premium — 7 dias grátis</Text>
          </Pressable>
        )}

        <Text style={styles.legal}>
          O I'm Here é um apoio à sua rotina espiritual e emocional. Ele não substitui
          acompanhamento médico ou psicológico. Versículos: Almeida (domínio público).
        </Text>

        <InstallButton />

        {/* Aparece no desenvolvimento ou depois dos 5 toques no nome */}
        {showDev && (
          <View style={styles.dev}>
            <Text style={styles.devTitle}>Modo desenvolvedor</Text>

            <View style={styles.devRow}>
              <Text style={styles.devLabel}>Premium liberado</Text>
              <Switch
                value={s.premium}
                onValueChange={s.setPremium}
                trackColor={{ false: '#DCD3C4', true: colors.gold }}
                thumbColor={colors.bgSoft}
              />
            </View>

            <Pressable
              style={styles.devBtn}
              onPress={() =>
                Alert.alert('Zerar dados do app', 'Apaga perfil, pontos, histórico e agendamentos.', [
                  { text: 'Cancelar', style: 'cancel' },
                  { text: 'Zerar', style: 'destructive', onPress: () => s.reset() },
                ])
              }
            >
              <Text style={styles.devBtnText}>Zerar dados do app</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
  title: { fontSize: 28, fontWeight: '600', color: colors.text },
  sub: { fontSize: 14, color: colors.olive, marginTop: -spacing.sm, fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  stat: {
    flex: 1,
    backgroundColor: colors.bgSoft,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  statNum: { fontSize: 24, fontWeight: '700', color: colors.olive },
  statLabel: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  card: {
    backgroundColor: colors.bgSoft,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  cardTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  empty: { fontSize: 13, color: colors.textMuted },
  histRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  histDate: { width: 44, fontSize: 12, color: colors.textMuted },
  histTrack: {
    flex: 1,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.bg,
    overflow: 'hidden',
  },
  histFill: { height: '100%', backgroundColor: colors.gold },
  histPts: { width: 30, fontSize: 12, color: colors.text, textAlign: 'right' },
  premiumBtn: {
    backgroundColor: colors.gold,
    borderRadius: radius.full,
    paddingVertical: 16,
    alignItems: 'center',
  },
  premiumText: { color: colors.coffee, fontSize: 15, fontWeight: '700' },
  legal: { fontSize: 11, color: colors.textMuted, lineHeight: 17 },
  dev: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.sage,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  devTitle: {
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontWeight: '700',
    color: colors.olive,
  },
  devRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  devLabel: { fontSize: 14, color: colors.text },
  devBtn: { paddingVertical: spacing.sm },
  devBtnText: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
});
