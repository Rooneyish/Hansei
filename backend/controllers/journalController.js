const { GoogleGenAI } = require("@google/genai");
const axios = require("axios");
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

    console.log("AI Engine: Scanning with gemini-2.5-flash...");

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents,
    });

    const extractedText = response.text;

    if (!extractedText) {
      return res.status(422).json({ error: "No text detected in image." });
    }

    res.status(200).json({ text: extractedText });
  } catch (err) {
    console.error("--- OCR Error ---", err.message);
    res
      .status(500)
      .json({ error: "Failed to scan text", details: err.message });
  }
}

// journalController.js

async function submitJournal(req, res) {
  const userId = req.user.id;
  const { content } = req.body;

  if (!content || content.trim() === "") {
    return res.status(400).json({ error: "Journal content cannot be empty" });
  }

  try {
    // 1. Create the journal entry
    const entry = await queries.createJournalEntry(userId, content);
    const journalId = entry.journal_id;

    // 2. Handle AI Emotion Analysis
    let aiEmotion = "neutral";
    let aiConfidence = 0.0;
    let moodStatus = "Reflective ✨";

    try {
      const aiResponse = await axios.post("http://127.0.0.1:8000/analyze", {
        text: content,
      });
      aiEmotion = aiResponse.data.emotion;
      aiConfidence = aiResponse.data.confidence;
      moodStatus = aiResponse.data.status_text;
    } catch (aiErr) {
      console.error("FastAPI Error: AI Engine unreachable.");
    }

    // 3. Save emotion and update mood
    await queries.saveEmotionAnalysis(journalId, aiEmotion, aiConfidence);
    await queries.updateStatusAndMood(userId, moodStatus);

    // --- ADDED THIS PART ---
    // 4. Update the Streak
    const streakData = await queries.checkInUser(userId);
    // -----------------------

    res.status(201).json({
      message: "Journal saved, mood, and streak updated!",
      mood: moodStatus,
      streak: streakData.streak_count, // Send back the new streak
      entry: entry,
    });
  } catch (err) {
    console.error("Database Error:", err);
    res.status(500).json({ error: "Failed to save journal to database" });
  }
}

module.exports = { scanText, submitJournal };
