import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  AlarmPermissions,
  missingSteps,
  readPermissions,
  Step,
  STEPS,
} from '@/lib/permissions';
import { useAppStore } from '@/store/useAppStore';
import { colors, radius, spacing } from '@/theme';

const icons: Record<Step['key'], React.ComponentProps<typeof Feather>['name']> = {
  notifications: 'bell',
  exactAlarm: 'clock',
  fullScreen: 'maximize',
  overlay: 'layers',
  battery: 'battery-charging',
};

/**
 * Assistente de permissões do alarme: um pedido por vez.
 *
 * Cada passo abre a janela ou a tela do sistema. Quando o usuário volta, o
 * app relê as permissões e avança sozinho; se a permissão continua
 * desligada, o passo fica na tela com uma dica. Ao terminar, fecha.
 */
export default function Permissoes() {
  const router = useRouter();
  const snooze = useAppStore((s) => s.snoozePermissions);

  const [perms, setPerms] = useState<AlarmPermissions | null>(null);
  const [tried, setTried] = useState<Step['key'] | null>(null);
  const total = useRef<number | null>(null);
  const autoAsked = useRef(false);

  const refresh = useCallback(async () => {
    const next = await readPermissions().catch(() => null);
    if (!next) return;
    if (total.current === null) total.current = missingSteps(next).length;
    setPerms(next);
  }, []);

  useEffect(() => {
    refresh();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  const remaining = perms ? missingSteps(perms) : [];
  const current = remaining[0] ?? null;
  const done = total.current === null ? 0 : total.current - remaining.length;

  // Notificações têm janela do sistema: pede sozinho ao chegar no passo
  useEffect(() => {
    if (!current || current.key !== 'notifications' || autoAsked.current) return;
    autoAsked.current = true;
    current.request().finally(refresh);
  }, [current, refresh]);

  const close = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  };

  const later = () => {
    snooze();
    close();
  };

  const ask = (step: Step) => {
    setTried(step.key);
    step.request().finally(refresh);
  };

  if (!perms) return <SafeAreaView style={styles.safe} />;

  const stillOff = current && tried === current.key;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.kicker}>PARA O ALARME FUNCIONAR</Text>

        {current ? (
          <>
            <View style={styles.dots}>
              {STEPS.filter((s) => perms[s.key] !== 'na').map((s) => (
                <View
                  key={s.key}
                  style={[
                    styles.dot,
                    perms[s.key] === 'ok' && styles.dotDone,
                    s.key === current.key && styles.dotCurrent,
                  ]}
                />
              ))}
            </View>

            <View style={styles.card}>
              <View style={styles.iconWrap}>
                <Feather name={icons[current.key]} size={30} color={colors.gold} />
              </View>
              <Text style={styles.title}>{current.title}</Text>
              <Text style={styles.why}>{current.why}</Text>
              <Text style={styles.hint}>{current.hint}</Text>

              {stillOff ? (
                <Text style={styles.stillOff}>
                  Ainda não está liberado. Se preferir, toque de novo para tentar outra vez.
                </Text>
              ) : null}

              <Pressable
                style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
                onPress={() => ask(current)}
              >
                <Text style={styles.buttonText}>{current.action}</Text>
              </Pressable>
            </View>

            <Text style={styles.progress}>
              {done} de {total.current ?? remaining.length} liberadas
            </Text>

            <Pressable onPress={later} hitSlop={8} style={styles.later}>
              <Text style={styles.laterText}>Deixar para depois</Text>
            </Pressable>
          </>
        ) : (
          <View style={styles.card}>
            <View style={styles.iconWrap}>
              <Feather name="check-circle" size={30} color={colors.olive} />
            </View>
            <Text style={styles.title}>Tudo pronto</Text>
            <Text style={styles.why}>
              O alarme vai tomar a tela no horário, com o celular bloqueado ou em uso.
            </Text>
            <Pressable
              style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
              onPress={close}
            >
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
  container: {
    flex: 1,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  kicker: { fontSize: 12, letterSpacing: 2, color: colors.olive, fontWeight: '700' },
  dots: { flexDirection: 'row', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.sage, opacity: 0.5 },
  dotDone: { backgroundColor: colors.olive, opacity: 1 },
  dotCurrent: { backgroundColor: colors.gold, opacity: 1, width: 22 },
  card: {
    alignSelf: 'stretch',
    backgroundColor: colors.bgSoft,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  title: { fontSize: 24, fontWeight: '800', color: colors.text, textAlign: 'center' },
  why: { fontSize: 15, color: colors.text, textAlign: 'center', lineHeight: 22 },
  hint: { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 19 },
  stillOff: {
    fontSize: 12,
    color: colors.olive,
    textAlign: 'center',
    lineHeight: 17,
    fontWeight: '600',
  },
  button: {
    alignSelf: 'stretch',
    backgroundColor: colors.gold,
    borderRadius: radius.full,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: spacing.sm,
    shadowColor: colors.coffee,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonPressed: { transform: [{ scale: 0.98 }] },
  buttonText: { color: colors.coffee, fontSize: 16, fontWeight: '800' },
  progress: { fontSize: 12, color: colors.textMuted },
  later: { paddingVertical: spacing.sm },
  laterText: { color: colors.textMuted, fontSize: 14, fontWeight: '600' },
});
