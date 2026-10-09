package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.AltRoute
import androidx.compose.material.icons.automirrored.filled.TrendingUp
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
import com.example.data.model.*
import com.example.ui.theme.*

@Composable
fun RouteTrackingScreen(
    assignments: List<Assignment>,
    incidents: List<Incident>,
    selectedIncident: Incident?,
    onUpdateStatus: (String, IncidentStatus) -> Unit
) {
    val activeAssignment = assignments.firstOrNull { it.status != AssignmentStatus.COMPLETED }
        ?: assignments.firstOrNull()

    val targetIncident = selectedIncident ?: incidents.find { it.incidentId == activeAssignment?.incidentId }
        ?: incidents.firstOrNull()

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(CrisisNavyDark)
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
        contentPadding = PaddingValues(top = 10.dp, bottom = 28.dp)
    ) {
        // 1. Navigation HUD Header
        item {
            Card(
                shape = RoundedCornerShape(14.dp),
                colors = CardDefaults.cardColors(containerColor = CrisisSurfaceDark),
                border = androidx.compose.foundation.BorderStroke(1.dp, CrisisCyan),
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("route_navigation_hud")
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Surface(
                            color = CrisisCyanDark,
                            shape = RoundedCornerShape(4.dp)
                        ) {
                            Text(
                                text = "LIVE TACTICAL ROUTE GUIDANCE",
                                style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                                color = Color.White,
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                            )
                        }

                        Text(
                            text = "ETA ${activeAssignment?.etaMinutes ?: 11} MINS",
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Black),
                            color = CrisisPrimaryAmber
                        )
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    Text(
                        text = targetIncident?.title ?: "Active Emergency Dispatch",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                        color = Color.White
                    )

                    Spacer(modifier = Modifier.height(4.dp))

                    Text(
                        text = "Assigned Unit: ${activeAssignment?.resourceName ?: "NDRF Swift Boat Alpha"}",
                        style = MaterialTheme.typography.bodySmall,
                        color = CrisisGreen
                    )

                    Spacer(modifier = Modifier.height(10.dp))

                    // Distance & Corridor Alert
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(CrisisNavyDark, RoundedCornerShape(8.dp))
                            .padding(10.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.AltRoute,
                            contentDescription = "Corridor",
                            tint = CrisisCyan,
                            modifier = Modifier.size(24.dp)
                        )
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "Flood-Safe Corridor: Northern Embankment Bypass",
                                style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                                color = Color.White
                            )
                            Text(
                                text = "Avoids submerged NH-24 underpass (water depth 2.4m)",
                                style = MaterialTheme.typography.bodySmall.copy(fontSize = 11.sp),
                                color = CrisisRed
                            )
                        }
                    }
                }
            }
        }

        // 2. Incident Lifecycle Progress Tracker (PRD Section 9)
        item {
            Card(
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = CrisisSurfaceDark),
                border = androidx.compose.foundation.BorderStroke(1.dp, CrisisBorderDark),
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("incident_lifecycle_timeline")
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text(
                        text = "INCIDENT RESPONSE LIFECYCLE",
                        style = MaterialTheme.typography.labelSmall.copy(
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 1.sp
                        ),
                        color = CrisisPrimaryAmber
                    )
                    Spacer(modifier = Modifier.height(10.dp))

                    val currentStep = targetIncident?.status?.stepIndex ?: 5

                    // Step progression
                    val steps = listOf(
                        "1. Reported",
                        "2. Classified",
                        "3. Prioritized",
                        "4. Resource Matched",
                        "5. Assigned",
                        "6. Responding",
                        "7. Resolved"
                    )

                    steps.forEachIndexed { idx, label ->
                        val stepNumber = idx + 1
                        val isCompleted = stepNumber <= currentStep
                        val isCurrent = stepNumber == currentStep

                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 4.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(22.dp)
                                    .clip(CircleShape)
                                    .background(
                                        when {
                                            isCurrent -> CrisisPrimaryAmber
                                            isCompleted -> CrisisGreen
                                            else -> CrisisSurfaceVariantDark
                                        }
                                    ),
                                contentAlignment = Alignment.Center
                            ) {
                                if (isCompleted && !isCurrent) {
                                    Icon(
                                        imageVector = Icons.Default.Check,
                                        contentDescription = null,
                                        tint = Color.White,
                                        modifier = Modifier.size(14.dp)
                                    )
                                } else {
                                    Text(
                                        text = "$stepNumber",
                                        style = MaterialTheme.typography.labelSmall.copy(fontSize = 10.sp, fontWeight = FontWeight.Bold),
                                        color = Color.White
                                    )
                                }
                            }

                            Spacer(modifier = Modifier.width(10.dp))

                            Text(
                                text = label,
                                style = MaterialTheme.typography.bodyMedium.copy(
                                    fontWeight = if (isCurrent) FontWeight.Bold else FontWeight.Normal
                                ),
                                color = when {
                                    isCurrent -> CrisisPrimaryAmber
                                    isCompleted -> Color.White
                                    else -> CrisisTextMutedDark
                                }
                            )

                            if (isCurrent) {
                                Spacer(modifier = Modifier.weight(1f))
                                Surface(
                                    color = CrisisPrimaryAmber.copy(alpha = 0.2f),
                                    shape = RoundedCornerShape(4.dp)
                                ) {
                                    Text(
                                        text = "CURRENT STAGE",
                                        style = MaterialTheme.typography.labelSmall.copy(fontSize = 9.sp, fontWeight = FontWeight.Bold),
                                        color = CrisisPrimaryAmber,
                                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }

        // 3. Turn-by-Turn Waypoint Guidance
        item {
            Card(
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = CrisisSurfaceDark),
                border = androidx.compose.foundation.BorderStroke(1.dp, CrisisBorderDark),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text(
                        text = "TACTICAL ROUTE WAYPOINTS",
                        style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                        color = CrisisCyan
                    )
                    Spacer(modifier = Modifier.height(10.dp))

                    val waypoints = listOf(
                        WaypointItem("0.0 km", "Depot Origin: NDRF Sector 1", "Depart base via elevated service lane", Icons.Default.Home),
                        WaypointItem("1.8 km", "Elevated Flyover Bypass", "Clear high ground; maintain green channel speed", Icons.AutoMirrored.Filled.TrendingUp),
                        WaypointItem("3.2 km", "Bund Entry Point C", "Water starts at 0.4m; lower boat engine draft", Icons.Default.WaterDrop),
                        WaypointItem("4.1 km", "Hospital ICU Target Site", "Prepare stretchers and evacuation lifelines", Icons.Default.Flag)
                    )

                    waypoints.forEach { wp ->
                        Row(
                            verticalAlignment = Alignment.Top,
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 6.dp)
                        ) {
                            Icon(
                                imageVector = wp.icon,
                                contentDescription = null,
                                tint = CrisisCyan,
                                modifier = Modifier
                                    .size(20.dp)
                                    .padding(top = 2.dp)
                            )
                            Spacer(modifier = Modifier.width(10.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Text(
                                        text = wp.title,
                                        style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold),
                                        color = Color.White
                                    )
                                    Text(
                                        text = wp.distance,
                                        style = MaterialTheme.typography.labelSmall,
                                        color = CrisisCyan
                                    )
                                }
                                Text(
                                    text = wp.instruction,
                                    style = MaterialTheme.typography.bodySmall,
                                    color = CrisisTextSecondaryDark
                                )
                            }
                        }
                    }
                }
            }
        }

        // 4. Responder Action Buttons
        item {
            Card(
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = CrisisSurfaceDark),
                border = androidx.compose.foundation.BorderStroke(1.dp, CrisisBorderDark),
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("responder_action_panel")
            ) {
                Column(
                    modifier = Modifier.padding(14.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Text(
                        text = "RESPONDER ACTIONS (FIELD TELEMETRY)",
                        style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                        color = CrisisTextSecondaryDark
                    )

                    val incId = targetIncident?.incidentId ?: "INC-101"

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Button(
                            onClick = { onUpdateStatus(incId, IncidentStatus.RESPONDING) },
                            colors = ButtonDefaults.buttonColors(containerColor = CrisisPrimaryAmber),
                            shape = RoundedCornerShape(8.dp),
                            modifier = Modifier
                                .weight(1f)
                                .testTag("btn_en_route")
                        ) {
                            Text("En Route", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }

                        Button(
                            onClick = { onUpdateStatus(incId, IncidentStatus.RESOLVED) },
                            colors = ButtonDefaults.buttonColors(containerColor = CrisisGreen),
                            shape = RoundedCornerShape(8.dp),
                            modifier = Modifier
                                .weight(1f)
                                .testTag("btn_resolved")
                        ) {
                            Text("Mark Resolved", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}

private data class WaypointItem(
    val distance: String,
    val title: String,
    val instruction: String,
    val icon: androidx.compose.ui.graphics.vector.ImageVector
)
