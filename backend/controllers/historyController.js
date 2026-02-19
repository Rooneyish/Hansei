const queries = require("../database/queries");
const {encrypt, decrypt} = require("../utils/crypto");
const KEY = Buffer.from(process.env.ENCRYPTION_KEY, "hex");

async function getChatHistory(req, res) {
  try {
    const userId = req.user.id;
    let sessionId = req.params.sessionId;

    if (!sessionId) {
      const active = await queries.findActiveChatSession(userId);
      if (!active) return res.json({ history: [] });
      sessionId = active.session_id;
    }

    const messages = await queries.getMessagesBySessionId(sessionId);

    const history = messages.map((msg) => ({
      id: Math.random().toString(),
      text: decrypt(msg.encrypted_text, KEY),
      sender: msg.role === "user" ? "user" : "ai",
      created_at: msg.created_at,
    }));

    return res.json({ history });
  } catch (err) {
    console.error("History Error:", err.message);
    res.status(500).json({ error: "Could not load chat history" });
  }
}

module.exports = {
    getChatHistory
}