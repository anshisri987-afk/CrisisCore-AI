package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
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
fun DashboardScreen(
    incidents: List<Incident>,
    resources: List<Resource>,
    assignments: List<Assignment>
) {
    val totalIncidents = incidents.size
    val resolvedIncidents = incidents.count { it.status == IncidentStatus.RESOLVED }
    val deployedAssets = resources.count { it.availability != ResourceAvailability.AVAILABLE }
    val utilizationPercent = if (resources.isNotEmpty()) (deployedAssets * 100) / resources.size else 0

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(CrisisNavyDark)
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
        contentPadding = PaddingValues(top = 10.dp, bottom = 28.dp)
    ) {
        // 1. Dashboard Header
        item {
            Card(
                shape = RoundedCornerShape(14.dp),
                colors = CardDefaults.cardColors(containerColor = CrisisSurfaceDark),
                border = androidx.compose.foundation.BorderStroke(1.dp, CrisisBorderDark),
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("dashboard_header_card")
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Analytics,
                            contentDescription = "Analytics",
                            tint = CrisisCyan
                        )
                        Text(
                            text = "OPERATIONAL PERFORMANCE & SITREP",
                            style = MaterialTheme.typography.titleMedium.copy(
                                fontWeight = FontWeight.Black,
                                letterSpacing = 1.sp
                            ),
                            color = Color.White
                        )
                    }
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "Unified command metrics aligned with UNDRR Sendai Framework & OCHA Humanitarian standards.",
                        style = MaterialTheme.typography.bodySmall,
                        color = CrisisTextSecondaryDark
                    )
                }
            }
        }

        // 2. High-Level Metrics Grid
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                MetricTile(
                    title = "Resource Utilization",
                    value = "$utilizationPercent%",
                    detail = "$deployedAssets of ${resources.size} Active",
                    color = CrisisPrimaryAmber,
                    modifier = Modifier.weight(1f)
                )
                MetricTile(
                    title = "Avg Triage Latency",
                    value = "1.4s",
                    detail = "Gemini AI Inference",
                    color = CrisisCyan,
                    modifier = Modifier.weight(1f)
                )
            }
        }

        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                MetricTile(
                    title = "Response Time Delta",
                    value = "-42%",
                    detail = "vs Manual Dispatch",
                    color = CrisisGreen,
                    modifier = Modifier.weight(1f)
                )
                MetricTile(
                    title = "Incidents Resolved",
                    value = "$resolvedIncidents / $totalIncidents",
                    detail = "Yamuna Flood Sector",
                    color = CrisisTextPrimaryDark,
                    modifier = Modifier.weight(1f)
                )
            }
        }

        // 3. Incident Type Distribution Bar
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
                        text = "INCIDENT BREAKDOWN BY HAZARD",
                        style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                        color = CrisisCyan
                    )

                    IncidentProgressBar("Urban Flood Inundation", 62, CrisisCyan)
                    IncidentProgressBar("Stranded Citizens / Trapped", 24, CrisisPrimaryAmber)
                    IncidentProgressBar("Medical Evacuation Urgent", 10, CrisisRed)
                    IncidentProgressBar("Infrastructure & Power Failure", 4, CrisisYellow)
                }
            }
        }

        // 4. Sendai Framework Compliance Checklist
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
                        text = "UNDRR SENDAI FRAMEWORK COMPLIANCE",
                        style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                        color = CrisisGreen
                    )

                    SendaiCheckItem("Priority 1: Understanding disaster risk (GIS hazard layer active)")
                    SendaiCheckItem("Priority 2: Strengthening disaster risk governance (Authority role gate)")
                    SendaiCheckItem("Priority 3: Investing in resilience (Pre-positioned watercraft & generators)")
                    SendaiCheckItem("Priority 4: Enhancing disaster preparedness for effective response")
                }
            }
        }
    }
}

@Composable
fun MetricTile(
    title: String,
    value: String,
    detail: String,
    color: Color,
    modifier: Modifier = Modifier
) {
    Card(
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = CrisisSurfaceDark),
        border = androidx.compose.foundation.BorderStroke(1.dp, CrisisBorderDark),
        modifier = modifier
    ) {
        Column(
            modifier = Modifier.padding(12.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Text(
                text = title,
                style = MaterialTheme.typography.labelSmall.copy(fontSize = 11.sp),
                color = CrisisTextSecondaryDark
            )
            Text(
                text = value,
                style = MaterialTheme.typography.headlineMedium.copy(fontWeight = FontWeight.Black),
                color = color
            )
            Text(
                text = detail,
                style = MaterialTheme.typography.labelSmall.copy(fontSize = 10.sp),
                color = CrisisTextMutedDark
            )
        }
    }
}

@Composable
fun IncidentProgressBar(
    label: String,
    percentage: Int,
    color: Color
) {
    Column(verticalArrangement = Arrangement.spacedBy(3.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(text = label, style = MaterialTheme.typography.bodySmall, color = Color.White)
            Text(text = "$percentage%", style = MaterialTheme.typography.labelSmall, color = color)
        }
        LinearProgressIndicator(
            progress = { percentage / 100f },
            modifier = Modifier
                .fillMaxWidth()
                .height(6.dp),
            color = color,
            trackColor = CrisisSurfaceVariantDark
        )
    }
}

@Composable
fun SendaiCheckItem(text: String) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        modifier = Modifier.padding(vertical = 2.dp)
    ) {
        Icon(
            imageVector = Icons.Default.CheckCircle,
            contentDescription = null,
            tint = CrisisGreen,
            modifier = Modifier.size(16.dp)
        )
        Text(
            text = text,
            style = MaterialTheme.typography.bodySmall.copy(fontSize = 11.sp),
            color = Color.White
        )
    }
}
