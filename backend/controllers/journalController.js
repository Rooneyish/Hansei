// Import the new library
const { GoogleGenAI } = require("@google/genai");
const queries = require("../database/queries");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function scanText(req, res) {
  try {
    const { imageBase64 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "No image data provided" });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const contents = [
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: cleanBase64,
        },
      },
      {
        text: "Extract all readable text from this image. Return only the text found, no conversational filler or extra notes.",
      },
    ];

    console.log("Processing with Gemini 2.5 Flash...");

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents,
    });

    const extractedText = response.text;

    if (!extractedText) {
      return res
        .status(422)
        .json({ error: "No text was detected in the image." });
    }

    console.log("Extraction successful!");
    res.status(200).json({ text: extractedText });
  } catch (err) {
    console.error("--- SCAN TEXT ERROR ---");
    console.error("Message:", err.message);

    res.status(500).json({
      error: "AI scanning failed",
      details: err.message,
    });
  }
}

async function submitJournal(req, res) {
  const userId = req.user.id;
  const { content } = req.body;

  if (!content || content.trim() === "") {
    return res.status(400).json({ error: "Journal content cannot be empty" });
  }

  try {
    const entry = await queries.createJournalEntry(userId, content);
    res.status(201).json({
      message: "Journal entry saved successfully!",
      entry,
    });
  } catch (err) {
    console.error("Database Error:", err);
    res.status(500).json({ error: "Failed to save journal to database" });
  }
}

module.exports = { scanText, submitJournal };
