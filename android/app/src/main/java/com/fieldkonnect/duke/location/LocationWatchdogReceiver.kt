package com.fieldkonnect.duke.location

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import androidx.core.content.ContextCompat

/**
 * Fired by the watchdog alarm while the user is punched in. Restarts the
 * location service if it was killed, otherwise nudges the live service so it
 * re-registers location updates when they have gone stale.
 */
class LocationWatchdogReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent?) {
    if (!LocationStorage.isActive(context)) return

    val serviceIntent = Intent(context, LocationForegroundService::class.java).apply {
      action = LocationForegroundService.ACTION_START
    }
    try {
      if (LocationForegroundService.isRunning) {
        // The app already holds a foreground service, so a plain start is allowed.
        context.startService(serviceIntent)
      } else {
        Log.d("FieldKonnectLocation", "Watchdog restarting killed location service")
        ContextCompat.startForegroundService(context, serviceIntent)
      }
    } catch (error: Exception) {
      // Android 12+ can refuse a background start (battery optimisation on);
      // try again on the next watchdog tick.
      Log.e("FieldKonnectLocation", "Watchdog could not restart location service", error)
      LocationForegroundService.scheduleWatchdog(context)
    }
  }
}
