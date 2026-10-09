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

private val DarkColorScheme = darkColorScheme(
    primary = CrisisPrimaryAmber,
    onPrimary = Color.White,
    primaryContainer = CrisisPrimaryAmberDark,
    onPrimaryContainer = Color.White,
    secondary = CrisisCyan,
    onSecondary = Color.Black,
    secondaryContainer = CrisisCyanDark,
    onSecondaryContainer = Color.White,
    tertiary = CrisisRed,
    onTertiary = Color.White,
    tertiaryContainer = CrisisRedContainer,
    onTertiaryContainer = Color(0xFFFFDAD6),
    background = CrisisNavyDark,
    onBackground = CrisisTextPrimaryDark,
    surface = CrisisSurfaceDark,
    onSurface = CrisisTextPrimaryDark,
    surfaceVariant = CrisisSurfaceVariantDark,
    onSurfaceVariant = CrisisTextSecondaryDark,
    outline = CrisisBorderDark,
    error = CrisisRed,
    onError = Color.White
)

private val LightColorScheme = lightColorScheme(
    primary = CrisisPrimaryAmberDark,
    onPrimary = Color.White,
    primaryContainer = CrisisPrimaryAmberLight,
    onPrimaryContainer = Color.Black,
    secondary = CrisisCyanDark,
    onSecondary = Color.White,
    tertiary = CrisisRed,
    onTertiary = Color.White,
    background = CrisisBgLight,
    onBackground = CrisisTextPrimaryLight,
    surface = CrisisSurfaceLight,
    onSurface = CrisisTextPrimaryLight,
    surfaceVariant = CrisisSurfaceVariantLight,
    onSurfaceVariant = CrisisTextSecondaryLight,
    outline = Color(0xFFCBD5E1),
    error = CrisisRed,
    onError = Color.White
)

@Composable
fun CrisisCoreTheme(
    darkTheme: Boolean = true, // Default to tactical dark theme for emergency dashboard
    dynamicColor: Boolean = false,
    content: @Composable () -> Unit,
) {
    val colorScheme = when {
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

// Backward compatibility alias
@Composable
fun MyApplicationTheme(
    darkTheme: Boolean = true,
    dynamicColor: Boolean = false,
    content: @Composable () -> Unit,
) {
    CrisisCoreTheme(darkTheme = darkTheme, dynamicColor = dynamicColor, content = content)
}
