import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { practices, totalSeconds } from '@/data/practices';
import { cancelAlarmNotification } from '@/lib/alarms';
import {
  alarmScreenShownRecently,
  markAlarmScreenShown,
  useOpenPractice,
} from '@/lib/usePracticeFlow';
import { useAppStore } from '@/store/useAppStore';
import { colors, radius, spacing } from '@/theme';

const pad = (n: number) => String(n).padStart(2, '0');

// Tela cheia do horário agendado: nome da prática, horário e o botão Iniciar.
// Chega aqui pela notificação em tela cheia, pelo link aberto em segundo
// plano ou pela verificação ao voltar ao app.
export default function PraticaAgora() {
  const router = useRouter();
  const { scheduleId } = useLocalSearchParams<{ scheduleId?: string }>();
  const hydrated = useAppStore((s) => s.hydrated);
  const schedules = useAppStore((s) => s.schedules);
  const openPractice = useOpenPractice();

  const schedule = schedules.find((x) => x.id === scheduleId);
  const practice = practices.find((p) => p.id === schedule?.practiceId);

  // Quando o app abre direto nesta tela (link ou tela cheia), não há para
  // onde "voltar": vai para as abas.
  const leave = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  };

  useEffect(() => {
    if (!hydrated || !scheduleId) return;
    // Segunda abertura da mesma chamada em poucos segundos: fecha esta
    if (alarmScreenShownRecently(scheduleId) && router.canGoBack()) {
      router.back();
      return;
    }
    markAlarmScreenShown(scheduleId);
    useAppStore.getState().markPrompted(scheduleId);
    // A tela já está na frente: para o som e some com a notificação
    cancelAlarmNotification(scheduleId).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, scheduleId]);

  if (!hydrated) {
    return <SafeAreaView style={styles.safe} />;
  }

  if (!schedule || !practice) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <Text style={styles.title}>Nada agendado agora</Text>
          <Pressable style={styles.ghost} onPress={leave}>
            <Text style={styles.ghostText}>Voltar</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const min = Math.round(totalSeconds(practice) / 60) || 1;

  const start = () => {
    leave();
    setTimeout(() => openPractice(practice.id), 150);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Image source={require('../assets/crown.png')} style={styles.crown} resizeMode="contain" />

        <Text style={styles.time}>
          {pad(schedule.hour)}:{pad(schedule.minute)}
        </Text>
        <Text style={styles.kicker}>é hora da sua prática</Text>

        <Text style={styles.title}>{practice.title}</Text>
        <Text style={styles.intro}>{practice.intro}</Text>
        <Text style={styles.meta}>
          ~{min} min · {practice.cycles} ciclos · +{practice.points} pontos
        </Text>

        <View style={styles.actions}>
          <Pressable style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]} onPress={start}>
            <Text style={styles.ctaText}>Iniciar</Text>
          </Pressable>

          <Pressable style={styles.ghost} onPress={leave}>
            <Text style={styles.ghostText}>Agora não</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: {
    flex: 1,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  crown: { width: 92, height: 72, marginBottom: spacing.md },
  time: { fontSize: 46, fontWeight: '800', color: colors.text, letterSpacing: 1 },
  kicker: {
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.olive,
    marginBottom: spacing.lg,
  },
  title: { fontSize: 28, fontWeight: '800', color: colors.text, textAlign: 'center' },
  intro: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 23,
    marginTop: spacing.sm,
  },
  meta: { fontSize: 12, color: colors.olive, marginTop: spacing.sm },
  actions: { alignSelf: 'stretch', marginTop: spacing.xl, gap: spacing.sm },
  cta: {
    backgroundColor: colors.gold,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    shadowColor: colors.coffee,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.32,
    shadowRadius: 14,
    elevation: 10,
  },
  ctaPressed: { transform: [{ scale: 0.98 }], elevation: 4, shadowOpacity: 0.16 },
  ctaText: { color: colors.coffee, fontSize: 18, fontWeight: '800', letterSpacing: 0.3 },
  ghost: { alignItems: 'center', paddingVertical: spacing.sm },
  ghostText: { color: colors.textMuted, fontSize: 15, fontWeight: '600' },
});
