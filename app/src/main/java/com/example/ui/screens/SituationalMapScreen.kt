package com.example.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.*
import com.example.ui.AppScreen
import com.example.ui.theme.*

@Composable
fun SituationalMapScreen(
    incidents: List<Incident>,
    resources: List<Resource>,
    selectedIncident: Incident?,
    onSelectIncident: (Incident) -> Unit,
    onNavigate: (AppScreen) -> Unit
) {
    var activeFilter by remember { mutableStateOf("ALL") }
    var focusedIncident by remember { mutableStateOf<Incident?>(selectedIncident ?: incidents.firstOrNull()) }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(CrisisNavyDark)
    ) {
        // 1. Tactical Vector Canvas Map
        Canvas(
            modifier = Modifier
                .fillMaxSize()
                .pointerInput(Unit) {
                    detectTapGestures { offset ->
                        // Select closest incident by canvas coordinates
                        val width = size.width
                        val height = size.height

                        var closest: Incident? = null
                        var minDistance = Float.MAX_VALUE

                        incidents.forEachIndexed { idx, inc ->
                            val x = (0.2f + (idx * 0.15f)) * width
                            val y = (0.25f + ((idx % 3) * 0.22f)) * height
                            val dist = kotlin.math.hypot(offset.x - x, offset.y - y)
                            if (dist < minDistance && dist < 120f) {
                                minDistance = dist
                                closest = inc
                            }
                        }
                        if (closest != null) {
                            focusedIncident = closest
                            onSelectIncident(closest!!)
                        }
                    }
                }
                .testTag("tactical_gis_map_canvas")
        ) {
            val width = size.width
            val height = size.height

            // A. Draw Grid lines (Tactical GIS coordinate grid)
            val gridColor = Color(0xFF132438)
            val step = 60.dp.toPx()
            for (x in 0..(width / step).toInt()) {
                drawLine(
                    color = gridColor,
                    start = Offset(x * step, 0f),
                    end = Offset(x * step, height),
                    strokeWidth = 1f
                )
            }
            for (y in 0..(height / step).toInt()) {
                drawLine(
                    color = gridColor,
                    start = Offset(0f, y * step),
                    end = Offset(width, y * step),
                    strokeWidth = 1f
                )
            }

            // B. Draw River / Flood Inundation Corridor
            val riverPath = Path().apply {
                moveTo(width * 0.15f, 0f)
                cubicTo(
                    width * 0.45f, height * 0.25f,
                    width * 0.35f, height * 0.55f,
                    width * 0.75f, height * 0.85f
                )
                lineTo(width * 0.95f, height)
                lineTo(width * 0.70f, height)
                cubicTo(
                    width * 0.25f, height * 0.65f,
                    width * 0.28f, height * 0.35f,
                    width * 0.05f, 0f
                )
                close()
            }

            drawPath(
                path = riverPath,
                brush = Brush.verticalGradient(
                    listOf(
                        Color(0xFF003049).copy(alpha = 0.5f),
                        Color(0xFF023E8A).copy(alpha = 0.65f),
                        Color(0xFF0077B6).copy(alpha = 0.75f)
                    )
                )
            )

            // Flood Inundation Hazard Polygon (Sector B & Mayur Vihar breached zone)
            val hazardPolygon = Path().apply {
                moveTo(width * 0.30f, height * 0.32f)
                lineTo(width * 0.72f, height * 0.28f)
                lineTo(width * 0.82f, height * 0.55f)
                lineTo(width * 0.50f, height * 0.62f)
                lineTo(width * 0.25f, height * 0.48f)
                close()
            }
            drawPath(
                path = hazardPolygon,
                color = Color(0xFFD90429).copy(alpha = 0.18f)
            )
            drawPath(
                path = hazardPolygon,
                color = CrisisRed.copy(alpha = 0.5f),
                style = Stroke(
                    width = 2.dp.toPx(),
                    pathEffect = PathEffect.dashPathEffect(floatArrayOf(15f, 15f))
                )
            )

            // C. Draw Tactical Navigation Route (if incident has assignment)
            val assignedInc = focusedIncident
            if (assignedInc != null) {
                val incX = width * 0.55f
                val incY = height * 0.42f
                val depotX = width * 0.18f
                val depotY = height * 0.75f

                val routePath = Path().apply {
                    moveTo(depotX, depotY)
                    lineTo(width * 0.25f, height * 0.58f)
                    lineTo(width * 0.42f, height * 0.48f)
                    lineTo(incX, incY)
                }

                // Glow route line
                drawPath(
                    path = routePath,
                    color = CrisisCyan.copy(alpha = 0.3f),
                    style = Stroke(width = 8.dp.toPx())
                )
                drawPath(
                    path = routePath,
                    color = CrisisCyan,
                    style = Stroke(
                        width = 3.dp.toPx(),
                        pathEffect = PathEffect.dashPathEffect(floatArrayOf(20f, 10f))
                    )
                )
            }

            // D. Draw Resource Locations (Depots / Moving Units)
            resources.forEachIndexed { i, res ->
                val rx = (0.15f + (i * 0.14f)) * width
                val ry = (0.70f + ((i % 2) * 0.08f)) * height

                // Resource Circle
                drawCircle(
                    color = CrisisGreen.copy(alpha = 0.25f),
                    radius = 20.dp.toPx(),
                    center = Offset(rx, ry)
                )
                drawCircle(
                    color = CrisisGreen,
                    radius = 8.dp.toPx(),
                    center = Offset(rx, ry)
                )
            }

            // E. Draw Incident Markers
            incidents.forEachIndexed { idx, inc ->
                val ix = (0.2f + (idx * 0.15f)) * width
                val iy = (0.25f + ((idx % 3) * 0.22f)) * height

                val isSelected = inc.incidentId == focusedIncident?.incidentId
                val markerColor = when (inc.severity) {
                    Severity.CRITICAL -> CrisisRed
                    Severity.HIGH -> CrisisPrimaryAmber
                    Severity.MEDIUM -> CrisisYellow
                    Severity.LOW -> CrisisCyan
                }

                // Pulsing outer halo for Critical or Selected
                if (inc.severity == Severity.CRITICAL || isSelected) {
                    drawCircle(
                        color = markerColor.copy(alpha = 0.35f),
                        radius = if (isSelected) 26.dp.toPx() else 18.dp.toPx(),
                        center = Offset(ix, iy)
                    )
                }

                drawCircle(
                    color = markerColor,
                    radius = if (isSelected) 12.dp.toPx() else 9.dp.toPx(),
                    center = Offset(ix, iy)
                )
                drawCircle(
                    color = Color.White,
                    radius = 4.dp.toPx(),
                    center = Offset(ix, iy)
                )
            }
        }

        // 2. Map HUD Overlay (Layer Chips & Legend)
        Column(
            modifier = Modifier
                .align(Alignment.TopStart)
                .fillMaxWidth()
                .padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            // Filter Pills
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                FilterChip(
                    selected = activeFilter == "ALL",
                    onClick = { activeFilter = "ALL" },
                    label = { Text("All Assets", fontSize = 11.sp) },
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = CrisisPrimaryAmber,
                        selectedLabelColor = Color.White
                    ),
                    modifier = Modifier.testTag("filter_all")
                )
                FilterChip(
                    selected = activeFilter == "FLOOD",
                    onClick = { activeFilter = "FLOOD" },
                    label = { Text("Water Level > 1m", fontSize = 11.sp) },
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = CrisisCyanDark,
                        selectedLabelColor = Color.White
                    ),
                    modifier = Modifier.testTag("filter_flood")
                )
                FilterChip(
                    selected = activeFilter == "BOATS",
                    onClick = { activeFilter = "BOATS" },
                    label = { Text("Rescue Boats", fontSize = 11.sp) },
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = CrisisGreenDark,
                        selectedLabelColor = Color.White
                    ),
                    modifier = Modifier.testTag("filter_boats")
                )
            }

            // Tactical Telemetry Badge
            Surface(
                color = CrisisNavyDark.copy(alpha = 0.9f),
                shape = RoundedCornerShape(8.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, CrisisBorderDark),
                modifier = Modifier.padding(top = 2.dp)
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(8.dp)
                            .clip(CircleShape)
                            .background(CrisisRed)
                    )
                    Text(
                        text = "LIVE GIS: YAMUNA BASIN SECTOR 1-5 • HAZARD RED ZONE ACTIVE",
                        style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold, fontSize = 9.sp),
                        color = Color.White
                    )
                }
            }
        }

        // 3. Bottom Tactical Drawer for Selected Incident
        if (focusedIncident != null) {
            val inc = focusedIncident!!
            Card(
                shape = RoundedCornerShape(topStart = 20.dp, topEnd = 20.dp),
                colors = CardDefaults.cardColors(containerColor = CrisisSurfaceDark),
                border = androidx.compose.foundation.BorderStroke(1.dp, CrisisBorderDark),
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .fillMaxWidth()
                    .testTag("map_marker_detail_card")
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Surface(
                            color = when (inc.severity) {
                                Severity.CRITICAL -> CrisisRed
                                Severity.HIGH -> CrisisPrimaryAmber
                                else -> CrisisYellow
                            },
                            shape = RoundedCornerShape(6.dp)
                        ) {
                            Text(
                                text = "${inc.severity.name} • ${inc.urgency.name}",
                                style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                                color = Color.White,
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                            )
                        }

                        Text(
                            text = "Priority Score: ${inc.priorityScore}/100",
                            style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                            color = CrisisCyan
                        )
                    }

                    Text(
                        text = inc.title,
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                        color = Color.White
                    )

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Text(
                            text = "📍 ${inc.locationName}",
                            style = MaterialTheme.typography.bodySmall,
                            color = CrisisTextSecondaryDark,
                            modifier = Modifier.weight(1f)
                        )
                        Text(
                            text = "🌊 ${inc.waterDepthMeters}m depth",
                            style = MaterialTheme.typography.bodySmall.copy(fontWeight = FontWeight.Bold),
                            color = CrisisCyan
                        )
                        Text(
                            text = "👥 ${inc.affectedPopulation} victims",
                            style = MaterialTheme.typography.bodySmall.copy(fontWeight = FontWeight.Bold),
                            color = CrisisPrimaryAmber
                        )
                    }

                    // Tactical Action Buttons
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Button(
                            onClick = {
                                onSelectIncident(inc)
                                onNavigate(AppScreen.RESOURCE_ALLOCATION)
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = CrisisPrimaryAmber),
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier
                                .weight(1f)
                                .testTag("map_dispatch_button")
                        ) {
                            Icon(
                                imageVector = Icons.Default.DirectionsBoat,
                                contentDescription = "Allocate",
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Allocate Resource", fontSize = 12.sp)
                        }

                        OutlinedButton(
                            onClick = {
                                onSelectIncident(inc)
                                onNavigate(AppScreen.ROUTE_TRACKING)
                            },
                            shape = RoundedCornerShape(10.dp),
                            colors = ButtonDefaults.outlinedButtonColors(
                                containerColor = CrisisNavyDark,
                                contentColor = CrisisCyan
                            ),
                            border = androidx.compose.foundation.BorderStroke(1.dp, CrisisCyan),
                            modifier = Modifier
                                .weight(1f)
                                .testTag("map_navigate_button")
                        ) {
                            Icon(
                                imageVector = Icons.Default.Navigation,
                                contentDescription = "Route",
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Follow Route", fontSize = 12.sp)
                        }
                    }
                }
            }
        }
    }
}
