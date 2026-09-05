import { Platform } from 'react-native';
import { practices } from '@/data/practices';
import type { Schedule } from '@/store/useAppStore';

/**
 * O Notifee é um módulo nativo: ele só existe no development build.
 * No Expo Go o require quebra, então carregamos com proteção e o app
 * segue funcionando normalmente, apenas sem alarme.
 */
type NotifeeModule = typeof import('@notifee/react-native');
type TimestampTrigger = import('@notifee/react-native').TimestampTrigger;

let mod: NotifeeModule | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  mod = require('@notifee/react-native') as NotifeeModule;
} catch {
  mod = null;
}

const notifee = mod?.default ?? null;

/** true quando rodando no development build, com o módulo nativo disponível */
export const alarmsAvailable = Boolean(notifee);

export const ALARM_CHANNEL = 'alarme-praticas';
export const REMINDER_CHANNEL = 'lembretes-praticas';

const REMINDER_MINUTES = 5;
const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Dois canais separados para o usuário tratar cada coisa nos ajustes do Android:
 * - alarme: som de alarme, tela cheia, categoria ALARM
 * - lembrete: notificação comum, 5 minutos antes
 *
 * Som e vibração são os padrões do sistema. Com a categoria ALARM, o próprio
 * Android segura o alarme durante ligações de voz e vídeo.
 */
export async function ensureChannels() {
  if (!notifee || !mod || Platform.OS !== 'android') return;

  await notifee.createChannel({
    id: ALARM_CHANNEL,
    name: 'Alarme das práticas',
    description: 'Chamada em tela cheia no horário da prática agendada',
    importance: mod.AndroidImportance.HIGH,
    visibility: mod.AndroidVisibility.PUBLIC,
    sound: 'default',
    vibration: true,
    bypassDnd: false,
  });

  await notifee.createChannel({
    id: REMINDER_CHANNEL,
    name: 'Lembretes',
    description: 'Aviso 5 minutos antes da prática agendada',
    importance: mod.AndroidImportance.DEFAULT,
    visibility: mod.AndroidVisibility.PUBLIC,
    sound: 'default',
    vibration: true,
  });
}

export async function ensurePermission(): Promise<boolean> {
  if (!notifee || !mod) return false;
  const settings = await notifee.requestPermission();
  return settings.authorizationStatus >= mod.AuthorizationStatus.AUTHORIZED;
}

// Próxima ocorrência de um dia da semana em determinado horário
function nextOccurrence(weekday: number, hour: number, minute: number, offsetMinutes = 0) {
  const now = new Date();
  const date = new Date();
  date.setSeconds(0, 0);
  date.setHours(hour, minute - offsetMinutes, 0, 0);

  const delta = (weekday - date.getDay() + 7) % 7;
  date.setDate(date.getDate() + delta);
  if (date.getTime() <= now.getTime()) date.setDate(date.getDate() + 7);
  return date;
}

/**
 * Reescreve todos os alarmes e lembretes a partir da agenda salva.
 * Cada agendamento gera, por dia da semana marcado:
 *   - um lembrete 5 minutos antes
 *   - o alarme em tela cheia no horário
 */
export async function syncAlarms(schedules: Schedule[]) {
  if (!notifee || !mod) return;

  await ensureChannels();
  await notifee.cancelAllNotifications();

  const active = schedules.filter((s) => s.enabled && (s.days ?? []).length > 0);
  if (active.length === 0) return;

  const allowed = await ensurePermission();
  if (!allowed) return;

  const trigger = (date: Date): TimestampTrigger => ({
    type: mod!.TriggerType.TIMESTAMP,
    timestamp: date.getTime(),
    repeatFrequency: mod!.RepeatFrequency.WEEKLY,
    alarmManager: { allowWhileIdle: true },
  });

  for (const item of active) {
    const practice = practices.find((p) => p.id === item.practiceId);
    if (!practice) continue;

    const time = `${pad(item.hour)}:${pad(item.minute)}`;
    const data = { practiceId: practice.id, scheduleId: item.id };

    for (const weekday of item.days ?? []) {
      // 1) lembrete, 5 minutos antes
      await notifee.createTriggerNotification(
        {
          id: `rem-${item.id}-${weekday}`,
          title: `${practice.title} às ${time}`,
          body: `Sua prática começa em ${REMINDER_MINUTES} minutos.`,
          data: { ...data, kind: 'reminder' },
          android: {
            channelId: REMINDER_CHANNEL,
            smallIcon: 'notification_icon',
            color: '#D4A72C',
            pressAction: { id: 'default', launchActivity: 'default' },
          },
        },
        trigger(nextOccurrence(weekday, item.hour, item.minute, REMINDER_MINUTES))
      );

      // 2) alarme no horário: tela cheia, por cima de qualquer app
      await notifee.createTriggerNotification(
        {
          id: `alm-${item.id}-${weekday}`,
          title: `${practice.title} · ${time}`,
          body: 'É a hora da sua prática. Toque para começar.',
          data: { ...data, kind: 'alarm' },
          android: {
            channelId: ALARM_CHANNEL,
            category: mod.AndroidCategory.ALARM,
            importance: mod.AndroidImportance.HIGH,
            smallIcon: 'notification_icon',
            color: '#D4A72C',
            autoCancel: false,
            // Comportamento de despertador: acende a tela, vibra e repete o
            // som até o usuário tocar ou dispensar. Para sozinho em 10 min.
            lightUpScreen: true,
            loopSound: true,
            vibrationPattern: [300, 500, 300, 500],
            timeoutAfter: 10 * 60 * 1000,
            pressAction: { id: 'default', launchActivity: 'default' },
            actions: [{ title: 'Iniciar', pressAction: { id: 'default', launchActivity: 'default' } }],
            fullScreenAction: {
              id: 'alarme',
              launchActivity: 'default',
            },
          },
        },
        trigger(nextOccurrence(weekday, item.hour, item.minute))
      );
    }
  }
}

/**
 * Para o som e some com a notificação do alarme quando a tela da prática já
 * está aberta. Só a notificação exibida: o gatilho semanal continua.
 */
export async function cancelAlarmNotification(scheduleId: string) {
  if (!notifee) return;
  await Promise.all(
    [0, 1, 2, 3, 4, 5, 6].map((weekday) =>
      notifee.cancelDisplayedNotification(`alm-${scheduleId}-${weekday}`).catch(() => {})
    )
  );
}

export const readScheduleId = (data: unknown): string | null => {
  if (data && typeof data === 'object' && 'scheduleId' in data) {
    const value = (data as { scheduleId?: unknown }).scheduleId;
    if (typeof value === 'string') return value;
  }
  return null;
};

export const readPracticeId = (data: unknown): string | null => {
  if (data && typeof data === 'object' && 'practiceId' in data) {
    const value = (data as { practiceId?: unknown }).practiceId;
    if (typeof value === 'string') return value;
  }
  return null;
};

export const isAlarm = (data: unknown): boolean =>
  Boolean(data && typeof data === 'object' && (data as { kind?: unknown }).kind === 'alarm');

export { notifee, mod as notifeeModule };
