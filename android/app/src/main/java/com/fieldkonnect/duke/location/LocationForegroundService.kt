package com.fieldkonnect.duke.location

import android.Manifest
import android.app.AlarmManager
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.content.pm.ServiceInfo
import android.location.Location
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.os.Build
import android.os.Handler
import android.os.HandlerThread
import android.os.IBinder
import android.os.Looper
import android.os.PowerManager
import android.provider.Settings
import android.net.Uri
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import com.fieldkonnect.duke.MainActivity
import com.fieldkonnect.duke.R
import com.google.android.gms.location.LocationAvailability
import com.google.android.gms.location.LocationCallback
import com.google.android.gms.location.LocationRequest
import com.google.android.gms.location.LocationResult
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import org.json.JSONArray
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL

class LocationForegroundService : Service() {
  private val fusedLocationClient by lazy { LocationServices.getFusedLocationProviderClient(this) }
  private lateinit var workerThread: HandlerThread
  private lateinit var workerHandler: Handler
  private val mainHandler = Handler(Looper.getMainLooper())
  private var running = false

  // Fused location updates keep arriving while the screen is locked / in Doze,
  // unlike a Handler timer which is frozen while the CPU sleeps.
  private val locationCallback = object : LocationCallback() {
    override fun onLocationResult(result: LocationResult) {
      result.locations.forEach { onLocationCaptured(it) }
    }

    override fun onLocationAvailability(availability: LocationAvailability) {
      if (!availability.isLocationAvailable) {
        Log.e(TAG, "Location unavailable (GPS/location may be switched off)")
        updateNotification("Location is off. Turn on location to continue tracking.")
      }
    }
  }

  private data class ApiResponse(
    val code: Int,
    val body: String,
    val success: Boolean,
  )

  override fun onCreate() {
    super.onCreate()
    workerThread = HandlerThread("FieldKonnectLocationWorker").also { it.start() }
    workerHandler = Handler(workerThread.looper)
    createNotificationChannel()
    isRunning = true
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    when (intent?.action) {
      ACTION_STOP -> {
        if (!LocationStorage.isActive(this)) {
          // This branch is a safeguard for a state race. Normally the native
          // module now avoids starting the service when tracking is inactive.
          stopSelf()
          return START_NOT_STICKY
        }
        if (!ensureForeground("Stopping live location tracking")) {
          LocationStorage.setActive(this, false)
          cancelWatchdog(this)
          return START_NOT_STICKY
        }
        stopTracking()
      }
      ACTION_SYNC -> {
        if (!LocationStorage.isActive(this)) {
          stopSelf()
          return START_NOT_STICKY
        }
        if (!ensureForeground("Syncing pending live locations")) return START_NOT_STICKY
        syncPendingLocations(stopIfInactive = true)
      }
      ACTION_CAPTURE_NOW -> {
        if (!ensureForeground("Capturing live location")) return START_NOT_STICKY
        captureLocation()
      }
      else -> startTracking(intent)
    }
    return START_STICKY
  }

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onDestroy() {
    isRunning = false
    running = false
    fusedLocationClient.removeLocationUpdates(locationCallback)
    mainHandler.removeCallbacksAndMessages(null)
    workerThread.quitSafely()
    super.onDestroy()
  }

  override fun onTaskRemoved(rootIntent: Intent?) {
    if (LocationStorage.isActive(this)) {
      Log.d(TAG, "App swiped from recent apps; keeping foreground location service alive")
      scheduleServiceRestart()
    }
    super.onTaskRemoved(rootIntent)
  }

  private fun startTracking(intent: Intent?) {
    val token = intent?.getStringExtra(EXTRA_TOKEN) ?: LocationStorage.token(this)
    val userData = intent?.getStringExtra(EXTRA_USER_DATA)
    if (token.isNullOrBlank()) {
      Log.e(TAG, "Punch-in tracking start blocked: missing token")
      stopSelf()
      return
    }

    LocationStorage.setActive(this, true, token, userData)
    if (!ensureForeground("Location tracking is active after punch-in.")) return
    Log.d(TAG, "Foreground service started")
    scheduleWatchdog(this)

    val lastCapturedAt = LocationStorage.lastCapturedAt(this)
    val stale = lastCapturedAt > 0 && System.currentTimeMillis() - lastCapturedAt > STALE_AFTER_MS
    if (!running || stale) {
      if (stale) Log.d(TAG, "No location for too long; re-registering location updates")
      running = startLocationUpdates()
      captureLocation()
    }
  }

  private fun stopTracking() {
    Log.d(TAG, "Punch-out tracking stopped")
    running = false
    fusedLocationClient.removeLocationUpdates(locationCallback)
    cancelWatchdog(this)
    mainHandler.removeCallbacksAndMessages(null)
    syncPendingLocations(stopIfInactive = false) {
      LocationStorage.setActive(this, false)
      stopForeground(STOP_FOREGROUND_REMOVE)
      stopSelf()
    }
  }

  /**
   * Promote to a location foreground service. Returns false (and stops) when
   * Android refuses, e.g. because location permission was revoked.
   */
  private fun ensureForeground(message: String): Boolean {
    return try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        startForeground(NOTIFICATION_ID, notification(message), ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION)
      } else {
        startForeground(NOTIFICATION_ID, notification(message))
      }
      true
    } catch (error: Exception) {
      Log.e(TAG, "Unable to start location foreground service", error)
      running = false
      stopSelf()
      false
    }
  }

  private fun startLocationUpdates(): Boolean {
    if (!hasLocationPermission()) {
      Log.e(TAG, "Allow all the time location permission missing; cannot track")
      updateNotification("Set Location permission to \"Allow all the time\"")
      return false
    }

    val request = LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, LOCATION_SYNC_INTERVAL_MS)
      .setMinUpdateIntervalMillis(LOCATION_SYNC_INTERVAL_MS)
      .setMaxUpdateDelayMillis(0)
      .setWaitForAccurateLocation(false)
      .build()

    return try {
      fusedLocationClient.removeLocationUpdates(locationCallback)
      fusedLocationClient.requestLocationUpdates(request, locationCallback, workerThread.looper)
      true
    } catch (error: SecurityException) {
      Log.e(TAG, "Location updates refused", error)
      updateNotification("Location permission required")
      false
    }
  }

  /** One immediate fresh fix (no stale cached location) right after punch-in / restart. */
  private fun captureLocation() {
    if (!LocationStorage.isActive(this) || !hasLocationPermission()) return

    try {
      fusedLocationClient.getCurrentLocation(Priority.PRIORITY_HIGH_ACCURACY, null)
        .addOnSuccessListener { location ->
          if (location != null) {
            onLocationCaptured(location)
          } else {
            updateNotification("Waiting for location. Make sure location is on.")
          }
        }
        .addOnFailureListener { error ->
          Log.e(TAG, "Location capture failed", error)
          updateNotification("Location capture failed")
        }
    } catch (error: SecurityException) {
      Log.e(TAG, "Location capture refused", error)
    }
  }

  private fun onLocationCaptured(location: Location) {
    if (!LocationStorage.isActive(this)) return
    // The immediate fix and the first periodic update can arrive together; the
    // server drops points closer than ~3 minutes anyway, so keep only one.
    val lastCapturedAt = LocationStorage.lastCapturedAt(this)
    if (lastCapturedAt > 0 && location.time - lastCapturedAt < MIN_POINT_GAP_MS) return

    LocationStorage.enqueue(this, location.latitude, location.longitude, LocationStorage.apiDateTime(java.util.Date(location.time)))
    LocationStorage.markCaptured(this, location.time)
    Log.d(TAG, "Location captured: ${location.latitude}, ${location.longitude}")
    updateNotification("Location captured at ${LocationStorage.apiDateTime()}")
    syncPendingLocations(stopIfInactive = false)
  }

  private fun syncPendingLocations(stopIfInactive: Boolean, onComplete: (() -> Unit)? = null) {
    workerHandler.post {
      // Keep the CPU awake until the upload finishes, even with the screen locked.
      val wakeLock = (getSystemService(Context.POWER_SERVICE) as PowerManager)
        .newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "FieldKonnect:LocationSync")
        .apply { setReferenceCounted(false); acquire(SYNC_WAKE_LOCK_TIMEOUT_MS) }
      val finish = {
        if (wakeLock.isHeld) wakeLock.release()
        if (stopIfInactive && !LocationStorage.isActive(this)) stopSelf()
        onComplete?.let { callback -> mainHandler.post(callback) }
      }
      val queue = LocationStorage.queued(this)
      if (queue.isEmpty()) {
        finish()
        return@post
      }
      if (!isOnline()) {
        Log.d(TAG, "API hit failed and saved locally: offline (${queue.size})")
        updateNotification("Offline: ${queue.size} locations pending")
        finish()
        return@post
      }

      val token = LocationStorage.token(this)
      if (token.isNullOrBlank()) {
        Log.e(TAG, "API hit failed and saved locally: missing token")
        finish()
        return@post
      }

      try {
        val response = postLocations(queue, token)
        if (response.success) {
          LocationStorage.removeQueued(this, queue.map { it.id }.toSet())
          Log.d(TAG, "Pending locations synced: ${queue.size}")
          updateNotification("Location synced at ${LocationStorage.apiDateTime()}")
          showApiResultNotification(
            title = "Location API success",
            message = "${queue.size} location(s) sent at ${LocationStorage.apiDateTime()} | HTTP ${response.code}",
            body = response.body,
          )
        } else {
          Log.e(TAG, "API hit failed and saved locally: HTTP ${response.code} ${response.body.take(LOG_BODY_LIMIT)}")
          updateNotification("Location sync failed")
          showApiResultNotification(
            title = "Location API failed",
            message = "${queue.size} location(s) kept pending | HTTP ${response.code}",
            body = response.body,
          )
        }
      } catch (error: Exception) {
        Log.e(TAG, "API hit failed and saved locally", error)
        updateNotification("Location sync failed")
        showApiResultNotification(
          title = "Location API error",
          message = "${queue.size} location(s) kept pending",
          body = error.message ?: "Unknown error",
        )
      } finally {
        finish()
      }
    }
  }

  private fun postLocations(locations: List<QueuedLocation>, token: String): ApiResponse {
    val payloadLocations = JSONArray()
    locations.forEach { item ->
      payloadLocations.put(JSONObject().apply {
        put("latitude", item.latitude.toString())
        put("longitude", item.longitude.toString())
        put("time", item.time)
      })
    }
    val payload = JSONObject().put("locations", payloadLocations).toString()
    val connection = (URL("${BASE_URL}api/updateLiveLocation").openConnection() as HttpURLConnection).apply {
      requestMethod = "POST"
      connectTimeout = 30000
      readTimeout = 30000
      doOutput = true
      setRequestProperty("Authorization", "Bearer $token")
      setRequestProperty("Accept", "application/json")
      setRequestProperty("Content-Type", "application/json")
    }
    OutputStreamWriter(connection.outputStream).use { it.write(payload) }
    val code = connection.responseCode
    val body = readResponseBody(connection, code)
    val success = isSuccessfulLocationResponse(code, body)
    Log.d(
      TAG,
      if (success) {
        "API hit success: HTTP $code ${body.take(LOG_BODY_LIMIT)}"
      } else {
        "API hit failed: HTTP $code ${body.take(LOG_BODY_LIMIT)}"
      },
    )
    connection.disconnect()
    return ApiResponse(code = code, body = body, success = success)
  }

  private fun readResponseBody(connection: HttpURLConnection, code: Int): String {
    val stream = if (code in 200..299) connection.inputStream else connection.errorStream
    if (stream == null) return ""

    return BufferedReader(InputStreamReader(stream)).use { reader ->
      reader.readText()
    }
  }

  private fun isSuccessfulLocationResponse(code: Int, body: String): Boolean {
    if (code !in 200..299) return false
    if (body.isBlank()) return true

    return try {
      val json = JSONObject(body)
      val status = json.optString("status").lowercase()
      val success = json.optString("success").lowercase()
      status == "success" || success == "true" || status.isBlank()
    } catch (_: Exception) {
      true
    }
  }

  private fun hasLocationPermission(): Boolean {
    val fine = ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
    val coarse = ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED
    val background = Build.VERSION.SDK_INT < Build.VERSION_CODES.Q ||
      ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_BACKGROUND_LOCATION) == PackageManager.PERMISSION_GRANTED
    return (fine || coarse) && background
  }

  private fun isOnline(): Boolean {
    val connectivityManager = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
    val network = connectivityManager.activeNetwork ?: return false
    val capabilities = connectivityManager.getNetworkCapabilities(network) ?: return false
    return capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
  }

  private fun createNotificationChannel() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val channel = NotificationChannel(CHANNEL_ID, "Live location tracking", NotificationManager.IMPORTANCE_LOW).apply {
      description = "Shows when FieldKonnect is tracking location after punch-in"
      setShowBadge(false)
    }
    getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
  }

  private fun notification(message: String): Notification {
    val launchIntent = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q && !hasLocationPermission()) {
      Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.fromParts("package", packageName, null))
        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    } else {
      Intent(this, MainActivity::class.java)
    }
    val pendingIntent = PendingIntent.getActivity(
      this,
      0,
      launchIntent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )
    return NotificationCompat.Builder(this, CHANNEL_ID)
      .setContentTitle("FieldKonnect live location")
      .setContentText(message)
      .setSmallIcon(R.mipmap.ic_launcher)
      .setOngoing(true)
      .setOnlyAlertOnce(true)
      .setContentIntent(pendingIntent)
      .build()
  }

  private fun apiResultNotification(title: String, message: String, body: String): Notification {
    val launchIntent = Intent(this, MainActivity::class.java)
    val pendingIntent = PendingIntent.getActivity(
      this,
      0,
      launchIntent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )
    val detail = listOf(message, body.take(NOTIFICATION_BODY_LIMIT))
      .filter { it.isNotBlank() }
      .joinToString("\n")

    return NotificationCompat.Builder(this, CHANNEL_ID)
      .setContentTitle(title)
      .setContentText(message)
      .setStyle(NotificationCompat.BigTextStyle().bigText(detail))
      .setSmallIcon(R.mipmap.ic_launcher)
      .setAutoCancel(true)
      .setOnlyAlertOnce(false)
      .setContentIntent(pendingIntent)
      .build()
  }

  private fun updateNotification(message: String) {
    val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    manager.notify(NOTIFICATION_ID, notification(message))
  }

  private fun showApiResultNotification(title: String, message: String, body: String) {
    val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    val notificationId = API_RESULT_NOTIFICATION_ID_BASE + (System.currentTimeMillis() % 100000).toInt()
    manager.notify(notificationId, apiResultNotification(title, message, body))
  }

  private fun scheduleServiceRestart() {
    scheduleWatchdog(this, RESTART_AFTER_TASK_REMOVED_MS)
  }

  companion object {
    private const val TAG = "FieldKonnectLocation"
    private const val BASE_URL = "https://duke.fieldkonnect.in/"
    private const val CHANNEL_ID = "fieldkonnect_live_location"
    private const val NOTIFICATION_ID = 9301
    private const val API_RESULT_NOTIFICATION_ID_BASE = 9400
    private const val LOCATION_SYNC_INTERVAL_MS = 3 * 60 * 1000L
    private const val MIN_POINT_GAP_MS = 170 * 1000L
    private const val STALE_AFTER_MS = 10 * 60 * 1000L
    private const val WATCHDOG_INTERVAL_MS = 10 * 60 * 1000L
    private const val WATCHDOG_REQUEST_CODE = 102
    private const val SYNC_WAKE_LOCK_TIMEOUT_MS = 60 * 1000L
    private const val LOG_BODY_LIMIT = 500
    private const val NOTIFICATION_BODY_LIMIT = 220

    const val ACTION_START = "com.fieldkonnect.duke.location.START"
    const val ACTION_STOP = "com.fieldkonnect.duke.location.STOP"
    const val ACTION_SYNC = "com.fieldkonnect.duke.location.SYNC"
    const val ACTION_CAPTURE_NOW = "com.fieldkonnect.duke.location.CAPTURE_NOW"
    const val EXTRA_TOKEN = "token"
    const val EXTRA_USER_DATA = "userData"
    private const val RESTART_AFTER_TASK_REMOVED_MS = 2000L

    /** True while this service instance is alive in the current process. */
    @Volatile
    var isRunning = false
      private set

    private fun watchdogIntent(context: Context): PendingIntent =
      PendingIntent.getBroadcast(
        context,
        WATCHDOG_REQUEST_CODE,
        Intent(context, LocationWatchdogReceiver::class.java),
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
      )

    /**
     * Wake up after [delayMs] (even in Doze) and let [LocationWatchdogReceiver]
     * restart tracking if the OS / OEM battery manager killed the service while
     * the user is still punched in.
     */
    fun scheduleWatchdog(context: Context, delayMs: Long = WATCHDOG_INTERVAL_MS) {
      val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
      alarmManager.setAndAllowWhileIdle(
        AlarmManager.RTC_WAKEUP,
        System.currentTimeMillis() + delayMs,
        watchdogIntent(context),
      )
    }

    fun cancelWatchdog(context: Context) {
      val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
      alarmManager.cancel(watchdogIntent(context))
    }
  }
}
