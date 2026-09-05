import { Platform } from 'react-native';
import { alarmPermissionsNative as native } from '../../modules/alarm-permissions';
import { todayKey, useAppStore } from '@/store/useAppStore';
import { notifee, notifeeModule } from './alarms';

/**
 * Permissões que o alarme precisa no Android.
 *
 * Só notificações e bateria têm janela de "Permitir" do sistema. Para as
 * demais o Android obriga a abrir a tela de Ajustes, então o app conduz um
 * assistente passo a passo (app/permissoes.tsx): mostra um pedido por vez,
 * abre a tela certa e avança sozinho quando o usuário volta com a permissão
 * ligada.
 *
 * - Notificações (Android 13+): janela do sistema.
 * - Alarmes exatos (Android 12+): sem ela o alarme vira "inexato" e atrasa.
 * - Tela cheia (Android 14+): sem ela o alarme não toma a tela bloqueada.
 * - Sobre outros apps: sem ela o app não abre o alarme por cima do que
 *   estiver em uso.
 * - Bateria: janela do sistema; com a otimização ligada alguns aparelhos
 *   seguram o alarme.
 */
export type Setting = 'ok' | 'off' | 'na';
export type StepKey = 'notifications' | 'exactAlarm' | 'fullScreen' | 'overlay' | 'battery';
export type AlarmPermissions = Record<StepKey, Setting>;

/** true no development build Android, onde o alarme existe de verdade */
export const permissionsAvailable = Boolean(notifee) && Platform.OS === 'android';

const NONE: AlarmPermissions = {
  notifications: 'na',
  exactAlarm: 'na',
  fullScreen: 'na',
  overlay: 'na',
  battery: 'na',
};

export async function readPermissions(): Promise<AlarmPermissions> {
  if (!notifee || !notifeeModule || !permissionsAvailable) return NONE;

  const settings = await notifee.getNotificationSettings();
  const notifications: Setting =
    settings.authorizationStatus >= notifeeModule.AuthorizationStatus.AUTHORIZED ? 'ok' : 'off';

  const alarm = settings.android?.alarm;
  const exactAlarm: Setting =
    alarm === notifeeModule.AndroidNotificationSetting.NOT_SUPPORTED
      ? 'na'
      : alarm === notifeeModule.AndroidNotificationSetting.ENABLED
        ? 'ok'
        : 'off';

  const fullScreen: Setting = native ? (native.canUseFullScreenIntent() ? 'ok' : 'off') : 'na';
  const overlay: Setting = native ? (native.canDrawOverlays() ? 'ok' : 'off') : 'na';

  let battery: Setting = 'na';
  try {
    battery = native
      ? native.isIgnoringBatteryOptimizations()
        ? 'ok'
        : 'off'
      : (await notifee.isBatteryOptimizationEnabled())
        ? 'off'
        : 'ok';
  } catch {
    battery = 'na';
  }

  return { notifications, exactAlarm, fullScreen, overlay, battery };
}

async function requestNotifications(): Promise<boolean> {
  if (!notifee || !notifeeModule) return false;
  const settings = await notifee.requestPermission();
  return settings.authorizationStatus >= notifeeModule.AuthorizationStatus.AUTHORIZED;
}

export interface Step {
  key: StepKey;
  title: string;
  why: string;
  /** O que fazer na tela que vai abrir */
  hint: string;
  action: string;
  /** true quando abre uma janela do sistema (não uma tela de Ajustes) */
  dialog: boolean;
  request: () => Promise<void>;
}

export const STEPS: Step[] = [
  {
    key: 'notifications',
    title: 'Notificações',
    why: 'É por onde o alarme e o lembrete chegam.',
    hint: 'Toque em Permitir na janela do sistema.',
    action: 'Permitir',
    dialog: true,
    request: async () => {
      // Negado duas vezes, o Android não mostra mais a janela: sobra os Ajustes
      const ok = await requestNotifications();
      if (!ok) await notifee?.openNotificationSettings();
    },
  },
  {
    key: 'exactAlarm',
    title: 'Alarmes e lembretes',
    why: 'Sem isso o Android atrasa o alarme em vários minutos para poupar bateria.',
    hint: 'Na tela que vai abrir, ative "Permitir alarmes e lembretes" e volte.',
    action: 'Abrir ajustes',
    dialog: false,
    request: async () => {
      await notifee?.openAlarmPermissionSettings();
    },
  },
  {
    key: 'fullScreen',
    title: 'Tela cheia',
    why: 'Deixa o alarme tomar a tela com o celular bloqueado, como um despertador.',
    hint: 'Na tela que vai abrir, ative "Permitir notificações em tela cheia" e volte.',
    action: 'Abrir ajustes',
    dialog: false,
    request: async () => {
      native?.openFullScreenIntentSettings();
    },
  },
  {
    key: 'overlay',
    title: 'Sobre outros apps',
    why: 'Deixa o alarme aparecer por cima do que você estiver usando.',
    hint: 'Na tela que vai abrir, ative "Permitir exibição sobre outros apps" e volte.',
    action: 'Abrir ajustes',
    dialog: false,
    request: async () => {
      native?.openOverlaySettings();
    },
  },
  {
    key: 'battery',
    title: 'Bateria',
    why: 'Com a otimização ligada, alguns aparelhos seguram o alarme.',
    hint: 'Toque em Permitir na janela do sistema.',
    action: 'Permitir',
    dialog: true,
    request: async () => {
      if (native?.requestIgnoreBatteryOptimizations()) return;
      await notifee?.openBatteryOptimizationSettings();
    },
  },
];

export const missingSteps = (perms: AlarmPermissions): Step[] =>
  STEPS.filter((s) => perms[s.key] === 'off');

/**
 * Decide se o assistente deve abrir: falta alguma permissão e o usuário
 * não pediu para deixar para depois hoje (`force` ignora o "depois").
 */
export async function shouldPromptPermissions(force = false): Promise<boolean> {
  if (!permissionsAvailable) return false;
  if (!force && useAppStore.getState().permissionsSnoozedDay === todayKey()) return false;
  const perms = await readPermissions();
  return missingSteps(perms).length > 0;
}
