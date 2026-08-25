package com.example.ui.theme

import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext

private val DarkColorScheme =
  darkColorScheme(
    primary = CorporateBlueLight,
    onPrimary = Color.White,
    primaryContainer = CorporateBlue,
    onPrimaryContainer = Color.White,
    secondary = AccentTealLight,
    onSecondary = Color.White,
    secondaryContainer = AccentTeal,
    onSecondaryContainer = Color.White,
    tertiary = AccentAmberLight,
    onTertiary = Color.Black,
    tertiaryContainer = AccentAmber,
    onTertiaryContainer = Color.White,
    background = CorporateNavyDark,
    surface = CorporateNavy,
    surfaceVariant = Slate800,
    onBackground = Slate100,
    onSurface = Slate100,
    onSurfaceVariant = Slate300,
    outline = Slate600,
    outlineVariant = Slate700,
  )

private val LightColorScheme =
  lightColorScheme(
    primary = CorporateBlue,
    onPrimary = Color.White,
    primaryContainer = CorporateBlueMuted,
    onPrimaryContainer = CorporateNavy,
    secondary = AccentTeal,
    onSecondary = Color.White,
    secondaryContainer = AccentTealMuted,
    onSecondaryContainer = AccentTeal,
    tertiary = AccentAmber,
    onTertiary = Color.White,
    tertiaryContainer = AccentAmberMuted,
    onTertiaryContainer = AccentAmber,
    background = Slate50,
    surface = Color.White,
    surfaceVariant = Slate100,
    onBackground = Slate900,
    onSurface = Slate900,
    onSurfaceVariant = Slate600,
    outline = Slate300,
    outlineVariant = Slate200,
  )

@Composable
fun MyApplicationTheme(
  darkTheme: Boolean = isSystemInDarkTheme(),
  // For the corporate theme, light theme is primary
  dynamicColor: Boolean = false,
  content: @Composable () -> Unit,
) {
  val colorScheme =
    when {
      dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
        val context = LocalContext.current
        if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
      }
      darkTheme -> DarkColorScheme
      else -> LightColorScheme
    }

  MaterialTheme(
    colorScheme = colorScheme,
    typography = Typography,
    content = content
  )
}

