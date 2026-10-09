package com.example.data.service

import android.util.Log
import com.example.BuildConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.TimeUnit

enum class GeminiMode(val modelName: String, val label: String) {
    FAST_LOW_LATENCY("gemini-3.1-flash-lite-preview", "Low Latency (Fast Lite)"),
    BALANCED_GENERAL("gemini-3.5-flash", "General Triage (3.5 Flash)"),
    HIGH_THINKING("gemini-3.1-pro-preview", "Deep Strategic (3.1 Pro High Thinking)"),
    SEARCH_GROUNDED("gemini-3.5-flash", "Search Grounded (Live Intel)"),
    MAPS_GROUNDED("gemini-3.5-flash", "Maps Grounded (Safe Routes & Shelters)")
}

data class ChatMessage(
    val id: String = java.util.UUID.randomUUID().toString(),
    val sender: String, // "user" or "model"
    val text: String,
    val modeUsed: GeminiMode = GeminiMode.BALANCED_GENERAL,
    val timestamp: Long = System.currentTimeMillis(),
    val groundingSource: String? = null
)

object GeminiApiService {
    private const val TAG = "GeminiApiService"
    private const val BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models"

    private val client = OkHttpClient.Builder()
        .connectTimeout(60, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .writeTimeout(60, TimeUnit.SECONDS)
        .build()

    private const val SYSTEM_PROMPT = """You are CrisisCore AI, an elite Emergency Command and Tactical Disaster Management Assistant developed for multi-agency urban disaster response (specialized in flood, rescue, medical triage, and resource logistics).
Your role:
1. Provide instant, calm, actionable, life-saving triage decisions.
2. Recommend constraint-based resource allocations (rescue boats, NDRF/SDRF personnel, medical units).
3. Evaluate situational threat level and route security.
4. Keep emergency answers structured, prioritized, and concise so operators can execute without delay."""

    suspend fun sendPrompt(
        prompt: String,
        mode: GeminiMode = GeminiMode.BALANCED_GENERAL,
        history: List<ChatMessage> = emptyList()
    ): Result<String> = withContext(Dispatchers.IO) {
        try {
            val apiKey = BuildConfig.GEMINI_API_KEY
            if (apiKey.isBlank() || apiKey == "MY_GEMINI_API_KEY") {
                return@withContext Result.failure(
                    Exception("Gemini API key is not configured. Please add your key in the AI Studio Secrets panel.")
                )
            }

            val requestJson = JSONObject()

            // System Instruction
            val sysPart = JSONObject().put("text", SYSTEM_PROMPT)
            val sysInstruction = JSONObject().put("parts", JSONArray().put(sysPart))
            requestJson.put("systemInstruction", sysInstruction)

            // Contents (History + Current Prompt)
            val contentsArray = JSONArray()
            history.takeLast(10).forEach { msg ->
                val turn = JSONObject()
                turn.put("role", if (msg.sender == "user") "user" else "model")
                val p = JSONObject().put("text", msg.text)
                turn.put("parts", JSONArray().put(p))
                contentsArray.put(turn)
            }

            // Current prompt
            val currentTurn = JSONObject()
            currentTurn.put("role", "user")
            val currentPart = JSONObject().put("text", prompt)
            currentTurn.put("parts", JSONArray().put(currentPart))
            contentsArray.put(currentTurn)

            requestJson.put("contents", contentsArray)

            // Generation Config
            val genConfig = JSONObject()
            genConfig.put("temperature", 0.4)

            if (mode == GeminiMode.HIGH_THINKING) {
                // High Thinking configured with thinkingLevel HIGH and no maxOutputTokens
                val thinkingConfig = JSONObject()
                thinkingConfig.put("thinkingLevel", "HIGH")
                genConfig.put("thinkingConfig", thinkingConfig)
            }
            requestJson.put("generationConfig", genConfig)

            // Grounding Tools
            when (mode) {
                GeminiMode.SEARCH_GROUNDED -> {
                    val tools = JSONArray()
                    val searchTool = JSONObject().put("googleSearch", JSONObject())
                    tools.put(searchTool)
                    requestJson.put("tools", tools)
                }
                GeminiMode.MAPS_GROUNDED -> {
                    val tools = JSONArray()
                    val mapsTool = JSONObject().put("googleMaps", JSONObject())
                    tools.put(mapsTool)
                    requestJson.put("tools", tools)
                }
                else -> { /* no extra tools */ }
            }

            val url = "$BASE_URL/${mode.modelName}:generateContent?key=$apiKey"
            val body = requestJson.toString().toRequestBody("application/json; charset=utf-8".toMediaType())

            val request = Request.Builder()
                .url(url)
                .post(body)
                .build()

            val response = client.newCall(request).execute()
            val responseBody = response.body?.string() ?: ""

            if (!response.isSuccessful) {
                Log.e(TAG, "Gemini API error code ${response.code}: $responseBody")
                return@withContext Result.failure(Exception("Gemini error (${response.code}): $responseBody"))
            }

            val respJson = JSONObject(responseBody)
            val candidates = respJson.optJSONArray("candidates")
            if (candidates != null && candidates.length() > 0) {
                val first = candidates.getJSONObject(0)
                val contentObj = first.optJSONObject("content")
                val parts = contentObj?.optJSONArray("parts")
                if (parts != null && parts.length() > 0) {
                    val textBuilder = StringBuilder()
                    for (i in 0 until parts.length()) {
                        val part = parts.getJSONObject(i)
                        if (part.has("text")) {
                            textBuilder.append(part.getString("text"))
                        }
                    }
                    return@withContext Result.success(textBuilder.toString())
                }
            }

            Result.failure(Exception("No response text returned by model."))
        } catch (e: Exception) {
            Log.e(TAG, "Failed calling Gemini API", e)
            Result.failure(e)
        }
    }

    /**
     * AI Pre-Triage for Incident Reporting:
     * Evaluates incident description and produces structured priority score (1-100),
     * urgency, threat level, and recommended resource type.
     */
    suspend fun analyzeIncidentTriage(
        title: String,
        type: String,
        description: String,
        waterDepthMeters: Double,
        affectedPopulation: Int
    ): Result<TriageResult> = withContext(Dispatchers.IO) {
        val prompt = """Analyze this emergency incident report and return your assessment strictly in the format:
PRIORITY_SCORE: [number 1-100]
SEVERITY: [CRITICAL, HIGH, MEDIUM, or LOW]
URGENCY: [IMMEDIATE, HIGH, or NORMAL]
RECOMMENDED_RESOURCE: [Inflatable Rescue Boat, Advanced Life Support Ambulance, NDRF Search & Rescue Team, Drone Recon, or Food/Water Pack]
REASONING: [1-2 concise tactical sentences]

Incident Details:
Title: $title
Type: $type
Description: $description
Estimated Flood Water Depth: $waterDepthMeters meters
Estimated Affected Population: $affectedPopulation people"""

        val responseResult = sendPrompt(prompt, GeminiMode.BALANCED_GENERAL)
        if (responseResult.isSuccess) {
            val text = responseResult.getOrNull() ?: ""
            var score = 75
            var severity = "HIGH"
            var urgency = "HIGH"
            var resource = "Inflatable Rescue Boat"
            var reasoning = "High flood depth threatening population requires immediate boat evacuation."

            text.lines().forEach { line ->
                val trimmed = line.trim()
                when {
                    trimmed.startsWith("PRIORITY_SCORE:", ignoreCase = true) -> {
                        val num = trimmed.substringAfter(":").trim().toIntOrNull()
                        if (num != null) score = num.coerceIn(1, 100)
                    }
                    trimmed.startsWith("SEVERITY:", ignoreCase = true) -> {
                        severity = trimmed.substringAfter(":").trim().uppercase()
                    }
                    trimmed.startsWith("URGENCY:", ignoreCase = true) -> {
                        urgency = trimmed.substringAfter(":").trim().uppercase()
                    }
                    trimmed.startsWith("RECOMMENDED_RESOURCE:", ignoreCase = true) -> {
                        resource = trimmed.substringAfter(":").trim()
                    }
                    trimmed.startsWith("REASONING:", ignoreCase = true) -> {
                        reasoning = trimmed.substringAfter(":").trim()
                    }
                }
            }
            Result.success(TriageResult(score, severity, urgency, resource, reasoning))
        } else {
            // Intelligent heuristic fallback if offline or no API key
            val calculatedScore = ((waterDepthMeters * 20) + (affectedPopulation * 2)).toInt().coerceIn(30, 98)
            val result = TriageResult(
                priorityScore = calculatedScore,
                severity = if (calculatedScore > 80) "CRITICAL" else "HIGH",
                urgency = if (waterDepthMeters > 1.5 || affectedPopulation > 10) "IMMEDIATE" else "HIGH",
                recommendedResource = if (waterDepthMeters > 0.8) "Inflatable Rescue Boat" else "NDRF Search & Rescue Team",
                reasoning = "Automatic constraint evaluation: water depth ${waterDepthMeters}m with $affectedPopulation victims requires watercraft & rapid triage."
            )
            Result.success(result)
        }
    }
}

data class TriageResult(
    val priorityScore: Int,
    val severity: String,
    val urgency: String,
    val recommendedResource: String,
    val reasoning: String
)
