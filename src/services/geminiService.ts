import { ChatMessage, GeminiMode, TriageResult, GEMINI_MODES } from '../types';

const SYSTEM_PROMPT = `You are CrisisCore AI, an elite Emergency Command and Tactical Disaster Management Assistant developed for multi-agency urban disaster response (specialized in flood, rescue, medical triage, and resource logistics).
Your role:
1. Provide instant, calm, actionable, life-saving triage decisions.
2. Recommend constraint-based resource allocations (rescue boats, NDRF/SDRF personnel, medical units).
3. Evaluate situational threat level and route security.
4. Keep emergency answers structured, prioritized, and concise so operators can execute without delay.`;

export async function sendPrompt(
  prompt: string,
  mode: GeminiMode = 'BALANCED_GENERAL',
  history: ChatMessage[] = []
): Promise<{ text: string; fallback: boolean }> {
  const apiKey =
    import.meta.env.VITE_GEMINI_API_KEY ||
    (typeof process !== 'undefined' && process.env ? process.env.GEMINI_API_KEY : '');

  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return {
      text: generateTacticalFallbackResponse(prompt, mode),
      fallback: true
    };
  }

  try {
    const modelName = GEMINI_MODES[mode]?.modelName || 'gemini-3.8-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const contents = [
      ...history.slice(-8).map((msg) => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      })),
      {
        role: 'user',
        parts: [{ text: prompt }]
      }
    ];

    const body: Record<string, any> = {
      systemInstruction: {
        parts: [{ text: SYSTEM_PROMPT }]
      },
      contents,
      generationConfig: {
        temperature: 0.3
      }
    };

    if (mode === 'HIGH_THINKING') {
      body.generationConfig.thinkingConfig = { thinkingLevel: 'HIGH' };
    }

    if (mode === 'SEARCH_GROUNDED') {
      body.tools = [{ googleSearch: {} }];
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      throw new Error(`Gemini API error status ${res.status}`);
    }

    const data = await res.json();
    const candidate = data?.candidates?.[0];
    const textPart = candidate?.content?.parts?.map((p: any) => p.text).join('') || '';

    if (!textPart) {
      throw new Error('No candidate content returned');
    }

    return { text: textPart, fallback: false };
  } catch (err) {
    console.warn('Gemini API call fell back to local emergency protocol:', err);
    return {
      text: generateTacticalFallbackResponse(prompt, mode),
      fallback: true
    };
  }
}

export async function analyzeIncidentTriage(
  title: string,
  type: string,
  description: string,
  waterDepthMeters: number,
  affectedPopulation: number
): Promise<TriageResult> {
  const apiKey =
    import.meta.env.VITE_GEMINI_API_KEY ||
    (typeof process !== 'undefined' && process.env ? process.env.GEMINI_API_KEY : '');

  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return generateHeuristicTriage(waterDepthMeters, affectedPopulation);
  }

  try {
    const prompt = `Analyze this emergency incident report and return your assessment strictly in the format:
PRIORITY_SCORE: [number 1-100]
SEVERITY: [CRITICAL, HIGH, MEDIUM, or LOW]
URGENCY: [IMMEDIATE, HIGH, or NORMAL]
RECOMMENDED_RESOURCE: [Inflatable Rescue Boat, Advanced Life Support Ambulance, NDRF Search & Rescue Team, Drone Recon, or Food/Water Pack]
REASONING: [1-2 concise tactical sentences]

Incident Details:
Title: ${title}
Type: ${type}
Description: ${description}
Estimated Flood Water Depth: ${waterDepthMeters} meters
Estimated Affected Population: ${affectedPopulation} people`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2 }
      })
    });

    if (!res.ok) throw new Error('API failed');

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    let score = 75;
    let severity = 'HIGH';
    let urgency = 'HIGH';
    let resource = 'Inflatable Rescue Boat';
    let reasoning = 'High flood depth threatening population requires immediate boat evacuation.';

    text.split('\n').forEach((line: string) => {
      const trimmed = line.trim();
      if (/^PRIORITY_SCORE:/i.test(trimmed)) {
        const num = parseInt(trimmed.replace(/^PRIORITY_SCORE:/i, '').trim(), 10);
        if (!isNaN(num)) score = Math.max(1, Math.min(100, num));
      } else if (/^SEVERITY:/i.test(trimmed)) {
        severity = trimmed.replace(/^SEVERITY:/i, '').trim().toUpperCase();
      } else if (/^URGENCY:/i.test(trimmed)) {
        urgency = trimmed.replace(/^URGENCY:/i, '').trim().toUpperCase();
      } else if (/^RECOMMENDED_RESOURCE:/i.test(trimmed)) {
        resource = trimmed.replace(/^RECOMMENDED_RESOURCE:/i, '').trim();
      } else if (/^REASONING:/i.test(trimmed)) {
        reasoning = trimmed.replace(/^REASONING:/i, '').trim();
      }
    });

    return {
      priorityScore: score,
      severity,
      urgency,
      recommendedResource: resource,
      reasoning
    };
  } catch (err) {
    return generateHeuristicTriage(waterDepthMeters, affectedPopulation);
  }
}

function generateHeuristicTriage(waterDepthMeters: number, affectedPopulation: number): TriageResult {
  const calculatedScore = Math.min(
    98,
    Math.max(30, Math.round(waterDepthMeters * 20 + affectedPopulation * 2))
  );

  return {
    priorityScore: calculatedScore,
    severity: calculatedScore > 80 ? 'CRITICAL' : calculatedScore > 60 ? 'HIGH' : 'MEDIUM',
    urgency: waterDepthMeters > 1.5 || affectedPopulation > 10 ? 'IMMEDIATE' : 'HIGH',
    recommendedResource:
      waterDepthMeters > 0.8 ? 'Inflatable Rescue Boat' : 'NDRF Search & Rescue Team',
    reasoning: `Automatic constraint evaluation: water depth ${waterDepthMeters}m with ${affectedPopulation} victims requires watercraft & rapid triage.`
  };
}

function generateTacticalFallbackResponse(prompt: string, mode: string): string {
  const p = prompt.toLowerCase();
  if (p.includes('checklist') || p.includes('evacuat')) {
    return `📋 **URBAN FLOOD EVACUATION PROTOCOL (Stage 3):**
1. **Immediate Life Safety:** Move all residents to elevations above 208.7m contour. Cut main electrical grid breakers in flooded sectors.
2. **Resource Staging:** Pre-position NDRF shallow-draft boats at Bund Ramp Points B & C.
3. **Medical Channel:** Establish ALS ambulance green corridor along Northern Elevated Flyover.
4. **Vulnerable Population:** Prioritize senior care centers, hospitals, and child-care shelters.`;
  }
  if (p.includes('route') || p.includes('nh-24') || p.includes('bypass')) {
    return `🛣️ **TACTICAL ROUTE ADVISORY:**
NH-24 underpass is inundated with water depth exceeding 2.4 meters and is CLOSED to standard emergency vehicles.
- **Primary Corridor:** Northern Ring Road Elevated Embankment (Dry clearance: 100%).
- **Estimated Travel Time:** 8–12 minutes from Sector 1 Depot to Metro Hospital.
- **Hazards:** Submerged manhole covers at Pillar 42 approach. Watercraft transition required at Point C.`;
  }
  if (p.includes('sitrep') || p.includes('summary')) {
    return `📊 **COMMAND SITREP (Yamuna Basin Active Grid):**
- **Hazard Level:** RED ALERT (Yamuna river gauge 208.66m, +0.3m above danger mark).
- **Active Incidents:** 5 logged (2 Critical, 2 High, 1 Medium).
- **Deployed Assets:** NDRF Swift Boat Alpha en route; SDRF Boat Bravo & ALS Ambulance ready on standby.
- **Top Priority:** Metro Hospital ICU evacuation (42 ventilator patients) and Yamuna Bund Point C breach (180 stranded).`;
  }
  return `🛡️ **Tactical Response [Mode: ${GEMINI_MODES[mode as GeminiMode]?.label || mode}]:**
Incident Command advises following standard SOP 14-B for urban inundation. Coordinate with field responders via VHF Channel 4. Maintain continuous GIS telemetry monitoring on affected evacuation corridors.`;
}
