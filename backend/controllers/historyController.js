const queries = require("../database/queries");
const { encrypt, decrypt } = require("../utils/crypto");
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

async function deleteChatHistory(req, res) {
  try {
    const { sessionId }= req.params;
    const userId = req.user.id;

    if (!sessionId) {
      console.log("Session id not found!");
      return res.status(400).json({ error: "Session ID is required" });
    }

    const deleted = await queries.deleteSession(sessionId, userId);
    if (!deleted) {
      return res.status(404).json({ error: "Session not found" });
    }

    res.status(200).json({
      success: true,
      message: `Session ${sessionId} deleted successfully`,
    });
  } catch (err) {
    console.error("Error while deleting chat history: ", err.message);
    res.status(500).json({ error: "Could not delete chat." });
  }
}

module.exports = {
  getChatHistory,
  deleteChatHistory,
};
