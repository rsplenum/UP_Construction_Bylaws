import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let aiClient: GoogleGenAI | null = null;
function getGeminiClient() {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

const BYELAWS_KNOWLEDGE_SUMMARY = `
You are the official AI Assistant for the "Uttar Pradesh Building Construction and Development Byelaws 2025" (TMPR8, Housing & Urban Planning Department, Government of Uttar Pradesh).
You have deep and accurate knowledge of all 18 Chapters and 15 Appendices:

Key Rules & Thresholds:
1. Chapter 1: Definitions (102 defined terms)
   - FAR = Total covered area on all floors / Plot Area
   - Compensatory FAR: surrendered land compensation
   - Purchasable FAR (PFAR) & Premium Purchasable FAR (PPFAR)
   - Stilt Floor: Built on pillars for parking, excluded from FAR but included in building height
   - Basement: max height above ground 1.20m, min height 2.4m to 4.5m
   - Habitable Room: min 9.5 sqm (single room) or 12.5 sqm (EWS/LIG), min width 2.4m, min height 2.75m.

2. Chapter 2: Permissions & Self-Certification
   - Residential plots up to 100 sqm and Commercial plots up to 30 sqm: NO permission required (token Re. 1 online self-certification, no completion certificate needed).
   - In approved/developed layouts: Residential up to 500 sqm (except multi-unit) and Commercial up to 200 sqm: instant online approval with LTP certificate.
   - Deemed NOC: 15 departments table. Timelines: 10 to 15 days; deemed approval after 30 days if no explicit objection.
   - Validity: Development permit 5 years (+3 yr extension); Building permit 5 years (+3 yr revalidation).
   - Up to Plinth Level: Mandatory submission of GPS coordinates, geo-tagged photos, and Appendix-12 affidavit within 48 hours.

3. Chapter 3: Standards for Land Development & Buildings
   - Access Road Widths: Built-up residential min 6m; Non-built-up residential: 9m (up to 10 acres), 12m (10-25 acres), 18m (>25 acres). Non-residential: 12m, 18m, 24m.
   - Parks/Open Spaces: Layouts >3000 sqm: 10% (with ZDP) or 15% (without ZDP) on telescopic basis. 30% must be Miyawaki dense vegetation for groundwater recharge; up to 70% under park parking allowed.
   - Plotted Residential Setbacks:
     * <=150 sqm: Front 1.0m, Rear 0m, Sides 0m
     * 150-300 sqm: Front 3.0m, Rear 1.5m, Sides 0m
     * 300-500 sqm: Front 3.0m, Rear 3.0m, Sides 0m
     * 500-1200 sqm (Semi-detached): Front 4.5m, Rear 4.5m, Side-1 1.5m, Side-2 0m
     * >1200 sqm (Detached): Front 6.0m, Rear 6.0m, Side-1 1.5m, Side-2 1.5m
   - High-Rise Setbacks (>15m height): Progressive table: 15-17.5m -> 5m; 17.5-21m -> 6m; 21-27m -> 7m; 27-33m -> 8m; 33-39m -> 9m; 39-45m -> 10m; 45-51m -> 11m; >51m -> Front 15m, others 12m.
   - FAR Exemptions: Lift machine room, lift lobby up to 10 sqm, meter room, service ducts, parking in stilt/basement/podium, balconies up to 2.0m (residential/group housing), fire escapes, rainwater structures.
   - Room Minimums: Kitchen with dining 7.5 sqm (min width 2.1m); kitchen without dining 5.0 sqm; toilet 1.5 sqm (min 1m width); WC 1.1 sqm; combined bath+WC 2.8 sqm; loft max 1.5m ht, 30% area; mezzanine min 9.5 sqm, max 33% plinth; ramp slope 1:10 or 1:12; staircase widths 1.0m (single res), 1.25m (multi/apt up to 15m), 1.5m (high-rise / hotel / general), 2.0m (assembly/institutional).

4. Chapter 4: Residential, EWS & LIG
   - EWS/LIG: 10% each mandatory reservation for projects with >1 unit. Plot size EWS: 35-40 sqm, LIG: 40-50 sqm. Carpet area EWS: 30-35 sqm, LIG: 35-45 sqm. Income limit EWS <3 Lakhs, LIG 3-6 Lakhs. Ceiling cost: EWS Rs. 4.50L, LIG Rs. 9.00L (+20% in cities >10 lakh pop).
   - Shelter fee formula: 10% of [(total DUs) x (min EWS carpet + min LIG carpet) x Circle Rate].

5. Chapter 5 & 8: Commercial & Mixed Use / TOD
   - Bazaar Street: Commercial on Ground + 1st floor; min 12m road.
   - Malls/Commercial Complexes: Setbacks, Skylighted Atrium permissible (max 20% area for temporary kiosks, not in FAR).
   - TOD Zone: FAR multiplier on Base FAR: 12m road -> 150%; 12-24m -> 250%; 24-45m -> 350%; >45m -> Unrestricted.

6. Chapter 9: Additional FAR & Purchasable FAR
   - Formula: C = Le x Rc x P, where Le = FP / Base FAR
   - Factor Coefficient P: Commercial = 0.50 (PFAR) / 1.0 (PPFAR); Mixed Use & Office = 0.45 / 0.90; Hotels = 0.40 / 0.80; Residential Plotted = 0.40 / NA; Group Housing = 0.40 / 0.80; Community = 0.20 / 0.40.
   - Green Buildings: +3% FAR (GRIHA 3-star / IGBC/LEED Silver), +5% (4-star/Gold), +7% (5-star/Platinum).

7. Chapter 10 & 11: Fire & Structural Safety
   - Fire Safety Certificate mandatory for >15m height or special buildings >500 sqm. 21 safety checkpoints.
   - SDBR (Structural Design Basis Report) in 4 parts. IS codes: IS 456, IS 800, IS 1893, IS 13920. Peer review mandatory for height >50m.

8. Chapter 12: Differently Abled & Children
   - 1800mm walkways (max 5% slope), 1:12 ramp with 800mm handrails, 1500x1750mm accessible toilet with swinging out door, tactile pavers, 2 reserved parking bays within 30m.

9. Chapter 13: Sustainability
   - Rainwater harvesting mandatory for plots >= 300 sqm.
   - Solar water heater mandatory for plots >= 500 sqm (and hotels/hospitals/institutions).
   - Rooftop solar PV mandatory on >=25% roof for plots >=5000 sqm.
   - Wastewater recycling mandatory if discharge >10,000 liters/day (purple pipe for flushing/gardening).

10. Chapter 15 & Appendix-15: Zoning & Permissibility
    - 16 Standard zones (BU, R, MU, C-1, C-2, SI, LI, OB, PSP, TT, F, RC, GB, RA, A, HF).
    - Mapped to 22 UP Development Authorities (Ayodhya, Meerut, Agra, Kanpur, Prayagraj, Varanasi, etc.).
    - Impact fee = Plot Area x Circle Rate x Coefficient x 0.25.

11. Chapter 16: Compounding
    - Non-compoundable: public land/amenities, illegal colonies, disputed land, fire/earthquake violations, height in heritage/airport zones, water bodies.
    - Compoundable: Front setback max 25% up to 1.0m; Rear setback 100% up to 500 sqm res; Side setback up to 25%; Height up to 10%; FAR up to 10%.
    - Fee schedule with exact rates per sqm or % of land price.

12. Chapter 17: EV Charging Infrastructure (EVCI)
    - 20% of parking capacity reserved for EVs. Additional power load calculated with safety factor 1.25.
    - Charger standards: CCS (>=50 kW), CHAdeMO (>=50 kW), Type-2 AC (>=22 kW), Bharat DC-001 (15 kW), Bharat AC-001 (10 kW).

Always provide exact citations to Chapter and Paragraph numbers, concise explanations, and structured tables or calculations where helpful.
`;

/** Longest question accepted, in characters. */
const MAX_MESSAGE_CHARS = 4_000;
/** Conversation turns forwarded as context. */
const MAX_HISTORY_TURNS = 6;
/** Characters kept from each historical turn. */
const MAX_HISTORY_TURN_CHARS = 2_000;
/** Requests allowed per client per window. */
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_MS = 60_000;
/** Upstream model call timeout. */
const MODEL_TIMEOUT_MS = 30_000;

const MODEL_ID = process.env.GEMINI_MODEL || "gemini-3.8-flash";

/**
 * Fixed-window rate limiter, in memory.
 *
 * The chat route proxies a metered upstream model with no auth in front of it. This is
 * per-process, so it does not survive a restart or coordinate across replicas — put a
 * shared limiter in the ingress for a real deployment — but it stops a single client
 * from draining the key.
 */
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now();
  const bucket = rateBuckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    rateBuckets.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, retryAfterSec: 0 };
  }
  if (bucket.count >= RATE_LIMIT_MAX) {
    return { allowed: false, retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  bucket.count += 1;
  return { allowed: true, retryAfterSec: 0 };
}

// Drop expired buckets so the map cannot grow without bound.
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of rateBuckets) {
    if (now >= bucket.resetAt) rateBuckets.delete(key);
  }
}, RATE_LIMIT_WINDOW_MS).unref();

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  // A chat endpoint has no use for a 10 MB body.
  app.use(express.json({ limit: "64kb" }));

  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("Permissions-Policy", "geolocation=(self), camera=(), microphone=()");
    next();
  });

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      document: "UP Building Byelaws 2025 (TMPR8)",
      aiConfigured: Boolean(process.env.GEMINI_API_KEY),
      model: MODEL_ID,
    });
  });

  app.post("/api/chat", async (req, res) => {
    const clientKey = req.ip || req.socket.remoteAddress || "unknown";
    const limit = checkRateLimit(clientKey);
    if (!limit.allowed) {
      res.setHeader("Retry-After", String(limit.retryAfterSec));
      return res.status(429).json({
        error: "Too many questions in a short period.",
        retryAfterSeconds: limit.retryAfterSec,
      });
    }

    try {
      const { message, conversationHistory = [] } = req.body ?? {};

      if (typeof message !== "string" || message.trim().length === 0) {
        return res.status(400).json({ error: "A question is required." });
      }
      if (message.length > MAX_MESSAGE_CHARS) {
        return res.status(413).json({
          error: `Question is too long (${message.length} characters). The limit is ${MAX_MESSAGE_CHARS}.`,
        });
      }

      const client = getGeminiClient();
      if (!client) {
        return res.status(200).json({
          reply:
            "The AI copilot is not configured on this deployment (no GEMINI_API_KEY). Every rule, table and calculation is still available offline in the Byelaws Code, FAR & Fees, 2D Setbacks and Zoning Matrix tabs.",
          source: "offline_fallback",
        });
      }

      const contents: { role: string; parts: { text: string }[] }[] = [];
      const history = Array.isArray(conversationHistory) ? conversationHistory : [];

      for (const turn of history.slice(-MAX_HISTORY_TURNS)) {
        if (!turn || (turn.role !== "user" && turn.role !== "model")) continue;
        if (typeof turn.text !== "string") continue;
        contents.push({
          role: turn.role,
          parts: [{ text: turn.text.slice(0, MAX_HISTORY_TURN_CHARS) }],
        });
      }

      contents.push({ role: "user", parts: [{ text: message }] });

      // Bound the upstream call so a hung model does not hold the socket open.
      const response = await Promise.race([
        client.models.generateContent({
          model: MODEL_ID,
          contents,
          config: { systemInstruction: BYELAWS_KNOWLEDGE_SUMMARY, temperature: 0.2 },
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("The model did not respond in time.")), MODEL_TIMEOUT_MS),
        ),
      ]);

      const replyText = response.text?.trim();
      if (!replyText) {
        return res.status(502).json({ error: "The model returned an empty answer. Try rephrasing the question." });
      }

      res.json({ reply: replyText, source: MODEL_ID });
    } catch (err) {
      // Log the detail; return a message that leaks neither the key nor the stack.
      console.error("[/api/chat]", err);
      const timedOut = err instanceof Error && err.message.includes("did not respond in time");
      res.status(timedOut ? 504 : 502).json({
        error: timedOut
          ? "The AI service timed out. Please try again."
          : "The AI service is unavailable right now. All rules and calculators still work offline.",
      });
    }
  });

  // Vite middleware in dev or static files in prod
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      if (req.path.startsWith("/api/")) return res.status(404).json({ error: "Unknown API route." });
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
