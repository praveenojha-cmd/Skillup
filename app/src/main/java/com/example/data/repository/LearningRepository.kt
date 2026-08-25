package com.example.data.repository

import com.example.data.model.Certificate
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
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update

class LearningRepository private constructor() {

    private val _currentUser = MutableStateFlow<Employee?>(null)
    val currentUser: StateFlow<Employee?> = _currentUser.asStateFlow()

    private val _courses = MutableStateFlow<List<Course>>(emptyList())
    val courses: StateFlow<List<Course>> = _courses.asStateFlow()

    private val _certificates = MutableStateFlow<Map<String, Certificate>>(emptyMap())
    val certificates: StateFlow<Map<String, Certificate>> = _certificates.asStateFlow()

    private val _quizAttempts = MutableStateFlow<Map<String, QuizAttempt>>(emptyMap())
    val quizAttempts: StateFlow<Map<String, QuizAttempt>> = _quizAttempts.asStateFlow()

    init {
        resetToInitialState()
    }

    fun resetToInitialState() {
        val initialEmployee = Employee(
            id = "EMP001",
            name = "Rahul Sharma",
            employeeCode = "EMP001",
            role = "Relationship Manager",
            department = "Retail Banking & Lending",
            location = "Bangalore",
            coursesAssignedCount = 8,
            coursesCompletedCount = 5,
            inProgressCount = 2,
            avgScorePercentage = 84
        )
        _currentUser.value = initialEmployee

        val initialCourses = createInitialCourses()
        _courses.value = initialCourses

        // Pre-create certificate for Customer Handling Excellence (already completed)
        val customerHandlingCert = Certificate(
            id = "CERT-CHE-2026",
            certificateNumber = "SKU-2026-CHE-8821",
            courseId = "course_3",
            courseTitle = "Customer Handling Excellence",
            recipientName = "Rahul Sharma",
            employeeCode = "EMP001",
            completionDate = "15 August 2026",
            scorePercentage = 92,
            totalModulesCompleted = 4
        )
        _certificates.value = mapOf("course_3" to customerHandlingCert)
    }

    fun login(userId: String, pass: String): Boolean {
        if (userId.trim().equals("EMP001", ignoreCase = true) && pass.trim() == "skillup123") {
            if (_currentUser.value == null) {
                resetToInitialState()
            }
            return true
        }
        return false
    }

    fun logout() {
        _currentUser.value = null
    }

    fun getCourse(courseId: String): Course? {
        return _courses.value.find { it.id == courseId }
    }

    fun getModule(courseId: String, moduleId: String): CourseModule? {
        return getCourse(courseId)?.modules?.find { it.id == moduleId }
    }

    fun getQuiz(quizId: String): Quiz? {
        for (course in _courses.value) {
            for (module in course.modules) {
                if (module.quiz?.id == quizId) return module.quiz
            }
        }
        return null
    }

    fun markModuleComplete(courseId: String, moduleId: String): Course? {
        var updatedCourse: Course? = null

        _courses.update { list ->
            list.map { course ->
                if (course.id != courseId) {
                    course
                } else {
                    var foundCompleted = false
                    val updatedModules = course.modules.mapIndexed { index, module ->
                        if (module.id == moduleId) {
                            foundCompleted = true
                            module.copy(status = ModuleStatus.COMPLETED)
                        } else if (foundCompleted && module.status == ModuleStatus.LOCKED) {
                            foundCompleted = false
                            module.copy(status = ModuleStatus.CURRENT)
                        } else {
                            module
                        }
                    }

                    val completedCount = updatedModules.count { it.status == ModuleStatus.COMPLETED }
                    val totalModules = updatedModules.size
                    val newPercentage = if (totalModules > 0) (completedCount * 100) / totalModules else 0

                    val newStatus = when {
                        completedCount == totalModules -> CourseStatus.COMPLETED
                        completedCount > 0 -> CourseStatus.IN_PROGRESS
                        else -> CourseStatus.ASSIGNED
                    }

                    val finalCourse = course.copy(
                        modules = updatedModules,
                        completionPercentage = newPercentage,
                        status = newStatus
                    )
                    updatedCourse = finalCourse
                    finalCourse
                }
            }
        }

        updateEmployeeStats()
        return updatedCourse
    }

    fun submitQuizAttempt(courseId: String, quizId: String, answers: Map<String, String>): QuizAttempt {
        val quiz = getQuiz(quizId) ?: throw IllegalArgumentException("Quiz not found")
        var correctCount = 0
        quiz.questions.forEach { question ->
            if (answers[question.id] == question.correctOptionId) {
                correctCount++
            }
        }

        val scorePercentage = if (quiz.questions.isNotEmpty()) {
            (correctCount * 100) / quiz.questions.size
        } else 0

        val isPassed = scorePercentage >= quiz.passingScorePercentage

        val attempt = QuizAttempt(
            quizId = quizId,
            totalQuestions = quiz.questions.size,
            correctAnswersCount = correctCount,
            scorePercentage = scorePercentage,
            isPassed = isPassed,
            completedAt = "24 August 2026",
            answers = answers
        )

        _quizAttempts.update { it + (quizId to attempt) }

        if (isPassed) {
            // Find module id with this quiz
            val course = getCourse(courseId)
            val quizModule = course?.modules?.find { it.quiz?.id == quizId }
            if (quizModule != null) {
                markModuleComplete(courseId, quizModule.id)
            }

            // Create certificate
            val cert = Certificate(
                id = "CERT-${courseId}-${System.currentTimeMillis() % 10000}",
                certificateNumber = "SKU-2026-${courseId.uppercase()}-9401",
                courseId = courseId,
                courseTitle = course?.title ?: "SkillUp Course",
                recipientName = _currentUser.value?.name ?: "Rahul Sharma",
                employeeCode = _currentUser.value?.employeeCode ?: "EMP001",
                completionDate = "24 August 2026",
                scorePercentage = scorePercentage,
                totalModulesCompleted = course?.modules?.size ?: 6
            )
            _certificates.update { it + (courseId to cert) }
        }

        return attempt
    }

    fun getCertificate(courseId: String): Certificate? {
        return _certificates.value[courseId]
    }

    private fun updateEmployeeStats() {
        val courseList = _courses.value
        val completed = courseList.count { it.status == CourseStatus.COMPLETED }
        val inProgress = courseList.count { it.status == CourseStatus.IN_PROGRESS }

        _currentUser.update { current ->
            current?.copy(
                coursesCompletedCount = 5 + completed - 1, // base stats
                inProgressCount = inProgress
            )
        }
    }

    private fun createInitialCourses(): List<Course> {
        // Course 1: Gold Loan Product Knowledge
        val c1m1 = CourseModule(
            id = "c1_m1",
            courseId = "course_1",
            orderIndex = 1,
            title = "1. Product Basics",
            subtitle = "Fundamentals, collateral types & eligibility",
            durationMinutes = 8,
            type = LessonContentType.VIDEO,
            status = ModuleStatus.COMPLETED,
            lesson = Lesson(
                id = "c1_l1",
                moduleId = "c1_m1",
                courseId = "course_1",
                title = "Gold Loan Fundamentals",
                moduleOrder = 1,
                totalModules = 6,
                type = LessonContentType.VIDEO,
                durationMinutes = 8,
                overview = "Understand why gold loans are one of the most accessible secured lending instruments for retail customers.",
                learningObjectives = listOf(
                    "Definition and key features of sovereign & retail gold lending",
                    "Accepted collateral: jewelry, minted coins (up to 50g), ornaments",
                    "Customer KYC norms & primary verification workflows"
                ),
                keyTakeaways = listOf(
                    "Gold loans offer rapid disbursement with lower interest rates compared to unsecured personal credit.",
                    "RBI guidelines strictly restrict pure gold bullion and bars from standard retail lending programs."
                ),
                videoTitle = "Gold Loan Essentials & Asset Class Overview",
                videoAuthor = "Priya Mehta, Senior Credit Officer"
            )
        )

        val c1m2 = CourseModule(
            id = "c1_m2",
            courseId = "course_1",
            orderIndex = 2,
            title = "2. Eligibility & Policy",
            subtitle = "Underwriting criteria & documentation",
            durationMinutes = 10,
            type = LessonContentType.PDF,
            status = ModuleStatus.COMPLETED,
            lesson = Lesson(
                id = "c1_l2",
                moduleId = "c1_m2",
                courseId = "course_1",
                title = "Eligibility & Underwriting Policy 2026",
                moduleOrder = 2,
                totalModules = 6,
                type = LessonContentType.PDF,
                durationMinutes = 10,
                overview = "Complete breakdown of minimum customer age, occupation checks, ownership declarations, and KYC compliance guidelines.",
                learningObjectives = listOf(
                    "Identity and address verification requirements (PAN, Aadhaar/Passport)",
                    "Ownership declaration documentation and legal indemnities",
                    "Risk mitigation against stolen or encumbered jewelry"
                ),
                keyTakeaways = listOf(
                    "Customer must be at least 18 years of age and the rightful owner of pledged ornaments.",
                    "PAN is mandatory for gold loan disbursements exceeding INR 5,00,000 as per statutory guidelines."
                ),
                documentPagesCount = 3,
                documentSections = listOf(
                    DocumentSection(
                        title = "1. Customer Qualification Standards",
                        content = "Applicants must be resident individuals aged 18 to 70 years. Salaried, self-employed, agricultural, and homemaker profiles are eligible.",
                        policyRef = "SEC-GL-2026/04"
                    ),
                    DocumentSection(
                        title = "2. Anti-Money Laundering Safeguards",
                        content = "Branches must perform strict CKYC validation. Third-party deposits require registered authorization and proof of relationship.",
                        policyRef = "AML-CIR-88"
                    )
                )
            )
        )

        val c1m3 = CourseModule(
            id = "c1_m3",
            courseId = "course_1",
            orderIndex = 3,
            title = "3. Gold Valuation",
            subtitle = "Karat verification, stone deduction & net weight",
            durationMinutes = 8,
            type = LessonContentType.TEXT,
            status = ModuleStatus.COMPLETED,
            lesson = Lesson(
                id = "c1_l3",
                moduleId = "c1_m3",
                courseId = "course_1",
                title = "Gold Appraisal & Net Weight Calculation",
                moduleOrder = 3,
                totalModules = 6,
                type = LessonContentType.TEXT,
                durationMinutes = 8,
                overview = "Master the standard appraisal methods: nitric acid touchstone testing, electronic karatmeters, and precise non-gold deductions.",
                learningObjectives = listOf(
                    "Determining Karat purity (18K, 20K, 22K)",
                    "Accurate gross-to-net weight deduction (gems, wax, enamel, threads)",
                    "Calculating market value using official 30-day moving average"
                ),
                keyTakeaways = listOf(
                    "LTV calculations MUST always be performed on Net Gold Weight, never on gross weight including stones.",
                    "Minimum acceptable purity for lending programs is 18 Karat gold."
                ),
                articleParagraphs = listOf(
                    "Gold valuation is the cornerstone of collateral integrity. The appraiser begins with visual hallmark verification, followed by density / touchstone checks.",
                    "Stone weight, thread bindings, wax fillings, and enamel coatings must be weighed and deducted with zero margin for error.",
                    "Once net weight in grams is established, it is multiplied by the system's prevailing rate for that specific karat rating."
                )
            )
        )

        val c1m4 = CourseModule(
            id = "c1_m4",
            courseId = "course_1",
            orderIndex = 4,
            title = "4. LTV & Pricing",
            subtitle = "Loan-to-Value formula, schemes & pricing limits",
            durationMinutes = 10,
            type = LessonContentType.VIDEO,
            status = ModuleStatus.CURRENT,
            lesson = Lesson(
                id = "c1_l4",
                moduleId = "c1_m4",
                courseId = "course_1",
                title = "LTV & Pricing Masterclass",
                moduleOrder = 4,
                totalModules = 6,
                type = LessonContentType.VIDEO,
                durationMinutes = 10,
                overview = "Deep dive into Loan-to-Value (LTV) regulatory caps, interest rate slabs, and pricing calculations for customer proposals.",
                learningObjectives = listOf(
                    "How LTV is calculated based on net collateral valuation",
                    "Applicable limits: RBI regulatory ceiling of 75% LTV",
                    "Common pricing scenarios (Bullet repayment vs Monthly interest schemes)",
                    "Common pricing mistakes and risk buffers during market volatility"
                ),
                keyTakeaways = listOf(
                    "LTV (Loan-to-Value) = (Sanctioned Loan Amount ÷ Collateral Market Value) × 100.",
                    "The statutory maximum LTV for retail gold lending in India is capped at 75% at origination.",
                    "Lower LTV brackets (e.g. 50-60%) qualify customers for preferential, discounted interest rates."
                ),
                videoTitle = "LTV Optimization & Scheme Structuring",
                videoAuthor = "Vikram Aditya, Head of Retail Products"
            )
        )

        val c1m5 = CourseModule(
            id = "c1_m5",
            courseId = "course_1",
            orderIndex = 5,
            title = "5. Customer Scenarios",
            subtitle = "Handling prepayments, rollovers & margin calls",
            durationMinutes = 9,
            type = LessonContentType.PDF,
            status = ModuleStatus.LOCKED,
            lesson = Lesson(
                id = "c1_l5",
                moduleId = "c1_m5",
                courseId = "course_1",
                title = "Real-World Customer Scenarios & Edge Cases",
                moduleOrder = 5,
                totalModules = 6,
                type = LessonContentType.PDF,
                durationMinutes = 9,
                overview = "Practical guide to managing customer requests across loan lifecycles: partial releases, tenure renewals, and margin call communications.",
                learningObjectives = listOf(
                    "Procedures for partial release of gold ornaments upon milestone payment",
                    "Conducting polite, legally compliant margin call communications if gold prices decline",
                    "Customer handover protocols and safe vault reconciliation"
                ),
                keyTakeaways = listOf(
                    "Prompt, empathetic communication during price corrections preserves customer retention while safeguarding book quality.",
                    "Two authorized officers must witness and sign off on vault releases."
                ),
                documentPagesCount = 2,
                documentSections = listOf(
                    DocumentSection(
                        title = "1. Margin Call Protocol",
                        content = "If LTV breaches 85% due to price drops, the system triggers automated advisory SMS and email notices. Relationship Managers have 48 hours to engage.",
                        policyRef = "RISK-MC-09"
                    ),
                    DocumentSection(
                        title = "2. Partial Release Workflow",
                        content = "Customer must pay down proportional principal so remaining collateral satisfies the <=75% LTV requirement.",
                        policyRef = "OPS-PR-14"
                    )
                )
            )
        )

        val c1Quiz = Quiz(
            id = "quiz_gold_loan",
            courseId = "course_1",
            courseTitle = "Gold Loan Product Knowledge",
            title = "Final Assessment: Gold Loan Mastery",
            description = "Test your comprehensive knowledge across LTV, collateral appraisal, underwriting guidelines, and regulatory compliance.",
            totalQuestions = 5,
            passingScorePercentage = 70,
            questions = listOf(
                QuizQuestion(
                    id = "q1",
                    questionNumber = 1,
                    questionText = "What does LTV represent in gold loan lending?",
                    options = listOf(
                        QuizOption("opt_1a", "A", "Loan-to-Value: Ratio of loan sanctioned to collateral market value"),
                        QuizOption("opt_1b", "B", "Lifetime Value: Expected total revenue generated from the customer"),
                        QuizOption("opt_1c", "C", "Legal Tenure Validity: Maximum allowable duration before auction"),
                        QuizOption("opt_1d", "D", "Liquidity Target Valuation: Minimum daily branch cash reserve")
                    ),
                    correctOptionId = "opt_1a",
                    explanation = "LTV stands for Loan-to-Value, which is the percentage ratio between the sanctioned loan amount and the verified market value of the net gold collateral."
                ),
                QuizQuestion(
                    id = "q2",
                    questionNumber = 2,
                    questionText = "What is the maximum regulatory LTV cap mandated by RBI for retail gold loans at origination?",
                    options = listOf(
                        QuizOption("opt_2a", "A", "50%"),
                        QuizOption("opt_2b", "B", "65%"),
                        QuizOption("opt_2c", "C", "75%"),
                        QuizOption("opt_2d", "D", "90%")
                    ),
                    correctOptionId = "opt_2c",
                    explanation = "Under RBI regulatory norms, the maximum loan-to-value (LTV) allowed for retail gold loans at the time of sanction is 75%."
                ),
                QuizQuestion(
                    id = "q3",
                    questionNumber = 3,
                    questionText = "When calculating net gold weight for loan sanction, which of the following MUST be deducted?",
                    options = listOf(
                        QuizOption("opt_3a", "A", "Precious stones, wax fillings, enamel, and non-gold threads"),
                        QuizOption("opt_3b", "B", "A mandatory 20% standard depreciation fee on all ornaments"),
                        QuizOption("opt_3c", "C", "Making charges previously incurred by the customer"),
                        QuizOption("opt_3d", "D", "GST paid at the time of original purchase")
                    ),
                    correctOptionId = "opt_3a",
                    explanation = "Only pure net gold content can be collateralized. All non-gold elements such as embedded gemstones, lac/wax, and threads must be deducted."
                ),
                QuizQuestion(
                    id = "q4",
                    questionNumber = 4,
                    questionText = "What is the minimum acceptable gold purity standard for retail gold loan programs?",
                    options = listOf(
                        QuizOption("opt_4a", "A", "14 Karat"),
                        QuizOption("opt_4b", "B", "18 Karat"),
                        QuizOption("opt_4c", "C", "22 Karat"),
                        QuizOption("opt_4d", "D", "24 Karat only")
                    ),
                    correctOptionId = "opt_4b",
                    explanation = "The standard institutional benchmark requires a minimum purity of 18 Karat (75.0% pure gold) for collateral acceptance."
                ),
                QuizQuestion(
                    id = "q5",
                    questionNumber = 5,
                    questionText = "If a customer repays a portion of the loan and requests partial release of ornaments, what condition must be met?",
                    options = listOf(
                        QuizOption("opt_5a", "A", "The customer must pay a 5% prepayment penalty"),
                        QuizOption("opt_5b", "B", "Remaining collateral value must still satisfy the required LTV ratio (<=75%)"),
                        QuizOption("opt_5c", "C", "All ornaments must remain locked until 100% full closure"),
                        QuizOption("opt_5d", "D", "Customer must pledge a secondary personal guarantee")
                    ),
                    correctOptionId = "opt_5b",
                    explanation = "Partial releases are permitted as long as the market value of the retained gold collateral continues to comfortably satisfy the maximum allowable LTV threshold."
                )
            )
        )

        val c1m6 = CourseModule(
            id = "c1_m6",
            courseId = "course_1",
            orderIndex = 6,
            title = "6. Final Assessment",
            subtitle = "5 Questions • Passing Score 70%",
            durationMinutes = 5,
            type = LessonContentType.QUIZ,
            status = ModuleStatus.LOCKED,
            quiz = c1Quiz
        )

        val course1 = Course(
            id = "course_1",
            title = "Gold Loan Product Knowledge",
            shortDescription = "Complete guide on gold loan fundamentals, valuation, underwriting, LTV & pricing.",
            fullDescription = "Build strong product knowledge covering gold loan fundamentals, eligibility, valuation, LTV, pricing and customer scenarios.",
            category = "Product & Credit",
            level = "Core Intermediate",
            moduleCount = 6,
            durationMinutes = 45,
            completionPercentage = 65,
            status = CourseStatus.IN_PROGRESS,
            modules = listOf(c1m1, c1m2, c1m3, c1m4, c1m5, c1m6),
            finalQuizId = "quiz_gold_loan"
        )

        // Course 2: Sales Excellence
        val c2m1 = CourseModule(
            id = "c2_m1",
            courseId = "course_2",
            orderIndex = 1,
            title = "1. Consultative Sales Mindset",
            subtitle = "Building high-trust customer relationships",
            durationMinutes = 8,
            type = LessonContentType.VIDEO,
            status = ModuleStatus.CURRENT,
            lesson = Lesson(
                id = "c2_l1",
                moduleId = "c2_m1",
                courseId = "course_2",
                title = "The Consultative Sales Mindset",
                moduleOrder = 1,
                totalModules = 5,
                type = LessonContentType.VIDEO,
                durationMinutes = 8,
                overview = "Transition from transactional selling to becoming a trusted financial advisor for high-net-worth and retail clients.",
                learningObjectives = listOf(
                    "Diagnosing customer liquidity needs with open-ended probing",
                    "Positioning interest savings vs unsecured personal loans",
                    "Structuring transparent loan proposals without hidden costs"
                ),
                keyTakeaways = listOf(
                    "High-performing Relationship Managers listen 70% of the time and pitch tailored solutions 30% of the time."
                ),
                videoTitle = "Consultative Selling & Client Discovery",
                videoAuthor = "Ananya Sen, VP of Retail Sales"
            )
        )
        val c2m2 = CourseModule(
            id = "c2_m2",
            courseId = "course_2",
            orderIndex = 2,
            title = "2. Pitching Value Propositions",
            subtitle = "Framing speed, security & flexibility",
            durationMinutes = 8,
            type = LessonContentType.TEXT,
            status = ModuleStatus.LOCKED
        )
        val c2m3 = CourseModule(
            id = "c2_m3",
            courseId = "course_2",
            orderIndex = 3,
            title = "3. Objection Handling",
            subtitle = "Overcoming rate, safety & stigma hurdles",
            durationMinutes = 10,
            type = LessonContentType.PDF,
            status = ModuleStatus.LOCKED
        )
        val c2m4 = CourseModule(
            id = "c2_m4",
            courseId = "course_2",
            orderIndex = 4,
            title = "4. Closing & Referral Loops",
            subtitle = "Securing commitments & client advocacy",
            durationMinutes = 8,
            type = LessonContentType.VIDEO,
            status = ModuleStatus.LOCKED
        )
        val c2m5 = CourseModule(
            id = "c2_m5",
            courseId = "course_2",
            orderIndex = 5,
            title = "5. Sales Certification Quiz",
            subtitle = "5 Questions • Passing Score 70%",
            durationMinutes = 6,
            type = LessonContentType.QUIZ,
            status = ModuleStatus.LOCKED
        )

        val course2 = Course(
            id = "course_2",
            title = "Sales Excellence",
            shortDescription = "Master consultative selling, high-conversion pitching and relationship building.",
            fullDescription = "Sharpen your client engagement, objection handling, and pipeline velocity with structured sales frameworks.",
            category = "Sales & Growth",
            level = "Advanced",
            moduleCount = 5,
            durationMinutes = 40,
            completionPercentage = 0,
            status = CourseStatus.ASSIGNED,
            modules = listOf(c2m1, c2m2, c2m3, c2m4, c2m5)
        )

        // Course 3: Customer Handling Excellence (100% Complete)
        val c3m1 = CourseModule(
            id = "c3_m1", courseId = "course_3", orderIndex = 1,
            title = "1. Active Empathy in Banking", subtitle = "De-escalation and positive phrasing",
            durationMinutes = 8, type = LessonContentType.VIDEO, status = ModuleStatus.COMPLETED
        )
        val c3m2 = CourseModule(
            id = "c3_m2", courseId = "course_3", orderIndex = 2,
            title = "2. Turnaround Time Management", subtitle = "Process optimization under SLA",
            durationMinutes = 9, type = LessonContentType.PDF, status = ModuleStatus.COMPLETED
        )
        val c3m3 = CourseModule(
            id = "c3_m3", courseId = "course_3", orderIndex = 3,
            title = "3. Escalation Resolution Matrix", subtitle = "Multi-tier grievance handling",
            durationMinutes = 10, type = LessonContentType.TEXT, status = ModuleStatus.COMPLETED
        )
        val c3m4 = CourseModule(
            id = "c3_m4", courseId = "course_3", orderIndex = 4,
            title = "4. Assessment & Certification", subtitle = "Passed with 92% score",
            durationMinutes = 8, type = LessonContentType.QUIZ, status = ModuleStatus.COMPLETED
        )

        val course3 = Course(
            id = "course_3",
            title = "Customer Handling Excellence",
            shortDescription = "Exemplary customer support, conflict resolution and branch service standards.",
            fullDescription = "Learn enterprise service standards, active listening, grievance redressing, and positive customer loyalty loops.",
            category = "Customer Experience",
            level = "Foundational",
            moduleCount = 4,
            durationMinutes = 35,
            completionPercentage = 100,
            status = CourseStatus.COMPLETED,
            modules = listOf(c3m1, c3m2, c3m3, c3m4),
            certificateId = "CERT-CHE-2026"
        )

        // Course 4: Collections & Retention
        val c4m1 = CourseModule(
            id = "c4_m1", courseId = "course_4", orderIndex = 1,
            title = "1. Fair Practice Code & Ethics", subtitle = "RBI compliance on debt recovery",
            durationMinutes = 10, type = LessonContentType.PDF, status = ModuleStatus.COMPLETED
        )
        val c4m2 = CourseModule(
            id = "c4_m2", courseId = "course_4", orderIndex = 2,
            title = "2. Early Delinquency Triggers", subtitle = "Behavioral telemetry & early alerts",
            durationMinutes = 10, type = LessonContentType.TEXT, status = ModuleStatus.COMPLETED
        )
        val c4m3 = CourseModule(
            id = "c4_m3", courseId = "course_4", orderIndex = 3,
            title = "3. Restructuring & Retention", subtitle = "EMI rescheduling & grace period norms",
            durationMinutes = 10, type = LessonContentType.VIDEO, status = ModuleStatus.CURRENT,
            lesson = Lesson(
                id = "c4_l3",
                moduleId = "c4_m3",
                courseId = "course_4",
                title = "Restructuring & Retention Best Practices",
                moduleOrder = 3,
                totalModules = 5,
                type = LessonContentType.VIDEO,
                durationMinutes = 10,
                overview = "How to help stressed borrowers navigate temporary cash-flow challenges while maintaining portfolio quality.",
                learningObjectives = listOf(
                    "Assessing genuine borrower distress vs intentional default",
                    "Flexible interest capitalization models within credit policy",
                    "Conducting respectful negotiation conversations"
                ),
                keyTakeaways = listOf(
                    "Customer retention through timely restructuring reduces long-term NPA provisions by over 40%."
                ),
                videoTitle = "Restructuring Strategies in Volatile Markets",
                videoAuthor = "Suresh N., Chief Risk Officer"
            )
        )
        val c4m4 = CourseModule(
            id = "c4_m4", courseId = "course_4", orderIndex = 4,
            title = "4. Notice & Auction Protocols", subtitle = "Legal timeline and documentation",
            durationMinutes = 12, type = LessonContentType.PDF, status = ModuleStatus.LOCKED
        )
        val c4m5 = CourseModule(
            id = "c4_m5", courseId = "course_4", orderIndex = 5,
            title = "5. Retention Final Assessment", subtitle = "5 Questions • Passing Score 70%",
            durationMinutes = 8, type = LessonContentType.QUIZ, status = ModuleStatus.LOCKED
        )

        val course4 = Course(
            id = "course_4",
            title = "Collections & Retention",
            shortDescription = "Compliant debt recovery, customer rehabilitation and risk containment.",
            fullDescription = "Comprehensive training on respectful collection methods, NPA prevention, loan restructuring and legal notice frameworks.",
            category = "Risk & Operations",
            level = "Advanced",
            moduleCount = 5,
            durationMinutes = 50,
            completionPercentage = 30,
            status = CourseStatus.IN_PROGRESS,
            modules = listOf(c4m1, c4m2, c4m3, c4m4, c4m5)
        )

        return listOf(course1, course2, course3, course4)
    }

    companion object {
        @Volatile
        private var instance: LearningRepository? = null

        fun getInstance(): LearningRepository {
            return instance ?: synchronized(this) {
                instance ?: LearningRepository().also { instance = it }
            }
        }
    }
}
