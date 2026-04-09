const { GoogleGenAI } = require("@google/genai");
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function detectCrisis(text) {
  try {
    if (!text) return false;

    const emergencyKeywords =
      /\b(suicide|kill myself|end my life|want to die|harm myself|cut myself|end it all)\b/i;
    if (emergencyKeywords.test(text)) return true;

    const prompt = `Analyze the following text for signs of immediate severe crisis, self-harm, suicidal ideation, or intent to harm others.
    Respond with exactly "CRISIS_DETECTED" if there is a severe safety risk, or "SAFE" if it is just normal venting, sadness, depression, or frustration.
    Text: "${text}"`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const reply = response.text.trim().toUpperCase();
    return reply.includes("CRISIS_DETECTED");
  } catch (err) {
    console.error("Crisis Detection Error:", err.message);
    return false;
  }
}

module.exports = { detectCrisis };
