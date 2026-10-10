import express from 'express';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

const SYSTEM_PROMPT = `You are CrisisCore AI, an elite Emergency Command and Tactical Disaster Management Assistant developed for multi-agency urban disaster response (specialized in flood, rescue, medical triage, and resource logistics).
Your role:
1. Provide instant, calm, actionable, life-saving triage decisions.
2. Recommend constraint-based resource allocations (rescue boats, NDRF/SDRF personnel, medical units).
3. Evaluate situational threat level and route security.
4. Keep emergency answers structured, prioritized, and concise so operators can execute without delay.`;

// Mode mappings for models
function getModelAndConfigForMode(mode: string) {
  let model = 'gemini-3.8-flash';
  const config: Record<string, any> = {
    systemInstruction: SYSTEM_PROMPT,
    temperature: 0.3
  };

  switch (mode) {
    case 'FAST_LOW_LATENCY':
      model = 'gemini-3.1-flash-lite';
      break;
    case 'HIGH_THINKING':
      model = 'gemini-3.1-pro-preview';
      config.thinkingConfig = { thinkingLevel: 'HIGH' };
      break;
    case 'SEARCH_GROUNDED':
      model = 'gemini-3.8-flash';
      config.tools = [{ googleSearch: {} }];
      break;
    case 'MAPS_GROUNDED':
      model = 'gemini-3.8-flash';
      break;
    case 'BALANCED_GENERAL':
    default:
      model = 'gemini-3.8-flash';
      break;
  }

  return { model, config };
}

// Gemini Chat Endpoint
app.post('/api/gemini/chat', async (req, res) => {
  try {
    const { prompt, mode = 'BALANCED_GENERAL', history = [] } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      // Heuristic tactical response fallback when API key is not configured
      const fallbackReply = generateFallbackChatResponse(prompt, mode);
      return res.json({ text: fallbackReply, fallback: true });
    }

    const ai = new GoogleGenAI({ apiKey });
    const { model, config } = getModelAndConfigForMode(mode);

    // Build contents array
    const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

    if (Array.isArray(history)) {
      history.slice(-8).forEach((item: any) => {
        contents.push({
          role: item.sender === 'user' ? 'user' : 'model',
          parts: [{ text: item.text }]
        });
      });
    }

    contents.push({
      role: 'user',
      parts: [{ text: prompt }]
    });

    const response = await ai.models.generateContent({
      model,
      contents,
      config
    });

    const text = response.text || 'Tactical response received.';
    return res.json({ text, fallback: false });
  } catch (err: any) {
    console.error('Gemini chat error:', err?.message || err);
    // Provide intelligent tactical fallback rather than crashing
    const prompt = req.body?.prompt || '';
    const mode = req.body?.mode || 'BALANCED_GENERAL';
    const fallbackReply = generateFallbackChatResponse(prompt, mode);
    return res.json({ text: fallbackReply, fallback: true, errorNotice: err?.message });
  }
});

// Gemini Incident Pre-Triage Endpoint
app.post('/api/gemini/triage', async (req, res) => {
  try {
    const { title, type, description, waterDepthMeters = 1.0, affectedPopulation = 5 } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      const calculatedScore = Math.min(98, Math.max(30, Math.round((waterDepthMeters * 20) + (affectedPopulation * 2))));
      return res.json({
        priorityScore: calculatedScore,
        severity: calculatedScore > 80 ? 'CRITICAL' : calculatedScore > 60 ? 'HIGH' : 'MEDIUM',
        urgency: waterDepthMeters > 1.5 || affectedPopulation > 10 ? 'IMMEDIATE' : 'HIGH',
        recommendedResource: waterDepthMeters > 0.8 ? 'Inflatable Rescue Boat' : 'NDRF Search & Rescue Team',
        reasoning: `Rule-based constraint engine: flood depth ${waterDepthMeters}m with ${affectedPopulation} affected citizens requires swift amphibious assets and immediate staging.`
      });
    }

    const ai = new GoogleGenAI({ apiKey });
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

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.2
      }
    });

    const text = response.text || '';
    let score = 75;
    let severity = 'HIGH';
    let urgency = 'HIGH';
    let resource = 'Inflatable Rescue Boat';
    let reasoning = 'High flood depth threatening population requires immediate boat evacuation.';

    text.split('\n').forEach((line) => {
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

    return res.json({
      priorityScore: score,
      severity,
      urgency,
      recommendedResource: resource,
      reasoning
    });
  } catch (err: any) {
    console.error('Triage AI error:', err?.message || err);
    const depth = req.body.waterDepthMeters || 1.0;
    const pop = req.body.affectedPopulation || 5;
    const score = Math.min(98, Math.max(30, Math.round((depth * 20) + (pop * 2))));
    return res.json({
      priorityScore: score,
      severity: score > 80 ? 'CRITICAL' : 'HIGH',
      urgency: depth > 1.5 ? 'IMMEDIATE' : 'HIGH',
      recommendedResource: depth > 0.8 ? 'Inflatable Rescue Boat' : 'NDRF Search & Rescue Team',
      reasoning: `Emergency fallback triage: water depth ${depth}m with ${pop} affected victims triggers high-priority evacuation.`
    });
  }
});

function generateFallbackChatResponse(prompt: string, mode: string): string {
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
  return `🛡️ **Tactical Response [Mode: ${mode}]:**
Incident Command advises following standard SOP 14-B for urban inundation. Coordinate with field responders via VHF Channel 4. Maintain continuous GIS telemetry monitoring on affected evacuation corridors.`;
}

// Dev vs Production Setup
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CrisisCore AI Command Server running on http://0.0.0.0:${PORT} [${isProd ? 'PROD' : 'DEV'}]`);
  });
}

startServer();
