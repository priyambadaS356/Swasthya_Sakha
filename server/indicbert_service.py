// Express Route / Controller
app.post("/api/triage", async (req, res) => {
  try {
    const { text, symptoms } = req.body;
    const inputString = (text || symptoms || "").toLowerCase();

    // 1. Same Keywords from Python script
    const redKeywords = ["दर्द", "छाती", "सांस", "हार्ट", "अटैक", "chest pain", "breathless", "unconscious"];
    const yellowKeywords = ["बुखार", "चक्कर", "उल्टी", "fever", "dizzy", "vomit", "headache"];

    // 2. Triage Logic
    let triageLevel = "GREEN";
    if (redKeywords.some(kw => inputString.includes(kw))) {
      triageLevel = "RED";
    } else if (yellowKeywords.some(kw => inputString.includes(kw))) {
      triageLevel = "YELLOW";
    }

    // 3. Save to MongoDB Atlas
    const newTriageRecord = await TriageModel.create({
      ...req.body,
      triageLevel: triageLevel
    });

    res.status(200).json({
      status: "success",
      data: newTriageRecord
    });

  } catch (error) {
    console.error("Triage Submission Error:", error);
    res.status(500).json({ error: error.message || "Server Error" });
  }
});