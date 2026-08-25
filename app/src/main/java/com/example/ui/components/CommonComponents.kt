package com.example.ui.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateColorAsState
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
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.Fullscreen
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.MenuBook
import androidx.compose.material.icons.filled.Pause
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Quiz
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material.icons.filled.School
import androidx.compose.material.icons.filled.Share
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.Verified
import androidx.compose.material.icons.filled.Videocam
import androidx.compose.material.icons.filled.VolumeUp
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.example.data.model.Certificate
import com.example.data.model.Course
import com.example.data.model.CourseModule
import com.example.data.model.CourseStatus
import com.example.data.model.LessonContentType
import com.example.data.model.ModuleStatus
import com.example.data.model.QuizOption
import com.example.ui.theme.*

@Composable
fun PrimaryButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    leadingIcon: ImageVector? = null,
    trailingIcon: ImageVector? = null,
    testTag: String = "primary_button"
) {
    Button(
        onClick = onClick,
        enabled = enabled,
        shape = RoundedCornerShape(16.dp),
        colors = ButtonDefaults.buttonColors(
            containerColor = CorporateNavy,
            contentColor = Color.White,
            disabledContainerColor = Slate200,
            disabledContentColor = Slate400
        ),
        modifier = modifier
            .height(50.dp)
            .testTag(testTag)
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.Center
        ) {
            if (leadingIcon != null) {
                Icon(
                    imageVector = leadingIcon,
                    contentDescription = null,
                    modifier = Modifier.size(18.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
            }
            Text(
                text = text,
                style = MaterialTheme.typography.labelLarge.copy(
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp
                )
            )
            if (trailingIcon != null) {
                Spacer(modifier = Modifier.width(8.dp))
                Icon(
                    imageVector = trailingIcon,
                    contentDescription = null,
                    modifier = Modifier.size(18.dp)
                )
            }
        }
    }
}

@Composable
fun SecondaryButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    leadingIcon: ImageVector? = null,
    testTag: String = "secondary_button"
) {
    Button(
        onClick = onClick,
        enabled = enabled,
        shape = RoundedCornerShape(16.dp),
        colors = ButtonDefaults.buttonColors(
            containerColor = CorporateBlueMuted,
            contentColor = CorporateBlue,
            disabledContainerColor = Slate100,
            disabledContentColor = Slate400
        ),
        modifier = modifier
            .height(48.dp)
            .testTag(testTag)
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.Center
        ) {
            if (leadingIcon != null) {
                Icon(
                    imageVector = leadingIcon,
                    contentDescription = null,
                    modifier = Modifier.size(18.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
            }
            Text(
                text = text,
                style = MaterialTheme.typography.labelLarge.copy(
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp
                )
            )
        }
    }
}

@Composable
fun SkillUpOutlinedButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    leadingIcon: ImageVector? = null,
    testTag: String = "outlined_button"
) {
    OutlinedButton(
        onClick = onClick,
        enabled = enabled,
        shape = RoundedCornerShape(16.dp),
        border = androidx.compose.foundation.BorderStroke(1.dp, Slate200),
        colors = ButtonDefaults.outlinedButtonColors(
            containerColor = Color.White,
            contentColor = CorporateNavy
        ),
        modifier = modifier
            .height(48.dp)
            .testTag(testTag)
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.Center
        ) {
            if (leadingIcon != null) {
                Icon(
                    imageVector = leadingIcon,
                    contentDescription = null,
                    tint = Slate700,
                    modifier = Modifier.size(18.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
            }
            Text(
                text = text,
                style = MaterialTheme.typography.labelLarge.copy(
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp
                )
            )
        }
    }
}

@Composable
fun SectionHeader(
    title: String,
    subtitle: String? = null,
    actionLabel: String? = null,
    onActionClick: (() -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = title,
                style = MaterialTheme.typography.titleLarge.copy(
                    fontWeight = FontWeight.Bold,
                    color = Slate900,
                    fontSize = 18.sp
                )
            )
            if (subtitle != null) {
                Spacer(modifier = Modifier.height(2.dp))
                Text(
                    text = subtitle,
                    style = MaterialTheme.typography.bodySmall.copy(
                        color = Slate500,
                        fontSize = 13.sp
                    )
                )
            }
        }
        if (actionLabel != null && onActionClick != null) {
            Text(
                text = actionLabel,
                style = MaterialTheme.typography.labelMedium.copy(
                    color = CorporateBlue,
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 14.sp
                ),
                modifier = Modifier
                    .clip(RoundedCornerShape(8.dp))
                    .clickable { onActionClick() }
                    .padding(horizontal = 6.dp, vertical = 4.dp)
            )
        }
    }
}

@Composable
fun StatCard(
    title: String,
    value: String,
    icon: ImageVector,
    accentColor: Color,
    bgColor: Color,
    modifier: Modifier = Modifier
) {
    Card(
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
        modifier = modifier
            .border(1.dp, Slate100, RoundedCornerShape(20.dp))
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.labelMedium.copy(
                        color = Slate500,
                        fontWeight = FontWeight.Medium
                    ),
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Box(
                    modifier = Modifier
                        .size(34.dp)
                        .clip(CircleShape)
                        .background(bgColor),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = icon,
                        contentDescription = null,
                        tint = accentColor,
                        modifier = Modifier.size(18.dp)
                    )
                }
            }
            Spacer(modifier = Modifier.height(12.dp))
            Text(
                text = value,
                style = MaterialTheme.typography.headlineLarge.copy(
                    fontWeight = FontWeight.Bold,
                    color = Slate900,
                    fontSize = 24.sp
                )
            )
        }
    }
}

@Composable
fun CourseCard(
    course: Course,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val animatedProgress by animateFloatAsState(
        targetValue = course.completionPercentage / 100f,
        animationSpec = tween(durationMillis = 600),
        label = "progress"
    )

    Card(
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
        modifier = modifier
            .fillMaxWidth()
            .border(1.dp, Slate100, RoundedCornerShape(24.dp))
            .clip(RoundedCornerShape(24.dp))
            .clickable { onClick() }
            .testTag("course_card_${course.id}")
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp)
        ) {
            // Category tag and status badge
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Category Tag
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(8.dp))
                        .background(CorporateBlueMuted)
                        .padding(horizontal = 8.dp, vertical = 3.dp)
                ) {
                    Text(
                        text = if (course.status == CourseStatus.IN_PROGRESS) "IN PROGRESS" else course.category.uppercase(),
                        style = MaterialTheme.typography.labelSmall.copy(
                            color = CorporateBlue,
                            fontWeight = FontWeight.Bold,
                            fontSize = 10.sp
                        )
                    )
                }

                // Percentage Tag
                Text(
                    text = "${course.completionPercentage}%",
                    style = MaterialTheme.typography.labelMedium.copy(
                        color = if (course.completionPercentage == 100) SuccessGreen else Slate400,
                        fontWeight = FontWeight.Bold,
                        fontSize = 12.sp
                    )
                )
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Title
            Text(
                text = course.title,
                style = MaterialTheme.typography.titleLarge.copy(
                    fontWeight = FontWeight.Bold,
                    color = Slate900,
                    fontSize = 17.sp,
                    lineHeight = 22.sp
                ),
                maxLines = 2,
                overflow = TextOverflow.Ellipsis
            )

            Spacer(modifier = Modifier.height(4.dp))

            // Short Description
            Text(
                text = course.shortDescription,
                style = MaterialTheme.typography.bodyMedium.copy(
                    color = Slate500,
                    fontSize = 13.sp,
                    lineHeight = 18.sp
                ),
                maxLines = 2,
                overflow = TextOverflow.Ellipsis
            )

            Spacer(modifier = Modifier.height(12.dp))

            // Modules & Duration info chips
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
                        text = "${course.moduleCount} Modules",
                        style = MaterialTheme.typography.labelMedium.copy(
                            color = Slate500,
                            fontWeight = FontWeight.Medium,
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
                        text = "${course.durationMinutes}m",
                        style = MaterialTheme.typography.labelMedium.copy(
                            color = Slate500,
                            fontWeight = FontWeight.Medium,
                            fontSize = 12.sp
                        )
                    )
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // Progress bar
            Column(modifier = Modifier.fillMaxWidth()) {
                LinearProgressIndicator(
                    progress = { animatedProgress },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(6.dp)
                        .clip(RoundedCornerShape(3.dp)),
                    color = if (course.completionPercentage == 100) SuccessGreen else CorporateBlue,
                    trackColor = Slate100,
                    strokeCap = StrokeCap.Round
                )
            }

            Spacer(modifier = Modifier.height(14.dp))

            // Action Button
            val ctaText = when (course.status) {
                CourseStatus.COMPLETED -> "Review Course"
                CourseStatus.IN_PROGRESS -> "Continue Learning"
                CourseStatus.ASSIGNED -> "Start Course"
            }

            val ctaIcon = when (course.status) {
                CourseStatus.COMPLETED -> Icons.Default.CheckCircle
                CourseStatus.IN_PROGRESS -> Icons.Default.PlayArrow
                CourseStatus.ASSIGNED -> Icons.AutoMirrored.Filled.ArrowForward
            }

            if (course.status == CourseStatus.COMPLETED) {
                SkillUpOutlinedButton(
                    text = ctaText,
                    onClick = onClick,
                    leadingIcon = ctaIcon,
                    modifier = Modifier.fillMaxWidth(),
                    testTag = "course_cta_${course.id}"
                )
            } else {
                PrimaryButton(
                    text = ctaText,
                    onClick = onClick,
                    leadingIcon = ctaIcon,
                    modifier = Modifier.fillMaxWidth(),
                    testTag = "course_cta_${course.id}"
                )
            }
        }
    }
}

@Composable
fun ModuleItemRow(
    module: CourseModule,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val isClickable = module.status != ModuleStatus.LOCKED

    val (bgContainerColor, borderColor) = when (module.status) {
        ModuleStatus.COMPLETED -> Pair(Color.White, Slate200)
        ModuleStatus.CURRENT -> Pair(CorporateBlueMuted.copy(alpha = 0.35f), CorporateBlueLight)
        ModuleStatus.LOCKED -> Pair(Slate50, Slate200)
    }

    Card(
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = bgContainerColor),
        elevation = CardDefaults.cardElevation(
            defaultElevation = if (module.status == ModuleStatus.CURRENT) 2.dp else 0.5.dp
        ),
        modifier = modifier
            .fillMaxWidth()
            .border(
                width = if (module.status == ModuleStatus.CURRENT) 1.5.dp else 1.dp,
                color = borderColor,
                shape = RoundedCornerShape(12.dp)
            )
            .clip(RoundedCornerShape(12.dp))
            .clickable(enabled = isClickable) { onClick() }
            .testTag("module_item_${module.id}")
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Status Icon Indicator (✓, ▶, 🔒)
            Box(
                modifier = Modifier
                    .size(36.dp)
                    .clip(CircleShape)
                    .background(
                        when (module.status) {
                            ModuleStatus.COMPLETED -> SuccessGreenMuted
                            ModuleStatus.CURRENT -> CorporateBlue
                            ModuleStatus.LOCKED -> Slate200
                        }
                    ),
                contentAlignment = Alignment.Center
            ) {
                when (module.status) {
                    ModuleStatus.COMPLETED -> Icon(
                        imageVector = Icons.Default.Check,
                        contentDescription = "Completed",
                        tint = SuccessGreen,
                        modifier = Modifier.size(20.dp)
                    )
                    ModuleStatus.CURRENT -> Icon(
                        imageVector = Icons.Default.PlayArrow,
                        contentDescription = "Current",
                        tint = Color.White,
                        modifier = Modifier.size(20.dp)
                    )
                    ModuleStatus.LOCKED -> Icon(
                        imageVector = Icons.Default.Lock,
                        contentDescription = "Locked",
                        tint = Slate400,
                        modifier = Modifier.size(16.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.width(14.dp))

            // Module Title & details
            Column(modifier = Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = module.title,
                        style = MaterialTheme.typography.titleMedium.copy(
                            fontWeight = if (module.status == ModuleStatus.CURRENT) FontWeight.Bold else FontWeight.SemiBold,
                            color = if (module.status == ModuleStatus.LOCKED) Slate500 else Slate900
                        ),
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }

                Spacer(modifier = Modifier.height(3.dp))

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    // Type Badge
                    val typeIcon = when (module.type) {
                        LessonContentType.VIDEO -> Icons.Default.Videocam
                        LessonContentType.PDF -> Icons.Default.Description
                        LessonContentType.TEXT -> Icons.Default.MenuBook
                        LessonContentType.QUIZ -> Icons.Default.Quiz
                    }

                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = typeIcon,
                            contentDescription = null,
                            tint = if (module.status == ModuleStatus.LOCKED) Slate400 else CorporateBlue,
                            modifier = Modifier.size(13.dp)
                        )
                        Spacer(modifier = Modifier.width(3.dp))
                        Text(
                            text = module.type.label,
                            style = MaterialTheme.typography.bodySmall.copy(
                                color = if (module.status == ModuleStatus.LOCKED) Slate400 else Slate600,
                                fontSize = 11.sp
                            )
                        )
                    }

                    Text(
                        text = "•",
                        style = MaterialTheme.typography.bodySmall.copy(color = Slate400)
                    )

                    Text(
                        text = "${module.durationMinutes} min",
                        style = MaterialTheme.typography.bodySmall.copy(
                            color = if (module.status == ModuleStatus.LOCKED) Slate400 else Slate500,
                            fontSize = 11.sp
                        )
                    )
                }
            }

            // End State Pill
            Spacer(modifier = Modifier.width(8.dp))
            val stateText = when (module.status) {
                ModuleStatus.COMPLETED -> "COMPLETED"
                ModuleStatus.CURRENT -> "START"
                ModuleStatus.LOCKED -> "LOCKED"
            }
            val stateTextColor = when (module.status) {
                ModuleStatus.COMPLETED -> SuccessGreen
                ModuleStatus.CURRENT -> CorporateBlue
                ModuleStatus.LOCKED -> Slate400
            }

            Text(
                text = stateText,
                style = MaterialTheme.typography.labelSmall.copy(
                    color = stateTextColor,
                    fontWeight = FontWeight.Bold,
                    fontSize = 10.sp
                )
            )
        }
    }
}

@Composable
fun QuizOptionCard(
    option: QuizOption,
    isSelected: Boolean,
    isSubmitted: Boolean,
    isCorrectOption: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val borderColor = when {
        isSubmitted && isCorrectOption -> SuccessGreen
        isSubmitted && isSelected && !isCorrectOption -> ErrorRed
        isSelected -> CorporateBlue
        else -> Slate200
    }

    val backgroundColor = when {
        isSubmitted && isCorrectOption -> SuccessGreenMuted.copy(alpha = 0.5f)
        isSubmitted && isSelected && !isCorrectOption -> ErrorRedMuted.copy(alpha = 0.5f)
        isSelected -> CorporateBlueMuted.copy(alpha = 0.4f)
        else -> Color.White
    }

    val pillColor = when {
        isSubmitted && isCorrectOption -> SuccessGreen
        isSubmitted && isSelected && !isCorrectOption -> ErrorRed
        isSelected -> CorporateBlue
        else -> Slate100
    }

    val pillTextColor = when {
        isSubmitted && (isCorrectOption || (isSelected && !isCorrectOption)) -> Color.White
        isSelected -> Color.White
        else -> Slate700
    }

    Card(
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = backgroundColor),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
        modifier = modifier
            .fillMaxWidth()
            .border(
                width = if (isSelected || (isSubmitted && isCorrectOption)) 2.dp else 1.dp,
                color = borderColor,
                shape = RoundedCornerShape(12.dp)
            )
            .clip(RoundedCornerShape(12.dp))
            .clickable(enabled = !isSubmitted) { onClick() }
            .testTag("quiz_option_${option.id}")
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(32.dp)
                    .clip(CircleShape)
                    .background(pillColor),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = option.label,
                    style = MaterialTheme.typography.labelMedium.copy(
                        color = pillTextColor,
                        fontWeight = FontWeight.Bold
                    )
                )
            }

            Spacer(modifier = Modifier.width(12.dp))

            Text(
                text = option.text,
                style = MaterialTheme.typography.bodyMedium.copy(
                    color = Slate900,
                    fontWeight = if (isSelected) FontWeight.SemiBold else FontWeight.Normal,
                    lineHeight = 20.sp
                ),
                modifier = Modifier.weight(1f)
            )

            if (isSubmitted) {
                Spacer(modifier = Modifier.width(8.dp))
                if (isCorrectOption) {
                    Icon(
                        imageVector = Icons.Default.CheckCircle,
                        contentDescription = "Correct Answer",
                        tint = SuccessGreen,
                        modifier = Modifier.size(22.dp)
                    )
                } else if (isSelected) {
                    Icon(
                        imageVector = Icons.Default.Close,
                        contentDescription = "Incorrect Choice",
                        tint = ErrorRed,
                        modifier = Modifier.size(22.dp)
                    )
                }
            }
        }
    }
}

@Composable
fun VideoPlayerMock(
    videoTitle: String,
    author: String,
    durationMinutes: Int,
    modifier: Modifier = Modifier
) {
    var isPlaying by remember { mutableStateOf(false) }
    var currentProgress by remember { mutableStateOf(0.42f) }

    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Slate900),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
        modifier = modifier
            .fillMaxWidth()
            .height(210.dp)
    ) {
        Box(modifier = Modifier.fillMaxWidth()) {
            // Background subtle grid & gradient representing video stream
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(210.dp)
                    .background(
                        Brush.verticalGradient(
                            listOf(
                                CorporateNavyDark,
                                CorporateNavy,
                                Color(0xFF0F172A)
                            )
                        )
                    )
            )

            // Video watermark & HD tag
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(12.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(4.dp))
                        .background(Color.Black.copy(alpha = 0.6f))
                        .padding(horizontal = 8.dp, vertical = 4.dp)
                ) {
                    Text(
                        text = "SkillUp Academy HD",
                        style = MaterialTheme.typography.labelSmall.copy(
                            color = Color.White,
                            fontWeight = FontWeight.Bold,
                            fontSize = 10.sp
                        )
                    )
                }

                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(4.dp))
                        .background(CorporateBlue.copy(alpha = 0.8f))
                        .padding(horizontal = 6.dp, vertical = 3.dp)
                ) {
                    Text(
                        text = "1080p • 1.0x",
                        style = MaterialTheme.typography.labelSmall.copy(
                            color = Color.White,
                            fontWeight = FontWeight.SemiBold,
                            fontSize = 10.sp
                        )
                    )
                }
            }

            // Center Play/Pause button
            Box(
                modifier = Modifier
                    .align(Alignment.Center)
                    .size(56.dp)
                    .clip(CircleShape)
                    .background(Color.White.copy(alpha = 0.9f))
                    .clickable { isPlaying = !isPlaying },
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = if (isPlaying) Icons.Default.Pause else Icons.Default.PlayArrow,
                    contentDescription = if (isPlaying) "Pause" else "Play",
                    tint = CorporateBlue,
                    modifier = Modifier.size(32.dp)
                )
            }

            // Bottom Player Controls Bar
            Column(
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .fillMaxWidth()
                    .background(
                        Brush.verticalGradient(
                            listOf(Color.Transparent, Color.Black.copy(alpha = 0.85f))
                        )
                    )
                    .padding(horizontal = 12.dp, vertical = 8.dp)
            ) {
                // Progress Scrubber
                LinearProgressIndicator(
                    progress = { if (isPlaying) 0.65f else currentProgress },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(4.dp)
                        .clip(RoundedCornerShape(2.dp)),
                    color = CorporateBlueLight,
                    trackColor = Color.White.copy(alpha = 0.3f),
                    strokeCap = StrokeCap.Round
                )

                Spacer(modifier = Modifier.height(6.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = if (isPlaying) "04:18 / ${durationMinutes}:00" else "02:45 / ${durationMinutes}:00",
                        style = MaterialTheme.typography.labelSmall.copy(
                            color = Color.White,
                            fontSize = 11.sp
                        )
                    )

                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.VolumeUp,
                            contentDescription = "Volume",
                            tint = Color.White,
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(12.dp))
                        Icon(
                            imageVector = Icons.Default.Fullscreen,
                            contentDescription = "Full Screen",
                            tint = Color.White,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun PdfViewerMock(
    title: String,
    pagesCount: Int,
    modifier: Modifier = Modifier
) {
    Card(
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = Slate100),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
        modifier = modifier
            .fillMaxWidth()
            .border(1.dp, Slate200, RoundedCornerShape(14.dp))
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp)
        ) {
            // PDF Document Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(32.dp)
                            .clip(RoundedCornerShape(6.dp))
                            .background(ErrorRedMuted),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Description,
                            contentDescription = null,
                            tint = ErrorRed,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                    Spacer(modifier = Modifier.width(10.dp))
                    Column {
                        Text(
                            text = title,
                            style = MaterialTheme.typography.titleSmall.copy(
                                fontWeight = FontWeight.Bold,
                                color = Slate900
                            ),
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                        Text(
                            text = "Official Standard Operating Procedure (SOP)",
                            style = MaterialTheme.typography.bodySmall.copy(
                                color = Slate500,
                                fontSize = 11.sp
                            )
                        )
                    }
                }

                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(6.dp))
                        .background(Color.White)
                        .border(1.dp, Slate200, RoundedCornerShape(6.dp))
                        .padding(horizontal = 8.dp, vertical = 4.dp)
                ) {
                    Text(
                        text = "Page 1 of $pagesCount",
                        style = MaterialTheme.typography.labelSmall.copy(
                            color = Slate700,
                            fontWeight = FontWeight.Medium
                        )
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Document simulated page canvas
            Card(
                shape = RoundedCornerShape(8.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .border(1.dp, Slate200, RoundedCornerShape(8.dp))
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(
                            text = "COMPLIANCE & UNDERWRITING DIVISION",
                            style = MaterialTheme.typography.labelSmall.copy(
                                color = Slate400,
                                fontWeight = FontWeight.Bold,
                                fontSize = 9.sp,
                                letterSpacing = 1.sp
                            )
                        )
                        Text(
                            text = "CONFIDENTIAL",
                            style = MaterialTheme.typography.labelSmall.copy(
                                color = ErrorRed,
                                fontWeight = FontWeight.Bold,
                                fontSize = 9.sp
                            )
                        )
                    }
                    HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp), color = Slate200)

                    Text(
                        text = "Section 4.2 — Regulatory LTV and Assessment Protocols",
                        style = MaterialTheme.typography.titleSmall.copy(
                            fontWeight = FontWeight.Bold,
                            color = Slate800
                        )
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = "All gold loan disbursements must strictly comply with statutory RBI Master Directions. The net weight of jewelry must exclude stones, wax, and embellishments before calculating the advance value.",
                        style = MaterialTheme.typography.bodySmall.copy(
                            color = Slate600,
                            lineHeight = 17.sp
                        )
                    )
                }
            }
        }
    }
}

@Composable
fun CertificateDialog(
    certificate: Certificate,
    onDismiss: () -> Unit
) {
    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Surface(
            shape = RoundedCornerShape(20.dp),
            color = Color.White,
            modifier = Modifier
                .fillMaxWidth(0.92f)
                .padding(vertical = 20.dp)
                .shadow(16.dp, RoundedCornerShape(20.dp))
                .border(2.dp, GoldBadge.copy(alpha = 0.5f), RoundedCornerShape(20.dp))
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Header with close button
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.Verified,
                            contentDescription = null,
                            tint = GoldBadge,
                            modifier = Modifier.size(24.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "CERTIFICATE OF ACHIEVEMENT",
                            style = MaterialTheme.typography.labelSmall.copy(
                                color = GoldBadge,
                                fontWeight = FontWeight.Bold,
                                letterSpacing = 1.sp
                            )
                        )
                    }

                    IconButton(
                        onClick = onDismiss,
                        modifier = Modifier.size(32.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Close,
                            contentDescription = "Close",
                            tint = Slate400
                        )
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Certificate Inner Frame
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(12.dp))
                        .background(GoldBadgeBg)
                        .border(1.dp, GoldBadge.copy(alpha = 0.3f), RoundedCornerShape(12.dp))
                        .padding(20.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = "SKILLUP ACADEMY",
                            style = MaterialTheme.typography.labelMedium.copy(
                                color = Slate600,
                                fontWeight = FontWeight.Bold,
                                letterSpacing = 2.sp
                            )
                        )

                        Spacer(modifier = Modifier.height(8.dp))

                        Text(
                            text = "This is proudly presented to",
                            style = MaterialTheme.typography.bodySmall.copy(
                                color = Slate500,
                                fontStyle = androidx.compose.ui.text.font.FontStyle.Italic
                            )
                        )

                        Spacer(modifier = Modifier.height(6.dp))

                        Text(
                            text = certificate.recipientName,
                            style = MaterialTheme.typography.headlineMedium.copy(
                                color = CorporateNavy,
                                fontWeight = FontWeight.Bold
                            ),
                            textAlign = TextAlign.Center
                        )

                        Text(
                            text = "Employee Code: ${certificate.employeeCode}",
                            style = MaterialTheme.typography.labelSmall.copy(
                                color = Slate500
                            )
                        )

                        Spacer(modifier = Modifier.height(10.dp))

                        Text(
                            text = "for successfully completing all modules & final assessment in",
                            style = MaterialTheme.typography.bodySmall.copy(
                                color = Slate600
                            ),
                            textAlign = TextAlign.Center
                        )

                        Spacer(modifier = Modifier.height(4.dp))

                        Text(
                            text = certificate.courseTitle,
                            style = MaterialTheme.typography.titleMedium.copy(
                                color = CorporateBlue,
                                fontWeight = FontWeight.Bold
                            ),
                            textAlign = TextAlign.Center
                        )

                        Spacer(modifier = Modifier.height(12.dp))

                        // Score & Date Row
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(8.dp))
                                .background(Color.White)
                                .padding(horizontal = 12.dp, vertical = 8.dp),
                            horizontalArrangement = Arrangement.SpaceAround
                        ) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text(
                                    text = "Score Achieved",
                                    style = MaterialTheme.typography.labelSmall.copy(color = Slate400, fontSize = 10.sp)
                                )
                                Text(
                                    text = "${certificate.scorePercentage}%",
                                    style = MaterialTheme.typography.labelMedium.copy(
                                        color = SuccessGreen,
                                        fontWeight = FontWeight.Bold
                                    )
                                )
                            }
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text(
                                    text = "Date Awarded",
                                    style = MaterialTheme.typography.labelSmall.copy(color = Slate400, fontSize = 10.sp)
                                )
                                Text(
                                    text = certificate.completionDate,
                                    style = MaterialTheme.typography.labelMedium.copy(
                                        color = Slate800,
                                        fontWeight = FontWeight.SemiBold
                                    )
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        Text(
                            text = "Credential ID: ${certificate.certificateNumber}",
                            style = MaterialTheme.typography.labelSmall.copy(
                                color = Slate400,
                                fontSize = 10.sp
                            )
                        )
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                PrimaryButton(
                    text = "Close Preview",
                    onClick = onDismiss,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        }
    }
}
