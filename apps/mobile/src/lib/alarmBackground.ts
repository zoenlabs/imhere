import { Linking } from 'react-native';
import { alarmPermissionsNative } from '../../modules/alarm-permissions';
import { isAlarm, notifee, notifeeModule, readScheduleId } from './alarms';

/**
 * Tratador do alarme com o app em segundo plano ou fechado.
 *
 * Importado pelo ponto de entrada (index.js) ANTES do expo-router: quando o
 * Android acorda o app em modo headless para entregar a notificação, as
 * telas nunca são carregadas, então o registro precisa acontecer aqui.
 *
 * - Aparelho bloqueado ou tela apagada: a notificação em tela cheia do
 *   sistema já abre o app (fullScreenAction); nada a fazer.
 * - Aparelho em uso: o Android não abre tela cheia por notificação, então o
 *   app abre a tela do alarme por conta própria, por cima do que estiver
 *   aberto. Depende da permissão "Exibir sobre outros apps".
 */
notifee?.onBackgroundEvent(async ({ type, detail }) => {
  if (!notifeeModule) return;
  const notification = detail.notification;
  if (!notification || type !== notifeeModule.EventType.DELIVERED) return;
  if (!isAlarm(notification.data)) return;
  if (alarmPermissionsNative?.isLockedOrScreenOff()) return;

  const scheduleId = readScheduleId(notification.data);
  if (!scheduleId) return;
  await Linking.openURL(`imhere://pratica-agora?scheduleId=${scheduleId}`).catch(() => {});
});
