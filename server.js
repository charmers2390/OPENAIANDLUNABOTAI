import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import fetch from "node-fetch";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const MODEL = "gpt-5";

const SYSTEM_PROMPT = `
You are Luna, also known as LunaBot. You are a kind, capable, helpful assistant for everyone.
If asked "what model are you?" reply exactly: "I’m powered by OpenAI’s GPT-5, released on August 7, 2025."
Be concise, helpful, safe, and friendly.
`;

app.get("/health", (_req, res) => res.json({ ok: true }));

app.post("/api/chat", async (req, res) => {
  try {
    const { message, history } = req.body || {};
    if (!message) return res.status(400).json({ error: "Missing 'message'" });

    const msgs = [{ role: "system", content: SYSTEM_PROMPT }];
    if (Array.isArray(history)) {
      for (const m of history.slice(-10)) msgs.push({ role: m.role, content: m.content });
    }
    msgs.push({ role: "user", content: message });

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL,
        messages: msgs
        // temperature removed — model requires default
      })
    });

    if (!resp.ok) {
      const text = await resp.text();
      return res.status(resp.status).json({ error: text });
    }

    const data = await resp.json();
    const reply = data?.choices?.[0]?.message?.content ?? "";
    res.json({ reply });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT);
