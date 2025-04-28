const axios = require("axios");
const { connection } = require("./database");
require("dotenv").config();

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

// Function to generate bio
async function groqGenerateBio(userProfile) {
  try {
    const { name, gender, department, interests } = userProfile;

    const prompt = `Generate a short and engaging bio for ${name}, a ${gender.toLowerCase()} working in the ${department} department.
    They have a passion for writing blogs on ${(
      interests || ["various topics"]
    ).join(", ")}. Make it friendly and engaging.`;

    console.log(prompt, "PROMPT");

    const response = await axios.post(
      GROQ_API_URL,
      {
        model: "llama-3.3-70b-versatile", // Adjust based on available models
        messages: [
          {
            role: "system",
            content:
              "You are an AI that generates professional and engaging short bios based on user details.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 200,
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
      "Error generating bio:",
      error.response?.data || error.message
    );
    return "Passionate blogger sharing insights and knowledge with the world."; // Default fallback bio
  }
}

// API Route for Auto-Generating Bio
exports.generateUserBio = async (req, res) => {
  try {
    const { name, gender, department, interests, email } = req.body;
    if (!name || !gender || !department || !email) {
      return res.status(400).json({ error: "Missing required user details." });
    }

    const bio = await groqGenerateBio({ name, gender, department, interests });
    bio.replace(/^.*?("Hi, I'm|Hello, I'm)/, "$1");

    // Update user profile with generated bio
    const result = await connection.updateOne(
      { email: email },
      { $set: { bio } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    res.json({ message: "Bio generated successfully!", bio });
  } catch (error) {
    console.error("Auto Bio Generation Error:", error);
    res.status(500).json({ error: "Failed to generate bio." });
  }
};
