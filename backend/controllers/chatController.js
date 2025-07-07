import ChatSession from "../models/ChatSession.js";
import fetch from "node-fetch";

// Create a new chat session
export const createSession = async (req, res) => {
  try {
    const { title } = req.body;
    const session = new ChatSession({ user: req.user.id, title });
    await session.save();
    res.status(201).json(session);
  } catch (err) {
    res.status(500).json({ error: "Failed to create session: " + err.message });
  }
};

// Get all chat sessions for the logged-in user
export const getSessions = async (req, res) => {
  try {
    const sessions = await ChatSession.find({ user: req.user.id }).sort({
      createdAt: -1,
    });
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch sessions" });
  }
};

// Get messages for a specific session
export const getSessionMessages = async (req, res) => {
  try {
    const session = await ChatSession.findOne({
      _id: req.params.id,
      user: req.user.id,
    });
    if (!session) return res.status(404).json({ error: "Session not found" });
    res.json(session.messages);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
};

// Add a message to a session and get AI response
export const addMessage = async (req, res) => {
  try {
    const { content } = req.body;
    const session = await ChatSession.findOne({
      _id: req.params.id,
      user: req.user.id,
    });
    if (!session) return res.status(404).json({ error: "Session not found" });
    // Save user message
    const userMessage = {
      sender: req.user.id,
      content,
      timestamp: new Date(),
    };
    session.messages.push(userMessage);
    await session.save();

    // Prepare conversation history for OpenRouter
    const messagesForAI = session.messages.map((msg) => ({
      role: msg.sender == null ? "assistant" : "user",
      content: msg.content,
    }));

    // Logging before OpenRouter API call
    console.log("Calling OpenRouter API...");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10 seconds

    const aiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:5000",
        "X-Title": "MAXChat",
      },
      body: JSON.stringify({
        model: "microsoft/wizardlm-2-8x22b",
        messages: messagesForAI,
        temperature: 0.7,
        max_tokens: 1000,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    console.log("OpenRouter API call finished");

    if (!aiRes.ok) {
      const errorText = await aiRes.text();
      console.error("OpenRouter API error:", aiRes.status, errorText);
      return res
        .status(500)
        .json({ error: `AI API error: ${aiRes.status} - ${errorText}` });
    }
    const aiData = await aiRes.json();
    console.log(
      "OpenRouter API raw response:",
      JSON.stringify(aiData, null, 2)
    );
    const aiContent = aiData.choices?.[0]?.message?.content || "(No response)";

    // Save AI message
    const aiMessage = {
      sender: "ai", // Use a string identifier for AI
      content: aiContent,
      timestamp: new Date(),
    };
    session.messages.push(aiMessage);
    await session.save();

    res.status(201).json(aiMessage);
  } catch (err) {
    console.error("Error in addMessage:", err);
    res.status(500).json({ error: "Failed to add message or get AI response" });
  }
};

// Delete a chat session
export const deleteSession = async (req, res) => {
  try {
    const session = await ChatSession.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });
    if (!session) return res.status(404).json({ error: "Session not found" });
    res.json({ message: "Session deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete session" });
  }
};
