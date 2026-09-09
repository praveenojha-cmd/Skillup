package com.example.ui.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.data.model.Certificate
import com.example.data.model.Course
import com.example.data.model.CourseModule
import com.example.data.model.Employee
import com.example.data.model.ModuleStatus
import com.example.data.model.Quiz
import com.example.data.model.QuizAttempt
import com.example.data.repository.LearningRepository
import com.example.data.repository.RepoResult
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

sealed class ScreenDestination {
    object Login : ScreenDestination()
    object Home : ScreenDestination()
    object MyCourses : ScreenDestination()
    object Profile : ScreenDestination()
    data class CourseDetails(val courseId: String) : ScreenDestination()
    data class LessonView(val courseId: String, val moduleId: String) : ScreenDestination()
    data class QuizView(val courseId: String, val quizId: String) : ScreenDestination()
    data class CourseCompletion(val courseId: String, val scorePercentage: Int) : ScreenDestination()
}

enum class CourseTab {
    ASSIGNED,
    IN_PROGRESS,
    COMPLETED
}

data class QuizUiState(
    val quiz: Quiz? = null,
    val currentQuestionIndex: Int = 0,
    val selectedOptionId: String? = null,
    // Whether the current answer has been saved locally and the learner may
    // proceed. This intentionally never claims correct/incorrect — the RPC
    // that returns questions omits is_correct by design, and only the
    // server-authoritative learner_submit_quiz_attempt result may report
    // correctness (see quizAttempt below).
    val isAnswerSubmitted: Boolean = false,
    val userAnswers: Map<String, String> = emptyMap(),
    val quizAttempt: QuizAttempt? = null,
    val isFinished: Boolean = false,
    val isLoading: Boolean = false,
    val isSubmitting: Boolean = false
)

class LearningViewModel(application: Application) : AndroidViewModel(application) {

    private val repository: LearningRepository = LearningRepository.getInstance(application)

    // Current navigation destination
    private val _currentDestination = MutableStateFlow<ScreenDestination>(ScreenDestination.Login)
    val currentDestination: StateFlow<ScreenDestination> = _currentDestination.asStateFlow()

    // Backstack for natural hierarchical navigation
    private val navBackstack = mutableListOf<ScreenDestination>()

    val currentUser: StateFlow<Employee?> = repository.currentUser
    val isLoggedIn: StateFlow<Boolean> = repository.currentUser
        .map { it != null }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), false)

    val allCourses: StateFlow<List<Course>> = repository.courses

    // True while a session-restore / initial data load is in flight — the
    // splash/loading state shown before we know whether to route to Login
    // or Home.
    private val _isRestoringSession = MutableStateFlow(true)
    val isRestoringSession: StateFlow<Boolean> = _isRestoringSession.asStateFlow()

    private val _isLoadingCourses = MutableStateFlow(false)
    val isLoadingCourses: StateFlow<Boolean> = _isLoadingCourses.asStateFlow()

    private val _isLoadingCourseDetail = MutableStateFlow(false)
    val isLoadingCourseDetail: StateFlow<Boolean> = _isLoadingCourseDetail.asStateFlow()

    // Selected Bottom Navigation Tab (0: Home, 1: My Courses, 2: Profile)
    private val _selectedBottomTab = MutableStateFlow(0)
    val selectedBottomTab: StateFlow<Int> = _selectedBottomTab.asStateFlow()

    // Tabs in My Courses screen
    private val _selectedCourseTab = MutableStateFlow(CourseTab.ASSIGNED)
    val selectedCourseTab: StateFlow<CourseTab> = _selectedCourseTab.asStateFlow()

    // Search query for My Courses
    private val _courseSearchQuery = MutableStateFlow("")
    val courseSearchQuery: StateFlow<String> = _courseSearchQuery.asStateFlow()

    // Login Form State — real Supabase Auth email/password, no demo defaults.
    private val _loginEmail = MutableStateFlow("")
    val loginEmail: StateFlow<String> = _loginEmail.asStateFlow()

    private val _loginPassword = MutableStateFlow("")
    val loginPassword: StateFlow<String> = _loginPassword.asStateFlow()

    private val _loginError = MutableStateFlow<String?>(null)
    val loginError: StateFlow<String?> = _loginError.asStateFlow()

    private val _isLoggingIn = MutableStateFlow(false)
    val isLoggingIn: StateFlow<Boolean> = _isLoggingIn.asStateFlow()

    // Currently viewed course
    private val _currentCourseId = MutableStateFlow<String?>(null)
    val currentCourse: StateFlow<Course?> = combine(allCourses, _currentCourseId) { courses, id ->
        courses.find { it.id == id }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), null)

    // Currently viewed lesson
    private val _currentModuleId = MutableStateFlow<String?>(null)
    val currentModule: StateFlow<CourseModule?> = combine(currentCourse, _currentModuleId) { course, modId ->
        course?.modules?.find { it.id == modId }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), null)

    // Quiz UI state
    private val _quizState = MutableStateFlow(QuizUiState())
    val quizState: StateFlow<QuizUiState> = _quizState.asStateFlow()

    // Certificate modal
    private val _activeCertificate = MutableStateFlow<Certificate?>(null)
    val activeCertificate: StateFlow<Certificate?> = _activeCertificate.asStateFlow()

    // General user feedback / error surface. Every backend failure this
    // ViewModel encounters is routed here — the UI must show this, never
    // silently substitute demo data.
    private val _toastMessage = MutableStateFlow<String?>(null)
    val toastMessage: StateFlow<String?> = _toastMessage.asStateFlow()

    init {
        viewModelScope.launch {
            _isRestoringSession.value = true
            val restored = repository.tryRestoreSession()
            _isRestoringSession.value = false
            if (restored) {
                navBackstack.clear()
                _selectedBottomTab.value = 0
                _currentDestination.value = ScreenDestination.Home
            } else {
                _currentDestination.value = ScreenDestination.Login
            }
        }
    }

    fun navigateTo(destination: ScreenDestination) {
        if (_currentDestination.value != destination) {
            navBackstack.add(_currentDestination.value)
            _currentDestination.value = destination
        }
    }

    fun navigateBack(): Boolean {
        if (navBackstack.isNotEmpty()) {
            val previous = navBackstack.removeAt(navBackstack.size - 1)
            _currentDestination.value = previous
            when (previous) {
                is ScreenDestination.Home -> _selectedBottomTab.value = 0
                is ScreenDestination.MyCourses -> _selectedBottomTab.value = 1
                is ScreenDestination.Profile -> _selectedBottomTab.value = 2
                else -> {}
            }
            return true
        }
        return false
    }

    fun selectBottomTab(tabIndex: Int) {
        navBackstack.clear()
        _selectedBottomTab.value = tabIndex
        when (tabIndex) {
            0 -> _currentDestination.value = ScreenDestination.Home
            1 -> _currentDestination.value = ScreenDestination.MyCourses
            2 -> _currentDestination.value = ScreenDestination.Profile
        }
    }

    fun onEmailChange(value: String) {
        _loginEmail.value = value
        _loginError.value = null
    }

    fun onPasswordChange(value: String) {
        _loginPassword.value = value
        _loginError.value = null
    }

    fun performLogin() {
        viewModelScope.launch {
            _isLoggingIn.value = true
            _loginError.value = null
            when (val result = repository.login(_loginEmail.value, _loginPassword.value)) {
                is RepoResult.Success -> {
                    navBackstack.clear()
                    _selectedBottomTab.value = 0
                    _currentDestination.value = ScreenDestination.Home
                }
                is RepoResult.Failure -> {
                    _loginError.value = result.message
                }
            }
            _isLoggingIn.value = false
        }
    }

    fun performLogout() {
        repository.logout()
        navBackstack.clear()
        _currentDestination.value = ScreenDestination.Login
    }

    fun refreshCourses() {
        viewModelScope.launch {
            _isLoadingCourses.value = true
            val result = repository.refreshCourses()
            _isLoadingCourses.value = false
            if (result is RepoResult.Failure) {
                _toastMessage.value = result.message
            }
        }
    }

    fun selectCourseTab(tab: CourseTab) {
        _selectedCourseTab.value = tab
    }

    fun setCourseSearchQuery(query: String) {
        _courseSearchQuery.value = query
    }

    fun openCourseDetails(courseId: String) {
        _currentCourseId.value = courseId
        navigateTo(ScreenDestination.CourseDetails(courseId))
        viewModelScope.launch {
            _isLoadingCourseDetail.value = true
            val result = repository.loadCourseCurriculum(courseId)
            _isLoadingCourseDetail.value = false
            if (result is RepoResult.Failure) {
                _toastMessage.value = result.message
            }
        }
    }

    /**
     * A module's lesson and its quiz are sequential steps, not alternatives —
     * open the lesson first if it exists and hasn't been completed yet;
     * otherwise (already completed, or no lesson at all) go straight to the
     * quiz when one exists. [ModuleStatus.COMPLETED] already reflects real
     * lesson_progress state (see LearningRepository.loadCourseCurriculum),
     * so it's reused here rather than tracking completion separately.
     */
    fun openModule(courseId: String, module: CourseModule) {
        _currentCourseId.value = courseId
        _currentModuleId.value = module.id

        when {
            module.lesson != null && module.status != ModuleStatus.COMPLETED ->
                navigateTo(ScreenDestination.LessonView(courseId, module.id))
            module.quiz != null -> startQuiz(courseId, module.quiz.id)
            module.lesson != null -> navigateTo(ScreenDestination.LessonView(courseId, module.id))
        }
    }

    /**
     * Re-opens an already-completed lesson purely for replay (e.g. "Watch
     * Again" on a completed VIDEO lesson). This is only a navigation
     * shortcut into the existing LessonScreen/Mp4VideoPlayer — unlike
     * [openModule], it never routes to the quiz, and it does not touch
     * completion state, lesson_progress, or course_completions in any way.
     */
    fun watchLessonAgain(courseId: String, module: CourseModule) {
        _currentCourseId.value = courseId
        _currentModuleId.value = module.id
        navigateTo(ScreenDestination.LessonView(courseId, module.id))
    }

    fun markCurrentLessonComplete() {
        val cId = _currentCourseId.value ?: return
        val mId = _currentModuleId.value ?: return

        viewModelScope.launch {
            when (val result = repository.markModuleComplete(cId, mId)) {
                is RepoResult.Success -> {
                    val updatedCourse = result.data
                    val updatedModule = updatedCourse.modules.find { it.id == mId }
                    _toastMessage.value = "Lesson marked complete!"
                    // Sequential flow: if this lesson's module has a quiz,
                    // go there next (reusing the existing startQuiz path)
                    // instead of just navigating back to the syllabus.
                    when {
                        updatedModule?.quiz != null -> startQuiz(cId, updatedModule.quiz.id)
                        updatedCourse.completionPercentage == 100 -> navigateTo(ScreenDestination.CourseCompletion(cId, 100))
                        else -> navigateBack()
                    }
                }
                is RepoResult.Failure -> {
                    _toastMessage.value = result.message
                }
            }
        }
    }

    fun startQuiz(courseId: String, quizId: String) {
        _currentCourseId.value = courseId
        _quizState.value = QuizUiState(isLoading = true)
        navigateTo(ScreenDestination.QuizView(courseId, quizId))

        viewModelScope.launch {
            when (val result = repository.loadQuizForCourse(courseId, quizId)) {
                is RepoResult.Success -> {
                    _quizState.value = QuizUiState(quiz = result.data, isLoading = false)
                }
                is RepoResult.Failure -> {
                    _quizState.value = QuizUiState(isLoading = false)
                    _toastMessage.value = result.message
                    navigateBack()
                }
            }
        }
    }

    fun selectQuizOption(optionId: String) {
        if (!_quizState.value.isAnswerSubmitted) {
            _quizState.update { it.copy(selectedOptionId = optionId) }
        }
    }

    /**
     * Locally advances the on-screen "was this option highlighted" state
     * only — this is NOT scoring. Correctness is determined exclusively by
     * the server when the full quiz is submitted in [nextQuizQuestion]'s
     * final-question branch.
     */
    fun submitCurrentQuizAnswer() {
        val state = _quizState.value
        val quiz = state.quiz ?: return
        val currentQ = quiz.questions.getOrNull(state.currentQuestionIndex) ?: return
        val selectedOpt = state.selectedOptionId ?: return

        val updatedAnswers = state.userAnswers + (currentQ.id to selectedOpt)

        _quizState.update {
            it.copy(
                isAnswerSubmitted = true,
                userAnswers = updatedAnswers
            )
        }
    }

    fun nextQuizQuestion() {
        val state = _quizState.value
        val quiz = state.quiz ?: return

        if (state.currentQuestionIndex + 1 < quiz.questions.size) {
            _quizState.update {
                it.copy(
                    currentQuestionIndex = it.currentQuestionIndex + 1,
                    selectedOptionId = null,
                    isAnswerSubmitted = false
                )
            }
        } else {
            val cId = _currentCourseId.value ?: quiz.courseId.toString()
            viewModelScope.launch {
                _quizState.update { it.copy(isSubmitting = true) }
                when (val result = repository.submitQuizAttempt(cId, quiz.id.toString(), state.userAnswers)) {
                    is RepoResult.Success -> {
                        _quizState.update {
                            it.copy(quizAttempt = result.data, isFinished = true, isSubmitting = false)
                        }
                    }
                    is RepoResult.Failure -> {
                        _quizState.update { it.copy(isSubmitting = false) }
                        _toastMessage.value = result.message
                    }
                }
            }
        }
    }

    fun retakeQuiz() {
        val quiz = _quizState.value.quiz ?: return
        val cId = _currentCourseId.value ?: quiz.courseId.toString()
        startQuiz(cId, quiz.id.toString())
    }

    fun proceedFromQuizToCompletion() {
        val state = _quizState.value
        val cId = _currentCourseId.value ?: state.quiz?.courseId?.toString() ?: return
        val score = state.quizAttempt?.scorePercentage ?: 0
        navigateTo(ScreenDestination.CourseCompletion(cId, score))
    }

    /**
     * No confirmed backend "certificate" table/RPC exists (flagged as an
     * open item during architecture planning). This renders a preview built
     * from real course/employee/attempt data already in memory, exactly as
     * the previous implementation's fallback branch did — it is not a
     * hardcoded course or quiz, only a display certificate.
     */
    fun viewCertificate(courseId: String) {
        val course = repository.getCourse(courseId)
        // The course's real quiz (this app currently has at most one quiz
        // per course, attached to its final module) — course.finalQuizId is
        // never populated by the repository, so it is not used here.
        val quiz = course?.modules?.firstNotNullOfOrNull { it.quiz }
        val user = currentUser.value
        val totalModules = course?.moduleCount ?: course?.modules?.size ?: 0
        val modulesCompleted = course?.modules?.count { it.status == ModuleStatus.COMPLETED } ?: 0
        // Prefer the durable, server-persisted score (quiz_attempts.score,
        // survives app restarts); fall back to this session's in-memory
        // attempt (available immediately after submission, before the next
        // curriculum reload); never a fabricated value.
        val scorePercentage = quiz?.lastAttemptScorePercentage
            ?: quiz?.id?.let { repository.getQuizAttempt(it) }?.scorePercentage
            ?: 0
        _activeCertificate.value = Certificate(
            id = "CERT-$courseId",
            certificateNumber = "SKU-${courseId.uppercase()}",
            courseId = courseId,
            courseTitle = course?.title ?: "SkillUp Course",
            recipientName = user?.name ?: "SkillUp Learner",
            employeeCode = user?.employeeCode ?: "",
            completionDate = course?.completionDate ?: "",
            scorePercentage = scorePercentage,
            passingScorePercentage = quiz?.passingScorePercentage ?: 70,
            totalModulesCompleted = modulesCompleted,
            totalModules = totalModules
        )
    }

    fun dismissCertificate() {
        _activeCertificate.value = null
    }

    fun clearToast() {
        _toastMessage.value = null
    }
}
