package com.example.data.model

enum class CourseStatus(val displayName: String) {
    ASSIGNED("Assigned"),
    IN_PROGRESS("In Progress"),
    COMPLETED("Completed")
}

enum class ModuleStatus {
    COMPLETED,
    CURRENT,
    LOCKED
}

enum class LessonContentType(val label: String) {
    VIDEO("Video Lesson"),
    PDF("Document / Policy"),
    TEXT("Interactive Guide"),
    QUIZ("Assessment")
}

data class Employee(
    val id: String,
    val name: String,
    val employeeCode: String,
    val role: String,
    val department: String,
    val location: String,
    val coursesAssignedCount: Int,
    val coursesCompletedCount: Int,
    val inProgressCount: Int,
    val avgScorePercentage: Int
)

data class Course(
    val id: String,
    val title: String,
    val shortDescription: String,
    val fullDescription: String,
    val category: String,
    val level: String,
    /** Null means "not yet loaded" (e.g. the lightweight Home course list,
     *  before this course's curriculum has been fetched) — distinct from a
     *  genuine, confirmed zero-module course. */
    val moduleCount: Int?,
    val durationMinutes: Int,
    val completionPercentage: Int,
    val status: CourseStatus,
    val modules: List<CourseModule>,
    val finalQuizId: String? = null,
    val certificateId: String? = null,
    val instructor: String = "Internal L&D Team"
)

data class CourseModule(
    val id: String,
    val courseId: String,
    val orderIndex: Int,
    val title: String,
    val subtitle: String,
    val durationMinutes: Int,
    val type: LessonContentType,
    val status: ModuleStatus,
    val lesson: Lesson? = null,
    val quiz: Quiz? = null
)

data class Lesson(
    val id: String,
    val moduleId: String,
    val courseId: String,
    val title: String,
    val moduleOrder: Int,
    val totalModules: Int,
    val type: LessonContentType,
    val durationMinutes: Int,
    val overview: String,
    val learningObjectives: List<String>,
    val keyTakeaways: List<String>,
    // Video specific
    val videoTitle: String? = null,
    val videoAuthor: String? = null,
    val videoUrl: String? = null,
    // Document specific
    val documentPagesCount: Int = 1,
    val documentSections: List<DocumentSection> = emptyList(),
    // Article specific
    val articleParagraphs: List<String> = emptyList()
)

data class DocumentSection(
    val title: String,
    val content: String,
    val policyRef: String? = null
)

data class QuizOption(
    val id: String,
    val label: String, // "A", "B", "C", "D"
    val text: String
)

data class QuizQuestion(
    val id: String,
    val questionNumber: Int,
    val questionText: String,
    val options: List<QuizOption>,
    val correctOptionId: String,
    val explanation: String
)

data class Quiz(
    val id: String,
    val courseId: String,
    val courseTitle: String,
    val title: String,
    val description: String,
    val totalQuestions: Int,
    val passingScorePercentage: Int = 70,
    val questions: List<QuizQuestion>
)

data class QuizAttempt(
    val quizId: String,
    val totalQuestions: Int,
    val correctAnswersCount: Int,
    val scorePercentage: Int,
    val isPassed: Boolean,
    val completedAt: String,
    val answers: Map<String, String> // QuestionId -> SelectedOptionId
)

data class Certificate(
    val id: String,
    val certificateNumber: String,
    val courseId: String,
    val courseTitle: String,
    val recipientName: String,
    val employeeCode: String,
    val completionDate: String,
    val scorePercentage: Int,
    val totalModulesCompleted: Int,
    val authorizedBy: String = "Director of Learning & Development",
    val organization: String = "Enterprise Learning Academy"
)
