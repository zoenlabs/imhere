import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { AppState, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  AlarmPermissions,
  openBatterySettings,
  openExactAlarmSettings,
  openFullScreenSettings,
  openManufacturerSettings,
  openNotificationSettings,
  readPermissions,
  requestNotifications,
  Setting,
} from '@/lib/permissions';
import { syncAlarms } from '@/lib/alarms';
import { useAppStore } from '@/store/useAppStore';
import { colors, radius, spacing } from '@/theme';

type Item = {
  key: keyof AlarmPermissions;
  title: string;
  why: string;
  action: string;
  onPress: () => void | Promise<unknown>;
};

const statusLabel: Record<Setting, string> = {
  ok: 'Liberado',
  off: 'Falta liberar',
  unknown: 'Confira nos ajustes',
  na: '',
};

/**
 * Etapa de permissões do alarme. Abre uma vez depois do onboarding e fica
 * acessível pelo Perfil. Pede as notificações na hora e, para o restante,
 * leva o usuário direto à tela certa dos Ajustes.
 */
export default function Permissoes() {
  const router = useRouter();
  const markReviewed = useAppStore((s) => s.markPermissionsReviewed);
  const [perms, setPerms] = useState<AlarmPermissions | null>(null);

  const refresh = useCallback(() => {
    readPermissions().then(setPerms).catch(() => {});
  }, []);

  // Pede notificações assim que a tela abre e relê tudo ao voltar dos Ajustes
  useEffect(() => {
    requestNotifications().finally(refresh);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  const finish = () => {
    markReviewed();
    // Alarmes criados antes das permissões ficaram "inexatos": recria todos
    syncAlarms(useAppStore.getState().schedules).catch(() => {});
    router.replace('/(tabs)');
  };

  const all: Item[] = perms
    ? [
        {
          key: 'notifications',
          title: 'Notificações',
          why: 'É por onde o alarme e o lembrete chegam.',
          action: perms.notifications === 'ok' ? 'Abrir ajustes' : 'Permitir',
          onPress: async () => {
            if (perms.notifications === 'ok') return openNotificationSettings();
            const ok = await requestNotifications();
            if (!ok) await openNotificationSettings();
            refresh();
          },
        },
        {
          key: 'exactAlarm',
          title: 'Alarmes e lembretes',
          why: 'Sem isso o Android pode atrasar o alarme em vários minutos para poupar bateria.',
          action: 'Abrir ajustes',
          onPress: openExactAlarmSettings,
        },
        {
          key: 'fullScreen',
          title: 'Notificações em tela cheia',
          why: 'Deixa o alarme tomar a tela e acender o aparelho, como um despertador. Ligue "Permitir notificações em tela cheia".',
          action: 'Abrir ajustes',
          onPress: openFullScreenSettings,
        },
        {
          key: 'battery',
          title: 'Bateria sem restrição',
          why: 'Com a otimização ligada, alguns aparelhos seguram o alarme.',
          action: 'Abrir ajustes',
          onPress: openBatterySettings,
        },
        {
          key: 'manufacturer',
          title: 'Início automático',
          why: 'Seu aparelho tem uma tela própria que fecha apps em segundo plano. Libere o I\'m Here nela.',
          action: 'Abrir ajustes',
          onPress: openManufacturerSettings,
        },
      ]
    : [];
  const items = all.filter((i) => perms && perms[i.key] !== 'na');

  const allOk = perms
    ? items.every((i) => perms[i.key] === 'ok' || perms[i.key] === 'unknown')
    : false;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Para o alarme funcionar</Text>
        <Text style={styles.sub}>
          O Android não libera essas permissões sozinho. Cada uma abre a tela certa dos ajustes;
          ao voltar, a lista se atualiza.
        </Text>

        {items.map((item) => {
          const state = perms![item.key];
          const ok = state === 'ok';
          return (
            <View key={item.key} style={styles.card}>
              <View style={styles.cardHead}>
                <Feather
                  name={ok ? 'check-circle' : state === 'unknown' ? 'help-circle' : 'alert-circle'}
                  size={20}
                  color={ok ? colors.olive : colors.gold}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={[styles.status, ok && styles.statusOk]}>{statusLabel[state]}</Text>
                </View>
              </View>
              <Text style={styles.why}>{item.why}</Text>
              {!ok && (
                <Pressable
                  style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
                  onPress={() => item.onPress()}
                >
                  <Text style={styles.buttonText}>{item.action}</Text>
                </Pressable>
              )}
            </View>
          );
        })}

        <Pressable
          style={({ pressed }) => [styles.done, pressed && styles.buttonPressed]}
          onPress={finish}
        >
          <Text style={styles.doneText}>{allOk ? 'Tudo pronto' : 'Continuar mesmo assim'}</Text>
        </Pressable>
        <Text style={styles.note}>Você pode revisar isso depois em Perfil → Alarmes e permissões.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  title: { fontSize: 28, fontWeight: '800', color: colors.text },
  sub: { fontSize: 15, color: colors.textMuted, lineHeight: 22, marginTop: -spacing.sm },
  card: {
    backgroundColor: colors.bgSoft,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  status: { fontSize: 12, color: colors.gold, fontWeight: '700' },
  statusOk: { color: colors.olive },
  why: { fontSize: 13, color: colors.textMuted, lineHeight: 19 },
  button: {
    alignSelf: 'flex-start',
    backgroundColor: colors.gold,
    borderRadius: radius.full,
    paddingVertical: 9,
    paddingHorizontal: 18,
  },
  buttonPressed: { transform: [{ scale: 0.98 }] },
  buttonText: { color: colors.coffee, fontSize: 14, fontWeight: '700' },
  done: {
    backgroundColor: colors.coffee,
    borderRadius: radius.full,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  doneText: { color: colors.bgSoft, fontSize: 16, fontWeight: '600' },
  note: { fontSize: 12, color: colors.textMuted, textAlign: 'center' },
});
