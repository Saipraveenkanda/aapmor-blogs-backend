let summarizer;

async function loadSummarizer() {
  if (!summarizer) {
    const { pipeline } = await import("@xenova/transformers");
    summarizer = await pipeline("summarization", "Xenova/distilbart-cnn-12-6");
    console.log("Summarization model loaded.");
  }
}

exports.summarizeText = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Text is required" });

    await loadSummarizer();

    const summary = await summarizer(text, {
      max_length: 100, // Increase max length for better summaries
      min_length: 30, // Ensure a reasonable minimum size
      repetition_penalty: 2.0, // Helps prevent repeating words
      temperature: 0.7, // Introduces some randomness
      do_sample: true, // Allows sampling to improve natural output
    });
    console.log(summary, "SUMMARY");

    res.json({ summary: summary[0].summary_text });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
