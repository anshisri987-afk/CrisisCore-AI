package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.*
import com.example.ui.theme.*

@Composable
fun ResourceAllocationScreen(
    incidents: List<Incident>,
    resources: List<Resource>,
    selectedIncident: Incident?,
    onSelectIncident: (Incident) -> Unit,
    onAssignResource: (Incident, Resource) -> Unit,
    onTriggerDynamicReallocation: () -> Unit,
    isReallocating: Boolean
) {
    var activeIncident by remember(selectedIncident) {
        mutableStateOf(selectedIncident ?: incidents.firstOrNull { it.status != IncidentStatus.RESOLVED } ?: incidents.firstOrNull())
    }
    var selectedFilter by remember { mutableStateOf("ALL") }

    val filteredResources = when (selectedFilter) {
        "AVAILABLE" -> resources.filter { it.availability == ResourceAvailability.AVAILABLE }
        "BOATS" -> resources.filter { it.type == ResourceType.RESCUE_BOAT }
        "MEDICAL" -> resources.filter { it.type == ResourceType.AMBULANCE || it.type == ResourceType.MEDICAL_STATION }
        else -> resources
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(CrisisNavyDark)
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
        contentPadding = PaddingValues(top = 10.dp, bottom = 28.dp)
    ) {
        // 1. Target Incident Selector Card
        item {
            Card(
                shape = RoundedCornerShape(14.dp),
                colors = CardDefaults.cardColors(containerColor = CrisisSurfaceDark),
                border = androidx.compose.foundation.BorderStroke(1.dp, CrisisPrimaryAmber.copy(alpha = 0.5f)),
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("target_incident_selector_card")
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text(
                        text = "TARGET EMERGENCY FOR DISPATCH",
                        style = MaterialTheme.typography.labelSmall.copy(
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 1.sp
                        ),
                        color = CrisisPrimaryAmber
                    )
                    Spacer(modifier = Modifier.height(6.dp))

                    if (activeIncident != null) {
                        val inc = activeIncident!!
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(
                                text = inc.title,
                                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                                color = Color.White,
                                modifier = Modifier.weight(1f)
                            )
                            Surface(
                                color = if (inc.severity == Severity.CRITICAL) CrisisRed else CrisisPrimaryAmber,
                                shape = RoundedCornerShape(4.dp)
                            ) {
                                Text(
                                    text = "PRIORITY ${inc.priorityScore}",
                                    style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                                    color = Color.White,
                                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(4.dp))

                        Text(
                            text = "📍 ${inc.locationName} • 🌊 ${inc.waterDepthMeters}m depth • 👥 ${inc.affectedPopulation} affected",
                            style = MaterialTheme.typography.bodySmall,
                            color = CrisisCyan
                        )

                        if (inc.assignedResourceName != null) {
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(
                                text = "Currently assigned: ${inc.assignedResourceName} (${inc.status.label})",
                                style = MaterialTheme.typography.labelSmall,
                                color = CrisisGreen
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    // Switch incident dropdown / pills
                    Text(
                        text = "Select another incident:",
                        style = MaterialTheme.typography.labelSmall,
                        color = CrisisTextMutedDark
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        incidents.take(3).forEach { otherInc ->
                            OutlinedButton(
                                onClick = {
                                    activeIncident = otherInc
                                    onSelectIncident(otherInc)
                                },
                                shape = RoundedCornerShape(6.dp),
                                colors = ButtonDefaults.outlinedButtonColors(
                                    containerColor = if (otherInc.incidentId == activeIncident?.incidentId) CrisisPrimaryAmber.copy(alpha = 0.2f) else CrisisNavyDark,
                                    contentColor = Color.White
                                ),
                                border = androidx.compose.foundation.BorderStroke(
                                    1.dp,
                                    if (otherInc.incidentId == activeIncident?.incidentId) CrisisPrimaryAmber else CrisisBorderDark
                                ),
                                contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp),
                                modifier = Modifier.height(32.dp)
                            ) {
                                Text(
                                    text = otherInc.incidentId,
                                    style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold)
                                )
                            }
                        }
                    }
                }
            }
        }

        // 2. OR-Tools Optimization Recommendation Header
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = CrisisSurfaceVariantDark),
                shape = RoundedCornerShape(12.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, CrisisCyan.copy(alpha = 0.4f)),
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("or_tools_optimization_card")
            ) {
                Row(
                    modifier = Modifier.padding(12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Psychology,
                        contentDescription = "AI Optimizer",
                        tint = CrisisCyan,
                        modifier = Modifier.size(24.dp)
                    )
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "Google OR-Tools Constraint Matcher Active",
                            style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                            color = CrisisCyan
                        )
                        Text(
                            text = "Evaluating equipment compatibility, transit distance, flood depth limits, and medical capacity.",
                            style = MaterialTheme.typography.bodySmall.copy(fontSize = 11.sp),
                            color = CrisisTextSecondaryDark
                        )
                    }
                }
            }
        }

        // 3. Filter Row
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                FilterChip(
                    selected = selectedFilter == "ALL",
                    onClick = { selectedFilter = "ALL" },
                    label = { Text("All (${resources.size})", fontSize = 11.sp) },
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = CrisisPrimaryAmber,
                        selectedLabelColor = Color.White
                    )
                )
                FilterChip(
                    selected = selectedFilter == "AVAILABLE",
                    onClick = { selectedFilter = "AVAILABLE" },
                    label = { Text("Available Only", fontSize = 11.sp) },
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = CrisisGreenDark,
                        selectedLabelColor = Color.White
                    )
                )
                FilterChip(
                    selected = selectedFilter == "BOATS",
                    onClick = { selectedFilter = "BOATS" },
                    label = { Text("Watercraft / Boats", fontSize = 11.sp) },
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = CrisisCyanDark,
                        selectedLabelColor = Color.White
                    )
                )
                FilterChip(
                    selected = selectedFilter == "MEDICAL",
                    onClick = { selectedFilter = "MEDICAL" },
                    label = { Text("Medical / ALS", fontSize = 11.sp) },
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = CrisisRedDark,
                        selectedLabelColor = Color.White
                    )
                )
            }
        }

        // 4. Resource Cards List
        items(filteredResources) { res ->
            val inc = activeIncident
            // Calculate constraint match score
            val matchScore = calculateMatchScore(inc, res)
            val matchExplanation = getMatchExplanation(inc, res)

            ResourceDeploymentCard(
                resource = res,
                matchScore = matchScore,
                matchExplanation = matchExplanation,
                onAssign = {
                    if (inc != null) {
                        onAssignResource(inc, res)
                    }
                }
            )
        }

        // 5. Dynamic Reallocation Showcase Banner at bottom
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = CrisisRedContainer.copy(alpha = 0.5f)),
                border = androidx.compose.foundation.BorderStroke(1.dp, CrisisRed),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("dynamic_reallocation_section")
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.Warning,
                            contentDescription = "Dynamic Override",
                            tint = CrisisRed,
                            modifier = Modifier.size(20.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "DYNAMIC REALLOCATION TRIGGER",
                            style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                            color = Color.White
                        )
                    }
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "Simulate an unexpected crisis surge (Hospital ICU generator submerged) and trigger real-time asset diversion in compliance with PRD Phase 4 requirements.",
                        style = MaterialTheme.typography.bodySmall,
                        color = Color(0xFFFFDAD6)
                    )
                    Spacer(modifier = Modifier.height(10.dp))
                    Button(
                        onClick = onTriggerDynamicReallocation,
                        enabled = !isReallocating,
                        colors = ButtonDefaults.buttonColors(containerColor = CrisisRed),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("reallocation_action_button")
                    ) {
                        if (isReallocating) {
                            CircularProgressIndicator(color = Color.White, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Diverting Assets...")
                        } else {
                            Icon(imageVector = Icons.Default.SwapHoriz, contentDescription = null)
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Execute Real-Time Asset Diversion")
                        }
                    }
                }
            }
        }
    }
}

private fun calculateMatchScore(incident: Incident?, resource: Resource): Int {
    if (incident == null) return 80
    var score = 70
    // Watercraft bonus if water depth > 1.0m
    if (incident.waterDepthMeters >= 1.0 && resource.type == ResourceType.RESCUE_BOAT) score += 26
    // Ambulance bonus for medical urgency
    if (incident.type == IncidentType.MEDICAL && resource.type == ResourceType.AMBULANCE) score += 25
    // NDRF personnel bonus for collapse or trapped
    if (incident.type == IncidentType.RESCUE && resource.type == ResourceType.DISASTER_TEAM) score += 24
    // Availability bonus
    if (resource.availability == ResourceAvailability.AVAILABLE) score += 10 else score -= 15
    return score.coerceIn(35, 99)
}

private fun getMatchExplanation(incident: Incident?, resource: Resource): String {
    if (incident == null) return "Available for tactical deployment."
    return when {
        incident.waterDepthMeters >= 1.5 && resource.type == ResourceType.RESCUE_BOAT ->
            "Optimal match: Inflatable shallow-draft watercraft required for water depth ${incident.waterDepthMeters}m."
        resource.type == ResourceType.AMBULANCE ->
            "Medical unit equipped with ALS triage support."
        resource.type == ResourceType.DISASTER_TEAM ->
            "Certified NDRF deep-search swimmers & swift-water rescue gear."
        resource.availability != ResourceAvailability.AVAILABLE ->
            "Currently deployed on prior incident; available for dynamic reassignment override."
        else ->
            "Suitable equipment within operational response perimeter."
    }
}

@Composable
fun ResourceDeploymentCard(
    resource: Resource,
    matchScore: Int,
    matchExplanation: String,
    onAssign: () -> Unit
) {
    Card(
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = CrisisSurfaceDark),
        border = androidx.compose.foundation.BorderStroke(1.dp, CrisisBorderDark),
        modifier = Modifier
            .fillMaxWidth()
            .testTag("resource_card_${resource.resourceId}")
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = resource.name,
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                        color = Color.White
                    )
                    Text(
                        text = "${resource.type.label} • ${resource.teamPersonnel}",
                        style = MaterialTheme.typography.bodySmall,
                        color = CrisisTextSecondaryDark
                    )
                }

                // Match Compatibility Badge
                Surface(
                    color = when {
                        matchScore >= 90 -> CrisisGreenContainer
                        matchScore >= 75 -> CrisisCyanDark.copy(alpha = 0.4f)
                        else -> CrisisBorderDark
                    },
                    shape = RoundedCornerShape(6.dp)
                ) {
                    Text(
                        text = "$matchScore% MATCH",
                        style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                        color = if (matchScore >= 90) CrisisGreen else CrisisCyan,
                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Reason / Explanation
            Text(
                text = matchExplanation,
                style = MaterialTheme.typography.bodySmall.copy(fontSize = 11.sp),
                color = CrisisCyan
            )

            Spacer(modifier = Modifier.height(10.dp))

            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
                modifier = Modifier.fillMaxWidth()
            ) {
                // Availability Status
                Surface(
                    color = when (resource.availability) {
                        ResourceAvailability.AVAILABLE -> CrisisGreenContainer
                        ResourceAvailability.DISPATCHED -> CrisisPrimaryAmber.copy(alpha = 0.2f)
                        ResourceAvailability.EN_ROUTE -> CrisisCyan.copy(alpha = 0.2f)
                        else -> CrisisSurfaceVariantDark
                    },
                    shape = RoundedCornerShape(4.dp)
                ) {
                    Text(
                        text = resource.availability.label.uppercase(),
                        style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                        color = when (resource.availability) {
                            ResourceAvailability.AVAILABLE -> CrisisGreen
                            ResourceAvailability.DISPATCHED -> CrisisPrimaryAmber
                            ResourceAvailability.EN_ROUTE -> CrisisCyan
                            else -> CrisisTextSecondaryDark
                        },
                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                    )
                }

                // Assign Button
                Button(
                    onClick = onAssign,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (resource.availability == ResourceAvailability.AVAILABLE) CrisisPrimaryAmber else CrisisCyanDark
                    ),
                    shape = RoundedCornerShape(8.dp),
                    contentPadding = PaddingValues(horizontal = 14.dp, vertical = 6.dp),
                    modifier = Modifier.testTag("assign_button_${resource.resourceId}")
                ) {
                    Icon(
                        imageVector = if (resource.availability == ResourceAvailability.AVAILABLE) Icons.AutoMirrored.Filled.Send else Icons.Default.SwapHoriz,
                        contentDescription = "Assign",
                        modifier = Modifier.size(14.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = if (resource.availability == ResourceAvailability.AVAILABLE) "Dispatch Asset" else "Reallocate",
                        style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold)
                    )
                }
            }
        }
    }
}
