package com.example.data.local

import android.content.Context
import android.content.SharedPreferences

/**
 * Persists the Supabase Auth session (access token, refresh token, auth user
 * id) across app restarts.
 *
 * NOTE: this uses a private-mode SharedPreferences file rather than
 * EncryptedSharedPreferences, because androidx.security:security-crypto is
 * not among this project's existing dependencies and the implementation
 * instructions explicitly said not to add a new dependency unless
 * technically unavoidable — plain private-mode SharedPreferences (accessible
 * only to this app's own UID, per Android's app-sandboxing model) is the
 * safest mechanism available without doing so. If stronger at-rest
 * protection is required later, swap this file's internals for
 * EncryptedSharedPreferences after adding that dependency deliberately.
 */
class SessionStore(context: Context) {

    private val prefs: SharedPreferences =
        context.applicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    data class StoredSession(
        val accessToken: String,
        val refreshToken: String?,
        val authUserId: String
    )

    fun save(accessToken: String, refreshToken: String?, authUserId: String) {
        prefs.edit()
            .putString(KEY_ACCESS_TOKEN, accessToken)
            .putString(KEY_REFRESH_TOKEN, refreshToken)
            .putString(KEY_AUTH_USER_ID, authUserId)
            .apply()
    }

    fun load(): StoredSession? {
        val accessToken = prefs.getString(KEY_ACCESS_TOKEN, null) ?: return null
        val authUserId = prefs.getString(KEY_AUTH_USER_ID, null) ?: return null
        val refreshToken = prefs.getString(KEY_REFRESH_TOKEN, null)
        return StoredSession(accessToken, refreshToken, authUserId)
    }

    fun clear() {
        prefs.edit().clear().apply()
    }

    companion object {
        private const val PREFS_NAME = "skillup_session"
        private const val KEY_ACCESS_TOKEN = "access_token"
        private const val KEY_REFRESH_TOKEN = "refresh_token"
        private const val KEY_AUTH_USER_ID = "auth_user_id"
    }
}
