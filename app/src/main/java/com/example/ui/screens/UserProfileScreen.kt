package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Logout
import androidx.compose.material.icons.filled.*
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
import com.example.ui.theme.*

@Composable
fun UserProfileScreen(
    userEmail: String,
    currentRole: UserRole,
    currentLanguage: String,
    onRoleChange: (UserRole) -> Unit,
    onLanguageToggle: () -> Unit,
    onSignOut: () -> Unit
) {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(CrisisNavyDark)
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
        contentPadding = PaddingValues(top = 10.dp, bottom = 28.dp)
    ) {
        // 1. User Identity Card
        item {
            Card(
                shape = RoundedCornerShape(14.dp),
                colors = CardDefaults.cardColors(containerColor = CrisisSurfaceDark),
                border = androidx.compose.foundation.BorderStroke(1.dp, CrisisBorderDark),
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("user_profile_header")
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(56.dp)
                            .clip(CircleShape)
                            .background(CrisisPrimaryAmber),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.AccountCircle,
                            contentDescription = "User",
                            tint = Color.White,
                            modifier = Modifier.size(36.dp)
                        )
                    }

                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = if (userEmail.isNotBlank()) userEmail else "Emergency Responder",
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                            color = Color.White
                        )
                        Text(
                            text = "Authenticated via Google Sign-In",
                            style = MaterialTheme.typography.bodySmall,
                            color = CrisisGreen
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Surface(
                            color = CrisisCyanDark.copy(alpha = 0.3f),
                            shape = RoundedCornerShape(4.dp)
                        ) {
                            Text(
                                text = "ROLE: ${currentRole.label.uppercase()}",
                                style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold, fontSize = 9.sp),
                                color = CrisisCyan,
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                            )
                        }
                    }
                }
            }
        }

        // 2. Role Selector (Multi-Role Permissions)
        item {
            Card(
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = CrisisSurfaceDark),
                border = androidx.compose.foundation.BorderStroke(1.dp, CrisisBorderDark),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(14.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Text(
                        text = "SELECT OPERATIONAL ROLE & ACCESS",
                        style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                        color = CrisisPrimaryAmber
                    )

                    UserRole.values().forEach { role ->
                        val isSelected = currentRole == role
                        Surface(
                            color = if (isSelected) CrisisSurfaceVariantDark else Color.Transparent,
                            shape = RoundedCornerShape(8.dp),
                            border = androidx.compose.foundation.BorderStroke(
                                1.dp,
                                if (isSelected) CrisisPrimaryAmber else CrisisBorderDark
                            ),
                            modifier = Modifier
                                .fillMaxWidth()
                                .testTag("role_option_${role.name}")
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(12.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Column {
                                    Text(
                                        text = role.label,
                                        style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold),
                                        color = if (isSelected) CrisisPrimaryAmber else Color.White
                                    )
                                    Text(
                                        text = when (role) {
                                            UserRole.DISASTER_AUTHORITY -> "Full control: triage, dispatch approval, dynamic override"
                                            UserRole.RESCUE_FIELD_TEAM -> "Waypoint navigation, field telemetry, incident resolution"
                                            UserRole.CITIZEN_REPORTER -> "Rapid incident submission, SOS beacon, safe shelter access"
                                            UserRole.RELIEF_COORDINATOR -> "Supply logistics, ration inventory, medical stations"
                                        },
                                        style = MaterialTheme.typography.bodySmall.copy(fontSize = 11.sp),
                                        color = CrisisTextSecondaryDark
                                    )
                                }

                                RadioButton(
                                    selected = isSelected,
                                    onClick = { onRoleChange(role) },
                                    colors = RadioButtonDefaults.colors(selectedColor = CrisisPrimaryAmber)
                                )
                            }
                        }
                    }
                }
            }
        }

        // 3. Language & Preferences
        item {
            Card(
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = CrisisSurfaceDark),
                border = androidx.compose.foundation.BorderStroke(1.dp, CrisisBorderDark),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(14.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Text(
                        text = "APP SETTINGS & LOCALIZATION",
                        style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                        color = CrisisCyan
                    )

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(text = "App Language", style = MaterialTheme.typography.bodyMedium, color = Color.White)
                            Text(
                                text = if (currentLanguage == "EN") "English (International)" else "हिन्दी (Hindi Disaster Response)",
                                style = MaterialTheme.typography.bodySmall,
                                color = CrisisTextSecondaryDark
                            )
                        }

                        Button(
                            onClick = onLanguageToggle,
                            colors = ButtonDefaults.buttonColors(containerColor = CrisisCyanDark),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text(if (currentLanguage == "EN") "Switch to हिन्दी" else "Switch to EN", fontSize = 11.sp)
                        }
                    }
                }
            }
        }

        // 4. Emergency Directory
        item {
            Card(
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = CrisisSurfaceDark),
                border = androidx.compose.foundation.BorderStroke(1.dp, CrisisBorderDark),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(14.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Text(
                        text = "NATIONAL EMERGENCY HELPLINES",
                        style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                        color = CrisisRed
                    )

                    HelplineRow("NDRF Disaster Helpline", "1078")
                    HelplineRow("State Disaster Control Room", "1070")
                    HelplineRow("Emergency Ambulance (ALS/BLS)", "108")
                    HelplineRow("National Emergency Number", "112")
                }
            }
        }

        // 5. Sign Out Button
        item {
            OutlinedButton(
                onClick = onSignOut,
                colors = ButtonDefaults.outlinedButtonColors(contentColor = CrisisRed),
                border = androidx.compose.foundation.BorderStroke(1.dp, CrisisRed),
                shape = RoundedCornerShape(10.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("sign_out_button")
            ) {
                Icon(imageVector = Icons.AutoMirrored.Filled.Logout, contentDescription = "Logout")
                Spacer(modifier = Modifier.width(8.dp))
                Text("Sign Out of CrisisCore AI Session")
            }
        }
    }
}

@Composable
fun HelplineRow(label: String, number: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(text = label, style = MaterialTheme.typography.bodySmall, color = Color.White)
        Text(
            text = number,
            style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Black),
            color = CrisisPrimaryAmber
        )
    }
}
