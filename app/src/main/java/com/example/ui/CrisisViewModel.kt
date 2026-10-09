package com.example.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.data.auth.AuthManager
import com.example.data.model.*
import com.example.data.repository.CrisisCoreRepository
import com.example.data.service.ChatMessage
import com.example.data.service.GeminiApiService
import com.example.data.service.GeminiMode
import com.example.data.service.TriageResult
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

enum class AppScreen {
    HOME,
    SITUATIONAL_MAP,
    RESOURCE_ALLOCATION,
    REPORT_INCIDENT,
    ROUTE_TRACKING,
    OPERATIONS_DASHBOARD,
    AI_ASSISTANT,
    USER_PROFILE
}

data class IncidentFormState(
    val title: String = "",
    val type: IncidentType = IncidentType.FLOOD,
    val severity: Severity = Severity.HIGH,
    val urgency: Urgency = Urgency.HIGH,
    val locationName: String = "",
    val latitude: Double = 28.6139,
    val longitude: Double = 77.2090,
    val affectedPopulation: Int = 12,
    val waterDepthMeters: Double = 1.5,
    val description: String = "",
    val photoUri: String = "",
    val isAnalyzing: Boolean = false,
    val aiTriageSuggestion: TriageResult? = null
)

class CrisisViewModel(
    private val repository: CrisisCoreRepository,
    private val authManager: AuthManager = AuthManager()
) : ViewModel() {

    // Current Screen
    private val _currentScreen = MutableStateFlow(AppScreen.HOME)
    val currentScreen: StateFlow<AppScreen> = _currentScreen.asStateFlow()

    // Active User Role
    private val _userRole = MutableStateFlow(UserRole.DISASTER_AUTHORITY)
    val userRole: StateFlow<UserRole> = _userRole.asStateFlow()

    // Language Toggle: EN or HI (Hindi)
    private val _currentLanguage = MutableStateFlow("EN")
    val currentLanguage: StateFlow<String> = _currentLanguage.asStateFlow()

    // Repository Flows
    val incidents: StateFlow<List<Incident>> = repository.observeIncidents()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val resources: StateFlow<List<Resource>> = repository.observeResources()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val assignments: StateFlow<List<Assignment>> = repository.observeAssignments()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val alerts: StateFlow<List<AlertMessage>> = repository.observeAlerts()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    // Selected Incident for Detail / Dispatch / Tracking
    private val _selectedIncident = MutableStateFlow<Incident?>(null)
    val selectedIncident: StateFlow<Incident?> = _selectedIncident.asStateFlow()

    // Incident Form
    private val _formState = MutableStateFlow(IncidentFormState())
    val formState: StateFlow<IncidentFormState> = _formState.asStateFlow()

    // Chatbot State
    private val _chatMessages = MutableStateFlow<List<ChatMessage>>(
        listOf(
            ChatMessage(
                sender = "model",
                text = "Welcome to CrisisCore AI Tactical Command. Urban flood telemetry active. How may I assist your emergency response team today?",
                modeUsed = GeminiMode.BALANCED_GENERAL
            )
        )
    )
    val chatMessages: StateFlow<List<ChatMessage>> = _chatMessages.asStateFlow()

    private val _selectedGeminiMode = MutableStateFlow(GeminiMode.BALANCED_GENERAL)
    val selectedGeminiMode: StateFlow<GeminiMode> = _selectedGeminiMode.asStateFlow()

    private val _isChatLoading = MutableStateFlow(false)
    val isChatLoading: StateFlow<Boolean> = _isChatLoading.asStateFlow()

    // Operational Feedback / Snackbars
    private val _statusMessage = MutableStateFlow<String?>(null)
    val statusMessage: StateFlow<String?> = _statusMessage.asStateFlow()

    // Reallocation simulation in progress
    private val _isReallocating = MutableStateFlow(false)
    val isReallocating: StateFlow<Boolean> = _isReallocating.asStateFlow()

    init {
        viewModelScope.launch {
            repository.seedInitialDataIfEmpty()
        }
    }

    fun setScreen(screen: AppScreen) {
        _currentScreen.value = screen
    }

    fun setUserRole(role: UserRole) {
        _userRole.value = role
    }

    fun toggleLanguage() {
        _currentLanguage.value = if (_currentLanguage.value == "EN") "HI" else "EN"
    }

    fun selectIncident(incident: Incident?) {
        _selectedIncident.value = incident
    }

    fun clearStatusMessage() {
        _statusMessage.value = null
    }

    fun setGeminiMode(mode: GeminiMode) {
        _selectedGeminiMode.value = mode
    }

    // ---------------- FORM UPDATES ----------------

    fun updateForm(update: (IncidentFormState) -> IncidentFormState) {
        _formState.value = update(_formState.value)
    }

    fun runAiPreTriage() {
        val current = _formState.value
        if (current.title.isBlank() && current.description.isBlank()) {
            _statusMessage.value = "Enter title or description for AI pre-triage"
            return
        }

        viewModelScope.launch {
            _formState.value = _formState.value.copy(isAnalyzing = true)
            val result = GeminiApiService.analyzeIncidentTriage(
                title = current.title.ifBlank { "Unspecified Flood Emergency" },
                type = current.type.displayName,
                description = current.description.ifBlank { "Water rising rapidly, citizens trapped." },
                waterDepthMeters = current.waterDepthMeters,
                affectedPopulation = current.affectedPopulation
            )
            val triage = result.getOrNull()
            if (triage != null) {
                val parsedSeverity = runCatching { Severity.valueOf(triage.severity) }.getOrDefault(Severity.HIGH)
                val parsedUrgency = runCatching { Urgency.valueOf(triage.urgency) }.getOrDefault(Urgency.HIGH)
                _formState.value = _formState.value.copy(
                    isAnalyzing = false,
                    severity = parsedSeverity,
                    urgency = parsedUrgency,
                    aiTriageSuggestion = triage
                )
                _statusMessage.value = "AI Triage: Priority Score ${triage.priorityScore}/100"
            } else {
                _formState.value = _formState.value.copy(isAnalyzing = false)
            }
        }
    }

    fun submitIncident(onSuccess: () -> Unit) {
        val form = _formState.value
        if (form.title.isBlank()) {
            _statusMessage.value = "Please enter an incident title"
            return
        }

        viewModelScope.launch {
            val score = form.aiTriageSuggestion?.priorityScore ?: (
                (form.severity.weight * 18) + (form.urgency.weight * 12) + (form.waterDepthMeters * 5).toInt()
            ).coerceIn(20, 99)

            val newIncident = Incident(
                reporterName = when (_userRole.value) {
                    UserRole.CITIZEN_REPORTER -> "Citizen Reporter"
                    UserRole.RESCUE_FIELD_TEAM -> "Field Response Unit"
                    else -> "Command Ops"
                },
                title = form.title,
                type = form.type,
                severity = form.severity,
                urgency = form.urgency,
                locationName = form.locationName.ifBlank { "Urban Flood Zone 3" },
                latitude = form.latitude,
                longitude = form.longitude,
                affectedPopulation = form.affectedPopulation,
                waterDepthMeters = form.waterDepthMeters,
                description = form.description,
                status = IncidentStatus.CLASSIFIED,
                priorityScore = score
            )

            val result = repository.reportIncident(newIncident)
            if (result.isSuccess) {
                _statusMessage.value = "Incident reported & classified successfully!"
                _formState.value = IncidentFormState() // Reset
                onSuccess()
            } else {
                _statusMessage.value = "Submission failed: ${result.exceptionOrNull()?.message}"
            }
        }
    }

    // ---------------- DISPATCH & ALLOCATION ----------------

    fun assignResourceToIncident(incident: Incident, resource: Resource) {
        viewModelScope.launch {
            val routeDesc = when (incident.type) {
                IncidentType.FLOOD -> "Elevated Embankment bypass (flood-free corridor)"
                else -> "Direct emergency green channel"
            }
            val res = repository.assignResource(
                incidentId = incident.incidentId,
                resourceId = resource.resourceId,
                resourceName = resource.name,
                incidentTitle = incident.title,
                routeSummary = routeDesc,
                etaMinutes = 8 + (Math.random() * 8).toInt()
            )
            if (res.isSuccess) {
                _statusMessage.value = "${resource.name} assigned to ${incident.title}"
                _selectedIncident.value = incident.copy(
                    status = IncidentStatus.ASSIGNED,
                    assignedResourceId = resource.resourceId,
                    assignedResourceName = resource.name
                )
            } else {
                _statusMessage.value = "Allocation failed: ${res.exceptionOrNull()?.message}"
            }
        }
    }

    /**
     * DYNAMIC REALLOCATION DEMO FLOW:
     * Simulates high-priority emergency spike (Hospital ICU flooding) diverting nearest watercraft
     */
    fun runDynamicReallocationDemo() {
        viewModelScope.launch {
            _isReallocating.value = true
            val criticalInc = incidents.value.find { it.incidentId == "INC-101" } ?: incidents.value.firstOrNull()
            val availableBoat = resources.value.find { it.resourceId == "RES-01" }
                ?: resources.value.find { it.type == ResourceType.RESCUE_BOAT }

            if (criticalInc != null && availableBoat != null) {
                val result = repository.triggerDynamicReallocation(
                    criticalIncidentId = criticalInc.incidentId,
                    sourceResourceId = availableBoat.resourceId,
                    reason = "CRITICAL PRIORITY: Hospital ICU power cut & 42 ventilator patients drowning hazard. Immediate diversion authorized by Incident Commander."
                )
                if (result.isSuccess) {
                    _statusMessage.value = "Dynamic Reallocation executed! Boat diverted to Hospital ICU."
                    _selectedIncident.value = criticalInc
                } else {
                    _statusMessage.value = "Reallocation failed: ${result.exceptionOrNull()?.message}"
                }
            } else {
                _statusMessage.value = "Simulation requirements not met."
            }
            _isReallocating.value = false
        }
    }

    fun updateIncidentStatus(incidentId: String, status: IncidentStatus) {
        viewModelScope.launch {
            repository.updateIncidentStatus(incidentId, status)
            _selectedIncident.value = _selectedIncident.value?.copy(status = status)
            _statusMessage.value = "Status updated to ${status.label}"
        }
    }

    // ---------------- AI CHATBOT ----------------

    fun sendChatMessage(prompt: String) {
        if (prompt.isBlank() || _isChatLoading.value) return

        val userMsg = ChatMessage(
            sender = "user",
            text = prompt,
            modeUsed = _selectedGeminiMode.value
        )
        val currentHistory = _chatMessages.value
        _chatMessages.value = currentHistory + userMsg
        _isChatLoading.value = true

        viewModelScope.launch {
            val result = GeminiApiService.sendPrompt(
                prompt = prompt,
                mode = _selectedGeminiMode.value,
                history = currentHistory
            )

            if (result.isSuccess) {
                val reply = result.getOrNull() ?: "Tactical response received."
                val modelMsg = ChatMessage(
                    sender = "model",
                    text = reply,
                    modeUsed = _selectedGeminiMode.value,
                    groundingSource = when (_selectedGeminiMode.value) {
                        GeminiMode.SEARCH_GROUNDED -> "Google Search Grounding (Live Met/Hydrological Intel)"
                        GeminiMode.MAPS_GROUNDED -> "Google Maps Grounding (Shelters & Evacuation Corridors)"
                        else -> null
                    }
                )
                _chatMessages.value = _chatMessages.value + modelMsg
            } else {
                val errorMsg = ChatMessage(
                    sender = "model",
                    text = "⚠️ Gemini Command Link: ${result.exceptionOrNull()?.message ?: "Communication timeout"}. Running local emergency fallback protocol.",
                    modeUsed = _selectedGeminiMode.value
                )
                _chatMessages.value = _chatMessages.value + errorMsg
            }
            _isChatLoading.value = false
        }
    }

    fun clearChat() {
        _chatMessages.value = listOf(
            ChatMessage(
                sender = "model",
                text = "Command session reset. Ready for emergency dispatch and tactical triage queries.",
                modeUsed = _selectedGeminiMode.value
            )
        )
    }
}
