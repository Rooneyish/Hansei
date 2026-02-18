const axios = require("axios");
const queries = require("../database/queries");
const { encrypt, decrypt } = require("../utils/crypto");
const KEY = Buffer.from(process.env.ENCRYPTION_KEY, "hex");

async function handleChat(req, res) {
  try {
    const userId = req.user.id;
    const { message, session_id } = req.body;

    let sessionId = session_id;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    if (!sessionId) {
      let active = await queries.findActiveChatSession(userId);
      sessionId = active
        ? active.session_id
        : (await queries.startNewChatSession(userId)).session_id;
    }

    const encryptedUserText = encrypt(message, KEY);
    await queries.saveChatMessage(sessionId, "user", encryptedUserText);

    const aiResponse = await axios.post("http://127.0.0.1:8000/chat", 
      {message}, {timeout: 60000});
    const reply = aiResponse.data.reply;

    const encryptedAiText = encrypt(reply, KEY);
    await queries.saveChatMessage(sessionId, "ai", encryptedAiText);

    return res.json({ reply, session_id: sessionId });
  } catch (err) {
    console.error("Chat Error:", err.message);

    res.status(500).json({
      reply:
        "I'm having a little trouble connecting to my thoughts right now. Can you try again in a second?",
    });
  }
}

async function handleEndSession(req, res) {
  try {
    const userId = req.user.id;

    const activeSession = await queries.findActiveChatSession(userId);

    if (activeSession) {
      await queries.endChatSession(activeSession.session_id);
      return res.status(200).json({ message: "Session closed successfully" });
    }

    res.status(200).json({ message: "No active session to close" });
  } catch (err) {
    console.error("End Session Error:", err.message);
    res.status(500).json({ error: "Failed to end session" });
  }
}

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

async function listSessions(req, res) {
  try {
    const userId = req.user.id;
    const sessions = await queries.getAllUserSessions(userId);
    const formatted = sessions.map((s) => ({
      id: s.session_id,
      start_time: s.start_time,
      end_time: s.end_time,
      preview_text: s.preview_text
        ? decrypt(s.preview_text, KEY)
        : "New Conversation",
    }));
    res.json({ sessions: formatted });
  } catch (err) {
    console.error("List Sessions Error:", err.message);
    res.status(500).json({ error: "Failed to fetch session list" });
  }
}

async function startNewSession(req, res) {
  try {
    const userId = req.user.id;
    const active = await queries.findActiveChatSession(userId);

    if (active) {
      await queries.endChatSession(active.session_id);
    }

    const newSession = await queries.startNewChatSession(userId);
    return res.json({ session_id: newSession.session_id });
  } catch (err) {
    console.error("Start Session Error:", err.message);
    res.status(500).json({ error: "Failed to start fresh session" });
  }
}

module.exports = {
  handleChat,
  handleEndSession,
  getChatHistory,
  listSessions,
  startNewSession
};
