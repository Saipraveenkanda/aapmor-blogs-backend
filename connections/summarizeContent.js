// require("dotenv").config();
// process.env.HF_HOME = "/tmp";
// let summarizer;

// async function loadSummarizer() {
//   if (!summarizer) {
//     process.env.XENOVA_TRANSFORMERS_CACHE = "/tmp";

//     const { pipeline } = await import("@xenova/transformers");
//     summarizer = await pipeline("summarization", "Xenova/distilbart-cnn-12-6");

//     console.log("✅ Summarization model loaded.");
//   }
// }

const axios = require("axios");
require("dotenv").config();
exports.summarizeText = async (req, res) => {
  try {
    const { text } = req.body;
    console.log(process.env.GROQ_API_KEY, "GROQ_API_KEY");

    // if (!text || text.trim().length === 0) {
    //   return res
    //     .status(400)
    //     .json({ error: "Text is required for summarization." });
    // }

    // await loadSummarizer(); // Ensure model is loaded

    // const summary = await summarizer(text, {
    //   max_length: Math.min(text.length * 0.5, 100), // Dynamically adjust length
    //   min_length: Math.min(text.length * 0.2, 40),
    //   repetition_penalty: 2.5, // Reduce repetitive phrases
    //   temperature: 0.7, // Adds variation
    //   do_sample: true, // Enables sampling
    // });

    // console.log("Summary Generated:", summary[0].summary_text);
    const summary = await groqSummary(text);
    res.json({ summary: summary });
  } catch (error) {
    console.error("Summarization Error:", error);
    res.status(500).json({ error: "Internal Server Error. Please try again." });
  }
};

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"; // Adjust if needed
// https://api.groq.com/openai/v1/chat/completions

async function groqSummary(text) {
  try {
    const response = await axios.post(
      GROQ_API_URL,
      {
        model: "llama-3.3-70b-versatile", // Adjust based on available models
        messages: [
          {
            role: "system",
            content:
              "You are an AI that summarizes text concisely.Limit the summary to two lines only.",
          },
          { role: "user", content: `Summarize the following text: ${text}` },
        ],
        temperature: 0.7,
        max_tokens: 200, // Adjust summary length
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error(
      "Error summarizing text:",
      error.response?.data || error.message
    );
    return "Failed to summarize text.";
  }
}
