let summarizer;

async function loadSummarizer() {
  if (!summarizer) {
    process.env.XENOVA_TRANSFORMERS_CACHE = "/tmp";

    const { pipeline } = await import("@xenova/transformers");
    summarizer = await pipeline("summarization", "Xenova/distilbart-cnn-12-6");

    console.log("✅ Summarization model loaded.");
  }
}

exports.summarizeText = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res
        .status(400)
        .json({ error: "Text is required for summarization." });
    }

    await loadSummarizer(); // Ensure model is loaded

    const summary = await summarizer(text, {
      max_length: Math.min(text.length * 0.5, 100), // Dynamically adjust length
      min_length: Math.min(text.length * 0.2, 40),
      repetition_penalty: 2.5, // Reduce repetitive phrases
      temperature: 0.7, // Adds variation
      do_sample: true, // Enables sampling
    });

    console.log("Summary Generated:", summary[0].summary_text);
    res.json({ summary: summary[0].summary_text });
  } catch (error) {
    console.error("Summarization Error:", error);
    res.status(500).json({ error: "Internal Server Error. Please try again." });
  }
};
