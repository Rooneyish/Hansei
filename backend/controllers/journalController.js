const { GoogleGenAI } = require("@google/genai");
const axios = require("axios");
const queries = require("../database/queries");
const { encrypt, decrypt } = require("../utils/crypto");
const KEY = Buffer.from(process.env.ENCRYPTION_KEY, "hex");
const { detectCrisis } = require("../utils/crisisDetector");

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

async function submitJournal(req, res) {
  const userId = req.user.id;
  const { content } = req.body;

  if (!content || content.trim() === "") {
    return res.status(400).json({ error: "Journal content cannot be empty" });
  }

  try {
    const isCrisis = await detectCrisis(content);
    if (isCrisis) {
      await queries.setCrisisMode(userId, true); 
      await queries.logCrisisTrigger(userId, 'journal');

      const encryptedContent = encrypt(content, KEY);
      await queries.createJournalEntry(userId, encryptedContent); 

      return res.status(403).json({
        success: false,
        isCrisis: true,
        message:
          "We're deeply concerned about what you just shared. Our AI is not a substitute for professional help. Please reach out to emergency services.",
        helplines: [
          {
            region: "Nepal",
            name: "TUTH Suicide Hotline",
            number: "1660 012 2223",
          },
          {
            region: "Nepal",
            name: "Patan Hospital Helpline",
            number: "9813111408",
          },
          {
            region: "Global",
            name: "Find A Helpline",
            url: "https://findahelpline.com/",
          },
        ],
      });
    }

    const encryptedContent = encrypt(content, KEY);

    const entry = await queries.createJournalEntry(userId, encryptedContent);
    const journalId = entry.journal_id;

    let aiEmotion = "neutral";
    let aiConfidence = 0.0;
    let moodStatus = "Reflective ✨";
    let musicRecommendation = null;
    let cbtLabResult = null;
    let triggerChat = false;

    try {
      const aiResponse = await axios.post("http://127.0.0.1:8000/analyze", {
        text: content,
      });
      aiEmotion = aiResponse.data.emotion;
      aiConfidence = aiResponse.data.confidence;
      moodStatus = aiResponse.data.status_text;
      cbtLabResult = aiResponse.data.cbt_analysis;

      if (aiResponse.data.music_recommendation) {
        const rec = aiResponse.data.music_recommendation;

        const trackDetails = await queries.getTrackById(rec.database_id);

        if (trackDetails) {
          const baseUrl = `${req.protocol}://${req.get("host")}`;
          musicRecommendation = {
            id: trackDetails.id,
            title: trackDetails.title,
            artist: trackDetails.artist,
            reasoning: rec.reasoning,
            url: `${baseUrl}/assets/music/${trackDetails.music_file}`,
            artwork: `${baseUrl}/assets/musicCovers/${trackDetails.artwork_file}`,
          };
        }
      }

      if (cbtLabResult) {
        const distortion = cbtLabResult.distortion || "General Reflection";
        const thought = cbtLabResult.thought || content.substring(0, 100);
        const reframe =
          cbtLabResult.reframe ||
          cbtLabResult.starter ||
          "Let's reflect on this together.";

        const distortionType = distortion.toLowerCase();

        if (
          distortionType !== "none" &&
          distortionType !== "reflection" &&
          distortionType !== "observation"
        ) {
          triggerChat = true;
        }

        await queries.saveCBTResult(
          userId,
          journalId,
          distortion,
          thought,
          reframe,
        );

        cbtLabResult.reframe = reframe;
        cbtLabResult.distortion = distortion;
      }
    } catch (aiErr) {
      console.error("[JOURNAL] AI Engine unreachable:", { endpoint: "/analyze", error: aiErr.message });
    }

    await queries.saveEmotionAnalysis(journalId, aiEmotion, aiConfidence);
    await queries.updateStatusAndMood(userId, moodStatus);
    const streakData = await queries.checkInUser(userId);
    const rewards = await queries.updateDailyRitual(userId, "journal");

    res.status(201).json({
      message: "Journal saved, mood, and streak updated!",
      mood: moodStatus,
      streak: streakData.streak_count,
      emotion: aiEmotion,
      music_recommendation: musicRecommendation,
      cbt_analysis: cbtLabResult,
      trigger_chat: triggerChat,
      rewards: rewards,
      entry: { ...entry, content: content },
    });
  } catch (err) {
    console.error("[JOURNAL] Database error:", { userId, error: err.message, stack: err.stack });
    res.status(500).json({ error: "Failed to save journal to database" });
  }
}

module.exports = { scanText, submitJournal };
