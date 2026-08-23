const { GoogleGenAI } = require("@google/genai");
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Sanitise user text before injecting into AI prompts.
 * Strips characters that could be used for prompt injection.
 */
function sanitiseForPrompt(text) {
  return text
    .replace(/["""`]/g, "'")       // Normalise quotes to prevent prompt escape
    .replace(/\n{3,}/g, "\n\n")    // Collapse excessive newlines
    .substring(0, 2000);           // Truncate to prevent oversized prompts
}

async function detectCrisis(text) {
  if (!text) return false;

  // Keyword check runs first — works even if the API is down
  const emergencyKeywords =
    /\b(suicide|kill myself|end my life|want to die|harm myself|cut myself|end it all)\b/i;
  if (emergencyKeywords.test(text)) return true;

  try {
    const sanitised = sanitiseForPrompt(text);
    const prompt = `Analyze the following text for signs of immediate severe crisis, self-harm, suicidal ideation, or intent to harm others.
    Respond with exactly "CRISIS_DETECTED" if there is a severe safety risk, or "SAFE" if it is just normal venting, sadness, depression, or frustration.
    Text: "${sanitised}"`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const reply = response.text.trim().toUpperCase();
    return reply.includes("CRISIS_DETECTED");
  } catch (err) {
    // SAFETY: If the AI safety check fails, assume the worst to protect the user.
    // A false positive (pausing chat) is far less harmful than a false negative (missing a crisis).
    console.error("⚠️  Crisis Detection API Failed — defaulting to CRISIS for safety:", err.message);
    return true;
  }
}

module.exports = { detectCrisis };
