package com.example.data.model

enum class AlertSeverity(val label: String) {
    CRITICAL("RED ALERT"),
    WARNING("WARNING"),
    ADVISORY("ADVISORY"),
    INFO("UPDATE")
}

data class AlertMessage(
    val alertId: String = "",
    val title: String = "",
    val message: String = "",
    val severity: AlertSeverity = AlertSeverity.WARNING,
    val incidentId: String? = null,
    val targetRole: String = "ALL",
    val timestamp: String = "",
    val isRead: Boolean = false
)
