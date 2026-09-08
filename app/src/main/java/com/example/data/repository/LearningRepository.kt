package com.example.data.repository

import android.content.Context
import com.example.data.local.SessionStore
import com.example.data.model.Course
import com.example.data.model.CourseModule
import com.example.data.model.CourseStatus
import com.example.data.model.DocumentSection
import com.example.data.model.Employee
import com.example.data.model.Lesson
import com.example.data.model.LessonContentType
import com.example.data.model.ModuleStatus
import com.example.data.model.Quiz
import com.example.data.model.QuizAttempt
import com.example.data.model.QuizOption
import com.example.data.model.QuizQuestion
import com.example.data.remote.SupabaseApi
import com.example.data.remote.SupabaseClientProvider
import com.example.data.remote.dto.AuthErrorResponse
import com.example.data.remote.dto.CourseAssignmentDto
import com.example.data.remote.dto.LessonDto
import com.example.data.remote.dto.LessonProgressUpsertDto
import com.example.data.remote.dto.QuizQuestionRowDto
import com.example.data.remote.dto.QuizSubmitRequestDto
import com.example.data.remote.dto.RpcCourseIdBody
import com.squareup.moshi.Moshi
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.withContext
import java.text.SimpleDateFormat
import java.util.Locale
import java.util.TimeZone
import retrofit2.Response

/**
 * Result wrapper the ViewModel uses to distinguish success from a real,
 * user-facing failure — callers must NEVER fall back to demo/hardcoded data
 * when this is a Failure.
 */
sealed class RepoResult<out T> {
    data class Success<T>(val data: T) : RepoResult<T>()
    data class Failure(val message: String, val cause: Throwable? = null) : RepoResult<Nothing>()
}

/**
 * Real Supabase-backed learning data layer. Replaces the previous
 * hardcoded/demo implementation entirely — there is no static fallback data
 * anywhere in this file. A backend/network failure is always surfaced as a
 * [RepoResult.Failure], never silently swapped for fake courses/questions.
 */
class LearningRepository private constructor(appContext: Context) {

    private val sessionStore = SessionStore(appContext)
    private val api: SupabaseApi = SupabaseClientProvider.api
    private val moshi: Moshi = Moshi.Builder().add(KotlinJsonAdapterFactory()).build()

    private val _currentUser = MutableStateFlow<Employee?>(null)
    val currentUser: StateFlow<Employee?> = _currentUser.asStateFlow()

    private val _courses = MutableStateFlow<List<Course>>(emptyList())
    val courses: StateFlow<List<Course>> = _courses.asStateFlow()

    private val _quizAttempts = MutableStateFlow<Map<String, QuizAttempt>>(emptyMap())
    val quizAttempts: StateFlow<Map<String, QuizAttempt>> = _quizAttempts.asStateFlow()

    // course_assignments.id for the currently-loaded courses, needed by the
    // quiz submission RPC (p_assignment_id) but not part of the UI-facing
    // Course model — kept internally, keyed by course id.
    private val assignmentIdByCourseId = mutableMapOf<String, String>()

    private var accessToken: String? = null

    // ------------------------------------------------------------------
    // Session
    // ------------------------------------------------------------------

    /** Attempts to restore a previously stored session on app launch. */
    suspend fun tryRestoreSession(): Boolean = withContext(Dispatchers.IO) {
        val stored = sessionStore.load() ?: return@withContext false
        accessToken = stored.accessToken
        val resolved = resolveEmployeeAndCourses(stored.authUserId)
        if (resolved is RepoResult.Failure) {
            // Stored token is no longer valid (expired/revoked) — clear it
            // and require a fresh login rather than looping on a bad token.
            accessToken = null
            sessionStore.clear()
            false
        } else {
            true
        }
    }

    suspend fun login(email: String, password: String): RepoResult<Unit> = withContext(Dispatchers.IO) {
        val trimmedEmail = email.trim()
        if (trimmedEmail.isEmpty() || password.isEmpty()) {
            return@withContext RepoResult.Failure("Please enter both email and password.")
        }
        try {
            val response = api.signInWithPassword(
                headers = SupabaseClientProvider.anonHeaders(),
                body = mapOf("email" to trimmedEmail, "password" to password)
            )
            if (!response.isSuccessful || response.body()?.accessToken == null) {
                return@withContext RepoResult.Failure(authErrorMessage(response))
            }
            val body = response.body()!!
            val authUserId = body.user?.id
                ?: return@withContext RepoResult.Failure("Login succeeded but no user identity was returned.")

            accessToken = body.accessToken
            val resolved = resolveEmployeeAndCourses(authUserId)
            if (resolved is RepoResult.Failure) {
                accessToken = null
                return@withContext resolved
            }

            sessionStore.save(body.accessToken!!, body.refreshToken, authUserId)
            RepoResult.Success(Unit)
        } catch (e: Exception) {
            RepoResult.Failure("Network error while signing in: ${e.message ?: "please try again."}", e)
        }
    }

    fun logout() {
        accessToken = null
        sessionStore.clear()
        _currentUser.value = null
        _courses.value = emptyList()
        _quizAttempts.value = emptyMap()
        assignmentIdByCourseId.clear()
    }

    /** Resolves the employees row for this auth user, then loads assigned courses. */
    private suspend fun resolveEmployeeAndCourses(authUserId: String): RepoResult<Unit> {
        val token = accessToken ?: return RepoResult.Failure("Not signed in.")
        val headers = SupabaseClientProvider.authHeaders(token)

        val empResponse = try {
            api.getEmployeeByAuthUserId(headers = headers, authUserIdEq = "eq.$authUserId")
        } catch (e: Exception) {
            return RepoResult.Failure("Network error while loading your profile: ${e.message ?: "please try again."}", e)
        }
        if (!empResponse.isSuccessful) {
            return RepoResult.Failure(restErrorMessage(empResponse, "load your employee profile"))
        }
        val dto = empResponse.body()?.firstOrNull()
            ?: return RepoResult.Failure("No employee profile is linked to this account. Contact your administrator.")

        if (dto.employmentStatus != "ACTIVE") {
            return RepoResult.Failure("Your employee profile is currently marked as INACTIVE. Learning portal access is unavailable.")
        }
        if (dto.skillupAccess != "ENABLED") {
            return RepoResult.Failure("Your SkillUp learning access is currently disabled. Please contact your administrator.")
        }

        val employee = Employee(
            id = dto.id,
            name = dto.fullName ?: dto.email ?: "SkillUp Learner",
            employeeCode = dto.employeeId ?: dto.id,
            role = dto.role?.name ?: "Unassigned",
            department = dto.role?.name ?: "—",
            location = dto.location?.city ?: dto.location?.name ?: "—",
            coursesAssignedCount = 0,
            coursesCompletedCount = 0,
            inProgressCount = 0,
            avgScorePercentage = 0
        )
        _currentUser.value = employee

        return loadAssignedCourses(dto.id, token)
    }

    // ------------------------------------------------------------------
    // Assigned courses (course_assignments + courses)
    // ------------------------------------------------------------------

    /** Re-fetches the learner's assigned courses. Safe to call any time (e.g. pull-to-refresh). */
    suspend fun refreshCourses(): RepoResult<Unit> = withContext(Dispatchers.IO) {
        val employeeId = _currentUser.value?.id ?: return@withContext RepoResult.Failure("Not signed in.")
        val token = accessToken ?: return@withContext RepoResult.Failure("Not signed in.")
        loadAssignedCourses(employeeId, token)
    }

    private suspend fun loadAssignedCourses(employeeId: String, token: String): RepoResult<Unit> {
        val headers = SupabaseClientProvider.authHeaders(token)
        val response = try {
            api.getMyCourseAssignments(headers = headers, employeeIdEq = "eq.$employeeId")
        } catch (e: Exception) {
            return RepoResult.Failure("Network error while loading your courses: ${e.message ?: "please try again."}", e)
        }
        if (!response.isSuccessful) {
            return RepoResult.Failure(restErrorMessage(response, "load your assigned courses"))
        }

        val assignments = response.body().orEmpty()
        assignmentIdByCourseId.clear()
        val mapped = assignments.mapNotNull { assignment -> toCourse(assignment) }
        _courses.value = mapped

        val completed = mapped.count { it.status == CourseStatus.COMPLETED }
        val inProgress = mapped.count { it.status == CourseStatus.IN_PROGRESS }
        _currentUser.update { it?.copy(
            coursesAssignedCount = mapped.size,
            coursesCompletedCount = completed,
            inProgressCount = inProgress
        ) }

        return RepoResult.Success(Unit)
    }

    private fun toCourse(assignment: CourseAssignmentDto): Course? {
        val c = assignment.course ?: return null
        assignmentIdByCourseId[c.id] = assignment.id
        val status = when (assignment.status) {
            "COMPLETED" -> CourseStatus.COMPLETED
            "IN_PROGRESS" -> CourseStatus.IN_PROGRESS
            else -> CourseStatus.ASSIGNED
        }
        return Course(
            id = c.id,
            title = c.title,
            shortDescription = c.description.orEmpty(),
            fullDescription = c.description.orEmpty(),
            category = c.category ?: "General",
            level = c.difficulty ?: "Intermediate",
            moduleCount = 0,
            durationMinutes = c.estimatedDurationMinutes ?: 0,
            completionPercentage = if (status == CourseStatus.COMPLETED) 100 else 0,
            status = status,
            modules = emptyList()
        )
    }

    // ------------------------------------------------------------------
    // Course curriculum (modules -> lessons -> quiz linkage)
    // ------------------------------------------------------------------

    /**
     * Loads the real module/lesson tree for one already-assigned course and
     * merges it into the in-memory [courses] list. Returns the updated
     * [Course] on success.
     */
    suspend fun loadCourseCurriculum(courseId: String): RepoResult<Course> = withContext(Dispatchers.IO) {
        val token = accessToken ?: return@withContext RepoResult.Failure("Not signed in.")
        val employeeId = _currentUser.value?.id ?: return@withContext RepoResult.Failure("Not signed in.")
        val headers = SupabaseClientProvider.authHeaders(token)
        val existing = _courses.value.find { it.id == courseId }
            ?: return@withContext RepoResult.Failure("This course is not in your assigned list.")

        try {
            val modulesResp = api.getModulesForCourse(headers = headers, courseIdEq = "eq.$courseId")
            if (!modulesResp.isSuccessful) return@withContext RepoResult.Failure(restErrorMessage(modulesResp, "load course modules"))
            val moduleDtos = modulesResp.body().orEmpty().sortedBy { it.sequence ?: 0 }
            if (moduleDtos.isEmpty()) {
                val empty = existing.copy(modules = emptyList(), moduleCount = 0)
                replaceCourse(empty)
                return@withContext RepoResult.Success(empty)
            }

            val moduleIdsIn = "in.(${moduleDtos.joinToString(",") { it.id }})"
            val lessonsResp = api.getLessonsForModules(headers = headers, moduleIdIn = moduleIdsIn)
            if (!lessonsResp.isSuccessful) return@withContext RepoResult.Failure(restErrorMessage(lessonsResp, "load course lessons"))
            val lessonDtos = lessonsResp.body().orEmpty().sortedBy { it.sequence ?: 0 }

            var quizByLessonId: Map<String, com.example.data.remote.dto.QuizDto> = emptyMap()
            if (lessonDtos.isNotEmpty()) {
                val lessonIdsIn = "in.(${lessonDtos.joinToString(",") { it.id }})"
                val quizzesResp = api.getQuizzesForLessons(headers = headers, lessonIdIn = lessonIdsIn)
                if (quizzesResp.isSuccessful) {
                    quizByLessonId = quizzesResp.body().orEmpty().associateBy { it.lessonId }
                }
            }

            val progressByLessonId: Map<String, String> = if (lessonDtos.isNotEmpty()) {
                val lessonIdsIn = "in.(${lessonDtos.joinToString(",") { it.id }})"
                val progressResp = api.getMyLessonProgress(headers = headers, employeeIdEq = "eq.$employeeId", lessonIdIn = lessonIdsIn)
                if (progressResp.isSuccessful) {
                    progressResp.body().orEmpty().associate { it.lessonId to (it.status ?: "") }
                } else emptyMap()
            } else emptyMap()

            val lessonsByModule = lessonDtos.groupBy { it.moduleId }
            var foundCurrent = false
            val courseModules = moduleDtos.mapIndexed { index, m ->
                val lessonDto = lessonsByModule[m.id]?.firstOrNull()
                val quizDto = lessonDto?.let { quizByLessonId[it.id] }
                val isCompleted = lessonDto != null && progressByLessonId[lessonDto.id] == "COMPLETED"
                val moduleStatus = when {
                    isCompleted -> ModuleStatus.COMPLETED
                    !foundCurrent -> { foundCurrent = true; ModuleStatus.CURRENT }
                    else -> ModuleStatus.LOCKED
                }
                buildModule(m, lessonDto, quizDto, moduleStatus, index + 1, moduleDtos.size)
            }

            val completedCount = courseModules.count { it.status == ModuleStatus.COMPLETED }
            val newPercentage = if (courseModules.isNotEmpty()) (completedCount * 100) / courseModules.size else 0
            val newStatus = when {
                completedCount == courseModules.size && courseModules.isNotEmpty() -> CourseStatus.COMPLETED
                completedCount > 0 -> CourseStatus.IN_PROGRESS
                else -> existing.status
            }

            val updated = existing.copy(
                modules = courseModules,
                moduleCount = courseModules.size,
                completionPercentage = newPercentage,
                status = newStatus
            )
            replaceCourse(updated)
            RepoResult.Success(updated)
        } catch (e: Exception) {
            RepoResult.Failure("Network error while loading this course: ${e.message ?: "please try again."}", e)
        }
    }

    private fun buildModule(
        m: com.example.data.remote.dto.ModuleDto,
        lessonDto: LessonDto?,
        quizDto: com.example.data.remote.dto.QuizDto?,
        status: ModuleStatus,
        moduleOrder: Int,
        totalModules: Int
    ): CourseModule {
        val contentType = lessonContentType(lessonDto?.lessonType, quizDto != null)
        val lesson = lessonDto?.let {
            Lesson(
                id = it.id,
                moduleId = m.id,
                courseId = m.courseId,
                title = it.title,
                moduleOrder = moduleOrder,
                totalModules = totalModules,
                type = contentType,
                durationMinutes = (it.durationSeconds ?: 0) / 60,
                overview = m.description.orEmpty(),
                learningObjectives = emptyList(),
                keyTakeaways = emptyList(),
                videoTitle = if (contentType == LessonContentType.VIDEO) it.title else null,
                videoAuthor = null,
                videoUrl = if (contentType == LessonContentType.VIDEO && !it.contentUrl.isNullOrBlank()) {
                    it.contentUrl
                } else null,
                documentPagesCount = 1,
                documentSections = if (contentType == LessonContentType.PDF && !it.contentText.isNullOrBlank()) {
                    listOf(DocumentSection(title = it.title, content = it.contentText, policyRef = null))
                } else emptyList(),
                articleParagraphs = if (contentType == LessonContentType.TEXT && !it.contentText.isNullOrBlank()) {
                    listOf(it.contentText)
                } else emptyList()
            )
        }

        val quiz = quizDto?.let {
            Quiz(
                id = it.id,
                courseId = m.courseId,
                courseTitle = "",
                title = it.title ?: "Assessment",
                description = "",
                totalQuestions = 0,
                passingScorePercentage = (it.passingScore ?: 70.0).toInt(),
                questions = emptyList() // loaded on-demand via loadQuiz()
            )
        }

        return CourseModule(
            id = m.id,
            courseId = m.courseId,
            orderIndex = m.sequence ?: moduleOrder,
            title = m.title,
            subtitle = m.description ?: (if (quiz != null) "Assessment" else ""),
            durationMinutes = lesson?.durationMinutes ?: 0,
            type = contentType,
            status = status,
            lesson = if (quiz == null) lesson else null,
            quiz = quiz
        )
    }

    private fun lessonContentType(lessonType: String?, hasQuiz: Boolean): LessonContentType = when {
        hasQuiz -> LessonContentType.QUIZ
        lessonType.equals("VIDEO", ignoreCase = true) -> LessonContentType.VIDEO
        lessonType.equals("PDF", ignoreCase = true) -> LessonContentType.PDF
        else -> LessonContentType.TEXT
    }

    private fun replaceCourse(updated: Course) {
        _courses.update { list -> list.map { if (it.id == updated.id) updated else it } }
    }

    fun getCourse(courseId: String): Course? = _courses.value.find { it.id == courseId }

    // ------------------------------------------------------------------
    // Non-quiz lesson completion (public.lesson_progress only — there is no
    // confirmed learner WRITE policy on course_assignments, so its status is
    // intentionally left to the quiz-submission RPC, per the verified access
    // model. completionPercentage below is a LOCAL DISPLAY estimate only,
    // never persisted as authoritative — the same limitation applies here as
    // to the previous demo build, just now grounded in real lesson_progress
    // rows instead of fake data.)
    // ------------------------------------------------------------------

    suspend fun markModuleComplete(courseId: String, moduleId: String): RepoResult<Course> = withContext(Dispatchers.IO) {
        val token = accessToken ?: return@withContext RepoResult.Failure("Not signed in.")
        val employeeId = _currentUser.value?.id ?: return@withContext RepoResult.Failure("Not signed in.")
        val course = getCourse(courseId) ?: return@withContext RepoResult.Failure("Course not found.")
        val module = course.modules.find { it.id == moduleId }
            ?: return@withContext RepoResult.Failure("Module not found.")
        val lesson = module.lesson ?: return@withContext RepoResult.Failure("This module has no lesson to complete.")

        try {
            val now = nowIso()
            val headers = SupabaseClientProvider.authHeaders(token)
            val upsertResp = api.upsertLessonProgress(
                headers = headers,
                body = listOf(
                    LessonProgressUpsertDto(
                        employeeId = employeeId,
                        lessonId = lesson.id.toString(),
                        status = "COMPLETED",
                        startedAt = now,
                        completedAt = now,
                        updatedAt = now
                    )
                )
            )
            if (!upsertResp.isSuccessful) {
                return@withContext RepoResult.Failure(restErrorMessage(upsertResp, "save your lesson progress"))
            }

            // Reflect completion locally (module/course progress) — this is
            // a display estimate; see class-level note above.
            var foundCompleted = false
            val updatedModules = course.modules.map { m ->
                if (m.id == moduleId) {
                    foundCompleted = true
                    m.copy(status = ModuleStatus.COMPLETED)
                } else if (foundCompleted && m.status == ModuleStatus.LOCKED) {
                    foundCompleted = false
                    m.copy(status = ModuleStatus.CURRENT)
                } else m
            }
            val completedCount = updatedModules.count { it.status == ModuleStatus.COMPLETED }
            val newPercentage = if (updatedModules.isNotEmpty()) (completedCount * 100) / updatedModules.size else 0
            val newStatus = when {
                completedCount == updatedModules.size -> CourseStatus.COMPLETED
                completedCount > 0 -> CourseStatus.IN_PROGRESS
                else -> CourseStatus.ASSIGNED
            }
            val updatedCourse = course.copy(
                modules = updatedModules,
                completionPercentage = newPercentage,
                status = newStatus
            )
            replaceCourse(updatedCourse)
            RepoResult.Success(updatedCourse)
        } catch (e: Exception) {
            RepoResult.Failure("Network error while saving your progress: ${e.message ?: "please try again."}", e)
        }
    }

    // ------------------------------------------------------------------
    // Quiz — questions loaded via the secure RPC (never quiz_options directly)
    // ------------------------------------------------------------------

    suspend fun loadQuizForCourse(courseId: String, quizId: String): RepoResult<Quiz> = withContext(Dispatchers.IO) {
        val token = accessToken ?: return@withContext RepoResult.Failure("Not signed in.")
        val course = getCourse(courseId) ?: return@withContext RepoResult.Failure("Course not found.")
        val quizStub = course.modules.firstNotNullOfOrNull { it.quiz?.takeIf { q -> q.id == quizId } }
            ?: return@withContext RepoResult.Failure("Quiz not found in this course.")

        try {
            val headers = SupabaseClientProvider.authHeaders(token)
            val response = api.getCourseQuizQuestions(headers = headers, body = RpcCourseIdBody(courseId = courseId))
            if (!response.isSuccessful) {
                return@withContext RepoResult.Failure(rpcErrorMessage(response, "load quiz questions"))
            }
            val rows: List<QuizQuestionRowDto> = response.body().orEmpty().filter { it.quizId == quizId }
            if (rows.isEmpty()) {
                return@withContext RepoResult.Failure("This quiz currently has no questions configured.")
            }

            val questions = rows.groupBy { it.questionId }
                .entries
                .sortedBy { it.value.first().questionSequence ?: 0 }
                .mapIndexed { idx, (questionId, optionRows) ->
                    val first = optionRows.first()
                    QuizQuestion(
                        id = questionId,
                        questionNumber = idx + 1,
                        questionText = first.questionText,
                        options = optionRows
                            .sortedBy { it.optionSequence ?: 0 }
                            .mapIndexed { optIdx, row ->
                                QuizOption(
                                    id = row.optionId,
                                    label = ('A' + optIdx).toString(),
                                    text = row.optionText
                                )
                            },
                        // The learner-safe RPC never returns is_correct — this
                        // is intentionally left blank; the server, not this
                        // app, is authoritative on correctness (see
                        // submitQuiz()). No UI in this app should ever read
                        // this field to grade an answer locally.
                        correctOptionId = "",
                        explanation = ""
                    )
                }

            RepoResult.Success(quizStub.copy(totalQuestions = questions.size, questions = questions))
        } catch (e: Exception) {
            RepoResult.Failure("Network error while loading the quiz: ${e.message ?: "please try again."}", e)
        }
    }

    /**
     * Submits answers to the server-authoritative RPC. [answers] maps
     * questionId -> selected optionId (single-select, matching the current
     * Android QuizScreen model). Android performs NO local scoring.
     */
    suspend fun submitQuizAttempt(
        courseId: String,
        quizId: String,
        answers: Map<String, String>
    ): RepoResult<QuizAttempt> = withContext(Dispatchers.IO) {
        val token = accessToken ?: return@withContext RepoResult.Failure("Not signed in.")
        val assignmentId = assignmentIdByCourseId[courseId]
            ?: return@withContext RepoResult.Failure("No active assignment found for this course.")

        try {
            val headers = SupabaseClientProvider.authHeaders(token)
            val response = api.submitQuizAttempt(
                headers = headers,
                body = QuizSubmitRequestDto(
                    quizId = quizId,
                    courseId = courseId,
                    assignmentId = assignmentId,
                    answers = answers
                )
            )
            if (!response.isSuccessful || response.body() == null) {
                return@withContext RepoResult.Failure(rpcErrorMessage(response, "submit your quiz"))
            }
            val result = response.body()!!

            val attempt = QuizAttempt(
                quizId = quizId,
                totalQuestions = result.maxScore,
                correctAnswersCount = result.score,
                scorePercentage = result.percentage,
                isPassed = result.passed,
                completedAt = nowIso(),
                answers = answers
            )
            _quizAttempts.update { it + (quizId to attempt) }

            // Reflect the server's authoritative progress/completion in the
            // in-memory course — courseProgressUpdated/isCourseCompleted come
            // directly from the RPC response, never recomputed locally.
            getCourse(courseId)?.let { course ->
                val newStatus = if (result.isCourseCompleted == true) CourseStatus.COMPLETED else CourseStatus.IN_PROGRESS
                replaceCourse(
                    course.copy(
                        completionPercentage = result.courseProgressUpdated ?: course.completionPercentage,
                        status = newStatus
                    )
                )
            }

            RepoResult.Success(attempt)
        } catch (e: Exception) {
            RepoResult.Failure("Network error while submitting your quiz: ${e.message ?: "please try again."}", e)
        }
    }

    fun getQuizAttempt(quizId: String): QuizAttempt? = _quizAttempts.value[quizId]

    // ------------------------------------------------------------------
    // Error message helpers — never leak raw SQL/RPC internals to the UI.
    // ------------------------------------------------------------------

    private fun authErrorMessage(response: Response<*>): String {
        val raw = response.errorBody()?.string()
        val parsed = raw?.let {
            try { moshi.adapter(AuthErrorResponse::class.java).fromJson(it) } catch (_: Exception) { null }
        }
        val detail = parsed?.errorDescription ?: parsed?.msg ?: parsed?.message
        return when (response.code()) {
            400, 401 -> "Invalid email or password."
            else -> detail ?: "Sign-in failed (HTTP ${response.code()}). Please try again."
        }
    }

    private fun restErrorMessage(response: Response<*>, action: String): String = when (response.code()) {
        401 -> "Your session has expired. Please sign in again."
        403 -> "You don't have access to $action."
        404 -> "The requested data could not be found."
        in 500..599 -> "The server is temporarily unavailable. Please try again shortly."
        else -> "Unable to $action (HTTP ${response.code()}). Please try again."
    }

    private fun rpcErrorMessage(response: Response<*>, action: String): String {
        if (response.code() == 401) return "Your session has expired. Please sign in again."
        if (response.code() == 403) {
            val raw = response.errorBody()?.string().orEmpty()
            return when {
                raw.contains("attempt", ignoreCase = true) -> "You have used all allowed attempts for this quiz."
                raw.contains("assignment", ignoreCase = true) -> "You do not have an active assignment for this course."
                raw.contains("active", ignoreCase = true) -> "Your learning access is not currently active."
                else -> "You don't have access to $action."
            }
        }
        return "Unable to $action (HTTP ${response.code()}). Please try again."
    }

    private fun nowIso(): String {
        val fmt = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US)
        fmt.timeZone = TimeZone.getTimeZone("UTC")
        return fmt.format(java.util.Date())
    }

    companion object {
        @Volatile
        private var instance: LearningRepository? = null

        fun getInstance(context: Context): LearningRepository {
            return instance ?: synchronized(this) {
                instance ?: LearningRepository(context.applicationContext).also { instance = it }
            }
        }
    }
}
