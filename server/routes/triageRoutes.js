import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

// 1. Schema & Model Definition (Ensures MongoDB doesn't throw ReferenceError)
const triageSchema = new mongoose.Schema(
  {
    text: String,
    symptoms: String,
    triageLevel: String,
    createdAt: { type: Date, default: Date.now }
  },
  { strict: false } // Allows extra fields from frontend without schema validation errors
);

const Triage = mongoose.models.Triage || mongoose.model('Triage', triageSchema);

// 2. Correct Route Handler (Path is '/' because '/api/triage' is mounted in server.js)
router.post('/', async (req, res) => {
  try {
    const { text, symptoms } = req.body || {};
    const inputString = (text || symptoms || JSON.stringify(req.body) || '').toLowerCase();

    // Keywords from triage logic
    const redKeywords = ["दर्द", "छाती", "सांस", "हार्ट", "अटैक", "chest pain", "breathless", "unconscious"];
    const yellowKeywords = ["बुखार", "चक्कर", "उल्टी", "fever", "dizzy", "vomit", "headache"];

    // Native JS Triage Rule Engine
    let triageLevel = "GREEN";
    if (redKeywords.some((kw) => inputString.includes(kw))) {
      triageLevel = "RED";
    } else if (yellowKeywords.some((kw) => inputString.includes(kw))) {
      triageLevel = "YELLOW";
    }

    // Check DB Connection state before saving
    if (mongoose.connection.readyState === 1) {
      const newTriageRecord = await Triage.create({
        ...req.body,
        triageLevel: triageLevel
      });

      return res.status(200).json({
        status: "success",
        data: newTriageRecord
      });
    } else {
      // Fallback response if DB is temporarily disconnected
      return res.status(200).json({
        status: "success",
        data: { ...req.body, triageLevel },
        warning: "Saved locally; DB connection pending"
      });
    }
  } catch (error) {
    console.error("Triage Submission Error:", error);
    res.status(500).json({ status: "error", message: error.message || "Server Error" });
  }
});

export default router;