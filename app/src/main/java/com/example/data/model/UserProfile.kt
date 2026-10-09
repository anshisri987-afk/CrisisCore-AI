package com.example.data.model

enum class UserRole(val label: String, val badge: String) {
    DISASTER_AUTHORITY("Emergency Authority", "COMMAND"),
    RESCUE_FIELD_TEAM("Rescue / Field Team", "RESPONDER"),
    CITIZEN_REPORTER("Citizen / Reporter", "CITIZEN"),
    RELIEF_COORDINATOR("Relief Coordinator", "LOGISTICS")
}

data class UserProfile(
    val userId: String = "",
    val name: String = "",
    val email: String = "",
    val role: UserRole = UserRole.DISASTER_AUTHORITY,
    val phone: String = "",
    val language: String = "EN",
    val createdAt: String = ""
)
