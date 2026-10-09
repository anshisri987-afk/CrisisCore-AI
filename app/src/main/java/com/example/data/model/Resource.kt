package com.example.data.model

enum class ResourceType(val label: String, val category: String) {
    RESCUE_BOAT("Inflatable Rescue Boat", "Watercraft"),
    AMBULANCE("Advanced Life Support Ambulance", "Medical"),
    DISASTER_TEAM("NDRF / SDRF Search & Rescue Team", "Personnel"),
    DRONE_UNIT("Recon & Thermal Drone Unit", "Air/GIS"),
    FIRE_ENGINE("Flood De-Watering / Fire Unit", "Heavy Equipment"),
    GENERATOR_POWER("Emergency Diesel Generator", "Power"),
    RATION_SUPPLY("Food, Drinking Water & Rations", "Supplies"),
    MEDICAL_STATION("Mobile Triage Medical Kit", "Medical")
}

enum class ResourceAvailability(val label: String) {
    AVAILABLE("Available"),
    DISPATCHED("Dispatched"),
    EN_ROUTE("En Route"),
    ON_SITE("On Site"),
    MAINTENANCE("Maintenance")
}

data class Resource(
    val resourceId: String = "",
    val name: String = "",
    val type: ResourceType = ResourceType.RESCUE_BOAT,
    val teamPersonnel: String = "4 Specialists",
    val latitude: Double = 28.6139,
    val longitude: Double = 77.2090,
    val availability: ResourceAvailability = ResourceAvailability.AVAILABLE,
    val capacity: Int = 10,
    val contactPhone: String = "+91 98765 43210",
    val currentIncidentId: String? = null,
    val updatedAt: String = ""
)
