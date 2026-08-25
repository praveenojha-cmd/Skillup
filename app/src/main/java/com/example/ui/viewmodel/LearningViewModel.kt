package com.example.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.data.model.Certificate
import com.example.data.model.Course
import com.example.data.model.CourseModule
import com.example.data.model.CourseStatus
import com.example.data.model.Employee
import com.example.data.model.Lesson
import com.example.data.model.Quiz
import com.example.data.model.QuizAttempt
import com.example.data.repository.LearningRepository
import kotlinx.coroutines.delay
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
    val isAnswerSubmitted: Boolean = false,
    val isAnswerCorrect: Boolean = false,
    val userAnswers: Map<String, String> = emptyMap(),
    val quizAttempt: QuizAttempt? = null,
    val isFinished: Boolean = false
)

class LearningViewModel(
    private val repository: LearningRepository = LearningRepository.getInstance()
) : ViewModel() {

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

    // Selected Bottom Navigation Tab (0: Home, 1: My Courses, 2: Profile)
    private val _selectedBottomTab = MutableStateFlow(0)
    val selectedBottomTab: StateFlow<Int> = _selectedBottomTab.asStateFlow()

    // Tabs in My Courses screen
    private val _selectedCourseTab = MutableStateFlow(CourseTab.ASSIGNED)
    val selectedCourseTab: StateFlow<CourseTab> = _selectedCourseTab.asStateFlow()

    // Search query for My Courses
    private val _courseSearchQuery = MutableStateFlow("")
    val courseSearchQuery: StateFlow<String> = _courseSearchQuery.asStateFlow()

    // Login Form State
    private val _loginUserId = MutableStateFlow("EMP001")
    val loginUserId: StateFlow<String> = _loginUserId.asStateFlow()

    private val _loginPassword = MutableStateFlow("skillup123")
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

    // General user feedback / snackbars
    private val _toastMessage = MutableStateFlow<String?>(null)
    val toastMessage: StateFlow<String?> = _toastMessage.asStateFlow()

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

    fun onUserIdChange(value: String) {
        _loginUserId.value = value
        _loginError.value = null
    }

    fun onPasswordChange(value: String) {
        _loginPassword.value = value
        _loginError.value = null
    }

    fun autofillDemoCredentials() {
        _loginUserId.value = "EMP001"
        _loginPassword.value = "skillup123"
        _loginError.value = null
    }

    fun performLogin() {
        viewModelScope.launch {
            _isLoggingIn.value = true
            _loginError.value = null
            delay(400) // Realistic UI response

            val success = repository.login(_loginUserId.value, _loginPassword.value)
            _isLoggingIn.value = false
            if (success) {
                navBackstack.clear()
                _selectedBottomTab.value = 0
                _currentDestination.value = ScreenDestination.Home
            } else {
                _loginError.value = "Invalid credentials. Use EMP001 / skillup123 for sample access."
            }
        }
    }

    fun performLogout() {
        repository.logout()
        navBackstack.clear()
        _currentDestination.value = ScreenDestination.Login
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
    }

    fun openModule(courseId: String, module: CourseModule) {
        _currentCourseId.value = courseId
        _currentModuleId.value = module.id

        if (module.quiz != null) {
            startQuiz(courseId, module.quiz.id)
        } else {
            navigateTo(ScreenDestination.LessonView(courseId, module.id))
        }
    }

    fun markCurrentLessonComplete() {
        val cId = _currentCourseId.value ?: return
        val mId = _currentModuleId.value ?: return

        val updatedCourse = repository.markModuleComplete(cId, mId)
        _toastMessage.value = "Module marked complete! Next module unlocked."

        // Check if course completed
        if (updatedCourse != null && updatedCourse.completionPercentage == 100) {
            navigateTo(ScreenDestination.CourseCompletion(cId, 90))
        } else {
            // Return to Course Details so user sees updated progress & unlocked next module
            navigateBack()
        }
    }

    fun startQuiz(courseId: String, quizId: String) {
        _currentCourseId.value = courseId
        val quiz = repository.getQuiz(quizId)
        _quizState.value = QuizUiState(
            quiz = quiz,
            currentQuestionIndex = 0,
            selectedOptionId = null,
            isAnswerSubmitted = false,
            isAnswerCorrect = false,
            userAnswers = emptyMap(),
            quizAttempt = null,
            isFinished = false
        )
        navigateTo(ScreenDestination.QuizView(courseId, quizId))
    }

    fun selectQuizOption(optionId: String) {
        if (!_quizState.value.isAnswerSubmitted) {
            _quizState.update { it.copy(selectedOptionId = optionId) }
        }
    }

    fun submitCurrentQuizAnswer() {
        val state = _quizState.value
        val quiz = state.quiz ?: return
        val currentQ = quiz.questions.getOrNull(state.currentQuestionIndex) ?: return
        val selectedOpt = state.selectedOptionId ?: return

        val isCorrect = selectedOpt == currentQ.correctOptionId
        val updatedAnswers = state.userAnswers + (currentQ.id to selectedOpt)

        _quizState.update {
            it.copy(
                isAnswerSubmitted = true,
                isAnswerCorrect = isCorrect,
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
                    isAnswerSubmitted = false,
                    isAnswerCorrect = false
                )
            }
        } else {
            // Finish quiz!
            val cId = _currentCourseId.value ?: quiz.courseId
            val attempt = repository.submitQuizAttempt(cId, quiz.id, state.userAnswers)
            _quizState.update {
                it.copy(
                    quizAttempt = attempt,
                    isFinished = true
                )
            }
        }
    }

    fun retakeQuiz() {
        val quiz = _quizState.value.quiz ?: return
        val cId = _currentCourseId.value ?: quiz.courseId
        startQuiz(cId, quiz.id)
    }

    fun proceedFromQuizToCompletion() {
        val state = _quizState.value
        val cId = _currentCourseId.value ?: state.quiz?.courseId ?: return
        val score = state.quizAttempt?.scorePercentage ?: 86
        navigateTo(ScreenDestination.CourseCompletion(cId, score))
    }

    fun viewCertificate(courseId: String) {
        val cert = repository.getCertificate(courseId)
        if (cert != null) {
            _activeCertificate.value = cert
        } else {
            // Provide preview certificate
            val course = repository.getCourse(courseId)
            _activeCertificate.value = Certificate(
                id = "PREVIEW-$courseId",
                certificateNumber = "SKU-2026-${courseId.uppercase()}-PREVIEW",
                courseId = courseId,
                courseTitle = course?.title ?: "SkillUp Course",
                recipientName = currentUser.value?.name ?: "Rahul Sharma",
                employeeCode = currentUser.value?.employeeCode ?: "EMP001",
                completionDate = "24 August 2026",
                scorePercentage = 86,
                totalModulesCompleted = course?.modules?.size ?: 6
            )
        }
    }

    fun dismissCertificate() {
        _activeCertificate.value = null
    }

    fun clearToast() {
        _toastMessage.value = null
    }
}
