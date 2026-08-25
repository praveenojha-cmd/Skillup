package com.example.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.slideInVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.EmojiEvents
import androidx.compose.material.icons.filled.HelpOutline
import androidx.compose.material.icons.filled.Quiz
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.components.PrimaryButton
import com.example.ui.components.QuizOptionCard
import com.example.ui.components.SkillUpOutlinedButton
import com.example.ui.theme.*
import com.example.ui.viewmodel.LearningViewModel

@Composable
fun QuizScreen(
    courseId: String,
    quizId: String,
    viewModel: LearningViewModel,
    modifier: Modifier = Modifier
) {
    val quizState by viewModel.quizState.collectAsState()
    val quiz = quizState.quiz

    if (quiz == null) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Text("Assessment not available.")
        }
        return
    }

    val currentQuestion = quiz.questions.getOrNull(quizState.currentQuestionIndex)
    val totalQuestions = quiz.questions.size
    val progressFraction = (quizState.currentQuestionIndex + 1).toFloat() / totalQuestions.toFloat()
    val animatedProgress by animateFloatAsState(
        targetValue = progressFraction,
        animationSpec = tween(400),
        label = "quiz_progress"
    )

    val scrollState = rememberScrollState()

    Scaffold(
        topBar = {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color.White)
                    .statusBarsPadding()
                    .padding(horizontal = 12.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(
                    onClick = { viewModel.navigateBack() },
                    modifier = Modifier.testTag("quiz_back_button")
                ) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                        contentDescription = "Back",
                        tint = Slate800
                    )
                }

                Text(
                    text = if (quizState.isFinished) "Assessment Results" else quiz.title,
                    style = MaterialTheme.typography.titleMedium.copy(
                        fontWeight = FontWeight.Bold,
                        color = Slate900
                    ),
                    maxLines = 1,
                    modifier = Modifier.weight(1f)
                )
            }
        },
        bottomBar = {
            Card(
                shape = RoundedCornerShape(topStart = 16.dp, topEnd = 16.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                elevation = CardDefaults.cardElevation(defaultElevation = 8.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .border(1.dp, Slate200, RoundedCornerShape(topStart = 16.dp, topEnd = 16.dp))
                    .navigationBarsPadding()
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp)
                ) {
                    if (quizState.isFinished) {
                        val isPassed = quizState.quizAttempt?.isPassed ?: false
                        if (isPassed) {
                            PrimaryButton(
                                text = "CONTINUE TO COMPLETION",
                                onClick = { viewModel.proceedFromQuizToCompletion() },
                                trailingIcon = Icons.AutoMirrored.Filled.ArrowForward,
                                modifier = Modifier.fillMaxWidth(),
                                testTag = "quiz_finish_continue_button"
                            )
                        } else {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                SkillUpOutlinedButton(
                                    text = "Back to Course",
                                    onClick = { viewModel.navigateBack() },
                                    modifier = Modifier.weight(1f)
                                )
                                PrimaryButton(
                                    text = "Retake Quiz",
                                    onClick = { viewModel.retakeQuiz() },
                                    leadingIcon = Icons.Default.Refresh,
                                    modifier = Modifier.weight(1f),
                                    testTag = "quiz_retake_button"
                                )
                            }
                        }
                    } else if (!quizState.isAnswerSubmitted) {
                        PrimaryButton(
                            text = "SUBMIT ANSWER",
                            onClick = { viewModel.submitCurrentQuizAnswer() },
                            enabled = quizState.selectedOptionId != null,
                            modifier = Modifier.fillMaxWidth(),
                            testTag = "quiz_submit_answer_button"
                        )
                    } else {
                        val isLast = quizState.currentQuestionIndex + 1 == totalQuestions
                        PrimaryButton(
                            text = if (isLast) "VIEW RESULTS" else "NEXT QUESTION",
                            onClick = { viewModel.nextQuizQuestion() },
                            trailingIcon = Icons.AutoMirrored.Filled.ArrowForward,
                            modifier = Modifier.fillMaxWidth(),
                            testTag = "quiz_next_question_button"
                        )
                    }
                }
            }
        }
    ) { paddingValues ->
        Column(
            modifier = modifier
                .fillMaxSize()
                .background(Color(0xFFF8FAFC))
                .padding(paddingValues)
                .verticalScroll(scrollState)
                .padding(horizontal = 20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Spacer(modifier = Modifier.height(4.dp))

            if (!quizState.isFinished && currentQuestion != null) {
                // Progress Header
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Question ${quizState.currentQuestionIndex + 1} of $totalQuestions",
                        style = MaterialTheme.typography.titleMedium.copy(
                            fontWeight = FontWeight.Bold,
                            color = CorporateBlue
                        )
                    )
                    Text(
                        text = "Passing: ${quiz.passingScorePercentage}%",
                        style = MaterialTheme.typography.labelSmall.copy(
                            color = Slate500,
                            fontWeight = FontWeight.Medium
                        )
                    )
                }

                // Progress Bar
                LinearProgressIndicator(
                    progress = { animatedProgress },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(6.dp)
                        .clip(RoundedCornerShape(3.dp)),
                    color = CorporateBlue,
                    trackColor = Slate200,
                    strokeCap = StrokeCap.Round
                )

                // Question Prompt Card
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .border(1.dp, Slate200, RoundedCornerShape(16.dp))
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(20.dp)
                    ) {
                        Row(verticalAlignment = Alignment.Top) {
                            Box(
                                modifier = Modifier
                                    .size(28.dp)
                                    .clip(CircleShape)
                                    .background(CorporateBlueMuted),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = "Q${quizState.currentQuestionIndex + 1}",
                                    style = MaterialTheme.typography.labelSmall.copy(
                                        color = CorporateBlue,
                                        fontWeight = FontWeight.Bold
                                    )
                                )
                            }
                            Spacer(modifier = Modifier.width(12.dp))
                            Text(
                                text = currentQuestion.questionText,
                                style = MaterialTheme.typography.titleLarge.copy(
                                    fontWeight = FontWeight.Bold,
                                    color = Slate900,
                                    fontSize = 17.sp,
                                    lineHeight = 24.sp
                                )
                            )
                        }
                    }
                }

                Text(
                    text = "Select one answer:",
                    style = MaterialTheme.typography.labelMedium.copy(
                        color = Slate600,
                        fontWeight = FontWeight.SemiBold
                    )
                )

                // 4 Options List
                currentQuestion.options.forEach { option ->
                    QuizOptionCard(
                        option = option,
                        isSelected = quizState.selectedOptionId == option.id,
                        isSubmitted = quizState.isAnswerSubmitted,
                        isCorrectOption = option.id == currentQuestion.correctOptionId,
                        onClick = { viewModel.selectQuizOption(option.id) }
                    )
                }

                // Answer Feedback Banner (shows after submission)
                AnimatedVisibility(
                    visible = quizState.isAnswerSubmitted,
                    enter = fadeIn() + slideInVertically()
                ) {
                    val isCorrect = quizState.isAnswerCorrect
                    Card(
                        shape = RoundedCornerShape(14.dp),
                        colors = CardDefaults.cardColors(
                            containerColor = if (isCorrect) SuccessGreenMuted else ErrorRedMuted
                        ),
                        modifier = Modifier
                            .fillMaxWidth()
                            .border(
                                1.dp,
                                if (isCorrect) SuccessGreen else ErrorRed,
                                RoundedCornerShape(14.dp)
                            )
                    ) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(16.dp)
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                    imageVector = if (isCorrect) Icons.Default.CheckCircle else Icons.Default.Close,
                                    contentDescription = null,
                                    tint = if (isCorrect) SuccessGreen else ErrorRed,
                                    modifier = Modifier.size(22.dp)
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = if (isCorrect) "Correct!" else "Incorrect",
                                    style = MaterialTheme.typography.titleMedium.copy(
                                        fontWeight = FontWeight.Bold,
                                        color = if (isCorrect) SuccessGreen else ErrorRed
                                    )
                                )
                            }
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(
                                text = currentQuestion.explanation,
                                style = MaterialTheme.typography.bodyMedium.copy(
                                    color = Slate800,
                                    lineHeight = 20.sp
                                )
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(20.dp))
            } else if (quizState.isFinished) {
                // Assessment Complete Summary View
                val attempt = quizState.quizAttempt
                val isPassed = attempt?.isPassed ?: false
                val score = attempt?.scorePercentage ?: 0

                Spacer(modifier = Modifier.height(10.dp))

                Card(
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .border(1.dp, Slate200, RoundedCornerShape(20.dp))
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        // Badge Icon
                        Box(
                            modifier = Modifier
                                .size(72.dp)
                                .clip(CircleShape)
                                .background(if (isPassed) SuccessGreenMuted else ErrorRedMuted),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = if (isPassed) Icons.Default.EmojiEvents else Icons.Default.HelpOutline,
                                contentDescription = null,
                                tint = if (isPassed) SuccessGreen else ErrorRed,
                                modifier = Modifier.size(40.dp)
                            )
                        }

                        Spacer(modifier = Modifier.height(16.dp))

                        Text(
                            text = if (isPassed) "Assessment Passed!" else "Assessment Not Cleared",
                            style = MaterialTheme.typography.headlineMedium.copy(
                                fontWeight = FontWeight.Bold,
                                color = Slate900
                            )
                        )

                        Spacer(modifier = Modifier.height(4.dp))

                        Text(
                            text = if (isPassed)
                                "Congratulations! You have satisfied all competency criteria."
                            else
                                "You need at least ${quiz.passingScorePercentage}% to unlock the course certificate. Please review the lessons and try again.",
                            style = MaterialTheme.typography.bodyMedium.copy(
                                color = Slate600,
                                textAlign = TextAlign.Center
                            )
                        )

                        Spacer(modifier = Modifier.height(20.dp))

                        // Score Box
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(12.dp))
                                .background(Slate100)
                                .padding(16.dp),
                            horizontalArrangement = Arrangement.SpaceAround,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text(
                                    text = "Your Score",
                                    style = MaterialTheme.typography.labelSmall.copy(color = Slate500)
                                )
                                Text(
                                    text = "$score%",
                                    style = MaterialTheme.typography.headlineMedium.copy(
                                        color = if (isPassed) SuccessGreen else ErrorRed,
                                        fontWeight = FontWeight.Bold
                                    )
                                )
                            }

                            Box(
                                modifier = Modifier
                                    .size(1.dp, 36.dp)
                                    .background(Slate300)
                            )

                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text(
                                    text = "Passing Score",
                                    style = MaterialTheme.typography.labelSmall.copy(color = Slate500)
                                )
                                Text(
                                    text = "${quiz.passingScorePercentage}%",
                                    style = MaterialTheme.typography.headlineMedium.copy(
                                        color = Slate800,
                                        fontWeight = FontWeight.Bold
                                    )
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(16.dp))

                        Text(
                            text = "Correct Answers: ${attempt?.correctAnswersCount ?: 0} / ${attempt?.totalQuestions ?: totalQuestions}",
                            style = MaterialTheme.typography.bodySmall.copy(
                                color = Slate600,
                                fontWeight = FontWeight.Medium
                            )
                        )
                    }
                }
            }
        }
    }
}
