import { requireOptionalNativeModule } from 'expo';

/**
 * Ponte para o módulo nativo Android em `android/`. Fora do development
 * build (Expo Go, iOS) o módulo não existe e `native` fica nulo; quem usa
 * trata isso como "não se aplica".
 */
export interface AlarmPermissionsNative {
  canUseFullScreenIntent(): boolean;
  openFullScreenIntentSettings(): boolean;
  canDrawOverlays(): boolean;
  openOverlaySettings(): boolean;
  isLockedOrScreenOff(): boolean;
}

export const alarmPermissionsNative =
  requireOptionalNativeModule<AlarmPermissionsNative>('AlarmPermissions');
