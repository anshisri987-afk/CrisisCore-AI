package com.example.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Chat
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.UserRole
import com.example.ui.AppScreen
import com.example.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CrisisTopAppBar(
    currentScreen: AppScreen,
    userRole: UserRole,
    currentLanguage: String,
    onRoleClick: () -> Unit,
    onLanguageClick: () -> Unit,
    onProfileClick: () -> Unit,
    onMenuClick: () -> Unit
) {
    TopAppBar(
        title = {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(10.dp)
                        .clip(CircleShape)
                        .background(CrisisGreen)
                )
                Column {
                    Text(
                        text = "CRISISCORE AI",
                        style = MaterialTheme.typography.titleMedium.copy(
                            fontWeight = FontWeight.Black,
                            letterSpacing = 1.2.sp
                        ),
                        color = Color.White
                    )
                    Text(
                        text = if (currentLanguage == "HI") "आपदा प्रतिक्रिया प्रणाली" else "URBAN FLOOD COMMAND • SENSE → ADAPT",
                        style = MaterialTheme.typography.labelSmall.copy(fontSize = 9.sp),
                        color = CrisisCyan
                    )
                }
            }
        },
        actions = {
            // Language Toggle
            OutlinedButton(
                onClick = onLanguageClick,
                contentPadding = PaddingValues(horizontal = 8.dp, vertical = 2.dp),
                shape = RoundedCornerShape(8.dp),
                colors = ButtonDefaults.outlinedButtonColors(
                    contentColor = CrisisCyan
                ),
                border = androidx.compose.foundation.BorderStroke(1.dp, CrisisBorderDark),
                modifier = Modifier
                    .height(32.dp)
                    .testTag("language_toggle_button")
            ) {
                Text(
                    text = if (currentLanguage == "EN") "हिन्दी" else "EN",
                    style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold)
                )
            }

            Spacer(modifier = Modifier.width(4.dp))

            // Role Badge Button
            Surface(
                color = when (userRole) {
                    UserRole.DISASTER_AUTHORITY -> CrisisRedContainer
                    UserRole.RESCUE_FIELD_TEAM -> CrisisPrimaryAmber.copy(alpha = 0.2f)
                    UserRole.CITIZEN_REPORTER -> CrisisCyan.copy(alpha = 0.2f)
                    UserRole.RELIEF_COORDINATOR -> CrisisGreenContainer
                },
                shape = RoundedCornerShape(8.dp),
                modifier = Modifier
                    .clip(RoundedCornerShape(8.dp))
                    .clickable { onRoleClick() }
                    .border(1.dp, CrisisBorderDark, RoundedCornerShape(8.dp))
                    .testTag("role_badge_selector")
            ) {
                Text(
                    text = userRole.badge,
                    style = MaterialTheme.typography.labelSmall.copy(
                        fontWeight = FontWeight.Bold,
                        fontSize = 10.sp
                    ),
                    color = when (userRole) {
                        UserRole.DISASTER_AUTHORITY -> CrisisRed
                        UserRole.RESCUE_FIELD_TEAM -> CrisisPrimaryAmber
                        UserRole.CITIZEN_REPORTER -> CrisisCyan
                        UserRole.RELIEF_COORDINATOR -> CrisisGreen
                    },
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 6.dp)
                )
            }

            IconButton(
                onClick = onProfileClick,
                modifier = Modifier.testTag("profile_icon_button")
            ) {
                Icon(
                    imageVector = Icons.Default.AccountCircle,
                    contentDescription = "Profile",
                    tint = CrisisTextPrimaryDark
                )
            }
        },
        colors = TopAppBarDefaults.topAppBarColors(
            containerColor = CrisisNavyDark
        )
    )
}

@Composable
fun CrisisBottomNavigationBar(
    currentScreen: AppScreen,
    onScreenSelected: (AppScreen) -> Unit,
    unreadAlertCount: Int = 0
) {
    NavigationBar(
        containerColor = CrisisNavyDark,
        tonalElevation = 8.dp,
        modifier = Modifier.navigationBarsPadding()
    ) {
        NavigationBarItem(
            selected = currentScreen == AppScreen.HOME,
            onClick = { onScreenSelected(AppScreen.HOME) },
            icon = {
                Icon(
                    imageVector = if (currentScreen == AppScreen.HOME) Icons.Filled.Dashboard else Icons.Outlined.Dashboard,
                    contentDescription = "Home"
                )
            },
            label = { Text("Overview") },
            colors = NavigationBarItemDefaults.colors(
                selectedIconColor = Color.White,
                selectedTextColor = CrisisPrimaryAmber,
                indicatorColor = CrisisPrimaryAmber,
                unselectedIconColor = CrisisTextSecondaryDark,
                unselectedTextColor = CrisisTextSecondaryDark
            ),
            modifier = Modifier.testTag("nav_home")
        )

        NavigationBarItem(
            selected = currentScreen == AppScreen.SITUATIONAL_MAP,
            onClick = { onScreenSelected(AppScreen.SITUATIONAL_MAP) },
            icon = {
                Icon(
                    imageVector = if (currentScreen == AppScreen.SITUATIONAL_MAP) Icons.Filled.Map else Icons.Outlined.Map,
                    contentDescription = "GIS Map"
                )
            },
            label = { Text("GIS Map") },
            colors = NavigationBarItemDefaults.colors(
                selectedIconColor = Color.White,
                selectedTextColor = CrisisPrimaryAmber,
                indicatorColor = CrisisPrimaryAmber,
                unselectedIconColor = CrisisTextSecondaryDark,
                unselectedTextColor = CrisisTextSecondaryDark
            ),
            modifier = Modifier.testTag("nav_map")
        )

        NavigationBarItem(
            selected = currentScreen == AppScreen.RESOURCE_ALLOCATION,
            onClick = { onScreenSelected(AppScreen.RESOURCE_ALLOCATION) },
            icon = {
                Icon(
                    imageVector = if (currentScreen == AppScreen.RESOURCE_ALLOCATION) Icons.Filled.Hub else Icons.Outlined.Hub,
                    contentDescription = "Allocate"
                )
            },
            label = { Text("Allocate") },
            colors = NavigationBarItemDefaults.colors(
                selectedIconColor = Color.White,
                selectedTextColor = CrisisPrimaryAmber,
                indicatorColor = CrisisPrimaryAmber,
                unselectedIconColor = CrisisTextSecondaryDark,
                unselectedTextColor = CrisisTextSecondaryDark
            ),
            modifier = Modifier.testTag("nav_allocate")
        )

        NavigationBarItem(
            selected = currentScreen == AppScreen.REPORT_INCIDENT,
            onClick = { onScreenSelected(AppScreen.REPORT_INCIDENT) },
            icon = {
                Icon(
                    imageVector = if (currentScreen == AppScreen.REPORT_INCIDENT) Icons.Filled.AddAlert else Icons.Outlined.AddAlert,
                    contentDescription = "Report"
                )
            },
            label = { Text("Report") },
            colors = NavigationBarItemDefaults.colors(
                selectedIconColor = Color.White,
                selectedTextColor = CrisisPrimaryAmber,
                indicatorColor = CrisisPrimaryAmber,
                unselectedIconColor = CrisisTextSecondaryDark,
                unselectedTextColor = CrisisTextSecondaryDark
            ),
            modifier = Modifier.testTag("nav_report")
        )

        NavigationBarItem(
            selected = currentScreen == AppScreen.ROUTE_TRACKING,
            onClick = { onScreenSelected(AppScreen.ROUTE_TRACKING) },
            icon = {
                Icon(
                    imageVector = if (currentScreen == AppScreen.ROUTE_TRACKING) Icons.Filled.Navigation else Icons.Outlined.Navigation,
                    contentDescription = "Tracking"
                )
            },
            label = { Text("Tracking") },
            colors = NavigationBarItemDefaults.colors(
                selectedIconColor = Color.White,
                selectedTextColor = CrisisPrimaryAmber,
                indicatorColor = CrisisPrimaryAmber,
                unselectedIconColor = CrisisTextSecondaryDark,
                unselectedTextColor = CrisisTextSecondaryDark
            ),
            modifier = Modifier.testTag("nav_tracking")
        )

        NavigationBarItem(
            selected = currentScreen == AppScreen.AI_ASSISTANT,
            onClick = { onScreenSelected(AppScreen.AI_ASSISTANT) },
            icon = {
                Icon(
                    imageVector = if (currentScreen == AppScreen.AI_ASSISTANT) Icons.AutoMirrored.Filled.Chat else Icons.AutoMirrored.Filled.Chat,
                    contentDescription = "AI Ops"
                )
            },
            label = { Text("AI Ops") },
            colors = NavigationBarItemDefaults.colors(
                selectedIconColor = Color.White,
                selectedTextColor = CrisisCyan,
                indicatorColor = CrisisCyanDark,
                unselectedIconColor = CrisisTextSecondaryDark,
                unselectedTextColor = CrisisTextSecondaryDark
            ),
            modifier = Modifier.testTag("nav_ai")
        )
    }
}
