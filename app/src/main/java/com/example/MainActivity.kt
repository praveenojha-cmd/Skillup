package com.example

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.MenuBook
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material.icons.outlined.MenuBook
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.ui.components.CertificateDialog
import com.example.ui.screens.CourseCompletionScreen
import com.example.ui.screens.CourseDetailsScreen
import com.example.ui.screens.HomeScreen
import com.example.ui.screens.LessonScreen
import com.example.ui.screens.LoginScreen
import com.example.ui.screens.MyCoursesScreen
import com.example.ui.screens.ProfileScreen
import com.example.ui.screens.QuizScreen
import com.example.ui.theme.*
import com.example.ui.viewmodel.LearningViewModel
import com.example.ui.viewmodel.ScreenDestination

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            MyApplicationTheme {
                SkillUpApp()
            }
        }
    }
}

@Composable
fun SkillUpApp(
    viewModel: LearningViewModel = viewModel()
) {
    val destination by viewModel.currentDestination.collectAsState()
    val isLoggedIn by viewModel.isLoggedIn.collectAsState()
    val activeTab by viewModel.selectedBottomTab.collectAsState()
    val activeCert by viewModel.activeCertificate.collectAsState()

    // Handle Hardware / Gesture Back Press
    BackHandler(enabled = destination !is ScreenDestination.Login) {
        viewModel.navigateBack()
    }

    // Determine if bottom navigation bar should be visible
    val showBottomBar = isLoggedIn && (
        destination is ScreenDestination.Home ||
        destination is ScreenDestination.MyCourses ||
        destination is ScreenDestination.Profile
    )

    Scaffold(
        modifier = Modifier.fillMaxSize(),
        bottomBar = {
            if (showBottomBar) {
                Surface(
                    shape = androidx.compose.foundation.shape.RoundedCornerShape(topStart = 32.dp, topEnd = 32.dp),
                    color = Color.White,
                    shadowElevation = 10.dp,
                    border = androidx.compose.foundation.BorderStroke(1.dp, Slate100),
                    modifier = Modifier.navigationBarsPadding()
                ) {
                    NavigationBar(
                        containerColor = Color.White,
                        tonalElevation = 0.dp,
                        modifier = Modifier
                            .height(68.dp)
                    ) {
                        val tabs = listOf(
                            Triple("Home", Icons.Filled.Home, Icons.Outlined.Home),
                            Triple("My Courses", Icons.Filled.MenuBook, Icons.Outlined.MenuBook),
                            Triple("Profile", Icons.Filled.Person, Icons.Outlined.Person)
                        )

                        tabs.forEachIndexed { index, (label, filledIcon, outlinedIcon) ->
                            val isSelected = activeTab == index
                            NavigationBarItem(
                                selected = isSelected,
                                onClick = { viewModel.selectBottomTab(index) },
                                icon = {
                                    Icon(
                                        imageVector = if (isSelected) filledIcon else outlinedIcon,
                                        contentDescription = label,
                                        modifier = Modifier.size(22.dp)
                                    )
                                },
                                label = {
                                    Text(
                                        text = label,
                                        style = MaterialTheme.typography.labelSmall.copy(
                                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.SemiBold,
                                            fontSize = 11.sp,
                                            letterSpacing = 0.sp
                                        )
                                    )
                                },
                                colors = NavigationBarItemDefaults.colors(
                                    selectedIconColor = CorporateBlue,
                                    selectedTextColor = CorporateBlue,
                                    indicatorColor = CorporateBlueMuted,
                                    unselectedIconColor = Slate400,
                                    unselectedTextColor = Slate400
                                ),
                                modifier = Modifier.testTag("bottom_tab_${label.lowercase().replace(" ", "_")}")
                            )
                        }
                    }
                }
            }
        }
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            AnimatedContent(
                targetState = destination,
                transitionSpec = { fadeIn() togetherWith fadeOut() },
                label = "screen_transition"
            ) { targetScreen ->
                when (targetScreen) {
                    is ScreenDestination.Login -> {
                        LoginScreen(viewModel = viewModel)
                    }
                    is ScreenDestination.Home -> {
                        HomeScreen(viewModel = viewModel)
                    }
                    is ScreenDestination.MyCourses -> {
                        MyCoursesScreen(viewModel = viewModel)
                    }
                    is ScreenDestination.CourseDetails -> {
                        CourseDetailsScreen(
                            courseId = targetScreen.courseId,
                            viewModel = viewModel
                        )
                    }
                    is ScreenDestination.LessonView -> {
                        LessonScreen(
                            courseId = targetScreen.courseId,
                            moduleId = targetScreen.moduleId,
                            viewModel = viewModel
                        )
                    }
                    is ScreenDestination.QuizView -> {
                        QuizScreen(
                            courseId = targetScreen.courseId,
                            quizId = targetScreen.quizId,
                            viewModel = viewModel
                        )
                    }
                    is ScreenDestination.CourseCompletion -> {
                        CourseCompletionScreen(
                            courseId = targetScreen.courseId,
                            scorePercentage = targetScreen.scorePercentage,
                            viewModel = viewModel
                        )
                    }
                    is ScreenDestination.Profile -> {
                        ProfileScreen(viewModel = viewModel)
                    }
                }
            }

            // Global Certificate Dialog Preview Overlay
            if (activeCert != null) {
                CertificateDialog(
                    certificate = activeCert!!,
                    onDismiss = { viewModel.dismissCertificate() }
                )
            }
        }
    }
}
