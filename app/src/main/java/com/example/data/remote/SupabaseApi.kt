package com.example.data.remote

import com.example.data.remote.dto.AuthTokenResponse
import com.example.data.remote.dto.CourseAssignmentDto
import com.example.data.remote.dto.EmployeeDto
import com.example.data.remote.dto.LessonDto
import com.example.data.remote.dto.LessonProgressDto
import com.example.data.remote.dto.LessonProgressUpsertDto
import com.example.data.remote.dto.ModuleDto
import com.example.data.remote.dto.QuizAttemptDto
import com.example.data.remote.dto.QuizDto
import com.example.data.remote.dto.QuizQuestionRowDto
import com.example.data.remote.dto.QuizSubmitRequestDto
import com.example.data.remote.dto.QuizSubmitResponseDto
import com.example.data.remote.dto.RpcCourseIdBody
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.HeaderMap
import retrofit2.http.Headers
import retrofit2.http.POST
import retrofit2.http.Query

/**
 * Thin Retrofit interface over the SAME Supabase REST/Auth/RPC endpoints the
 * React learner app calls via @supabase/supabase-js. No new backend surface
 * is introduced here — every path below already exists and is already used
 * by src/lib/supabase.ts.
 *
 * Auth (login) intentionally does NOT go through [authHeaders] — it has no
 * session yet, only the anon apikey. Every other call is learner-scoped by
 * RLS using the caller's own Bearer session token; no employee_id supplied
 * by these calls is ever trusted for authorization by the backend.
 */
interface SupabaseApi {

    // ------------------------------------------------------------------
    // Auth
    // ------------------------------------------------------------------

    @Headers("Content-Type: application/json")
    @POST("auth/v1/token?grant_type=password")
    suspend fun signInWithPassword(
        @HeaderMap headers: Map<String, String>,
        @Body body: Map<String, String>
    ): Response<AuthTokenResponse>

    // ------------------------------------------------------------------
    // Employee resolution — RLS: "Employees can view own employee record"
    // ------------------------------------------------------------------

    @GET("rest/v1/employees")
    suspend fun getEmployeeByAuthUserId(
        @HeaderMap headers: Map<String, String>,
        @Query("select") select: String =
            "id,employee_id,full_name,email,role_id,location_id,employment_status,skillup_access,auth_user_id,roles(name),locations(city,name)",
        @Query("auth_user_id") authUserIdEq: String,
        @Query("limit") limit: Int = 1
    ): Response<List<EmployeeDto>>

    // ------------------------------------------------------------------
    // Assigned courses — RLS: own non-REVOKED assignments, PUBLISHED courses
    // ------------------------------------------------------------------

    @GET("rest/v1/course_assignments")
    suspend fun getMyCourseAssignments(
        @HeaderMap headers: Map<String, String>,
        @Query("select") select: String =
            "id,employee_id,course_id,status,assigned_at,deadline,courses(id,title,description,category,difficulty,estimated_duration_minutes,thumbnail_url,status)",
        @Query("employee_id") employeeIdEq: String,
        @Query("status") statusNeq: String = "neq.REVOKED"
    ): Response<List<CourseAssignmentDto>>

    // ------------------------------------------------------------------
    // Curriculum — modules/lessons/quizzes for one assigned course
    // ------------------------------------------------------------------

    @GET("rest/v1/modules")
    suspend fun getModulesForCourse(
        @HeaderMap headers: Map<String, String>,
        @Query("select") select: String = "id,course_id,title,description,sequence",
        @Query("course_id") courseIdEq: String,
        @Query("order") order: String = "sequence.asc"
    ): Response<List<ModuleDto>>

    @GET("rest/v1/lessons")
    suspend fun getLessonsForModules(
        @HeaderMap headers: Map<String, String>,
        @Query("select") select: String =
            "id,module_id,title,lesson_type,content_url,content_text,duration_seconds,sequence,is_required",
        @Query(value = "module_id", encoded = true) moduleIdIn: String,
        @Query("order") order: String = "sequence.asc"
    ): Response<List<LessonDto>>

    @GET("rest/v1/quizzes")
    suspend fun getQuizzesForLessons(
        @HeaderMap headers: Map<String, String>,
        @Query("select") select: String = "id,lesson_id,title,passing_score,attempts_allowed",
        @Query(value = "lesson_id", encoded = true) lessonIdIn: String
    ): Response<List<QuizDto>>

    // ------------------------------------------------------------------
    // Lesson progress — RLS: learner can view/create/update own rows only
    // ------------------------------------------------------------------

    @GET("rest/v1/lesson_progress")
    suspend fun getMyLessonProgress(
        @HeaderMap headers: Map<String, String>,
        @Query("select") select: String = "lesson_id,status",
        @Query("employee_id") employeeIdEq: String,
        @Query(value = "lesson_id", encoded = true) lessonIdIn: String
    ): Response<List<LessonProgressDto>>

    @Headers("Content-Type: application/json", "Prefer: resolution=merge-duplicates")
    @POST("rest/v1/lesson_progress?on_conflict=employee_id,lesson_id")
    suspend fun upsertLessonProgress(
        @HeaderMap headers: Map<String, String>,
        @Body body: List<LessonProgressUpsertDto>
    ): Response<Void>

    // ------------------------------------------------------------------
    // Quiz attempts — RLS: "Employees can view own quiz attempts" (SELECT).
    // Read-only lookup of whether this learner already has a passed attempt
    // for a quiz — the durable, server-backed source of truth for
    // completion, surviving app restarts (unlike any in-memory cache).
    // ------------------------------------------------------------------

    @GET("rest/v1/quiz_attempts")
    suspend fun getMyQuizAttempts(
        @HeaderMap headers: Map<String, String>,
        @Query("select") select: String = "quiz_id,passed",
        @Query("employee_id") employeeIdEq: String,
        @Query(value = "quiz_id", encoded = true) quizIdIn: String
    ): Response<List<QuizAttemptDto>>

    // ------------------------------------------------------------------
    // Secure quiz RPCs — never query quiz_options directly (no learner
    // SELECT policy exists on it; is_correct must never reach this app).
    // ------------------------------------------------------------------

    @Headers("Content-Type: application/json")
    @POST("rest/v1/rpc/learner_get_course_quiz_questions")
    suspend fun getCourseQuizQuestions(
        @HeaderMap headers: Map<String, String>,
        @Body body: RpcCourseIdBody
    ): Response<List<QuizQuestionRowDto>>

    @Headers("Content-Type: application/json")
    @POST("rest/v1/rpc/learner_submit_quiz_attempt")
    suspend fun submitQuizAttempt(
        @HeaderMap headers: Map<String, String>,
        @Body body: QuizSubmitRequestDto
    ): Response<QuizSubmitResponseDto>
}
