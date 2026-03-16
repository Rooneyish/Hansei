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

    const rawRows = await queries.getMessagesBySessionId(sessionId);
    const history = rawRows.slice(-6).map((row) => ({
      role: row.role === "user" ? "user" : "ai",
      content: decrypt(row.encrypted_text, KEY),
    }));

    const encryptedUserText = encrypt(message, KEY);
    await queries.saveChatMessage(sessionId, "user", encryptedUserText);

    const aiResponse = await axios({
      method: "post",
      url: "http://127.0.0.1:8000/chat",
      data: { message, history },
      responseType: "stream",
      timeout: 30000,
    });

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Session-Id", sessionId);
    res.setHeader("Access-Control-Expose-Headers", "X-Session-Id");

    let fullAiReply = "";

    aiResponse.data.on("data", (chunk) => {
      const text = chunk.toString();
      fullAiReply += text;
      res.write(text);
    });

    aiResponse.data.on("end", async () => {
      try {
        const encryptedAiText = encrypt(fullAiReply, KEY);
        await queries.saveChatMessage(sessionId, "ai", encryptedAiText);
      } catch (saveErr) {
        console.error("Error saving AI response to DB:", saveErr);
      }
      res.end();
    });

    req.on("close", () => {
      aiResponse.data.destroy();
    });
  } catch (err) {
    console.error("Chat Error:", err.message);
    if (!res.headersSent) {
      res.status(500).json({
        reply:
          "I'm having a little trouble connecting to my thoughts. Try again?",
      });
    } else {
      res.end();
    }
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

async function listSessions(req, res) {
  try {
    const userId = req.user.id;
    const sessions = await queries.getAllUserSessions(userId);

    const formatted = sessions.map((s) => {
      let decryptedPreview = "New Conversation";

      if (s.preview_text) {
        try {
          decryptedPreview = decrypt(s.preview_text, KEY);
        } catch (err) {
          decryptedPreview = "Reflection in progress...";
        }
      }

      return {
        id: s.session_id,
        title: s.title || "Mindful Reflection",
        start_time: s.start_time, 
        preview_text: decryptedPreview,
      };
    });

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

const initiateProactiveChat = async (req, res) => {
  const { distortion, message } = req.body;
  const userId = req.user.id;

  try {
    const sessionId = await queries.createProactiveSession(
      userId,
      distortion,
      message,
    );

    return res.status(201).json({
      session_id: sessionId,
      message: "Proactive session persisted successfully",
    });
  } catch (err) {
    console.error("Initiation error:", err);
    return res
      .status(500)
      .json({ error: "Failed to initialize proactive session" });
  }
};

module.exports = {
  handleChat,
  handleEndSession,
  listSessions,
  startNewSession,
  initiateProactiveChat,
};
