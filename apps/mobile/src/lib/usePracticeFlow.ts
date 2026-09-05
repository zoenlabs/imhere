import { type Router, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { practices } from '@/data/practices';
import { ALL_DAYS, useAppStore } from '@/store/useAppStore';
import {
  isAlarm,
  notifee,
  notifeeModule,
  readPracticeId,
  readScheduleId,
  syncAlarms,
} from './alarms';

// Janela em que ainda faz sentido chamar a prática depois do horário marcado
const WINDOW_MINUTES = 45;

/**
 * A tela do alarme pode ser chamada por três caminhos ao mesmo tempo
 * (notificação em tela cheia, link aberto em segundo plano e verificação ao
 * voltar ao primeiro plano). Este registro evita abrir duas vezes.
 */
const shownAt = new Map<string, number>();
export const markAlarmScreenShown = (scheduleId: string) => shownAt.set(scheduleId, Date.now());
export const alarmScreenShownRecently = (scheduleId: string) =>
  Date.now() - (shownAt.get(scheduleId) ?? 0) < 10_000;

/** Abre a tela do alarme; se o app acabou de nascer (splash), substitui em vez de empilhar. */
export function showAlarmScreen(router: Router, scheduleId: string) {
  if (alarmScreenShownRecently(scheduleId)) return;
  markAlarmScreenShown(scheduleId);
  const target = { pathname: '/pratica-agora', params: { scheduleId } } as const;
  if (router.canGoBack()) router.push(target);
  else router.replace(target);
}

// O tratador do alarme em segundo plano fica em src/lib/alarmBackground.ts,
// importado pelo index.js antes do expo-router.

/**
 * Abre a prática validando o plano:
 * prática paga sem acesso ativo vai para o paywall.
 */
export function useOpenPractice() {
  const router = useRouter();
  return (practiceId: string) => {
    const practice = practices.find((p) => p.id === practiceId);
    if (!practice) return;
    const allowed = !practice.premium || useAppStore.getState().hasPremiumAccess();
    router.push(allowed ? `/respirar/${practice.id}` : '/paywall');
  };
}

/**
 * Liga quatro coisas:
 * 1. mantém alarmes e lembretes do sistema em dia com a agenda salva;
 * 2. abre a tela de alarme em tela cheia quando o alarme dispara;
 * 3. leva direto para a prática quando o usuário toca no lembrete;
 * 4. mostra a prática do horário quando o app volta ao primeiro plano.
 */
export function usePracticeFlow() {
  const router = useRouter();
  const openPractice = useOpenPractice();
  const schedules = useAppStore((s) => s.schedules);
  const handled = useRef<string | null>(null);

  // 1) Sincroniza alarmes e lembretes sempre que a agenda muda
  useEffect(() => {
    syncAlarms(schedules).catch(() => {});
  }, [schedules]);

  // 2 e 3) Alarme disparado ou notificação tocada
  useEffect(() => {
    const handle = (data: unknown, id: string) => {
      if (handled.current === id) return;
      handled.current = id;

      const scheduleId = readScheduleId(data);
      const practiceId = readPracticeId(data);

      // Alarme: abre a tela cheia com o botão Iniciar
      if (isAlarm(data) && scheduleId) {
        setTimeout(() => showAlarmScreen(router, scheduleId), 300);
        return;
      }

      // Lembrete tocado: vai direto para a prática
      if (practiceId) setTimeout(() => openPractice(practiceId), 300);
    };

    if (!notifee || !notifeeModule) return;
    const EventType = notifeeModule.EventType;

    // App aberto pelo alarme ou pela notificação (estava fechado)
    notifee
      .getInitialNotification()
      .then((initial) => {
        if (!initial) return;
        handle(initial.notification.data, initial.notification.id ?? 'initial');
      })
      .catch(() => {});

    const unsubscribe = notifee.onForegroundEvent(({ type, detail }) => {
      const notification = detail.notification;
      if (!notification) return;
      if (type === EventType.PRESS || type === EventType.DELIVERED) {
        if (type === EventType.DELIVERED && !isAlarm(notification.data)) return;
        handle(notification.data, notification.id ?? String(type));
      }
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 4) Prática do horário quando o app volta ao primeiro plano
  useEffect(() => {
    const check = () => {
      const s = useAppStore.getState();
      s.rollDayIfNeeded();

      const now = new Date();
      const weekday = now.getDay();
      const minutesNow = now.getHours() * 60 + now.getMinutes();

      const due = s.schedules
        .filter((item) => item.enabled && (item.days ?? ALL_DAYS).includes(weekday))
        .filter((item) => !s.promptedToday.includes(item.id))
        .filter((item) => !s.doneToday.includes(item.id))
        .map((item) => ({ item, delta: minutesNow - (item.hour * 60 + item.minute) }))
        .filter(({ delta }) => delta >= 0 && delta <= WINDOW_MINUTES)
        .sort((a, b) => a.delta - b.delta)[0];

      if (!due) return;
      s.markPrompted(due.item.id);
      showAlarmScreen(router, due.item.id);
    };

    const t = setTimeout(check, 600);
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') check();
    });
    return () => {
      clearTimeout(t);
      sub.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
