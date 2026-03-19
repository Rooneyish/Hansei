const axios = require("axios");
const queries = require("../database/queries");
const { decrypt } = require("../utils/crypto");
const KEY = Buffer.from(process.env.ENCRYPTION_KEY, "hex");

async function saveMeditationSession(req, res) {
  const userId = req.user.user_id || req.user.id;
  const { type, duration, moodReflection } = req.body;

  if (!type || !duration) {
    return res.status(400).json({ error: "Missing required meditation data." });
  }

  try {
    const result = await queries.createMeditationEntry(
      userId,
      type,
      duration,
      moodReflection,
    );

    const rewards = await queries.updateDailyRitual(userId, "zen");

    res.status(201).json({
      success: true,
      data: result,
      rewards: rewards,
    });
  } catch (error) {
    console.error("DB Error:", error);
    res.status(500).json({ error: "Failed to record session in database." });
  }
}

async function getZenIntention(req, res) {
  const userId = req.user.user_id || req.user.id;

  try {
    const journal = await queries.getLatestJournal(userId);

    let plainText = "A quiet moment of reflection.";
    let emotion = "neutral";

    if (journal && journal.text) {
      plainText = decrypt(journal.text, KEY);
      emotion = journal.primary_emotion || "neutral";
    }

    const aiRes = await axios.post("http://127.0.0.1:8000/ai/zen-intention", {
      journal_text: plainText,
      emotion: emotion,
    });

    res.json({ intention: aiRes.data.intention });
  } catch (error) {
    console.error("Zen Intention Error:", error);
    res.json({ intention: "Find stillness in the rhythm of your breath." });
  }
}

module.exports = { saveMeditationSession, getZenIntention };
