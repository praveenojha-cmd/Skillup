package com.example.data.remote

import com.example.BuildConfig
import com.squareup.moshi.Moshi
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.moshi.MoshiConverterFactory
import java.util.concurrent.TimeUnit

/**
 * Builds the single Retrofit client used for every Supabase REST/Auth/RPC
 * call. Uses ONLY the publishable/anon key (BuildConfig.SUPABASE_ANON_KEY,
 * sourced from the gitignored `.env` file via the existing secrets-gradle
 * plugin) — never a service_role/secret key. Per-request Authorization
 * (Bearer <user JWT>) is supplied by callers via header maps, not baked in
 * here, since it changes with the logged-in session.
 *
 * Logging is deliberately BASIC (method/URL/status/timing only), never BODY,
 * so request/response payloads containing tokens or answers are never
 * written to Logcat.
 */
object SupabaseClientProvider {

    val baseUrl: String
        get() = BuildConfig.SUPABASE_URL.trimEnd('/') + "/"

    val anonKey: String
        get() = BuildConfig.SUPABASE_ANON_KEY

    /** Standard headers for an authenticated learner call. */
    fun authHeaders(accessToken: String): Map<String, String> = mapOf(
        "apikey" to anonKey,
        "Authorization" to "Bearer $accessToken"
    )

    /** Headers for the one call made before any session exists (login). */
    fun anonHeaders(): Map<String, String> = mapOf(
        "apikey" to anonKey
    )

    private val loggingInterceptor = HttpLoggingInterceptor().apply {
        level = if (BuildConfig.DEBUG) {
            HttpLoggingInterceptor.Level.BASIC
        } else {
            HttpLoggingInterceptor.Level.NONE
        }
    }

    private val okHttpClient: OkHttpClient by lazy {
        OkHttpClient.Builder()
            .addInterceptor(loggingInterceptor)
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(20, TimeUnit.SECONDS)
            .writeTimeout(20, TimeUnit.SECONDS)
            .build()
    }

    private val moshi: Moshi by lazy {
        Moshi.Builder()
            .add(KotlinJsonAdapterFactory())
            .build()
    }

    val api: SupabaseApi by lazy {
        Retrofit.Builder()
            .baseUrl(baseUrl)
            .client(okHttpClient)
            .addConverterFactory(MoshiConverterFactory.create(moshi))
            .build()
            .create(SupabaseApi::class.java)
    }
}
