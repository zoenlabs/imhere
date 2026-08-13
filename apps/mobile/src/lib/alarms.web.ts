import type { Schedule } from '@/store/useAppStore';

/**
 * Versão web: alarme não existe no navegador.
 *
 * Nenhum navegador permite tomar a tela por cima de outros aplicativos ou
 * acordar o aparelho, e a API que agendava notificações localmente
 * (Notification Triggers) foi descontinuada pelo Google. O agendamento
 * continua sendo salvo e exibido; apenas não dispara.
 *
 * Este arquivo evita que o Notifee, que é módulo nativo, entre no bundle web.
 */
export const alarmsAvailable = false;

export const ALARM_CHANNEL = 'alarme-praticas';
export const REMINDER_CHANNEL = 'lembretes-praticas';

export async function ensureChannels() {}

export async function ensurePermission(): Promise<boolean> {
  return false;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function syncAlarms(_schedules: Schedule[]) {}

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

export const notifee = null;
export const notifeeModule = null;
