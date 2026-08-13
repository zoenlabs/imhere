const { withAndroidManifest, AndroidConfig } = require('expo/config-plugins');

/**
 * Deixa o app apto a se comportar como despertador no Android:
 *
 * - USE_FULL_SCREEN_INTENT: a notificação de alarme toma a tela inteira
 *   por cima de qualquer app aberto.
 * - SCHEDULE_EXACT_ALARM / USE_EXACT_ALARM: o alarme dispara no minuto certo,
 *   sem o atraso que o Android aplica em notificações comuns.
 * - WAKE_LOCK e TURN_SCREEN_ON: acordam a tela no horário.
 * - RECEIVE_BOOT_COMPLETED: os alarmes sobrevivem a um reinício do aparelho.
 *
 * Na MainActivity, showWhenLocked e turnScreenOn fazem a tela do alarme
 * aparecer com o celular bloqueado, igual ao despertador do sistema.
 *
 * Observação para o lançamento: a permissão de tela cheia é restrita na
 * Play Store. Na publicação é preciso declarar que o app usa alarmes.
 */
const PERMISSIONS = [
  'android.permission.USE_FULL_SCREEN_INTENT',
  'android.permission.SCHEDULE_EXACT_ALARM',
  'android.permission.USE_EXACT_ALARM',
  'android.permission.WAKE_LOCK',
  'android.permission.TURN_SCREEN_ON',
  'android.permission.RECEIVE_BOOT_COMPLETED',
  'android.permission.VIBRATE',
  'android.permission.POST_NOTIFICATIONS',
];

module.exports = function withAlarme(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults;

    manifest['uses-permission'] = manifest['uses-permission'] ?? [];
    for (const name of PERMISSIONS) {
      const exists = manifest['uses-permission'].some(
        (item) => item.$?.['android:name'] === name
      );
      if (!exists) manifest['uses-permission'].push({ $: { 'android:name': name } });
    }

    const activity = AndroidConfig.Manifest.getMainActivityOrThrow(manifest);
    activity.$['android:showWhenLocked'] = 'true';
    activity.$['android:turnScreenOn'] = 'true';
    activity.$['android:launchMode'] = 'singleTask';

    return cfg;
  });
};
