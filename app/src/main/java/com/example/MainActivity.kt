package com.example

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.viewModelFactory
import androidx.lifecycle.ViewModelProvider.AndroidViewModelFactory.Companion.APPLICATION_KEY
import com.example.data.auth.AuthManager
import com.example.data.repository.CrisisCoreRepository
import com.example.ui.AppScreen
import com.example.ui.CrisisViewModel
import com.example.ui.auth.AuthScreen
import com.example.ui.components.CrisisBottomNavigationBar
import com.example.ui.components.CrisisTopAppBar
import com.example.ui.screens.*
import com.example.ui.theme.CrisisCoreTheme
import com.example.ui.theme.CrisisNavyDark
import com.google.firebase.auth.FirebaseAuth
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {
    private val authManager by lazy { AuthManager() }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        setContent {
            CrisisCoreTheme(darkTheme = true) {
                val firebaseUser by authManager.authStateFlow().collectAsStateWithLifecycle(initialValue = authManager.currentUser)
                var hasEnteredDemo by remember { mutableStateOf(false) }

                if (firebaseUser == null && !hasEnteredDemo) {
                    AuthScreen(
                        authManager = authManager,
                        onAuthSuccess = { hasEnteredDemo = true }
                    )
                } else {
                    val repository = remember { CrisisCoreRepository.create(applicationContext) }
                    val viewModel: CrisisViewModel = viewModel(
                        factory = viewModelFactory {
                            addInitializer(CrisisViewModel::class) {
                                CrisisViewModel(repository, authManager)
                            }
                        }
                    )

                    CrisisCoreAppContent(
                        viewModel = viewModel,
                        userEmail = firebaseUser?.email ?: "ops_command@crisiscore.gov",
                        onSignOut = {
                            authManager.signOut()
                            hasEnteredDemo = false
                        }
                    )
                }
            }
        }
    }
}

@Composable
fun CrisisCoreAppContent(
    viewModel: CrisisViewModel,
    userEmail: String,
    onSignOut: () -> Unit
) {
    val currentScreen by viewModel.currentScreen.collectAsStateWithLifecycle()
    val userRole by viewModel.userRole.collectAsStateWithLifecycle()
    val currentLanguage by viewModel.currentLanguage.collectAsStateWithLifecycle()
    val incidents by viewModel.incidents.collectAsStateWithLifecycle()
    val resources by viewModel.resources.collectAsStateWithLifecycle()
    val assignments by viewModel.assignments.collectAsStateWithLifecycle()
    val alerts by viewModel.alerts.collectAsStateWithLifecycle()
    val selectedIncident by viewModel.selectedIncident.collectAsStateWithLifecycle()
    val formState by viewModel.formState.collectAsStateWithLifecycle()
    val chatMessages by viewModel.chatMessages.collectAsStateWithLifecycle()
    val selectedGeminiMode by viewModel.selectedGeminiMode.collectAsStateWithLifecycle()
    val isChatLoading by viewModel.isChatLoading.collectAsStateWithLifecycle()
    val statusMessage by viewModel.statusMessage.collectAsStateWithLifecycle()
    val isReallocating by viewModel.isReallocating.collectAsStateWithLifecycle()

    val snackbarHostState = remember { SnackbarHostState() }
    val scope = rememberCoroutineScope()

    LaunchedEffect(statusMessage) {
        statusMessage?.let { msg ->
            snackbarHostState.showSnackbar(msg)
            viewModel.clearStatusMessage()
        }
    }

    // Handle back button: return to HOME screen if on another screen
    BackHandler(enabled = currentScreen != AppScreen.HOME) {
        viewModel.setScreen(AppScreen.HOME)
    }

    Scaffold(
        modifier = Modifier
            .fillMaxSize()
            .background(CrisisNavyDark),
        topBar = {
            CrisisTopAppBar(
                currentScreen = currentScreen,
                userRole = userRole,
                currentLanguage = currentLanguage,
                onRoleClick = { viewModel.setScreen(AppScreen.USER_PROFILE) },
                onLanguageClick = { viewModel.toggleLanguage() },
                onProfileClick = { viewModel.setScreen(AppScreen.USER_PROFILE) },
                onMenuClick = { viewModel.setScreen(AppScreen.OPERATIONS_DASHBOARD) }
            )
        },
        bottomBar = {
            CrisisBottomNavigationBar(
                currentScreen = currentScreen,
                onScreenSelected = { screen -> viewModel.setScreen(screen) },
                unreadAlertCount = alerts.count { !it.isRead }
            )
        },
        snackbarHost = { SnackbarHost(hostState = snackbarHostState) }
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            when (currentScreen) {
                AppScreen.HOME -> {
                    HomeScreen(
                        incidents = incidents,
                        resources = resources,
                        alerts = alerts,
                        userRole = userRole,
                        currentLanguage = currentLanguage,
                        onNavigate = { screen -> viewModel.setScreen(screen) },
                        onSelectIncident = { inc -> viewModel.selectIncident(inc) },
                        onTriggerDynamicReallocation = { viewModel.runDynamicReallocationDemo() },
                        isReallocating = isReallocating
                    )
                }

                AppScreen.SITUATIONAL_MAP -> {
                    SituationalMapScreen(
                        incidents = incidents,
                        resources = resources,
                        selectedIncident = selectedIncident,
                        onSelectIncident = { inc -> viewModel.selectIncident(inc) },
                        onNavigate = { screen -> viewModel.setScreen(screen) }
                    )
                }

                AppScreen.RESOURCE_ALLOCATION -> {
                    ResourceAllocationScreen(
                        incidents = incidents,
                        resources = resources,
                        selectedIncident = selectedIncident,
                        onSelectIncident = { inc -> viewModel.selectIncident(inc) },
                        onAssignResource = { inc, res -> viewModel.assignResourceToIncident(inc, res) },
                        onTriggerDynamicReallocation = { viewModel.runDynamicReallocationDemo() },
                        isReallocating = isReallocating
                    )
                }

                AppScreen.REPORT_INCIDENT -> {
                    IncidentReportScreen(
                        formState = formState,
                        onUpdateForm = { update -> viewModel.updateForm(update) },
                        onRunAiPreTriage = { viewModel.runAiPreTriage() },
                        onSubmit = {
                            viewModel.submitIncident {
                                viewModel.setScreen(AppScreen.HOME)
                            }
                        }
                    )
                }

                AppScreen.ROUTE_TRACKING -> {
                    RouteTrackingScreen(
                        assignments = assignments,
                        incidents = incidents,
                        selectedIncident = selectedIncident,
                        onUpdateStatus = { id, status -> viewModel.updateIncidentStatus(id, status) }
                    )
                }

                AppScreen.OPERATIONS_DASHBOARD -> {
                    DashboardScreen(
                        incidents = incidents,
                        resources = resources,
                        assignments = assignments
                    )
                }

                AppScreen.AI_ASSISTANT -> {
                    CrisisChatScreen(
                        messages = chatMessages,
                        selectedMode = selectedGeminiMode,
                        onSelectMode = { mode -> viewModel.setGeminiMode(mode) },
                        onSendMessage = { prompt -> viewModel.sendChatMessage(prompt) },
                        onClearChat = { viewModel.clearChat() },
                        isLoading = isChatLoading
                    )
                }

                AppScreen.USER_PROFILE -> {
                    UserProfileScreen(
                        userEmail = userEmail,
                        currentRole = userRole,
                        currentLanguage = currentLanguage,
                        onRoleChange = { role -> viewModel.setUserRole(role) },
                        onLanguageToggle = { viewModel.toggleLanguage() },
                        onSignOut = onSignOut
                    )
                }
            }
        }
    }
}
