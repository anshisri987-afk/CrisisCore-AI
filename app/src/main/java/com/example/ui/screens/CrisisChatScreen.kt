package com.example.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.service.ChatMessage
import com.example.data.service.GeminiMode
import com.example.ui.theme.*
import kotlinx.coroutines.launch

@Composable
fun CrisisChatScreen(
    messages: List<ChatMessage>,
    selectedMode: GeminiMode,
    onSelectMode: (GeminiMode) -> Unit,
    onSendMessage: (String) -> Unit,
    onClearChat: () -> Unit,
    isLoading: Boolean
) {
    var inputText by remember { mutableStateOf("") }
    val listState = rememberLazyListState()
    val coroutineScope = rememberCoroutineScope()

    LaunchedEffect(messages.size) {
        if (messages.isNotEmpty()) {
            listState.animateScrollToItem(messages.size - 1)
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(CrisisNavyDark)
    ) {
        // 1. Intelligence Mode Selector Bar
        Surface(
            color = CrisisSurfaceDark,
            modifier = Modifier.fillMaxWidth(),
            border = androidx.compose.foundation.BorderStroke(0.dp, CrisisBorderDark)
        ) {
            Column(modifier = Modifier.padding(12.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(8.dp)
                                .clip(CircleShape)
                                .background(CrisisCyan)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "AI INTELLIGENCE ENGINE",
                            style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                            color = CrisisCyan
                        )
                    }

                    IconButton(
                        onClick = onClearChat,
                        modifier = Modifier
                            .size(24.dp)
                            .testTag("clear_chat_button")
                    ) {
                        Icon(
                            imageVector = Icons.Default.DeleteOutline,
                            contentDescription = "Clear Session",
                            tint = CrisisTextSecondaryDark,
                            modifier = Modifier.size(16.dp)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))

                LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    items(GeminiMode.values()) { mode ->
                        FilterChip(
                            selected = selectedMode == mode,
                            onClick = { onSelectMode(mode) },
                            label = {
                                Text(
                                    text = mode.label,
                                    fontSize = 11.sp,
                                    fontWeight = if (selectedMode == mode) FontWeight.Bold else FontWeight.Normal
                                )
                            },
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = when (mode) {
                                    GeminiMode.HIGH_THINKING -> CrisisPrimaryAmber
                                    GeminiMode.FAST_LOW_LATENCY -> CrisisGreenDark
                                    GeminiMode.SEARCH_GROUNDED, GeminiMode.MAPS_GROUNDED -> CrisisCyanDark
                                    else -> CrisisSurfaceVariantDark
                                },
                                selectedLabelColor = Color.White
                            ),
                            modifier = Modifier.testTag("gemini_mode_${mode.name}")
                        )
                    }
                }
            }
        }

        // 2. Chat Conversation Scrollable Thread
        LazyColumn(
            state = listState,
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth()
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
            contentPadding = PaddingValues(top = 12.dp, bottom = 12.dp)
        ) {
            items(messages) { msg ->
                ChatBubble(message = msg)
            }

            if (isLoading) {
                item {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        modifier = Modifier.padding(vertical = 4.dp)
                    ) {
                        CircularProgressIndicator(
                            color = CrisisCyan,
                            strokeWidth = 2.dp,
                            modifier = Modifier.size(16.dp)
                        )
                        Text(
                            text = when (selectedMode) {
                                GeminiMode.HIGH_THINKING -> "Thinking deeply (Gemini 3.1 Pro High Thinking)..."
                                GeminiMode.FAST_LOW_LATENCY -> "Responding fast (3.1 Flash-Lite)..."
                                GeminiMode.SEARCH_GROUNDED -> "Grounding with Google Search Met data..."
                                GeminiMode.MAPS_GROUNDED -> "Grounding with Google Maps GIS data..."
                                else -> "Generating tactical command advice..."
                            },
                            style = MaterialTheme.typography.labelSmall,
                            color = CrisisCyan
                        )
                    }
                }
            }
        }

        // 3. Quick Emergency Prompt Chips
        LazyRow(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 6.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            val suggestions = listOf(
                "Flood evacuation checklist",
                "Triage protocol for hypothermia",
                "Alternative route for submerged NH-24",
                "Generate SITREP command summary"
            )
            items(suggestions) { prompt ->
                Surface(
                    color = CrisisSurfaceDark,
                    shape = RoundedCornerShape(16.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, CrisisBorderDark),
                    modifier = Modifier.testTag("prompt_chip_${prompt.take(10)}")
                ) {
                    TextButton(
                        onClick = { onSendMessage(prompt) },
                        contentPadding = PaddingValues(horizontal = 10.dp, vertical = 2.dp),
                        modifier = Modifier.height(30.dp)
                    ) {
                        Text(
                            text = prompt,
                            style = MaterialTheme.typography.labelSmall.copy(fontSize = 11.sp),
                            color = CrisisTextPrimaryDark
                        )
                    }
                }
            }
        }

        // 4. Input Row
        Surface(
            color = CrisisSurfaceDark,
            modifier = Modifier.fillMaxWidth(),
            border = androidx.compose.foundation.BorderStroke(1.dp, CrisisBorderDark)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 12.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedTextField(
                    value = inputText,
                    onValueChange = { inputText = it },
                    placeholder = { Text("Ask tactical command or request triage...", fontSize = 13.sp) },
                    maxLines = 3,
                    shape = RoundedCornerShape(20.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = CrisisCyan,
                        unfocusedBorderColor = CrisisBorderDark,
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White
                    ),
                    modifier = Modifier
                        .weight(1f)
                        .testTag("chat_input_field")
                )

                IconButton(
                    onClick = {
                        if (inputText.isNotBlank()) {
                            val txt = inputText
                            inputText = ""
                            onSendMessage(txt)
                        }
                    },
                    enabled = !isLoading && inputText.isNotBlank(),
                    colors = IconButtonDefaults.iconButtonColors(
                        containerColor = CrisisPrimaryAmber,
                        contentColor = Color.White,
                        disabledContainerColor = CrisisSurfaceVariantDark
                    ),
                    modifier = Modifier
                        .size(44.dp)
                        .testTag("chat_send_button")
                ) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.Send,
                        contentDescription = "Send",
                        modifier = Modifier.size(18.dp)
                    )
                }
            }
        }
    }
}

@Composable
fun ChatBubble(message: ChatMessage) {
    val isUser = message.sender == "user"

    Column(
        modifier = Modifier.fillMaxWidth(),
        horizontalAlignment = if (isUser) Alignment.End else Alignment.Start
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp),
            modifier = Modifier.padding(bottom = 2.dp)
        ) {
            Text(
                text = if (isUser) "Operator" else "CrisisCore AI",
                style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold, fontSize = 10.sp),
                color = if (isUser) CrisisPrimaryAmber else CrisisCyan
            )

            if (!isUser && message.groundingSource != null) {
                Surface(
                    color = CrisisCyanDark.copy(alpha = 0.3f),
                    shape = RoundedCornerShape(4.dp)
                ) {
                    Text(
                        text = "GROUNDED",
                        style = MaterialTheme.typography.labelSmall.copy(fontSize = 8.sp, fontWeight = FontWeight.Bold),
                        color = CrisisCyan,
                        modifier = Modifier.padding(horizontal = 4.dp, vertical = 1.dp)
                    )
                }
            }
        }

        Surface(
            color = if (isUser) CrisisPrimaryAmber.copy(alpha = 0.25f) else CrisisSurfaceVariantDark,
            shape = RoundedCornerShape(
                topStart = 14.dp,
                topEnd = 14.dp,
                bottomStart = if (isUser) 14.dp else 2.dp,
                bottomEnd = if (isUser) 2.dp else 14.dp
            ),
            border = androidx.compose.foundation.BorderStroke(
                1.dp,
                if (isUser) CrisisPrimaryAmber.copy(alpha = 0.5f) else CrisisBorderDark
            ),
            modifier = Modifier.widthIn(max = 320.dp)
        ) {
            Column(modifier = Modifier.padding(12.dp)) {
                Text(
                    text = message.text,
                    style = MaterialTheme.typography.bodyMedium.copy(fontSize = 13.sp, lineHeight = 18.sp),
                    color = Color.White
                )

                if (message.groundingSource != null) {
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = "Source: ${message.groundingSource}",
                        style = MaterialTheme.typography.labelSmall.copy(fontSize = 9.sp),
                        color = CrisisCyan
                    )
                }
            }
        }
    }
}
