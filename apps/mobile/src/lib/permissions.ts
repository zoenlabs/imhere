import Constants from 'expo-constants';
import * as IntentLauncher from 'expo-intent-launcher';
import { Platform } from 'react-native';
import { notifee, notifeeModule } from './alarms';

/**
 * Permissões que o alarme precisa no Android.
 *
 * Nenhuma delas vem concedida por padrão nas versões novas do Android, e o
 * sistema não mostra diálogo para a maioria: o usuário precisa ligar nos
 * Ajustes. Este módulo lê o estado de cada uma e abre a tela certa.
 *
 * - Notificações (Android 13+): diálogo do sistema.
 * - Alarmes exatos (Android 12+): tela de Ajustes. Sem ela o alarme vira
 *   "inexato" e o Android pode atrasar por muitos minutos.
 * - Tela cheia (Android 14+): tela de Ajustes. Sem ela o alarme não toma a
 *   tela nem acende o aparelho. O Android não permite consultar o estado.
 * - Otimização de bateria: tela de Ajustes. Com ela ligada, alguns aparelhos
 *   seguram alarmes.
 * - Fabricante: Xiaomi, Huawei, Samsung e outros têm uma tela própria de
 *   "início automático" que fecha apps em segundo plano.
 */
export type Setting = 'ok' | 'off' | 'unknown' | 'na';

export interface AlarmPermissions {
  notifications: Setting;
  exactAlarm: Setting;
  fullScreen: Setting;
  battery: Setting;
  manufacturer: Setting;
}

const androidVersion = Platform.OS === 'android' ? Number(Platform.Version) : 0;
const PACKAGE = Constants.expoConfig?.android?.package ?? 'com.zoenlabs.imhere';

/** true no development build Android, onde o alarme existe de verdade */
export const permissionsAvailable = Boolean(notifee) && Platform.OS === 'android';

const NONE: AlarmPermissions = {
  notifications: 'na',
  exactAlarm: 'na',
  fullScreen: 'na',
  battery: 'na',
  manufacturer: 'na',
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

  // O Android não expõe se a tela cheia está liberada; só dá para pedir
  const fullScreen: Setting = androidVersion >= 34 ? 'unknown' : 'na';

  let battery: Setting = 'na';
  try {
    battery = (await notifee.isBatteryOptimizationEnabled()) ? 'off' : 'ok';
  } catch {
    battery = 'na';
  }

  let manufacturer: Setting = 'na';
  try {
    const power = await notifee.getPowerManagerInfo();
    manufacturer = power.activity ? 'unknown' : 'na';
  } catch {
    manufacturer = 'na';
  }

  return { notifications, exactAlarm, fullScreen, battery, manufacturer };
}

/** Diálogo do sistema. Se já foi negado duas vezes, o Android não mostra mais. */
export async function requestNotifications(): Promise<boolean> {
  if (!notifee || !notifeeModule) return false;
  const settings = await notifee.requestPermission();
  return settings.authorizationStatus >= notifeeModule.AuthorizationStatus.AUTHORIZED;
}

export const openNotificationSettings = () => notifee?.openNotificationSettings().catch(() => {});
export const openExactAlarmSettings = () => notifee?.openAlarmPermissionSettings().catch(() => {});
export const openBatterySettings = () => notifee?.openBatteryOptimizationSettings().catch(() => {});
export const openManufacturerSettings = () => notifee?.openPowerManagerSettings().catch(() => {});

export async function openFullScreenSettings() {
  try {
    await IntentLauncher.startActivityAsync('android.settings.MANAGE_APP_USE_FULL_SCREEN_INTENT', {
      data: `package:${PACKAGE}`,
    });
  } catch {
    // Aparelho sem essa tela: cai nos ajustes de notificação do app
    await notifee?.openNotificationSettings().catch(() => {});
  }
}
