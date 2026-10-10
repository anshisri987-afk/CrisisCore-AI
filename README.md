# CrisisCore AI - Emergency Resource Allocation & Disaster Response System

CrisisCore AI is a tactical emergency command and multi-agency disaster management web application designed for urban flood response, rapid risk triage, and dynamic resource reallocation.

## Core Features

- **Unified Tactical Command Overview**: Real-time status of active emergencies, critical sirens, response time improvements, and deployed assets.
- **Dynamic Reallocation Engine (Sense → Decide → Allocate → Respond → Adapt)**: Simulates sudden high-priority crisis surges (e.g. Hospital ICU inundation with 42 ventilator patients) and automatically diverts active field resources in real time.
- **Interactive Situational GIS Map**: Custom vector canvas rendering coordinate grids, Yamuna flood inundation corridors, breached hazard zones, route glow lines, and pulsing priority markers.
- **Google OR-Tools Constraint Matcher**: Calculates asset compatibility match percentages based on equipment specifications, transit routes, water depth limits, and medical capacity.
- **Incident Reporting & AI Risk Pre-Triage**: Integrates Gemini AI to evaluate disaster parameters (water depth, affected population, urgency) and automatically generate priority scores (1–100) and recommended assets.
- **Route Guidance & Lifecycle Progression**: 7-stage Incident Response Lifecycle progression bar, turn-by-turn waypoint navigation, and flood-safe Northern Embankment corridor alerts.
- **UNDRR Sendai Framework Analytics**: Command metrics including resource utilization, average triage latency, and hazard distribution.
- **Multi-Mode AI Operations Assistant**: Gemini chat interface supporting Low Latency (Fast Lite), General Triage (3.8 Flash), Deep Strategic (3.1 Pro High Thinking), Search Grounding, and Maps Grounding.
- **Multi-Role Access Control**: Switch between Emergency Authority, Rescue Field Team, Citizen Reporter, and Relief Coordinator roles.
- **Bilingual Support**: Instant toggle between English and Hindi (हिन्दी) for emergency field operators.

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons
- **Backend**: Node.js, Express, Vite middleware, `@google/genai`
- **Telemetry**: Local persistent storage with initial urban flood baseline data
