package com.example.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.R
import com.example.data.model.*
import com.example.ui.AppScreen
import com.example.ui.theme.*

@Composable
fun HomeScreen(
    incidents: List<Incident>,
    resources: List<Resource>,
    alerts: List<AlertMessage>,
    userRole: UserRole,
    currentLanguage: String,
    onNavigate: (AppScreen) -> Unit,
    onSelectIncident: (Incident) -> Unit,
    onTriggerDynamicReallocation: () -> Unit,
    isReallocating: Boolean
) {
    val activeIncidents = incidents.filter { it.status != IncidentStatus.RESOLVED }
    val criticalIncidents = activeIncidents.filter { it.severity == Severity.CRITICAL }
    val deployedResources = resources.filter { it.availability != ResourceAvailability.AVAILABLE }
    val criticalAlert = alerts.firstOrNull { it.severity == AlertSeverity.CRITICAL }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(CrisisNavyDark)
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
        contentPadding = PaddingValues(top = 8.dp, bottom = 24.dp)
    ) {
        // 1. Critical Alert Banner (if any)
        if (criticalAlert != null) {
            item {
                Card(
                    colors = CardDefaults.cardColors(containerColor = CrisisRedContainer),
                    border = CardDefaults.outlinedCardBorder().copy(brush = Brush.horizontalGradient(listOf(CrisisRed, CrisisPrimaryAmber))),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("critical_alert_card")
                ) {
                    Row(
                        modifier = Modifier.padding(14.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(36.dp)
                                .clip(CircleShape)
                                .background(CrisisRed),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.Warning,
                                contentDescription = "Alert",
                                tint = Color.White
                            )
                        }
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = criticalAlert.title,
                                style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                                color = Color.White
                            )
                            Text(
                                text = criticalAlert.message,
                                style = MaterialTheme.typography.bodySmall,
                                color = Color(0xFFFFDAD6)
                            )
                        }
                    }
                }
            }
        }

        // 2. Hero Operations Banner
        item {
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = CrisisSurfaceDark),
                border = androidx.compose.foundation.BorderStroke(1.dp, CrisisBorderDark),
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("hero_command_banner")
            ) {
                Box(modifier = Modifier.fillMaxWidth()) {
                    // Illustration Image
                    Image(
                        painter = painterResource(id = R.drawable.crisiscore_hero_banner_1791478323814),
                        contentDescription = "Urban Flood Command Center",
                        contentScale = ContentScale.Crop,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(180.dp)
                    )

                    // Gradient Scrim
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(180.dp)
                            .background(
                                Brush.verticalGradient(
                                    listOf(
                                        Color.Transparent,
                                        CrisisNavyDark.copy(alpha = 0.85f),
                                        CrisisNavyDark
                                    )
                                )
                            )
                    )

                    // Content Overlay
                    Column(
                        modifier = Modifier
                            .align(Alignment.BottomStart)
                            .padding(14.dp)
                    ) {
                        Surface(
                            color = CrisisPrimaryAmber,
                            shape = RoundedCornerShape(4.dp)
                        ) {
                            Text(
                                text = if (currentLanguage == "HI") "सक्रिय बाढ़ नियंत्रण कक्ष" else "ACTIVE URBAN FLOOD RESPONSE",
                                style = MaterialTheme.typography.labelSmall.copy(
                                    fontWeight = FontWeight.Black,
                                    letterSpacing = 1.sp
                                ),
                                color = Color.White,
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                            )
                        }
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = if (currentLanguage == "HI") "यमुना बेसिन आपातकालीन संसाधन आवंटन" else "Yamuna River Basin Dispatch Grid",
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                            color = Color.White
                        )
                        Text(
                            text = if (currentLanguage == "HI") "सेंसर और नागरिक रिपोर्ट वास्तविक समय में समन्वयित" else "Real-time telemetry • Multi-Agency NDRF / SDRF Coordination",
                            style = MaterialTheme.typography.bodySmall,
                            color = CrisisCyan
                        )
                    }
                }
            }
        }

        // 3. Operational KPIs Row
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                KpiCard(
                    title = "Active Events",
                    value = "${activeIncidents.size}",
                    subtitle = "${criticalIncidents.size} Critical",
                    color = CrisisRed,
                    icon = Icons.Default.CrisisAlert,
                    modifier = Modifier.weight(1f)
                )
                KpiCard(
                    title = "Assets Deployed",
                    value = "${deployedResources.size}/${resources.size}",
                    subtitle = "Watercraft & ALS",
                    color = CrisisPrimaryAmber,
                    icon = Icons.Default.DirectionsBoat,
                    modifier = Modifier.weight(1f)
                )
                KpiCard(
                    title = "Response Time",
                    value = "-42%",
                    subtitle = "vs Manual Ops",
                    color = CrisisGreen,
                    icon = Icons.Default.Speed,
                    modifier = Modifier.weight(1f)
                )
            }
        }

        // 4. Dynamic Reallocation Simulation Action Card (PRD Core requirement!)
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = CrisisSurfaceVariantDark),
                border = androidx.compose.foundation.BorderStroke(1.dp, CrisisCyan.copy(alpha = 0.5f)),
                shape = RoundedCornerShape(14.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("dynamic_reallocation_banner")
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.AutoMode,
                            contentDescription = "Dynamic Reallocation",
                            tint = CrisisCyan
                        )
                        Text(
                            text = "Sense → Decide → Allocate → Respond → Adapt",
                            style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                            color = CrisisCyan
                        )
                    }
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "Experience the AI-powered dynamic reallocation engine. When a higher-severity emergency (e.g. Hospital ICU inundation) occurs, active field assets are intelligently rerouted.",
                        style = MaterialTheme.typography.bodySmall,
                        color = CrisisTextSecondaryDark
                    )
                    Spacer(modifier = Modifier.height(10.dp))
                    Button(
                        onClick = onTriggerDynamicReallocation,
                        enabled = !isReallocating,
                        colors = ButtonDefaults.buttonColors(containerColor = CrisisPrimaryAmber),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("trigger_reallocation_demo_button")
                    ) {
                        if (isReallocating) {
                            CircularProgressIndicator(
                                color = Color.White,
                                modifier = Modifier.size(16.dp),
                                strokeWidth = 2.dp
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Recomputing Optimal Deployment Plan...")
                        } else {
                            Icon(
                                imageVector = Icons.Default.Bolt,
                                contentDescription = "Trigger",
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Simulate Critical Event & Dynamic Reallocation")
                        }
                    }
                }
            }
        }

        // 5. Quick Action Tiles
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedButton(
                    onClick = { onNavigate(AppScreen.REPORT_INCIDENT) },
                    shape = RoundedCornerShape(10.dp),
                    colors = ButtonDefaults.outlinedButtonColors(
                        containerColor = CrisisSurfaceDark,
                        contentColor = Color.White
                    ),
                    border = androidx.compose.foundation.BorderStroke(1.dp, CrisisBorderDark),
                    modifier = Modifier
                        .weight(1f)
                        .testTag("quick_action_report")
                ) {
                    Icon(
                        imageVector = Icons.Default.AddAlert,
                        contentDescription = "Report",
                        tint = CrisisRed,
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Report Incident", fontSize = 12.sp)
                }

                OutlinedButton(
                    onClick = { onNavigate(AppScreen.SITUATIONAL_MAP) },
                    shape = RoundedCornerShape(10.dp),
                    colors = ButtonDefaults.outlinedButtonColors(
                        containerColor = CrisisSurfaceDark,
                        contentColor = Color.White
                    ),
                    border = androidx.compose.foundation.BorderStroke(1.dp, CrisisBorderDark),
                    modifier = Modifier
                        .weight(1f)
                        .testTag("quick_action_map")
                ) {
                    Icon(
                        imageVector = Icons.Default.Map,
                        contentDescription = "GIS Map",
                        tint = CrisisCyan,
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Tactical Map", fontSize = 12.sp)
                }

                OutlinedButton(
                    onClick = { onNavigate(AppScreen.OPERATIONS_DASHBOARD) },
                    shape = RoundedCornerShape(10.dp),
                    colors = ButtonDefaults.outlinedButtonColors(
                        containerColor = CrisisSurfaceDark,
                        contentColor = Color.White
                    ),
                    border = androidx.compose.foundation.BorderStroke(1.dp, CrisisBorderDark),
                    modifier = Modifier
                        .weight(1f)
                        .testTag("quick_action_analytics")
                ) {
                    Icon(
                        imageVector = Icons.Default.Analytics,
                        contentDescription = "Analytics",
                        tint = CrisisGreen,
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Analytics", fontSize = 12.sp)
                }
            }
        }

        // 6. Priority Incident Feed Header
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "PRIORITY INCIDENT QUEUE",
                    style = MaterialTheme.typography.titleSmall.copy(
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.sp
                    ),
                    color = CrisisTextPrimaryDark
                )
                Text(
                    text = "AI Ranked",
                    style = MaterialTheme.typography.labelSmall,
                    color = CrisisCyan
                )
            }
        }

        // 7. Incident Feed Items
        items(incidents) { incident ->
            IncidentFeedCard(
                incident = incident,
                onClick = {
                    onSelectIncident(incident)
                    onNavigate(AppScreen.RESOURCE_ALLOCATION)
                }
            )
        }
    }
}

@Composable
fun KpiCard(
    title: String,
    value: String,
    subtitle: String,
    color: Color,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    modifier: Modifier = Modifier
) {
    Card(
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = CrisisSurfaceDark),
        border = androidx.compose.foundation.BorderStroke(1.dp, CrisisBorderDark),
        modifier = modifier
    ) {
        Column(
            modifier = Modifier.padding(10.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.labelSmall.copy(fontSize = 10.sp),
                    color = CrisisTextSecondaryDark
                )
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = color,
                    modifier = Modifier.size(14.dp)
                )
            }
            Text(
                text = value,
                style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Black),
                color = color
            )
            Text(
                text = subtitle,
                style = MaterialTheme.typography.labelSmall.copy(fontSize = 9.sp),
                color = CrisisTextMutedDark
            )
        }
    }
}

@Composable
fun IncidentFeedCard(
    incident: Incident,
    onClick: () -> Unit
) {
    Card(
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = CrisisSurfaceDark),
        border = androidx.compose.foundation.BorderStroke(
            1.dp,
            if (incident.severity == Severity.CRITICAL) CrisisRed.copy(alpha = 0.6f) else CrisisBorderDark
        ),
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() }
            .testTag("incident_card_${incident.incidentId}")
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
                modifier = Modifier.fillMaxWidth()
            ) {
                // Priority Score Badge
                Surface(
                    color = when {
                        incident.priorityScore >= 90 -> CrisisRed
                        incident.priorityScore >= 75 -> CrisisPrimaryAmber
                        else -> CrisisCyanDark
                    },
                    shape = RoundedCornerShape(6.dp)
                ) {
                    Text(
                        text = "PRIORITY ${incident.priorityScore}/100",
                        style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                        color = Color.White,
                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                    )
                }

                // Status Badge
                Surface(
                    color = when (incident.status) {
                        IncidentStatus.RESOLVED -> CrisisGreenContainer
                        IncidentStatus.RESPONDING, IncidentStatus.ASSIGNED -> CrisisPrimaryAmber.copy(alpha = 0.2f)
                        else -> CrisisSurfaceVariantDark
                    },
                    shape = RoundedCornerShape(6.dp)
                ) {
                    Text(
                        text = incident.status.label,
                        style = MaterialTheme.typography.labelSmall.copy(
                            fontWeight = FontWeight.SemiBold,
                            fontSize = 11.sp
                        ),
                        color = when (incident.status) {
                            IncidentStatus.RESOLVED -> CrisisGreen
                            IncidentStatus.RESPONDING, IncidentStatus.ASSIGNED -> CrisisPrimaryAmber
                            else -> CrisisTextSecondaryDark
                        },
                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = incident.title,
                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                color = Color.White
            )

            Spacer(modifier = Modifier.height(4.dp))

            Text(
                text = incident.description,
                style = MaterialTheme.typography.bodySmall,
                color = CrisisTextSecondaryDark,
                maxLines = 2
            )

            Spacer(modifier = Modifier.height(10.dp))

            // Metadata Chips
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(10.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.WaterDrop,
                        contentDescription = "Depth",
                        tint = CrisisCyan,
                        modifier = Modifier.size(14.dp)
                    )
                    Spacer(modifier = Modifier.width(3.dp))
                    Text(
                        text = "${incident.waterDepthMeters}m depth",
                        style = MaterialTheme.typography.labelSmall,
                        color = CrisisCyan
                    )
                }

                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.Groups,
                        contentDescription = "Population",
                        tint = CrisisPrimaryAmber,
                        modifier = Modifier.size(14.dp)
                    )
                    Spacer(modifier = Modifier.width(3.dp))
                    Text(
                        text = "${incident.affectedPopulation} affected",
                        style = MaterialTheme.typography.labelSmall,
                        color = CrisisPrimaryAmber
                    )
                }

                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.Place,
                        contentDescription = "Location",
                        tint = CrisisTextMutedDark,
                        modifier = Modifier.size(14.dp)
                    )
                    Spacer(modifier = Modifier.width(3.dp))
                    Text(
                        text = incident.locationName,
                        style = MaterialTheme.typography.labelSmall,
                        color = CrisisTextMutedDark,
                        maxLines = 1
                    )
                }
            }

            if (incident.assignedResourceName != null) {
                Spacer(modifier = Modifier.height(8.dp))
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(CrisisNavyDark, RoundedCornerShape(6.dp))
                        .padding(horizontal = 8.dp, vertical = 4.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.DirectionsBoat,
                        contentDescription = "Assigned",
                        tint = CrisisGreen,
                        modifier = Modifier.size(14.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = "Assigned Unit: ${incident.assignedResourceName}",
                        style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Medium),
                        color = CrisisGreen
                    )
                }
            }
        }
    }
}
