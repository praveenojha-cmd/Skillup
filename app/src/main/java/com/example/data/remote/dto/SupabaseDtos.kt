package com.example.data.remote.dto

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

// ============================================================================
// Auth (POST /auth/v1/token?grant_type=password)
// ============================================================================

@JsonClass(generateAdapter = true)
data class AuthTokenResponse(
    @Json(name = "access_token") val accessToken: String?,
    @Json(name = "refresh_token") val refreshToken: String?,
    @Json(name = "expires_in") val expiresIn: Long?,
    @Json(name = "token_type") val tokenType: String?,
    @Json(name = "user") val user: AuthUserDto?
)

@JsonClass(generateAdapter = true)
data class AuthUserDto(
    @Json(name = "id") val id: String,
    @Json(name = "email") val email: String?
)

@JsonClass(generateAdapter = true)
data class AuthErrorResponse(
    @Json(name = "error") val error: String? = null,
    @Json(name = "error_description") val errorDescription: String? = null,
    @Json(name = "msg") val msg: String? = null,
    @Json(name = "message") val message: String? = null
)

// ============================================================================
// public.employees (+ joined roles/locations for display only)
// ============================================================================

@JsonClass(generateAdapter = true)
data class RoleRefDto(
    @Json(name = "name") val name: String?
)

@JsonClass(generateAdapter = true)
data class LocationRefDto(
    @Json(name = "city") val city: String?,
    @Json(name = "name") val name: String?
)

@JsonClass(generateAdapter = true)
data class EmployeeDto(
    @Json(name = "id") val id: String,
    @Json(name = "employee_id") val employeeId: String?,
    @Json(name = "full_name") val fullName: String?,
    @Json(name = "email") val email: String?,
    @Json(name = "role_id") val roleId: String?,
    @Json(name = "location_id") val locationId: String?,
    @Json(name = "employment_status") val employmentStatus: String?,
    @Json(name = "skillup_access") val skillupAccess: String?,
    @Json(name = "auth_user_id") val authUserId: String?,
    @Json(name = "roles") val role: RoleRefDto?,
    @Json(name = "locations") val location: LocationRefDto?
)

// ============================================================================
// public.courses / public.course_assignments
// ============================================================================

@JsonClass(generateAdapter = true)
data class CourseDto(
    @Json(name = "id") val id: String,
    @Json(name = "title") val title: String,
    @Json(name = "description") val description: String?,
    @Json(name = "category") val category: String?,
    @Json(name = "difficulty") val difficulty: String?,
    @Json(name = "estimated_duration_minutes") val estimatedDurationMinutes: Int?,
    @Json(name = "thumbnail_url") val thumbnailUrl: String?,
    @Json(name = "status") val status: String?
)

@JsonClass(generateAdapter = true)
data class CourseAssignmentDto(
    @Json(name = "id") val id: String,
    @Json(name = "employee_id") val employeeId: String,
    @Json(name = "course_id") val courseId: String,
    @Json(name = "status") val status: String?,
    @Json(name = "assigned_at") val assignedAt: String?,
    @Json(name = "deadline") val deadline: String?,
    @Json(name = "courses") val course: CourseDto?
)

// ============================================================================
// public.modules / public.lessons / public.quizzes
// ============================================================================

@JsonClass(generateAdapter = true)
data class ModuleDto(
    @Json(name = "id") val id: String,
    @Json(name = "course_id") val courseId: String,
    @Json(name = "title") val title: String,
    @Json(name = "description") val description: String?,
    @Json(name = "sequence") val sequence: Int?
)

@JsonClass(generateAdapter = true)
data class LessonDto(
    @Json(name = "id") val id: String,
    @Json(name = "module_id") val moduleId: String,
    @Json(name = "title") val title: String,
    @Json(name = "lesson_type") val lessonType: String?,
    @Json(name = "content_url") val contentUrl: String?,
    @Json(name = "content_text") val contentText: String?,
    @Json(name = "duration_seconds") val durationSeconds: Int?,
    @Json(name = "sequence") val sequence: Int?,
    @Json(name = "is_required") val isRequired: Boolean?
)

@JsonClass(generateAdapter = true)
data class QuizDto(
    @Json(name = "id") val id: String,
    @Json(name = "lesson_id") val lessonId: String,
    @Json(name = "title") val title: String?,
    @Json(name = "passing_score") val passingScore: Double?,
    @Json(name = "attempts_allowed") val attemptsAllowed: Int?
)

// ============================================================================
// public.lesson_progress (learner-owned read/insert/update only)
// ============================================================================

@JsonClass(generateAdapter = true)
data class LessonProgressUpsertDto(
    @Json(name = "employee_id") val employeeId: String,
    @Json(name = "lesson_id") val lessonId: String,
    @Json(name = "status") val status: String,
    @Json(name = "started_at") val startedAt: String,
    @Json(name = "completed_at") val completedAt: String?,
    @Json(name = "updated_at") val updatedAt: String
)

@JsonClass(generateAdapter = true)
data class LessonProgressDto(
    @Json(name = "lesson_id") val lessonId: String,
    @Json(name = "status") val status: String?
)

// ============================================================================
// public.quiz_attempts (learner-owned SELECT only — "Employees can view own
// quiz attempts"). Read here purely to determine pass/fail durably from the
// server, since quiz_attempts rows already persist that — no new table/
// column, this just queries what learner_submit_quiz_attempt already wrote.
// ============================================================================

@JsonClass(generateAdapter = true)
data class QuizAttemptDto(
    @Json(name = "quiz_id") val quizId: String,
    @Json(name = "passed") val passed: Boolean?,
    // score already stores the 0-100 percentage (see learner_submit_quiz_attempt).
    @Json(name = "score") val score: Int?
)

// ============================================================================
// public.course_completions (learner-owned SELECT only). Written exactly
// once per (employee_id, course_id) by learner_submit_quiz_attempt at the
// moment a course is actually completed — the authoritative source for the
// course's completion date, distinct from any individual quiz attempt's
// completed_at.
// ============================================================================

@JsonClass(generateAdapter = true)
data class CourseCompletionDto(
    @Json(name = "course_id") val courseId: String,
    @Json(name = "completed_at") val completedAt: String?
)

// ============================================================================
// learner_get_course_quiz_questions RPC — flat row shape, grouped client-side.
// Deliberately has NO is_correct field: the RPC never returns one.
// ============================================================================

@JsonClass(generateAdapter = true)
data class RpcCourseIdBody(
    @Json(name = "p_course_id") val courseId: String
)

@JsonClass(generateAdapter = true)
data class QuizQuestionRowDto(
    @Json(name = "quiz_id") val quizId: String,
    @Json(name = "question_id") val questionId: String,
    @Json(name = "question_text") val questionText: String,
    @Json(name = "question_sequence") val questionSequence: Int?,
    @Json(name = "option_id") val optionId: String,
    @Json(name = "option_text") val optionText: String,
    @Json(name = "option_sequence") val optionSequence: Int?
)

// ============================================================================
// learner_submit_quiz_attempt RPC
// ============================================================================

@JsonClass(generateAdapter = true)
data class QuizSubmitRequestDto(
    @Json(name = "p_quiz_id") val quizId: String,
    @Json(name = "p_course_id") val courseId: String,
    @Json(name = "p_assignment_id") val assignmentId: String,
    @Json(name = "p_answers") val answers: Map<String, Any>
)

@JsonClass(generateAdapter = true)
data class QuizFeedbackItemDto(
    @Json(name = "questionId") val questionId: String,
    @Json(name = "questionText") val questionText: String?,
    @Json(name = "isCorrect") val isCorrect: Boolean,
    @Json(name = "pointsAwarded") val pointsAwarded: Int?,
    @Json(name = "explanation") val explanation: String?
)

@JsonClass(generateAdapter = true)
data class QuizSubmitResponseDto(
    @Json(name = "attemptId") val attemptId: String?,
    @Json(name = "score") val score: Int,
    @Json(name = "maxScore") val maxScore: Int,
    @Json(name = "percentage") val percentage: Int,
    @Json(name = "passed") val passed: Boolean,
    @Json(name = "passingScore") val passingScore: Double?,
    @Json(name = "attemptNumber") val attemptNumber: Int?,
    @Json(name = "courseProgressUpdated") val courseProgressUpdated: Int?,
    @Json(name = "isCourseCompleted") val isCourseCompleted: Boolean?,
    @Json(name = "feedback") val feedback: List<QuizFeedbackItemDto>?
)
