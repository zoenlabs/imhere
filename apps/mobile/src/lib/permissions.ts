import { Alert, AppState, Platform } from 'react-native';
import { alarmPermissionsNative as native } from '../../modules/alarm-permissions';
import { todayKey, useAppStore } from '@/store/useAppStore';
import { notifee, notifeeModule } from './alarms';

/**
 * Permissões que o alarme precisa no Android, pedidas automaticamente.
 *
 * O app verifica em silêncio e, para cada uma que falta, mostra um aviso
 * curto e abre a tela padrão do sistema. Só as notificações têm diálogo;
 * o restante o Android obriga a ligar nos Ajustes.
 *
 * - Notificações (Android 13+): diálogo do sistema.
 * - Alarmes exatos (Android 12+): sem ela o alarme vira "inexato" e atrasa.
 * - Tela cheia (Android 14+): sem ela o alarme não toma a tela bloqueada.
 * - Exibir sobre outros apps: sem ela o app não abre o alarme por cima do
 *   que estiver em uso.
 * - Bateria e "início automático" do fabricante: só na revisão manual.
 */
export type Setting = 'ok' | 'off' | 'na';

export interface AlarmPermissions {
  notifications: Setting;
  exactAlarm: Setting;
  fullScreen: Setting;
  overlay: Setting;
  battery: Setting;
  manufacturer: Setting;
}

/** true no development build Android, onde o alarme existe de verdade */
export const permissionsAvailable = Boolean(notifee) && Platform.OS === 'android';

const NONE: AlarmPermissions = {
  notifications: 'na',
  exactAlarm: 'na',
  fullScreen: 'na',
  overlay: 'na',
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

  const fullScreen: Setting = native ? (native.canUseFullScreenIntent() ? 'ok' : 'off') : 'na';
  const overlay: Setting = native ? (native.canDrawOverlays() ? 'ok' : 'off') : 'na';

  let battery: Setting = 'na';
  try {
    battery = (await notifee.isBatteryOptimizationEnabled()) ? 'off' : 'ok';
  } catch {
    battery = 'na';
  }

  // O Android não informa se o app já foi liberado na tela do fabricante;
  // 'off' aqui significa apenas "existe uma tela para revisar".
  let manufacturer: Setting = 'na';
  try {
    const power = await notifee.getPowerManagerInfo();
    manufacturer = power.activity ? 'off' : 'na';
  } catch {
    manufacturer = 'na';
  }

  return { notifications, exactAlarm, fullScreen, overlay, battery, manufacturer };
}

async function requestNotifications(): Promise<boolean> {
  if (!notifee || !notifeeModule) return false;
  const settings = await notifee.requestPermission();
  return settings.authorizationStatus >= notifeeModule.AuthorizationStatus.AUTHORIZED;
}

type Step = {
  key: keyof AlarmPermissions;
  title: string;
  message: string;
  open: () => unknown;
};

const STEPS: Step[] = [
  {
    key: 'exactAlarm',
    title: 'Alarmes e lembretes',
    message:
      'Na próxima tela, ative "Permitir alarmes e lembretes". Sem isso o Android atrasa o alarme em vários minutos.',
    open: () => notifee?.openAlarmPermissionSettings(),
  },
  {
    key: 'fullScreen',
    title: 'Notificações em tela cheia',
    message:
      'Na próxima tela, ative "Permitir notificações em tela cheia". É o que deixa o alarme tomar a tela com o celular bloqueado.',
    open: () => native?.openFullScreenIntentSettings(),
  },
  {
    key: 'overlay',
    title: 'Exibir sobre outros apps',
    message:
      'Na próxima tela, ative "Permitir exibição sobre outros apps". É o que deixa o alarme aparecer por cima do que você estiver usando.',
    open: () => native?.openOverlaySettings(),
  },
];

const OPTIONAL_STEPS: Step[] = [
  {
    key: 'battery',
    title: 'Bateria sem restrição',
    message:
      'Na próxima tela, escolha "Não otimizar" ou "Sem restrições" para o I\'m Here. Alguns aparelhos seguram o alarme com a otimização ligada.',
    open: () => notifee?.openBatteryOptimizationSettings(),
  },
  {
    key: 'manufacturer',
    title: 'Início automático',
    message:
      'Seu aparelho tem uma tela própria que fecha apps em segundo plano. Na próxima tela, libere o I\'m Here.',
    open: () => notifee?.openPowerManagerSettings(),
  },
];

/** Aviso curto antes de mandar o usuário aos Ajustes. */
function confirm(title: string, message: string): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: 'Agora não', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Abrir ajustes', onPress: () => resolve(true) },
      ],
      { cancelable: false, onDismiss: () => resolve(false) }
    );
  });
}

/**
 * Espera o app sair e voltar ao primeiro plano (o usuário foi aos Ajustes
 * e retornou). Se nada acontecer em 2 minutos, segue em frente.
 */
function waitForForeground(timeoutMs = 2 * 60 * 1000): Promise<void> {
  return new Promise((resolve) => {
    let left = false;
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') {
        left = true;
        return;
      }
      if (left) finish();
    });
    const timer = setTimeout(finish, timeoutMs);
    function finish() {
      clearTimeout(timer);
      sub.remove();
      resolve();
    }
  });
}

let running = false;

/**
 * Passa por cada permissão que falta, abrindo a tela certa do sistema.
 *
 * - `force`: ignora o "agora não" dado hoje (usado ao criar um agendamento
 *   e na revisão manual pelo Perfil).
 * - `manual`: inclui bateria e fabricante e mostra um resumo no final.
 *
 * Retorna true quando tudo o que é obrigatório ficou liberado.
 */
export async function runPermissionFlow(
  opts: { force?: boolean; manual?: boolean } = {}
): Promise<boolean> {
  if (!permissionsAvailable || !notifee || running) return false;

  const store = useAppStore.getState();
  if (!opts.force && store.permissionsSnoozedDay === todayKey()) return false;

  running = true;
  try {
    let perms = await readPermissions();

    // 1) Notificações: diálogo do sistema direto. Se já foi negado de vez,
    //    o Android não mostra mais o diálogo e sobra a tela de Ajustes.
    if (perms.notifications === 'off') {
      const ok = await requestNotifications();
      if (!ok) {
        const go = await confirm(
          'Notificações',
          'O alarme e o lembrete chegam por notificação. Na próxima tela, ative as notificações do I\'m Here.'
        );
        if (!go) {
          store.snoozePermissions();
          return false;
        }
        await notifee.openNotificationSettings();
        await waitForForeground();
      }
    }

    // 2) As demais: aviso curto e tela de Ajustes, uma de cada vez
    const steps = opts.manual ? [...STEPS, ...OPTIONAL_STEPS] : STEPS;
    for (const step of steps) {
      perms = await readPermissions();
      if (perms[step.key] !== 'off') continue;

      const go = await confirm(step.title, step.message);
      if (!go) {
        store.snoozePermissions();
        return false;
      }
      await step.open();
      await waitForForeground();
    }

    perms = await readPermissions();
    const missing = STEPS.filter((s) => perms[s.key] === 'off').map((s) => s.title);
    if (perms.notifications === 'off') missing.unshift('Notificações');

    if (opts.manual) {
      Alert.alert(
        missing.length ? 'Ainda falta liberar' : 'Tudo liberado',
        missing.length
          ? `${missing.join(', ')}. Toque em "Alarmes e permissões" de novo quando quiser tentar.`
          : 'O alarme está pronto para tomar a tela no horário.'
      );
    }
    if (missing.length) store.snoozePermissions();
    return missing.length === 0;
  } finally {
    running = false;
  }
}
