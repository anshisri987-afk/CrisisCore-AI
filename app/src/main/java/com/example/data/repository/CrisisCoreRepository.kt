package com.example.data.repository

import android.content.Context
import android.util.Log
import com.example.R
import com.example.data.model.*
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.DocumentSnapshot
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.ListenerRegistration
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.UUID

class CrisisCoreRepository(
    private val db: FirebaseFirestore,
    private val auth: FirebaseAuth
) {
    companion object {
        private const val TAG = "CrisisCoreRepo"

        fun create(context: Context, auth: FirebaseAuth = FirebaseAuth.getInstance()): CrisisCoreRepository {
            val firestore = try {
                val dbId = runCatching { context.getString(R.string.firestore_database_id) }.getOrNull()
                if (!dbId.isNullOrBlank()) {
                    FirebaseFirestore.getInstance(dbId)
                } else {
                    FirebaseFirestore.getInstance()
                }
            } catch (e: Exception) {
                Log.w(TAG, "Using default Firestore instance: ${e.message}")
                FirebaseFirestore.getInstance()
            }
            return CrisisCoreRepository(firestore, auth)
        }
    }

    private fun nowIso(): String {
        return SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.US).format(Date())
    }

    private fun requireUserId(): String {
        return auth.currentUser?.uid ?: "anonymous_responder"
    }

    // ---------------- INCIDENTS ----------------

    fun observeIncidents(): Flow<List<Incident>> = callbackFlow {
        val listener: ListenerRegistration = db.collection("incidents")
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    Log.w(TAG, "Error listening to incidents", error)
                    trySend(emptyList())
                    return@addSnapshotListener
                }
                if (snapshot != null) {
                    val list = snapshot.documents.mapNotNull { doc -> mapDocToIncident(doc) }
                    trySend(list)
                }
            }
        awaitClose { listener.remove() }
    }

    private fun mapDocToIncident(doc: DocumentSnapshot): Incident? {
        return try {
            Incident(
                incidentId = doc.getString("incidentId") ?: doc.id,
                reporterId = doc.getString("reporterId") ?: "",
                reporterName = doc.getString("reporterName") ?: "Citizen Alert",
                title = doc.getString("title") ?: "Emergency",
                type = runCatching { IncidentType.valueOf(doc.getString("type") ?: "FLOOD") }.getOrDefault(IncidentType.FLOOD),
                severity = runCatching { Severity.valueOf(doc.getString("severity") ?: "HIGH") }.getOrDefault(Severity.HIGH),
                urgency = runCatching { Urgency.valueOf(doc.getString("urgency") ?: "HIGH") }.getOrDefault(Urgency.HIGH),
                locationName = doc.getString("locationName") ?: "Sector B",
                latitude = doc.getDouble("latitude") ?: 28.6139,
                longitude = doc.getDouble("longitude") ?: 77.2090,
                affectedPopulation = (doc.getLong("affectedPopulation") ?: 1L).toInt(),
                waterDepthMeters = doc.getDouble("waterDepthMeters") ?: 1.0,
                description = doc.getString("description") ?: "",
                photoUrl = doc.getString("photoUrl") ?: "",
                status = runCatching { IncidentStatus.valueOf(doc.getString("status") ?: "REPORTED") }.getOrDefault(IncidentStatus.REPORTED),
                priorityScore = (doc.getLong("priorityScore") ?: 75L).toInt(),
                assignedResourceId = doc.getString("assignedResourceId"),
                assignedResourceName = doc.getString("assignedResourceName"),
                createdAt = doc.getString("createdAt") ?: "",
                updatedAt = doc.getString("updatedAt") ?: ""
            )
        } catch (e: Exception) {
            Log.e(TAG, "Failed mapping incident doc: ${doc.id}", e)
            null
        }
    }

    suspend fun reportIncident(incident: Incident): Result<String> {
        return try {
            val id = incident.incidentId.ifBlank { UUID.randomUUID().toString() }
            val reporterId = requireUserId()
            val now = nowIso()

            val docData = hashMapOf(
                "incidentId" to id,
                "reporterId" to reporterId,
                "reporterName" to incident.reporterName,
                "title" to incident.title,
                "type" to incident.type.name,
                "severity" to incident.severity.name,
                "urgency" to incident.urgency.name,
                "locationName" to incident.locationName,
                "latitude" to incident.latitude,
                "longitude" to incident.longitude,
                "affectedPopulation" to incident.affectedPopulation,
                "waterDepthMeters" to incident.waterDepthMeters,
                "description" to incident.description,
                "photoUrl" to incident.photoUrl,
                "status" to incident.status.name,
                "priorityScore" to incident.priorityScore,
                "assignedResourceId" to incident.assignedResourceId,
                "assignedResourceName" to incident.assignedResourceName,
                "createdAt" to incident.createdAt.ifBlank { now },
                "updatedAt" to now
            )

            db.collection("incidents").document(id).set(docData).await()
            Result.success(id)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to report incident", e)
            Result.failure(e)
        }
    }

    suspend fun updateIncidentStatus(incidentId: String, status: IncidentStatus): Result<Unit> {
        return try {
            db.collection("incidents").document(incidentId).update(
                mapOf(
                    "status" to status.name,
                    "updatedAt" to nowIso()
                )
            ).await()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    // ---------------- RESOURCES ----------------

    fun observeResources(): Flow<List<Resource>> = callbackFlow {
        val listener = db.collection("resources")
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    Log.w(TAG, "Error listening to resources", error)
                    trySend(emptyList())
                    return@addSnapshotListener
                }
                if (snapshot != null) {
                    val list = snapshot.documents.mapNotNull { doc -> mapDocToResource(doc) }
                    trySend(list)
                }
            }
        awaitClose { listener.remove() }
    }

    private fun mapDocToResource(doc: DocumentSnapshot): Resource? {
        return try {
            Resource(
                resourceId = doc.getString("resourceId") ?: doc.id,
                name = doc.getString("name") ?: "Rescue Unit",
                type = runCatching { ResourceType.valueOf(doc.getString("type") ?: "RESCUE_BOAT") }.getOrDefault(ResourceType.RESCUE_BOAT),
                teamPersonnel = doc.getString("teamPersonnel") ?: "Specialists",
                latitude = doc.getDouble("latitude") ?: 28.6139,
                longitude = doc.getDouble("longitude") ?: 77.2090,
                availability = runCatching { ResourceAvailability.valueOf(doc.getString("availability") ?: "AVAILABLE") }.getOrDefault(ResourceAvailability.AVAILABLE),
                capacity = (doc.getLong("capacity") ?: 10L).toInt(),
                contactPhone = doc.getString("contactPhone") ?: "+91 98765 43210",
                currentIncidentId = doc.getString("currentIncidentId"),
                updatedAt = doc.getString("updatedAt") ?: ""
            )
        } catch (e: Exception) {
            null
        }
    }

    suspend fun updateResourceStatus(resourceId: String, availability: ResourceAvailability, incidentId: String? = null): Result<Unit> {
        return try {
            val updates = mutableMapOf<String, Any?>(
                "availability" to availability.name,
                "updatedAt" to nowIso()
            )
            if (incidentId != null) {
                updates["currentIncidentId"] = incidentId
            }
            db.collection("resources").document(resourceId).update(updates).await()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    // ---------------- ASSIGNMENTS ----------------

    fun observeAssignments(): Flow<List<Assignment>> = callbackFlow {
        val listener = db.collection("assignments")
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    Log.w(TAG, "Error listening to assignments", error)
                    trySend(emptyList())
                    return@addSnapshotListener
                }
                if (snapshot != null) {
                    val list = snapshot.documents.mapNotNull { doc -> mapDocToAssignment(doc) }
                    trySend(list)
                }
            }
        awaitClose { listener.remove() }
    }

    private fun mapDocToAssignment(doc: DocumentSnapshot): Assignment? {
        return try {
            Assignment(
                assignmentId = doc.getString("assignmentId") ?: doc.id,
                incidentId = doc.getString("incidentId") ?: "",
                resourceId = doc.getString("resourceId") ?: "",
                resourceName = doc.getString("resourceName") ?: "",
                incidentTitle = doc.getString("incidentTitle") ?: "",
                priority = doc.getString("priority") ?: "High",
                routeSummary = doc.getString("routeSummary") ?: "Safe Corridor",
                distanceKm = doc.getDouble("distanceKm") ?: 3.5,
                etaMinutes = (doc.getLong("etaMinutes") ?: 15L).toInt(),
                status = runCatching { AssignmentStatus.valueOf(doc.getString("status") ?: "ASSIGNED") }.getOrDefault(AssignmentStatus.ASSIGNED),
                assignedAt = doc.getString("assignedAt") ?: "",
                updatedAt = doc.getString("updatedAt") ?: ""
            )
        } catch (e: Exception) {
            null
        }
    }

    suspend fun assignResource(
        incidentId: String,
        resourceId: String,
        resourceName: String,
        incidentTitle: String,
        routeSummary: String = "Via Northern Elevated Embankment (Flood-Safe)",
        etaMinutes: Int = 14
    ): Result<String> {
        return try {
            val assignmentId = UUID.randomUUID().toString()
            val now = nowIso()

            val assignmentData = hashMapOf(
                "assignmentId" to assignmentId,
                "incidentId" to incidentId,
                "resourceId" to resourceId,
                "resourceName" to resourceName,
                "incidentTitle" to incidentTitle,
                "priority" to "Urgent",
                "routeSummary" to routeSummary,
                "distanceKm" to 3.8,
                "etaMinutes" to etaMinutes,
                "status" to AssignmentStatus.ASSIGNED.name,
                "assignedAt" to now,
                "updatedAt" to now
            )

            db.collection("assignments").document(assignmentId).set(assignmentData).await()

            // Update incident
            db.collection("incidents").document(incidentId).update(
                mapOf(
                    "status" to IncidentStatus.ASSIGNED.name,
                    "assignedResourceId" to resourceId,
                    "assignedResourceName" to resourceName,
                    "updatedAt" to now
                )
            ).await()

            // Update resource
            db.collection("resources").document(resourceId).update(
                mapOf(
                    "availability" to ResourceAvailability.DISPATCHED.name,
                    "currentIncidentId" to incidentId,
                    "updatedAt" to now
                )
            ).await()

            // Broadcast alert
            val alertId = UUID.randomUUID().toString()
            db.collection("alerts").document(alertId).set(
                hashMapOf(
                    "alertId" to alertId,
                    "title" to "Unit Dispatched: $resourceName",
                    "message" to "Dispatched to '$incidentTitle'. ETA: $etaMinutes mins along $routeSummary",
                    "severity" to AlertSeverity.INFO.name,
                    "incidentId" to incidentId,
                    "targetRole" to "ALL",
                    "timestamp" to now,
                    "isRead" to false
                )
            ).await()

            Result.success(assignmentId)
        } catch (e: Exception) {
            Log.e(TAG, "Failed assigning resource", e)
            Result.failure(e)
        }
    }

    /**
     * DYNAMIC REALLOCATION DEMO CUJ (from PRD Section 13):
     * "introduce a new higher-priority incident and demonstrate dynamic reallocation... Sense -> Decide -> Allocate -> Respond -> Adapt"
     */
    suspend fun triggerDynamicReallocation(
        criticalIncidentId: String,
        sourceResourceId: String,
        reason: String
    ): Result<String> {
        return try {
            val now = nowIso()
            val resourceDoc = db.collection("resources").document(sourceResourceId).get().await()
            val resourceName = resourceDoc.getString("name") ?: "Tactical Boat Unit"
            val prevIncidentId = resourceDoc.getString("currentIncidentId")

            val incDoc = db.collection("incidents").document(criticalIncidentId).get().await()
            val incTitle = incDoc.getString("title") ?: "High Priority Crisis"

            // Mark prior assignment as reallocated
            if (prevIncidentId != null) {
                val priorAssignments = db.collection("assignments")
                    .whereEqualTo("resourceId", sourceResourceId)
                    .whereEqualTo("status", AssignmentStatus.ASSIGNED.name)
                    .get().await()

                for (doc in priorAssignments.documents) {
                    doc.reference.update(
                        mapOf(
                            "status" to AssignmentStatus.REALLOCATED.name,
                            "updatedAt" to now
                        )
                    ).await()
                }

                db.collection("incidents").document(prevIncidentId).update(
                    mapOf(
                        "status" to IncidentStatus.PRIORITIZED.name,
                        "assignedResourceId" to null,
                        "assignedResourceName" to null,
                        "updatedAt" to now
                    )
                ).await()
            }

            // Create new expedited assignment
            val newAssignId = UUID.randomUUID().toString()
            db.collection("assignments").document(newAssignId).set(
                hashMapOf(
                    "assignmentId" to newAssignId,
                    "incidentId" to criticalIncidentId,
                    "resourceId" to sourceResourceId,
                    "resourceName" to resourceName,
                    "incidentTitle" to incTitle,
                    "priority" to "CRITICAL OVERRIDE",
                    "routeSummary" to "High-Speed Navigation Corridor via Drainage Channel 4",
                    "distanceKm" to 2.1,
                    "etaMinutes" to 7,
                    "status" to AssignmentStatus.EN_ROUTE.name,
                    "assignedAt" to now,
                    "updatedAt" to now
                )
            ).await()

            // Update critical incident
            db.collection("incidents").document(criticalIncidentId).update(
                mapOf(
                    "status" to IncidentStatus.RESPONDING.name,
                    "assignedResourceId" to sourceResourceId,
                    "assignedResourceName" to resourceName,
                    "priorityScore" to 98,
                    "updatedAt" to now
                )
            ).await()

            // Update resource
            db.collection("resources").document(sourceResourceId).update(
                mapOf(
                    "availability" to ResourceAvailability.EN_ROUTE.name,
                    "currentIncidentId" to criticalIncidentId,
                    "updatedAt" to now
                )
            ).await()

            // Broadcast urgent alert
            val alertId = UUID.randomUUID().toString()
            db.collection("alerts").document(alertId).set(
                hashMapOf(
                    "alertId" to alertId,
                    "title" to "⚡ DYNAMIC REALLOCATION TRIGGERED",
                    "message" to "$resourceName diverted to '$incTitle'. Reason: $reason",
                    "severity" to AlertSeverity.CRITICAL.name,
                    "incidentId" to criticalIncidentId,
                    "targetRole" to "ALL",
                    "timestamp" to now,
                    "isRead" to false
                )
            ).await()

            Result.success(newAssignId)
        } catch (e: Exception) {
            Log.e(TAG, "Error in dynamic reallocation", e)
            Result.failure(e)
        }
    }

    // ---------------- ALERTS ----------------

    fun observeAlerts(): Flow<List<AlertMessage>> = callbackFlow {
        val listener = db.collection("alerts")
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    trySend(emptyList())
                    return@addSnapshotListener
                }
                if (snapshot != null) {
                    val list = snapshot.documents.mapNotNull { doc ->
                        AlertMessage(
                            alertId = doc.getString("alertId") ?: doc.id,
                            title = doc.getString("title") ?: "Notice",
                            message = doc.getString("message") ?: "",
                            severity = runCatching { AlertSeverity.valueOf(doc.getString("severity") ?: "WARNING") }.getOrDefault(AlertSeverity.WARNING),
                            incidentId = doc.getString("incidentId"),
                            targetRole = doc.getString("targetRole") ?: "ALL",
                            timestamp = doc.getString("timestamp") ?: "",
                            isRead = doc.getBoolean("isRead") ?: false
                        )
                    }
                    trySend(list)
                }
            }
        awaitClose { listener.remove() }
    }

    suspend fun broadcastAlert(title: String, message: String, severity: AlertSeverity): Result<Unit> {
        return try {
            val alertId = UUID.randomUUID().toString()
            db.collection("alerts").document(alertId).set(
                hashMapOf(
                    "alertId" to alertId,
                    "title" to title,
                    "message" to message,
                    "severity" to severity.name,
                    "timestamp" to nowIso(),
                    "isRead" to false
                )
            ).await()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    // ---------------- SEED DATA INITIALIZER ----------------

    suspend fun seedInitialDataIfEmpty() {
        try {
            val incidentCount = db.collection("incidents").limit(1).get().await().size()
            if (incidentCount > 0) return

            val now = nowIso()

            // 1. Seed Incidents (Urban Flood Scenario)
            val seedIncidents = listOf(
                Incident(
                    incidentId = "INC-101",
                    reporterName = "Dr. S. Verma (Chief Medical Officer)",
                    title = "City Metro Hospital - ICU Water Ingress (2.2m)",
                    type = IncidentType.FLOOD,
                    severity = Severity.CRITICAL,
                    urgency = Urgency.IMMEDIATE,
                    locationName = "Metro Hospital, Ring Road Sector 4",
                    latitude = 28.6250,
                    longitude = 77.2180,
                    affectedPopulation = 42,
                    waterDepthMeters = 2.2,
                    description = "Basement & Ground floor flooded. 42 critical ventilator patients need evacuation immediately. Power backup failing.",
                    status = IncidentStatus.PRIORITIZED,
                    priorityScore = 96,
                    createdAt = now,
                    updatedAt = now
                ),
                Incident(
                    incidentId = "INC-102",
                    reporterName = "Inspector R. Singh (Civil Defense)",
                    title = "Yamuna Bund Breach - Slum Cluster Inundated",
                    type = IncidentType.RESCUE,
                    severity = Severity.CRITICAL,
                    urgency = Urgency.IMMEDIATE,
                    locationName = "Mayur Vihar Bund Point C",
                    latitude = 28.6080,
                    longitude = 77.2350,
                    affectedPopulation = 180,
                    waterDepthMeters = 2.8,
                    description = "Temporary bund breach. Fast currents. Over 180 residents stranded on rooftops without food or clean water.",
                    status = IncidentStatus.RESPONDING,
                    priorityScore = 93,
                    assignedResourceId = "RES-01",
                    assignedResourceName = "NDRF Swift Boat Alpha",
                    createdAt = now,
                    updatedAt = now
                ),
                Incident(
                    incidentId = "INC-103",
                    reporterName = "Priya Sharma (Resident)",
                    title = "Senior Citizens Care Center Cut Off",
                    type = IncidentType.RESCUE,
                    severity = Severity.HIGH,
                    urgency = Urgency.HIGH,
                    locationName = "Vasant Enclave Block D",
                    latitude = 28.5800,
                    longitude = 77.1900,
                    affectedPopulation = 24,
                    waterDepthMeters = 1.4,
                    description = "Access road submerged under 1.4m water. 24 elderly individuals need food, dry clothes, and routine heart medication.",
                    status = IncidentStatus.CLASSIFIED,
                    priorityScore = 82,
                    createdAt = now,
                    updatedAt = now
                ),
                Incident(
                    incidentId = "INC-104",
                    reporterName = "Electricity Board Dispatch",
                    title = "33kV Power Substation Flooding Hazard",
                    type = IncidentType.COLLAPSE,
                    severity = Severity.HIGH,
                    urgency = Urgency.HIGH,
                    locationName = "Substation 12, Riverbed Road",
                    latitude = 28.6320,
                    longitude = 77.2050,
                    affectedPopulation = 12000,
                    waterDepthMeters = 1.1,
                    description = "Water entering transformer bays. Immediate high-capacity dewatering pumps needed to avoid grid shutdown.",
                    status = IncidentStatus.REPORTED,
                    priorityScore = 78,
                    createdAt = now,
                    updatedAt = now
                ),
                Incident(
                    incidentId = "INC-105",
                    reporterName = "Relief Shelter Camp #4",
                    title = "Drinking Water & Ration Shortage",
                    type = IncidentType.FLOOD,
                    severity = Severity.MEDIUM,
                    urgency = Urgency.NORMAL,
                    locationName = "Govt Senior Secondary School, Sector 2",
                    latitude = 28.6410,
                    longitude = 77.2280,
                    affectedPopulation = 350,
                    waterDepthMeters = 0.4,
                    description = "350 displaced citizens need 500 ration packets, potable drinking water cans, and baby food.",
                    status = IncidentStatus.REPORTED,
                    priorityScore = 64,
                    createdAt = now,
                    updatedAt = now
                )
            )

            for (inc in seedIncidents) {
                db.collection("incidents").document(inc.incidentId).set(
                    hashMapOf(
                        "incidentId" to inc.incidentId,
                        "reporterId" to "seed_authority",
                        "reporterName" to inc.reporterName,
                        "title" to inc.title,
                        "type" to inc.type.name,
                        "severity" to inc.severity.name,
                        "urgency" to inc.urgency.name,
                        "locationName" to inc.locationName,
                        "latitude" to inc.latitude,
                        "longitude" to inc.longitude,
                        "affectedPopulation" to inc.affectedPopulation,
                        "waterDepthMeters" to inc.waterDepthMeters,
                        "description" to inc.description,
                        "photoUrl" to inc.photoUrl,
                        "status" to inc.status.name,
                        "priorityScore" to inc.priorityScore,
                        "assignedResourceId" to inc.assignedResourceId,
                        "assignedResourceName" to inc.assignedResourceName,
                        "createdAt" to inc.createdAt,
                        "updatedAt" to inc.updatedAt
                    )
                ).await()
            }

            // 2. Seed Resources
            val seedResources = listOf(
                Resource(
                    resourceId = "RES-01",
                    name = "NDRF Swift Boat Alpha",
                    type = ResourceType.RESCUE_BOAT,
                    teamPersonnel = "6 NDRF Certified Divers",
                    latitude = 28.6100,
                    longitude = 77.2300,
                    availability = ResourceAvailability.DISPATCHED,
                    capacity = 12,
                    contactPhone = "+91 99100 11001",
                    currentIncidentId = "INC-102",
                    updatedAt = now
                ),
                Resource(
                    resourceId = "RES-02",
                    name = "SDRF Tactical Boat Bravo",
                    type = ResourceType.RESCUE_BOAT,
                    teamPersonnel = "4 Water Rescue Operators",
                    latitude = 28.6200,
                    longitude = 77.2100,
                    availability = ResourceAvailability.AVAILABLE,
                    capacity = 10,
                    contactPhone = "+91 99100 22002",
                    updatedAt = now
                ),
                Resource(
                    resourceId = "RES-03",
                    name = "ALS Critical Ambulance 09",
                    type = ResourceType.AMBULANCE,
                    teamPersonnel = "2 Paramedics + 1 Emergency Physician",
                    latitude = 28.6180,
                    longitude = 77.2150,
                    availability = ResourceAvailability.AVAILABLE,
                    capacity = 3,
                    contactPhone = "+91 99100 33003",
                    updatedAt = now
                ),
                Resource(
                    resourceId = "RES-04",
                    name = "High-Flow De-Watering Rig #2",
                    type = ResourceType.FIRE_ENGINE,
                    teamPersonnel = "4 Fire Service Engineers",
                    latitude = 28.6300,
                    longitude = 77.2020,
                    availability = ResourceAvailability.AVAILABLE,
                    capacity = 5000,
                    contactPhone = "+91 99100 44004",
                    updatedAt = now
                ),
                Resource(
                    resourceId = "RES-05",
                    name = "Recon Drone Unit 'Garuda-3'",
                    type = ResourceType.DRONE_UNIT,
                    teamPersonnel = "2 Licensed UAV Pilots",
                    latitude = 28.6150,
                    longitude = 77.2200,
                    availability = ResourceAvailability.AVAILABLE,
                    capacity = 4,
                    contactPhone = "+91 99100 55005",
                    updatedAt = now
                ),
                Resource(
                    resourceId = "RES-06",
                    name = "Mobile Food & Water Supply Truck",
                    type = ResourceType.RATION_SUPPLY,
                    teamPersonnel = "3 Red Cross Volunteers",
                    latitude = 28.6380,
                    longitude = 77.2250,
                    availability = ResourceAvailability.AVAILABLE,
                    capacity = 1200,
                    contactPhone = "+91 99100 66006",
                    updatedAt = now
                )
            )

            for (res in seedResources) {
                db.collection("resources").document(res.resourceId).set(
                    hashMapOf(
                        "resourceId" to res.resourceId,
                        "name" to res.name,
                        "type" to res.type.name,
                        "teamPersonnel" to res.teamPersonnel,
                        "latitude" to res.latitude,
                        "longitude" to res.longitude,
                        "availability" to res.availability.name,
                        "capacity" to res.capacity,
                        "contactPhone" to res.contactPhone,
                        "currentIncidentId" to res.currentIncidentId,
                        "updatedAt" to res.updatedAt
                    )
                ).await()
            }

            // 3. Seed Assignments
            val assign1 = Assignment(
                assignmentId = "ASN-501",
                incidentId = "INC-102",
                resourceId = "RES-01",
                resourceName = "NDRF Swift Boat Alpha",
                incidentTitle = "Yamuna Bund Breach - Slum Cluster Inundated",
                priority = "Immediate Triage",
                routeSummary = "Elevated Ring Road -> Bund Access Ramp 2",
                distanceKm = 3.2,
                etaMinutes = 9,
                status = AssignmentStatus.EN_ROUTE,
                assignedAt = now,
                updatedAt = now
            )
            db.collection("assignments").document(assign1.assignmentId).set(
                hashMapOf(
                    "assignmentId" to assign1.assignmentId,
                    "incidentId" to assign1.incidentId,
                    "resourceId" to assign1.resourceId,
                    "resourceName" to assign1.resourceName,
                    "incidentTitle" to assign1.incidentTitle,
                    "priority" to assign1.priority,
                    "routeSummary" to assign1.routeSummary,
                    "distanceKm" to assign1.distanceKm,
                    "etaMinutes" to assign1.etaMinutes,
                    "status" to assign1.status.name,
                    "assignedAt" to assign1.assignedAt,
                    "updatedAt" to assign1.updatedAt
                )
            ).await()

            // 4. Seed Alerts
            val alert1 = AlertMessage(
                alertId = "ALT-901",
                title = "🚨 RED ALERT: Yamuna Water Level Crosses 208.66m Danger Mark",
                message = "All low-lying riverbed sectors must execute Stage 3 evacuation immediately. Emergency sirens activated.",
                severity = AlertSeverity.CRITICAL,
                timestamp = now,
                isRead = false
            )
            val alert2 = AlertMessage(
                alertId = "ALT-902",
                title = "⚠️ FLASH ADVISORY: NH-24 Underpass Submerged",
                message = "Diversion route established via Nizamuddin flyover. Emergency response vehicles have priority green corridor.",
                severity = AlertSeverity.WARNING,
                timestamp = now,
                isRead = false
            )
            for (alt in listOf(alert1, alert2)) {
                db.collection("alerts").document(alt.alertId).set(
                    hashMapOf(
                        "alertId" to alt.alertId,
                        "title" to alt.title,
                        "message" to alt.message,
                        "severity" to alt.severity.name,
                        "timestamp" to alt.timestamp,
                        "isRead" to alt.isRead
                    )
                ).await()
            }

            Log.i(TAG, "Seed data initialized successfully.")
        } catch (e: Exception) {
            Log.e(TAG, "Failed seeding initial data", e)
        }
    }
}
