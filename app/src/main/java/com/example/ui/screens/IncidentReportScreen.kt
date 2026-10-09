package com.example.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
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
import com.example.data.model.IncidentType
import com.example.data.model.Severity
import com.example.data.model.Urgency
import com.example.ui.IncidentFormState
import com.example.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun IncidentReportScreen(
    formState: IncidentFormState,
    onUpdateForm: ((IncidentFormState) -> IncidentFormState) -> Unit,
    onRunAiPreTriage: () -> Unit,
    onSubmit: () -> Unit
) {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(CrisisNavyDark)
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
        contentPadding = PaddingValues(top = 10.dp, bottom = 32.dp)
    ) {
        // 1. Header Banner
        item {
            Card(
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = CrisisSurfaceDark),
                border = androidx.compose.foundation.BorderStroke(1.dp, CrisisBorderDark),
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("report_header_card")
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.AddAlert,
                            contentDescription = "Report",
                            tint = CrisisPrimaryAmber
                        )
                        Text(
                            text = "EMERGENCY INCIDENT INTAKE",
                            style = MaterialTheme.typography.titleMedium.copy(
                                fontWeight = FontWeight.Black,
                                letterSpacing = 1.sp
                            ),
                            color = Color.White
                        )
                    }
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "Real-time dispatch system. Multi-source citizen & responder telemetry. AI pre-triage verifies severity before queueing.",
                        style = MaterialTheme.typography.bodySmall,
                        color = CrisisTextSecondaryDark
                    )
                }
            }
        }

        // 2. Incident Title Input
        item {
            OutlinedTextField(
                value = formState.title,
                onValueChange = { newTitle -> onUpdateForm { it.copy(title = newTitle) } },
                label = { Text("Incident Title / Emergency Summary") },
                placeholder = { Text("e.g. 15 Stranded on Rooftop, Yamuna Bund Sector 4") },
                singleLine = true,
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = CrisisPrimaryAmber,
                    unfocusedBorderColor = CrisisBorderDark,
                    focusedTextColor = Color.White,
                    unfocusedTextColor = Color.White,
                    focusedLabelColor = CrisisPrimaryAmber,
                    unfocusedLabelColor = CrisisTextSecondaryDark
                ),
                shape = RoundedCornerShape(10.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("input_incident_title")
            )
        }

        // 3. Category Selector
        item {
            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Text(
                    text = "Incident Category",
                    style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                    color = CrisisTextSecondaryDark
                )
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    IncidentType.values().take(3).forEach { cat ->
                        FilterChip(
                            selected = formState.type == cat,
                            onClick = { onUpdateForm { it.copy(type = cat) } },
                            label = { Text(cat.displayName, fontSize = 11.sp) },
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = CrisisPrimaryAmber,
                                selectedLabelColor = Color.White
                            ),
                            modifier = Modifier.weight(1f)
                        )
                    }
                }
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    IncidentType.values().drop(3).forEach { cat ->
                        FilterChip(
                            selected = formState.type == cat,
                            onClick = { onUpdateForm { it.copy(type = cat) } },
                            label = { Text(cat.displayName, fontSize = 11.sp) },
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = CrisisPrimaryAmber,
                                selectedLabelColor = Color.White
                            ),
                            modifier = Modifier.weight(1f)
                        )
                    }
                }
            }
        }

        // 4. Severity & Urgency Selection
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                // Severity
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = "Severity",
                        style = MaterialTheme.typography.labelSmall,
                        color = CrisisTextSecondaryDark
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                        Severity.values().forEach { sev ->
                            Surface(
                                color = if (formState.severity == sev) {
                                    when (sev) {
                                        Severity.CRITICAL -> CrisisRed
                                        Severity.HIGH -> CrisisPrimaryAmber
                                        Severity.MEDIUM -> CrisisYellow
                                        Severity.LOW -> CrisisCyan
                                    }
                                } else CrisisSurfaceDark,
                                shape = RoundedCornerShape(6.dp),
                                modifier = Modifier
                                    .weight(1f)
                                    .border(1.dp, CrisisBorderDark, RoundedCornerShape(6.dp))
                            ) {
                                IconButton(
                                    onClick = { onUpdateForm { it.copy(severity = sev) } },
                                    modifier = Modifier.height(36.dp)
                                ) {
                                    Text(
                                        text = sev.name.take(4),
                                        style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                                        color = if (formState.severity == sev) Color.White else CrisisTextSecondaryDark
                                    )
                                }
                            }
                        }
                    }
                }

                // Urgency
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = "Urgency",
                        style = MaterialTheme.typography.labelSmall,
                        color = CrisisTextSecondaryDark
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                        Urgency.values().forEach { urg ->
                            Surface(
                                color = if (formState.urgency == urg) CrisisPrimaryAmber else CrisisSurfaceDark,
                                shape = RoundedCornerShape(6.dp),
                                modifier = Modifier
                                    .weight(1f)
                                    .border(1.dp, CrisisBorderDark, RoundedCornerShape(6.dp))
                            ) {
                                IconButton(
                                    onClick = { onUpdateForm { it.copy(urgency = urg) } },
                                    modifier = Modifier.height(36.dp)
                                ) {
                                    Text(
                                        text = when (urg) {
                                            Urgency.IMMEDIATE -> "NOW"
                                            Urgency.HIGH -> "<45m"
                                            Urgency.NORMAL -> "NORM"
                                        },
                                        style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                                        color = if (formState.urgency == urg) Color.White else CrisisTextSecondaryDark
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }

        // 5. Environmental Flood Parameters (Water depth & victims)
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
                    // Water Depth
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.WaterDrop,
                                contentDescription = "Water",
                                tint = CrisisCyan,
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "Estimated Water Depth:",
                                style = MaterialTheme.typography.bodyMedium,
                                color = Color.White
                            )
                        }
                        Text(
                            text = String.format("%.1f meters", formState.waterDepthMeters),
                            style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                            color = CrisisCyan
                        )
                    }

                    Slider(
                        value = formState.waterDepthMeters.toFloat(),
                        onValueChange = { newVal ->
                            onUpdateForm { it.copy(waterDepthMeters = (newVal * 10).toInt() / 10.0) }
                        },
                        valueRange = 0.2f..4.0f,
                        colors = SliderDefaults.colors(
                            thumbColor = CrisisCyan,
                            activeTrackColor = CrisisCyan,
                            inactiveTrackColor = CrisisSurfaceVariantDark
                        )
                    )

                    // Affected Population
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.Groups,
                                contentDescription = "People",
                                tint = CrisisPrimaryAmber,
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "Estimated Victims / Trapped:",
                                style = MaterialTheme.typography.bodyMedium,
                                color = Color.White
                            )
                        }

                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            FilledTonalIconButton(
                                onClick = {
                                    if (formState.affectedPopulation > 1) {
                                        onUpdateForm { it.copy(affectedPopulation = it.affectedPopulation - 1) }
                                    }
                                },
                                modifier = Modifier.size(32.dp)
                            ) {
                                Text("-", fontWeight = FontWeight.Bold, color = Color.White)
                            }
                            Text(
                                text = "${formState.affectedPopulation}",
                                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                                color = Color.White
                            )
                            FilledTonalIconButton(
                                onClick = {
                                    onUpdateForm { it.copy(affectedPopulation = it.affectedPopulation + 5) }
                                },
                                modifier = Modifier.size(32.dp)
                            ) {
                                Text("+", fontWeight = FontWeight.Bold, color = Color.White)
                            }
                        }
                    }
                }
            }
        }

        // 6. Location Tagging
        item {
            OutlinedTextField(
                value = formState.locationName,
                onValueChange = { newLoc -> onUpdateForm { it.copy(locationName = newLoc) } },
                label = { Text("Incident Location / Landmark") },
                placeholder = { Text("e.g. Near Geeta Colony Flyover, Pillar 48") },
                leadingIcon = {
                    Icon(
                        imageVector = Icons.Default.Place,
                        contentDescription = "Location",
                        tint = CrisisPrimaryAmber
                    )
                },
                trailingIcon = {
                    IconButton(
                        onClick = {
                            onUpdateForm {
                                it.copy(
                                    locationName = "Sector 14 Bund Road (GPS Tagged)",
                                    latitude = 28.6185,
                                    longitude = 77.2210
                                )
                            }
                        }
                    ) {
                        Icon(
                            imageVector = Icons.Default.MyLocation,
                            contentDescription = "GPS",
                            tint = CrisisCyan
                        )
                    }
                },
                singleLine = true,
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = CrisisPrimaryAmber,
                    unfocusedBorderColor = CrisisBorderDark,
                    focusedTextColor = Color.White,
                    unfocusedTextColor = Color.White
                ),
                shape = RoundedCornerShape(10.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("input_location_name")
            )
        }

        // 7. Detailed Description
        item {
            OutlinedTextField(
                value = formState.description,
                onValueChange = { newDesc -> onUpdateForm { it.copy(description = newDesc) } },
                label = { Text("Incident Description & Urgent Needs") },
                placeholder = { Text("Water current is strong, electric cables submerged, need immediate boat and food...") },
                minLines = 3,
                maxLines = 5,
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = CrisisPrimaryAmber,
                    unfocusedBorderColor = CrisisBorderDark,
                    focusedTextColor = Color.White,
                    unfocusedTextColor = Color.White
                ),
                shape = RoundedCornerShape(10.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("input_description")
            )
        }

        // 8. AI Pre-Triage Assessment Trigger & Results
        item {
            Card(
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = CrisisSurfaceVariantDark),
                border = androidx.compose.foundation.BorderStroke(1.dp, CrisisCyan),
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("ai_pre_triage_section")
            ) {
                Column(
                    modifier = Modifier.padding(14.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.Psychology,
                                contentDescription = "Gemini",
                                tint = CrisisCyan
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "Gemini AI Incident Pre-Triage",
                                style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                                color = CrisisCyan
                            )
                        }

                        Button(
                            onClick = onRunAiPreTriage,
                            enabled = !formState.isAnalyzing,
                            colors = ButtonDefaults.buttonColors(containerColor = CrisisCyanDark),
                            shape = RoundedCornerShape(8.dp),
                            contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp),
                            modifier = Modifier.testTag("run_ai_triage_button")
                        ) {
                            if (formState.isAnalyzing) {
                                CircularProgressIndicator(color = Color.White, modifier = Modifier.size(14.dp), strokeWidth = 2.dp)
                            } else {
                                Text("Analyze Risk", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }

                    if (formState.aiTriageSuggestion != null) {
                        val suggestion = formState.aiTriageSuggestion
                        HorizontalDivider(color = CrisisBorderDark, thickness = 1.dp)
                        Text(
                            text = "AI Assessment: Priority Score ${suggestion.priorityScore}/100",
                            style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                            color = CrisisPrimaryAmber
                        )
                        Text(
                            text = "Recommended Asset: ${suggestion.recommendedResource}",
                            style = MaterialTheme.typography.bodySmall.copy(fontWeight = FontWeight.Bold),
                            color = CrisisGreen
                        )
                        Text(
                            text = suggestion.reasoning,
                            style = MaterialTheme.typography.bodySmall,
                            color = CrisisTextPrimaryDark
                        )
                    } else {
                        Text(
                            text = "Tap 'Analyze Risk' to allow Gemini to calculate urgency, priority score, and optimal resource recommendation.",
                            style = MaterialTheme.typography.bodySmall,
                            color = CrisisTextSecondaryDark
                        )
                    }
                }
            }
        }

        // 9. Submit Button
        item {
            Button(
                onClick = onSubmit,
                colors = ButtonDefaults.buttonColors(containerColor = CrisisPrimaryAmber),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp)
                    .testTag("submit_incident_button")
            ) {
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.Send,
                    contentDescription = "Submit",
                    modifier = Modifier.size(20.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "TRANSMIT DISASTER REPORT",
                    style = MaterialTheme.typography.titleSmall.copy(
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.sp
                    )
                )
            }
        }
    }
}
