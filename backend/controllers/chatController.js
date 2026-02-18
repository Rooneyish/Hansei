const axios = require("axios");
const queries = require("../database/queries");
const { encrypt, decrypt } = require("../utils/crypto");
const KEY = Buffer.from(process.env.ENCRYPTION_KEY, "hex");

async function handleChat(req, res) {
  try {
    const userId = req.user.id;
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    let activeSession = await queries.findActiveChatSession(userId);
    if (!activeSession) {
      activeSession = await queries.startNewChatSession(userId);
    }
    const sessionId = activeSession.session_id;

    const encryptedUserText = encrypt(message, KEY);
    await queries.saveChatMessage(sessionId, "user", encryptedUserText);

    const aiResponse = await axios.post("http://127.0.0.1:8000/chat", {
      message,
    });
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

    const activeSession = await queries.findActiveChatSession(userId);
    if (!activeSession) {
      return res.json({ history: [] }); 
    }

    const messages = await queries.getMessagesBySessionId(activeSession.session_id);

    const history = messages.map(msg => ({
      id: Math.random().toString(), 
      text: decrypt(msg.encrypted_text, KEY),
      sender: msg.role === 'user' ? 'user' : 'ai',
      created_at: msg.created_at
    }));

    return res.json({ history });
  } catch (err) {
    console.error("History Error:", err.message);
    res.status(500).json({ error: "Could not load chat history" });
  }
}

module.exports={
    handleChat,
    handleEndSession,
    getChatHistory
}
