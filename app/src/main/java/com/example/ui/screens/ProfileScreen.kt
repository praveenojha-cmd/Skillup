package com.example.ui.screens

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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.automirrored.filled.ExitToApp
import androidx.compose.material.icons.filled.Assignment
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Download
import androidx.compose.material.icons.filled.EmojiEvents
import androidx.compose.material.icons.filled.HelpOutline
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.PendingActions
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material.icons.filled.Work
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.components.BrandMark
import com.example.ui.components.PrimaryButton
import com.example.ui.components.SectionHeader
import com.example.ui.components.SkillUpOutlinedButton
import com.example.ui.components.StatCard
import com.example.ui.theme.*
import com.example.ui.viewmodel.LearningViewModel

@Composable
fun ProfileScreen(
    viewModel: LearningViewModel,
    modifier: Modifier = Modifier
) {
    val user by viewModel.currentUser.collectAsState()
    val courses by viewModel.allCourses.collectAsState()

    var notificationsEnabled by remember { mutableStateOf(true) }
    var showChangePasswordDialog by remember { mutableStateOf(false) }
    var showHelpDialog by remember { mutableStateOf(false) }
    var showLogoutConfirmDialog by remember { mutableStateOf(false) }

    val scrollState = rememberScrollState()

    val completedCount = courses.count { it.status == com.example.data.model.CourseStatus.COMPLETED }
    val inProgressCount = courses.count { it.status == com.example.data.model.CourseStatus.IN_PROGRESS }

    // Derived from the live user's real name — never a demo identity's initials.
    val avatarInitials = user?.name
        ?.trim()
        ?.split(Regex("\\s+"))
        ?.filter { it.isNotBlank() }
        ?.take(2)
        ?.mapNotNull { it.firstOrNull()?.uppercaseChar() }
        ?.joinToString("")
        ?.ifBlank { null }
        ?: "-"

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(Slate50)
            .verticalScroll(scrollState)
            .padding(horizontal = 20.dp)
    ) {
        Spacer(modifier = Modifier.height(10.dp))

        Text(
            text = "Employee Profile",
            style = MaterialTheme.typography.headlineLarge.copy(
                fontWeight = FontWeight.Bold,
                color = Slate900,
                fontSize = 24.sp
            )
        )
        Text(
            text = "Corporate identity and learning transcripts",
            style = MaterialTheme.typography.bodyMedium.copy(
                color = Slate500,
                fontSize = 13.sp
            )
        )

        Spacer(modifier = Modifier.height(10.dp))

        // Subtle identity only.
        BrandMark(logoHeight = 12.dp)

        Spacer(modifier = Modifier.height(12.dp))

        // Profile Identity Card
        Card(
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
            modifier = Modifier
                .fillMaxWidth()
                .border(1.dp, Slate100, RoundedCornerShape(24.dp))
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Profile Avatar with Initials
                    Box(
                        modifier = Modifier
                            .size(60.dp)
                            .clip(CircleShape)
                            .background(CorporateNavy),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = avatarInitials,
                            style = MaterialTheme.typography.titleLarge.copy(
                                color = Color.White,
                                fontWeight = FontWeight.Bold,
                                fontSize = 18.sp
                            )
                        )
                    }

                    Spacer(modifier = Modifier.width(16.dp))

                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = user?.name ?: "-",
                            style = MaterialTheme.typography.titleLarge.copy(
                                fontWeight = FontWeight.Bold,
                                color = Slate900,
                                fontSize = 18.sp
                            )
                        )
                        Spacer(modifier = Modifier.height(3.dp))
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(8.dp))
                                .background(CorporateBlueMuted)
                                .padding(horizontal = 8.dp, vertical = 3.dp)
                        ) {
                            Text(
                                text = "Employee ID: ${user?.employeeCode ?: "-"}",
                                style = MaterialTheme.typography.labelSmall.copy(
                                    color = CorporateBlue,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 11.sp
                                )
                            )
                        }
                    }
                }

                HorizontalDivider(modifier = Modifier.padding(vertical = 16.dp), color = Slate100)

                // Role & Location Row
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.Work,
                            contentDescription = null,
                            tint = Slate500,
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Column {
                            Text(
                                text = "Role",
                                style = MaterialTheme.typography.labelSmall.copy(color = Slate400, fontSize = 10.sp)
                            )
                            Text(
                                text = user?.role ?: "-",
                                style = MaterialTheme.typography.bodyMedium.copy(
                                    fontWeight = FontWeight.SemiBold,
                                    color = Slate800
                                )
                            )
                        }
                    }

                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.LocationOn,
                            contentDescription = null,
                            tint = Slate500,
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Column {
                            Text(
                                text = "Location",
                                style = MaterialTheme.typography.labelSmall.copy(color = Slate400, fontSize = 10.sp)
                            )
                            Text(
                                text = user?.location ?: "-",
                                style = MaterialTheme.typography.bodyMedium.copy(
                                    fontWeight = FontWeight.SemiBold,
                                    color = Slate800
                                )
                            )
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(20.dp))

        // Learning Statistics Header
        SectionHeader(
            title = "Learning Statistics",
            subtitle = "Cumulative performance across training tracks"
        )

        Spacer(modifier = Modifier.height(8.dp))

        // 2x2 Grid of Stat Cards
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            StatCard(
                title = "Courses Assigned",
                value = "${user?.coursesAssignedCount ?: 0}",
                icon = Icons.Default.Assignment,
                accentColor = CorporateBlue,
                bgColor = CorporateBlueMuted,
                modifier = Modifier.weight(1f)
            )

            StatCard(
                title = "Courses Completed",
                value = "$completedCount",
                icon = Icons.Default.CheckCircle,
                accentColor = SuccessGreen,
                bgColor = SuccessGreenMuted,
                modifier = Modifier.weight(1f)
            )
        }

        Spacer(modifier = Modifier.height(12.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            StatCard(
                title = "In Progress",
                value = "$inProgressCount",
                icon = Icons.Default.PendingActions,
                accentColor = AccentAmber,
                bgColor = AccentAmberMuted,
                modifier = Modifier.weight(1f)
            )

            StatCard(
                title = "Average Score",
                value = user?.avgScorePercentage?.let { "$it%" } ?: "-",
                icon = Icons.Default.EmojiEvents,
                accentColor = AccentTeal,
                bgColor = AccentTealMuted,
                modifier = Modifier.weight(1f)
            )
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Account & Preferences
        SectionHeader(
            title = "Settings & Support",
            subtitle = "Security and application preferences"
        )

        Spacer(modifier = Modifier.height(8.dp))

        Card(
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
            modifier = Modifier
                .fillMaxWidth()
                .border(1.dp, Slate200, RoundedCornerShape(16.dp))
        ) {
            Column(modifier = Modifier.fillMaxWidth()) {
                // Change Password
                ProfileMenuRow(
                    icon = Icons.Default.Lock,
                    title = "Change Password",
                    subtitle = "Update your portal credentials",
                    onClick = { showChangePasswordDialog = true }
                )

                HorizontalDivider(color = Slate100)

                // Notifications Toggle
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 12.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(36.dp)
                                .clip(RoundedCornerShape(8.dp))
                                .background(CorporateBlueMuted),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.Notifications,
                                contentDescription = null,
                                tint = CorporateBlue,
                                modifier = Modifier.size(20.dp)
                            )
                        }
                        Spacer(modifier = Modifier.width(12.dp))
                        Column {
                            Text(
                                text = "Course Notifications",
                                style = MaterialTheme.typography.bodyMedium.copy(
                                    fontWeight = FontWeight.SemiBold,
                                    color = Slate900
                                )
                            )
                            Text(
                                text = "Reminders for pending mandatory modules",
                                style = MaterialTheme.typography.bodySmall.copy(color = Slate500)
                            )
                        }
                    }

                    Switch(
                        checked = notificationsEnabled,
                        onCheckedChange = { notificationsEnabled = it },
                        colors = SwitchDefaults.colors(
                            checkedThumbColor = Color.White,
                            checkedTrackColor = CorporateBlue,
                            uncheckedThumbColor = Slate400,
                            uncheckedTrackColor = Slate200
                        )
                    )
                }

                HorizontalDivider(color = Slate100)

                // Help & Support
                ProfileMenuRow(
                    icon = Icons.Default.HelpOutline,
                    title = "Help & Support",
                    subtitle = "Contact L&D administrator",
                    onClick = { showHelpDialog = true }
                )

                HorizontalDivider(color = Slate100)

                // Logout
                ProfileMenuRow(
                    icon = Icons.AutoMirrored.Filled.ExitToApp,
                    title = "Logout",
                    subtitle = "Sign out of your employee account",
                    titleColor = ErrorRed,
                    iconTint = ErrorRed,
                    iconBg = ErrorRedMuted,
                    onClick = { showLogoutConfirmDialog = true },
                    testTag = "profile_logout_row"
                )
            }
        }

        Spacer(modifier = Modifier.height(32.dp))
    }

    if (showChangePasswordDialog) {
        var newPass by remember { mutableStateOf("") }
        var confirmPass by remember { mutableStateOf("") }
        var isSaved by remember { mutableStateOf(false) }

        AlertDialog(
            onDismissRequest = { showChangePasswordDialog = false },
            title = {
                Text("Change Password", fontWeight = FontWeight.Bold)
            },
            text = {
                if (isSaved) {
                    Text("Password successfully updated for ${user?.name ?: "your account"}.")
                } else {
                    Column {
                        Text(
                            "Enter a new secure password for your SkillUp account:",
                            style = MaterialTheme.typography.bodyMedium.copy(color = Slate600)
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                        OutlinedTextField(
                            value = newPass,
                            onValueChange = { newPass = it },
                            label = { Text("New Password") },
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth()
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        OutlinedTextField(
                            value = confirmPass,
                            onValueChange = { confirmPass = it },
                            label = { Text("Confirm New Password") },
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                }
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        if (isSaved) {
                            showChangePasswordDialog = false
                        } else if (newPass.isNotBlank() && newPass == confirmPass) {
                            isSaved = true
                        }
                    }
                ) {
                    Text(if (isSaved) "Done" else "Save Password", color = CorporateBlue, fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                if (!isSaved) {
                    TextButton(onClick = { showChangePasswordDialog = false }) {
                        Text("Cancel", color = Slate500)
                    }
                }
            }
        )
    }

    if (showHelpDialog) {
        AlertDialog(
            onDismissRequest = { showHelpDialog = false },
            title = { Text("L&D Helpdesk", fontWeight = FontWeight.Bold) },
            text = {
                Column {
                    Text("Need help with course completion, quiz reassessments, or curriculum queries?")
                    Spacer(modifier = Modifier.height(8.dp))
                    Text("• Email: learning@internal.corp", fontWeight = FontWeight.SemiBold, color = CorporateBlue)
                    Text("• Helpline: Ext 4022 (Mon - Fri 9 AM - 6 PM)", color = Slate600)
                }
            },
            confirmButton = {
                TextButton(onClick = { showHelpDialog = false }) {
                    Text("Got it", color = CorporateBlue, fontWeight = FontWeight.Bold)
                }
            }
        )
    }

    if (showLogoutConfirmDialog) {
        AlertDialog(
            onDismissRequest = { showLogoutConfirmDialog = false },
            title = { Text("Confirm Logout", fontWeight = FontWeight.Bold) },
            text = { Text("Are you sure you want to sign out of SkillUp?") },
            confirmButton = {
                TextButton(
                    onClick = {
                        showLogoutConfirmDialog = false
                        viewModel.performLogout()
                    }
                ) {
                    Text("Logout", color = ErrorRed, fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { showLogoutConfirmDialog = false }) {
                    Text("Cancel", color = Slate600)
                }
            }
        )
    }
}

@Composable
fun ProfileMenuRow(
    icon: ImageVector,
    title: String,
    subtitle: String,
    onClick: () -> Unit,
    titleColor: Color = Slate900,
    iconTint: Color = CorporateBlue,
    iconBg: Color = CorporateBlueMuted,
    testTag: String = "profile_menu_row"
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() }
            .padding(horizontal = 16.dp, vertical = 14.dp)
            .testTag(testTag),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .size(36.dp)
                    .clip(RoundedCornerShape(8.dp))
                    .background(iconBg),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = iconTint,
                    modifier = Modifier.size(20.dp)
                )
            }
            Spacer(modifier = Modifier.width(12.dp))
            Column {
                Text(
                    text = title,
                    style = MaterialTheme.typography.bodyMedium.copy(
                        fontWeight = FontWeight.SemiBold,
                        color = titleColor
                    )
                )
                Text(
                    text = subtitle,
                    style = MaterialTheme.typography.bodySmall.copy(color = Slate500)
                )
            }
        }

        Icon(
            imageVector = Icons.AutoMirrored.Filled.ArrowForward,
            contentDescription = null,
            tint = Slate400,
            modifier = Modifier.size(18.dp)
        )
    }
}
