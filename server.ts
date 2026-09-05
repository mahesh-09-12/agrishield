import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

// Server-side Gemini AI Client
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Helper to resolve image to base64 and mimeType
async function resolveImageToParts(
  input: string,
  fallbackMime: string = "image/jpeg"
): Promise<{ base64: string; mimeType: string } | null> {
  if (!input || typeof input !== "string") return null;

  // Case 1: Remote HTTP/HTTPS URL
  if (input.startsWith("http://") || input.startsWith("https://")) {
    try {
      const response = await fetch(input);
      if (!response.ok) {
        console.warn(`Failed to fetch image from URL: ${input}, status: ${response.status}`);
        return null;
      }
      const arrayBuffer = await response.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      const contentType = response.headers.get("content-type");
      const mimeType = contentType ? contentType.split(";")[0].trim() : fallbackMime;
      return { base64, mimeType };
    } catch (err) {
      console.warn(`Error downloading remote image URL: ${input}`, err);
      return null;
    }
  }

  // Case 2: Data URI (e.g. data:image/jpeg;base64,....)
  if (input.startsWith("data:")) {
    const match = input.match(/^data:([^;]+);base64,(.+)$/s);
    if (match) {
      return {
        mimeType: match[1] || fallbackMime,
        base64: match[2].trim(),
      };
    }
    const clean = input.replace(/^data:[^;]+;base64,/, "").trim();
    return { base64: clean, mimeType: fallbackMime };
  }

  // Case 3: Raw base64 string
  return { base64: input.trim(), mimeType: fallbackMime };
}

// AI Crop Damage Assessment Endpoint
app.post("/api/ai/assess-crop-damage", async (req, res) => {
  try {
    const {
      imageBase64,
      mimeType = "image/jpeg",
      cropType = "Rice",
      stage = "Flowering",
      disasterType = "Heavy Rainfall",
      evidenceType = "Post-disaster",
    } = req.body;

    const ai = getAIClient();

    if (!imageBase64) {
      return res.status(400).json({ error: "Missing imageBase64 parameter" });
    }

    // Resolve image into pure Base64 bytes & MIME type
    const resolvedImage = await resolveImageToParts(imageBase64, mimeType);

    // Fallback if AI or image bytes cannot be resolved
    if (!ai || !resolvedImage || !resolvedImage.base64) {
      const mockResult = {
        isFallback: true,
        fallbackReason: !ai ? "Gemini API client not initialized" : "Unable to decode image bytes",
        finalStatus: "NEEDS REVIEW",
        isAgricultural: false,
        contentIdentified: "Unverified image bytes",
        evidenceType: evidenceType || "Post-disaster",
        evidenceQuality: "LOW",
        cropIdentified: "Unknown",
        cropStage: "Unknown",
        observedConditions: "Cannot verify visual evidence offline. Manual human review required.",
        damageSeverity: "UNKNOWN",
        estimatedAffectedArea: "Not applicable",
        impactPercentage: "Not applicable",
        detectedDamage: [],
        evidenceMismatch: false,
        confidence: 0,
        reason: "Image verification could not be completed automatically. Human officer review required.",
        humanReviewRequired: true,
      };
      return res.json({ success: true, assessment: mockResult });
    }

    const prompt = `You are AgriShield's AI Evidence Verification and Damage Assessment Engine.

You must follow this STRICT TWO-STEP VERIFICATION PROTOCOL:

================================================================================
STEP 1: VISUAL CONTENT VERIFICATION (MANDATORY GATE)
================================================================================
Determine what the uploaded image actually depicts based ONLY on visual inspection.
CRITICAL RULES:
- Do NOT assume the image contains crop or field damage.
- Do NOT use the farmer's registered crop, disaster type, GPS, weather, or metadata as proof of visual content.
- Never invent, assume, or guess damage that is not visually observable in the image.

Analyze the image content into ONE of these:

CASE A: INVALID EVIDENCE
The image is clearly NOT an agricultural field or farm crop:
- Medical imagery (MRI scans, CT scans, X-rays, ultrasound, anatomical scans)
- Documents, certificates, paper, text pages, books, PDFs, printed forms, letters
- Screenshots (computer screens, smartphone screens, web browsers, UI, code, apps, WhatsApp chats)
- Indoor scenes, furniture, appliances, household items, cars, vehicles, electronics
- Human selfies, portraits, pets, random objects, memes, non-agricultural photos
ACTION:
- STOP IMMEDIATELY. Do NOT perform any crop, stage, or damage analysis.
- finalStatus MUST BE "INVALID EVIDENCE"
- isAgricultural MUST BE false
- contentIdentified MUST accurately state what the image is (e.g., "Brain MRI scan", "Printed document / medical report", "Mobile phone screenshot")
- damageSeverity MUST BE "NOT APPLICABLE"
- estimatedAffectedArea MUST BE "Not applicable"
- impactPercentage MUST BE "Not applicable"
- detectedDamage MUST BE []
- cropIdentified MUST BE "Not applicable"
- cropStage MUST BE "Not applicable"
- reason MUST clearly explain why it was rejected (e.g., "The uploaded image is a brain MRI scan and does not contain an agricultural field or crop. Crop damage assessment is not applicable.")

CASE B: UNCERTAIN (NEEDS REVIEW)
The image is too blurry, dark, heavily degraded, or ambiguous to reliably verify as agricultural:
ACTION:
- STOP. Do NOT guess damage or percentages.
- finalStatus MUST BE "NEEDS REVIEW"
- isAgricultural MUST BE false
- damageSeverity MUST BE "UNKNOWN"
- estimatedAffectedArea MUST BE "Not applicable"
- impactPercentage MUST BE "Not applicable"
- detectedDamage MUST BE []
- reason MUST explain that the image quality is insufficient for verification and human review is required.

CASE C: VALID AGRICULTURAL IMAGE
The image clearly depicts an agricultural crop, paddy field, orchard, plantation, or farm plot:
ACTION:
- Continue to crop, growth stage, and damage analysis.
- Visually identify the crop and stage if recognizable.
- If the visible crop visibly contradicts the registered crop (${cropType}), set finalStatus to "EVIDENCE MISMATCH". Otherwise "VERIFIED EVIDENCE".
- Detect ONLY damages that are visually supported (e.g. "Flood inundation", "Stem lodging", "Leaf rot", "Hail tears"). If no damage is observed, set damageSeverity to "NONE" and estimatedAffectedArea to "0%".
- Set damageSeverity: "NONE" | "LOW" | "MODERATE" | "HIGH" | "SEVERE"
- Estimate affected area percentage ONLY when the image provides sufficient visual perspective (e.g. "65%"). If the view is too close or insufficient to quantify, return "UNKNOWN".
- impactPercentage: e.g. "65%" or "0%" (or "Not applicable" if undamaged).

================================================================================
OUTPUT FORMAT
================================================================================
Return ONLY a valid JSON object adhering strictly to this schema:
{
  "finalStatus": "INVALID EVIDENCE" | "NEEDS REVIEW" | "VERIFIED EVIDENCE" | "EVIDENCE MISMATCH",
  "isAgricultural": boolean,
  "contentIdentified": string,
  "evidenceType": "${evidenceType}",
  "evidenceQuality": "HIGH" | "MEDIUM" | "LOW" | "INVALID",
  "cropIdentified": string,
  "cropStage": string,
  "observedConditions": string,
  "detectedDamage": string[],
  "damageSeverity": "NOT APPLICABLE" | "UNKNOWN" | "NONE" | "LOW" | "MODERATE" | "HIGH" | "SEVERE",
  "estimatedAffectedArea": string,
  "impactPercentage": string,
  "evidenceMismatch": boolean,
  "confidence": number,
  "reason": string,
  "humanReviewRequired": boolean
}`;

    let response;
    try {
      response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: {
          parts: [
            {
              inlineData: {
                data: resolvedImage.base64,
                mimeType: resolvedImage.mimeType,
              },
            },
            {
              text: prompt,
            },
          ],
        },
        config: {
          responseMimeType: "application/json",
        },
      });
    } catch (primaryErr: any) {
      console.warn("Primary model error, attempting gemini-3.1-flash-lite:", primaryErr?.message || primaryErr);
      response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: {
          parts: [
            {
              inlineData: {
                data: resolvedImage.base64,
                mimeType: resolvedImage.mimeType,
              },
            },
            {
              text: prompt,
            },
          ],
        },
        config: {
          responseMimeType: "application/json",
        },
      });
    }

    const text = response.text || "{}";
    let parsedResult;
    try {
      parsedResult = JSON.parse(text);
    } catch {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      parsedResult = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    }

    if (!parsedResult) {
      throw new Error("Failed to parse AI response JSON");
    }

    // Strict programmatic enforcement of rules for invalid images:
    if (parsedResult.finalStatus === "INVALID EVIDENCE" || parsedResult.isAgricultural === false) {
      parsedResult.finalStatus = "INVALID EVIDENCE";
      parsedResult.isAgricultural = false;
      parsedResult.damageSeverity = "NOT APPLICABLE";
      parsedResult.estimatedAffectedArea = "Not applicable";
      parsedResult.impactPercentage = "Not applicable";
      parsedResult.detectedDamage = [];
      parsedResult.cropIdentified = "Not applicable";
      parsedResult.cropStage = "Not applicable";
      parsedResult.evidenceQuality = "INVALID";
      parsedResult.humanReviewRequired = false;
    } else if (parsedResult.finalStatus === "NEEDS REVIEW") {
      parsedResult.finalStatus = "NEEDS REVIEW";
      parsedResult.isAgricultural = false;
      parsedResult.damageSeverity = "UNKNOWN";
      parsedResult.estimatedAffectedArea = "Not applicable";
      parsedResult.impactPercentage = "Not applicable";
      parsedResult.detectedDamage = [];
      parsedResult.humanReviewRequired = true;
    }

    parsedResult.isFallback = false;
    return res.json({ success: true, assessment: parsedResult });
  } catch (error: any) {
    console.error("Gemini assessment error:", error);
    // Return structured safe fallback without assuming damage
    return res.json({
      success: true,
      assessment: {
        isFallback: true,
        fallbackReason: error?.message || "AI service temporarily unavailable",
        finalStatus: "NEEDS REVIEW",
        isAgricultural: false,
        contentIdentified: "Unverified image",
        evidenceType: req.body?.evidenceType || "Post-disaster",
        evidenceQuality: "LOW",
        cropIdentified: "Unknown",
        cropStage: "Unknown",
        observedConditions: "Cannot verify visual evidence automatically. Manual review required.",
        detectedDamage: [],
        damageSeverity: "UNKNOWN",
        estimatedAffectedArea: "Not applicable",
        impactPercentage: "Not applicable",
        evidenceMismatch: false,
        confidence: 0,
        reason: "Image verification service could not complete automated analysis. Human review required.",
        humanReviewRequired: true,
      },
    });
  }
});

// Weather API Proxy / Aggregator with Open-Meteo Integration
app.get("/api/weather", async (req, res) => {
  try {
    const { lat, lng, startDate, endDate } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ success: false, error: "Latitude and longitude required" });
    }

    const latNum = parseFloat(lat as string);
    const lngNum = parseFloat(lng as string);

    const today = new Date().toISOString().split("T")[0];
    const defaultStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const targetStartDate = (startDate as string) || defaultStart;
    const targetEndDate = (endDate as string) || today;

    const openMeteoUrl = `https://archive-api.open-meteo.com/v1/archive?latitude=${latNum}&longitude=${lngNum}&start_date=${targetStartDate}&end_date=${targetEndDate}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,rain_sum,wind_speed_10m_max&timezone=auto`;

    let data;
    try {
      const response = await fetch(openMeteoUrl);
      if (response.ok) {
        data = await response.json();
      } else {
        const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latNum}&longitude=${lngNum}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,rain_sum,wind_speed_10m_max&past_days=7&forecast_days=3&timezone=auto`;
        const forecastRes = await fetch(forecastUrl);
        if (forecastRes.ok) {
          data = await forecastRes.json();
        }
      }
    } catch {
      data = null;
    }

    if (!data || !data.daily || !data.daily.time || data.daily.time.length === 0) {
      return res.status(504).json({ success: false, error: "Weather data unavailable from Open-Meteo API for these coordinates." });
    }

    const times = data.daily.time || [];
    const rainSums = data.daily.precipitation_sum || data.daily.rain_sum || [];
    const rawWindSpeeds = data.daily.wind_speed_10m_max || [];
    // Convert Open-Meteo wind speeds (m/s) to km/h for UI-consistent presentation
    const windSpeeds = (rawWindSpeeds || []).map((w: number) => Number(((w || 0) * 3.6).toFixed(1)));
    const maxTemps = data.daily.temperature_2m_max || [];

    let maxRain = 0;
    let maxRainDate = times[0] || today;
    let totalRain = 0;
    let maxWind = 0;
    let totalTemp = 0;

    rainSums.forEach((r: number, idx: number) => {
      const val = r || 0;
      totalRain += val;
      if (val > maxRain) {
        maxRain = val;
        maxRainDate = times[idx];
      }
    });

    windSpeeds.forEach((w: number) => {
      if ((w || 0) > maxWind) maxWind = w || 0;
    });

    maxTemps.forEach((t: number) => {
      totalTemp += (t || 0);
    });

    const avgMaxTemp = maxTemps.length > 0 ? Number((totalTemp / maxTemps.length).toFixed(1)) : 0;
    const isExtreme = maxRain > 30;

    return res.json({
      success: true,
      source: "open_meteo_live",
      location: { lat: latNum, lng: lngNum },
      daily: {
        time: times,
        precipitation_sum: rainSums,
        temperature_2m_max: maxTemps,
        wind_speed_10m_max: windSpeeds,
        weather_code: data.daily.weather_code || [],
      },
      correlationSummary: {
        peakRainfallDate: maxRainDate,
        peakRainfallMm: Number(maxRain.toFixed(1)),
        peakWindSpeedKmh: Number(maxWind.toFixed(1)),
        avgMaxTempC: avgMaxTemp,
        extremeEventConfirmed: isExtreme,
        eventLabel: isExtreme ? "Heavy Precipitation Anomaly Detected" : "Standard Meteorological Conditions",
        correlationStatement: isExtreme
          ? `Peak rainfall of ${maxRain.toFixed(1)} mm and max wind gusts of ${maxWind.toFixed(1)} km/h recorded around ${maxRainDate}.`
          : `Monitored rainfall max of ${maxRain.toFixed(1)} mm and average max temperature of ${avgMaxTemp}°C.`
      }
    });
  } catch (error: any) {
    console.error("Weather endpoint error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", app: "Smart Crop Insurance Platform", timestamp: new Date().toISOString() });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Smart Crop Insurance Platform running on port ${PORT}`);
  });
}

startServer();
