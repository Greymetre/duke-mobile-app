package com.fieldkonnect.duke.location

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import androidx.core.content.ContextCompat

class LocationTrackingModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "LocationTracking"

  @ReactMethod
  fun startLocationTrackingAfterPunchIn(userData: ReadableMap?, token: String?, promise: Promise) {
    try {
      val authToken = token?.takeIf { it.isNotBlank() } ?: LocationStorage.token(reactContext)
      if (authToken.isNullOrBlank()) {
        promise.reject("missing_token", "Cannot start live location tracking without an auth token")
        return
      }
      val intent = Intent(reactContext, LocationForegroundService::class.java).apply {
        action = LocationForegroundService.ACTION_START
        putExtra(LocationForegroundService.EXTRA_TOKEN, authToken)
        userData?.let { putExtra(LocationForegroundService.EXTRA_USER_DATA, it.toHashMap().toString()) }
      }
      ContextCompat.startForegroundService(reactContext, intent)
      android.util.Log.d("FieldKonnectLocation", "Punch-in tracking started")
      promise.resolve(true)
    } catch (error: Exception) {
      promise.reject("start_failed", error)
    }
  }

  @ReactMethod
  fun stopLocationTrackingAfterPunchOut(promise: Promise) {
    try {
      val intent = Intent(reactContext, LocationForegroundService::class.java).apply {
        action = LocationForegroundService.ACTION_STOP
      }
      ContextCompat.startForegroundService(reactContext, intent)
      promise.resolve(true)
    } catch (error: Exception) {
      promise.reject("stop_failed", error)
    }
  }

  @ReactMethod
  fun syncPendingLocations(promise: Promise) {
    try {
      if (!LocationStorage.isActive(reactContext)) {
        promise.resolve(true)
        return
      }

      val intent = Intent(reactContext, LocationForegroundService::class.java).apply {
        action = LocationForegroundService.ACTION_SYNC
      }
      ContextCompat.startForegroundService(reactContext, intent)
      promise.resolve(true)
    } catch (error: Exception) {
      promise.reject("sync_failed", error)
    }
  }

  @ReactMethod
  fun getTrackingStatus(promise: Promise) {
    try {
      val status = LocationStorage.status(reactContext)
      val map = Arguments.createMap().apply {
        putBoolean("active", status.optBoolean("active"))
        putDouble("startedAt", status.optLong("startedAt").toDouble())
        putDouble("lastCapturedAt", status.optLong("lastCapturedAt").toDouble())
        putInt("pendingCount", status.optInt("pendingCount"))
      }
      promise.resolve(map)
    } catch (error: Exception) {
      promise.reject("status_failed", error)
    }
  }

  @ReactMethod
  fun openBatteryOptimizationSettings(promise: Promise) {
    try {
      val powerManager = reactContext.getSystemService(PowerManager::class.java)
      val packageName = reactContext.packageName
      val intent = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M &&
        !powerManager.isIgnoringBatteryOptimizations(packageName)
      ) {
        Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
          data = Uri.parse("package:$packageName")
        }
      } else {
        Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
          data = Uri.parse("package:$packageName")
        }
      }
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      reactContext.startActivity(intent)
      promise.resolve(true)
    } catch (error: Exception) {
      promise.reject("battery_settings_failed", error)
    }
  }
}
