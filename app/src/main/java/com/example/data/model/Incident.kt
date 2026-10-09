package com.example.data.model

enum class IncidentType(val displayName: String, val iconName: String) {
    FLOOD("Urban Flood", "water_drop"),
    RESCUE("Stranded / Trapped", "life_preserver"),
    MEDICAL("Medical Urgent", "medical_services"),
    COLLAPSE("Structural Collapse", "foundation"),
    FIRE("Electrical / Fire", "local_fire_department")
}

enum class Severity(val label: String, val weight: Int) {
    CRITICAL("Critical", 4),
    HIGH("High", 3),
    MEDIUM("Medium", 2),
    LOW("Low", 1)
}

enum class Urgency(val label: String, val weight: Int) {
    IMMEDIATE("Immediate (0-15m)", 4),
    HIGH("High (15-45m)", 3),
    NORMAL("Normal (45m+)", 2)
}

enum class IncidentStatus(val label: String, val stepIndex: Int) {
    REPORTED("Reported", 1),
    CLASSIFIED("Classified", 2),
    PRIORITIZED("Prioritized", 3),
    RESOURCE_MATCHED("Matched", 4),
    ASSIGNED("Assigned", 5),
    RESPONDING("Responding / En Route", 6),
    RESOLVED("Resolved / Closed", 7)
}

data class Incident(
    val incidentId: String = "",
    val reporterId: String = "",
    val reporterName: String = "Citizen Alert",
    val title: String = "",
    val type: IncidentType = IncidentType.FLOOD,
    val severity: Severity = Severity.HIGH,
    val urgency: Urgency = Urgency.HIGH,
    val locationName: String = "",
    val latitude: Double = 28.6139,
    val longitude: Double = 77.2090,
    val affectedPopulation: Int = 1,
    val waterDepthMeters: Double = 1.0,
    val description: String = "",
    val photoUrl: String = "",
    val status: IncidentStatus = IncidentStatus.REPORTED,
    val priorityScore: Int = 75, // 0 - 100
    val assignedResourceId: String? = null,
    val assignedResourceName: String? = null,
    val createdAt: String = "",
    val updatedAt: String = ""
)
