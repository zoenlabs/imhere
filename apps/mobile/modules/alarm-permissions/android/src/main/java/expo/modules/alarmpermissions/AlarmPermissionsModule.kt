package expo.modules.alarmpermissions

import android.app.KeyguardManager
import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Permissões do alarme que nenhuma biblioteca do projeto consulta:
 *
 * - Notificações em tela cheia (Android 14+): sem ela o alarme não toma a
 *   tela com o aparelho bloqueado.
 * - Exibir sobre outros apps: sem ela o app não pode abrir a tela do alarme
 *   por cima do que estiver em uso.
 *
 * Também informa se o aparelho está bloqueado ou com a tela apagada, para o
 * app decidir se abre a tela do alarme por conta própria.
 */
class AlarmPermissionsModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw IllegalStateException("React context indisponível")

  override fun definition() = ModuleDefinition {
    Name("AlarmPermissions")

    Function("canUseFullScreenIntent") {
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
        return@Function true
      }
      val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
      manager.canUseFullScreenIntent()
    }

    Function("openFullScreenIntentSettings") {
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
        return@Function false
      }
      start(Intent(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT, packageUri()))
      true
    }

    Function("canDrawOverlays") {
      Settings.canDrawOverlays(context)
    }

    Function("openOverlaySettings") {
      start(Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, packageUri()))
      true
    }

    Function("isIgnoringBatteryOptimizations") {
      val power = context.getSystemService(Context.POWER_SERVICE) as PowerManager
      power.isIgnoringBatteryOptimizations(context.packageName)
    }

    // Janela do sistema "Permitir que o app fique ativo em segundo plano?".
    // Precisa da permissão REQUEST_IGNORE_BATTERY_OPTIMIZATIONS no manifesto.
    Function("requestIgnoreBatteryOptimizations") {
      try {
        start(Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS, packageUri()))
        true
      } catch (e: Exception) {
        false
      }
    }

    Function("isLockedOrScreenOff") {
      val keyguard = context.getSystemService(Context.KEYGUARD_SERVICE) as KeyguardManager
      val power = context.getSystemService(Context.POWER_SERVICE) as PowerManager
      keyguard.isKeyguardLocked || !power.isInteractive
    }
  }

  private fun packageUri(): Uri = Uri.parse("package:${context.packageName}")

  private fun start(intent: Intent) {
    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    context.startActivity(intent)
  }
}
