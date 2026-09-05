const { withAndroidManifest, AndroidConfig } = require('expo/config-plugins');

/**
 * Deixa o app apto a se comportar como despertador no Android:
 *
 * - USE_FULL_SCREEN_INTENT: a notificação de alarme toma a tela inteira
 *   por cima de qualquer app aberto.
 * - SCHEDULE_EXACT_ALARM: o alarme dispara no minuto certo, sem o atraso que
 *   o Android aplica em notificações comuns. No Android 14+ o usuário precisa
 *   autorizar em Ajustes → Apps → I'm Here → "Alarmes e lembretes".
 *   (USE_EXACT_ALARM foi removida de propósito: o Google reserva essa
 *   permissão a despertadores e calendários e reprova outros apps.)
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
  'android.permission.WAKE_LOCK',
  'android.permission.TURN_SCREEN_ON',
  'android.permission.RECEIVE_BOOT_COMPLETED',
  'android.permission.VIBRATE',
  'android.permission.POST_NOTIFICATIONS',
  // Janela do sistema para tirar o app da otimização de bateria. A Play Store
  // só aceita quando a função principal depende disso (é o caso do alarme);
  // declarar na revisão do app.
  'android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS',
];

module.exports = function withAlarme(config) {
  return withAndroidManifest(config, (cfg) => {
    // cfg.modResults é o objeto raiz ({ manifest: {...} }); as permissões
    // precisam entrar dentro de <manifest>, não ao lado dele. O helper do
    // Expo já faz isso e evita duplicar as que o próprio Expo adiciona.
    const androidManifest = cfg.modResults;
    AndroidConfig.Permissions.ensurePermissions(androidManifest, PERMISSIONS);

    const activity = AndroidConfig.Manifest.getMainActivityOrThrow(androidManifest);
    activity.$['android:showWhenLocked'] = 'true';
    activity.$['android:turnScreenOn'] = 'true';
    activity.$['android:launchMode'] = 'singleTask';

    return cfg;
  });
};
