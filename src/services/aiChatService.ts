import express from "express";
import fetch from "node-fetch"; // to call Ollama API
import { db } from "../services/firebase"; // Firestore setup
import { collection, getDocs } from "firebase/firestore";

const router = express.Router();

// Chat Route 
router.post("/chat", async (req, res) => {
  try {
    const { question } = req.body;

    let context = "";
    if (question.toLowerCase().includes("bill")) {
      const snapshot = await getDocs(collection(db, "bills"));
      const bills = snapshot.docs.map(doc => doc.data());
      context = `Here are some bills: ${JSON.stringify(bills)}`;
    }

    // Send prompt + context to Ollama 
    const ollamaResponse = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3", 
        prompt: ` 
          You are a FitBot, an AI-powered Gym Assistant inside a Gym Management System.
          Your role:
          - Answer gym-related questions (payments, workout, diet).
          - Use the provided context if available.
          - Be short, clear, aand professional.

          Context: ${context || "No database info available."}
          User Question: ${question} 
          Answer:`,
      }),
    });

    const data = await ollamaResponse.json() as { response: string };
    res.json({ answer: data.response });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Chatbot error" });
  }
});

export default router;


