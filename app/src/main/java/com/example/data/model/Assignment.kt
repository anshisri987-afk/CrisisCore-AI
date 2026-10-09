package com.example.data.model

enum class AssignmentStatus(val label: String) {
    ASSIGNED("Assigned"),
    EN_ROUTE("En Route"),
    ON_SCENE("On Scene"),
    COMPLETED("Completed"),
    REALLOCATED("Dynamically Reallocated")
}

data class Assignment(
    val assignmentId: String = "",
    val incidentId: String = "",
    val resourceId: String = "",
    val resourceName: String = "",
    val incidentTitle: String = "",
    val priority: String = "High",
    val routeSummary: String = "Via Elevated Bypass -> North Bund Road",
    val distanceKm: Double = 4.2,
    val etaMinutes: Int = 12,
    val status: AssignmentStatus = AssignmentStatus.ASSIGNED,
    val assignedAt: String = "",
    val updatedAt: String = ""
)
