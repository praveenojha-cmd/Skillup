package com.example.ui.screens

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material.icons.filled.TrendingUp
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.CourseStatus
import com.example.ui.components.CourseCard
import com.example.ui.components.PrimaryButton
import com.example.ui.components.SectionHeader
import com.example.ui.theme.*
import com.example.ui.viewmodel.LearningViewModel
import com.example.ui.viewmodel.ScreenDestination
import java.util.Calendar

/**
 * Device-local-time greeting. Uses java.util.Calendar (not java.time,
 * which needs API 26+/core-library-desugaring — this project's minSdk is
 * 24) and Calendar.getInstance()'s default timezone, i.e. the device's own
 * local time, never server time.
 */
private fun greetingForHour(hourOfDay: Int): String = when (hourOfDay) {
    in 5..11 -> "Good Morning"
    in 12..16 -> "Good Afternoon"
    in 17..20 -> "Good Evening"
    else -> "Good Night" // 21:00–04:59
}

@Composable
fun HomeScreen(
    viewModel: LearningViewModel,
    modifier: Modifier = Modifier
) {
    val user by viewModel.currentUser.collectAsState()
    val courses by viewModel.allCourses.collectAsState()

    val greeting = remember { greetingForHour(Calendar.getInstance().get(Calendar.HOUR_OF_DAY)) }
    val userName = user?.name?.split(" ")?.firstOrNull() ?: "Rahul"
    val userInitials = user?.name?.split(" ")?.mapNotNull { it.firstOrNull()?.toString() }?.take(2)?.joinToString("") ?: "RS"
    val inProgressCourse = courses.find { it.status == CourseStatus.IN_PROGRESS } ?: courses.firstOrNull()

    // Calculate dynamic overall progress across all modules. Courses whose
    // curriculum hasn't loaded yet (moduleCount == null) simply don't
    // contribute here — no fabricated fallback if nothing is known yet.
    val totalModulesAll = courses.sumOf { it.moduleCount ?: 0 }
    val completedModulesAll = courses.sumOf { (it.completionPercentage * (it.moduleCount ?: 0)) / 100 }
    val overallProgressPercent = if (totalModulesAll > 0) (completedModulesAll * 100) / totalModulesAll else 0

    val animatedOverallProgress by animateFloatAsState(
        targetValue = overallProgressPercent / 100f,
        animationSpec = tween(700),
        label = "overall_progress"
    )

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .background(Slate50)
            .padding(horizontal = 20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Spacer(modifier = Modifier.height(4.dp))

            // Greeting & Clean Avatar Row
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 4.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "$greeting,",
                        style = MaterialTheme.typography.bodyMedium.copy(
                            color = Slate500,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Medium
                        )
                    )
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = "$userName 👋",
                        style = MaterialTheme.typography.headlineMedium.copy(
                            fontWeight = FontWeight.Bold,
                            color = Slate900,
                            fontSize = 24.sp,
                            letterSpacing = (-0.3).sp
                        )
                    )
                }

                // Clean Minimalist Avatar
                Box(
                    modifier = Modifier
                        .size(48.dp)
                        .clip(CircleShape)
                        .background(Slate200)
                        .border(2.dp, Color.White, CircleShape)
                        .shadow(2.dp, CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(Slate400),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = userInitials,
                            style = MaterialTheme.typography.titleMedium.copy(
                                color = Color.White,
                                fontWeight = FontWeight.Bold,
                                fontSize = 16.sp
                            )
                        )
                    }
                }
            }
        }

        // Overall Learning Progress Card (32dp radius, deep navy #0A2540)
        item {
            Card(
                shape = RoundedCornerShape(32.dp),
                colors = CardDefaults.cardColors(containerColor = CorporateNavy),
                elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .shadow(12.dp, RoundedCornerShape(32.dp), spotColor = CorporateNavy.copy(alpha = 0.35f))
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(
                            Brush.linearGradient(
                                listOf(
                                    CorporateNavy,
                                    Color(0xFF0C2F52),
                                    Color(0xFF0F3963)
                                )
                            )
                        )
                        .padding(24.dp)
                ) {
                    Column(modifier = Modifier.fillMaxWidth()) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text(
                                    text = "OVERALL PROGRESS",
                                    style = MaterialTheme.typography.labelSmall.copy(
                                        color = Color(0xFF93C5FD),
                                        fontWeight = FontWeight.Bold,
                                        letterSpacing = 1.2.sp,
                                        fontSize = 11.sp
                                    )
                                )
                                Spacer(modifier = Modifier.height(4.dp))
                                Row(verticalAlignment = Alignment.Bottom) {
                                    Text(
                                        text = "$overallProgressPercent%",
                                        style = MaterialTheme.typography.displayMedium.copy(
                                            color = Color.White,
                                            fontWeight = FontWeight.ExtraBold,
                                            fontSize = 36.sp
                                        )
                                    )
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(
                                        text = "of goals met",
                                        style = MaterialTheme.typography.bodyMedium.copy(
                                            color = Color(0xFF93C5FD),
                                            fontSize = 14.sp
                                        ),
                                        modifier = Modifier.padding(bottom = 6.dp)
                                    )
                                }
                            }

                            // Circular subtle icon indicator
                            Box(
                                modifier = Modifier
                                    .size(48.dp)
                                    .clip(CircleShape)
                                    .background(Color.White.copy(alpha = 0.10f)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.TrendingUp,
                                    contentDescription = null,
                                    tint = Color.White,
                                    modifier = Modifier.size(24.dp)
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(18.dp))

                        // Clean Minimalist Progress Bar
                        LinearProgressIndicator(
                            progress = { animatedOverallProgress },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(8.dp)
                                .clip(RoundedCornerShape(4.dp)),
                            color = Color(0xFF60A5FA),
                            trackColor = Color.White.copy(alpha = 0.12f),
                            strokeCap = StrokeCap.Round
                        )

                        Spacer(modifier = Modifier.height(14.dp))

                        // Quick Stats Sub-Row
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(
                                text = "${user?.coursesCompletedCount ?: 0} of ${user?.coursesAssignedCount ?: 0} Courses Completed",
                                style = MaterialTheme.typography.bodySmall.copy(
                                    color = Color.White.copy(alpha = 0.85f),
                                    fontWeight = FontWeight.Medium,
                                    fontSize = 12.sp
                                )
                            )
                            Text(
                                text = "Avg Score: ${user?.avgScorePercentage ?: 0}%",
                                style = MaterialTheme.typography.bodySmall.copy(
                                    color = Color.White,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 12.sp
                                )
                            )
                        }
                    }
                }
            }
        }

        // Quick Continue Learning Highlight (In Progress Course)
        if (inProgressCourse != null && inProgressCourse.completionPercentage < 100) {
            item {
                SectionHeader(
                    title = "Continue Learning",
                    subtitle = "Pick up where you left off"
                )

                Spacer(modifier = Modifier.height(2.dp))

                Card(
                    shape = RoundedCornerShape(24.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .border(1.dp, Slate100, RoundedCornerShape(24.dp))
                        .clickable { viewModel.openCourseDetails(inProgressCourse.id) }
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(20.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(CorporateBlueMuted)
                                    .padding(horizontal = 8.dp, vertical = 3.dp)
                            ) {
                                Text(
                                    text = "IN PROGRESS",
                                    style = MaterialTheme.typography.labelSmall.copy(
                                        color = CorporateBlue,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 10.sp
                                    )
                                )
                            }

                            Text(
                                text = "${inProgressCourse.completionPercentage}%",
                                style = MaterialTheme.typography.labelMedium.copy(
                                    color = Slate400,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 12.sp
                                )
                            )
                        }

                        Spacer(modifier = Modifier.height(10.dp))

                        Text(
                            text = inProgressCourse.title,
                            style = MaterialTheme.typography.titleMedium.copy(
                                fontWeight = FontWeight.Bold,
                                color = Slate900,
                                fontSize = 17.sp
                            )
                        )

                        Spacer(modifier = Modifier.height(8.dp))

                        // Modules & duration
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                    imageVector = Icons.Default.Description,
                                    contentDescription = null,
                                    tint = Slate400,
                                    modifier = Modifier.size(14.dp)
                                )
                                Spacer(modifier = Modifier.width(4.dp))
                                Text(
                                    text = "${inProgressCourse.moduleCount?.toString() ?: "—"} Modules",
                                    style = MaterialTheme.typography.bodySmall.copy(
                                        color = Slate500,
                                        fontSize = 12.sp
                                    )
                                )
                            }

                            Spacer(modifier = Modifier.width(16.dp))

                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                    imageVector = Icons.Default.Schedule,
                                    contentDescription = null,
                                    tint = Slate400,
                                    modifier = Modifier.size(14.dp)
                                )
                                Spacer(modifier = Modifier.width(4.dp))
                                Text(
                                    text = "${inProgressCourse.durationMinutes}m",
                                    style = MaterialTheme.typography.bodySmall.copy(
                                        color = Slate500,
                                        fontSize = 12.sp
                                    )
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(14.dp))

                        PrimaryButton(
                            text = "Continue Learning",
                            onClick = { viewModel.openCourseDetails(inProgressCourse.id) },
                            modifier = Modifier.fillMaxWidth(),
                            testTag = "home_continue_learning_button"
                        )
                    }
                }
            }
        }

        // Assigned Courses Section
        item {
            SectionHeader(
                title = "Assigned Courses",
                subtitle = "${courses.size} mandatory & elective programs",
                actionLabel = "View all",
                onActionClick = { viewModel.selectBottomTab(1) }
            )
        }

        // Course List
        items(courses) { course ->
            CourseCard(
                course = course,
                onClick = { viewModel.openCourseDetails(course.id) }
            )
        }

        item {
            Spacer(modifier = Modifier.height(20.dp))
        }
    }
}
