const Groq = require("groq-sdk");
require("dotenv").config();

const groq = new Groq({ apiKey: process.env.key });

// Cache for storing previous conversions to make responses deterministic
const conversionCache = new Map();

async function getGroqChatCompletion(input, options = {}) {
  return (
    await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: input,
        },
      ],
      model: "openai/gpt-oss-120b",
      temperature: options.temperature || 0, // Set to 0 for deterministic output
      seed: options.seed || 42, // Consistent seed for reproducibility
    })
  ).choices[0]?.message?.content;
}

async function llmResponse(message) {
  // Return empty string if no valid input
  if (!message || message.trim() === "") {
    return "";
  }

  // Check cache first for deterministic responses
  const cacheKey = message.trim();
  if (conversionCache.has(cacheKey)) {
    return conversionCache.get(cacheKey);
  }

  const response = await getGroqChatCompletion(
    `Convert this text to latex. Follow these rules strictly:
1. Try to convert natural language descriptions into mathematical symbols and formulas whenever possible (e.g., "square root of x" → "\\sqrt{x}", "alpha" → "\\alpha")
2. If there is plain text that cannot be converted to mathematical symbols, wrap it in \\text{} to prevent it from being stuck together (e.g., "Let x equal" → "\\text{Let } x \\text{ equal}")
3. Return the plain inner latex code only
4. Break lines using double backslash (\\\\) wherever there is a line break in the input
5. DO NOT surround the output with dollar signs
6. DO NOT add any content that is not in the input
7. If there is no meaningful content to convert, return an empty string

Input text:
${message}`,
    { temperature: 0, seed: 42 } // Deterministic settings
  );

  const result = response || "";

  // Store in cache for future use
  conversionCache.set(cacheKey, result);

  // Limit cache size to prevent memory issues (keep last 100 conversions)
  if (conversionCache.size > 100) {
    const firstKey = conversionCache.keys().next().value;
    conversionCache.delete(firstKey);
  }

  return result;
}

async function imageToLatex(base64Image) {
  try {
    // Return empty string if no valid input
    if (!base64Image || base64Image.trim() === "") {
      return "";
    }

    const response = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: 'Convert this handwritten mathematical image to LaTeX code. Follow these rules strictly:\n1. Focus on accurately converting any handwritten equations, formulas, or mathematical notation to proper LaTeX syntax.\n2. If there is plain text that cannot be converted to mathematical symbols, wrap it in \\text{} to prevent it from being stuck together (e.g., "Let x equal" → "\\text{Let } x \\text{ equal}").\n3. DO NOT use TikZ or tikzpicture environment. DO NOT use any unknown environments.\n4. If there are diagrams, describe them in plain text within \\text{} in the LaTeX.\n5. Return ONLY the inner LaTeX code without any surrounding dollar signs, explanation, or markdown formatting.\n6. If the image is blank, empty, or contains no mathematical content, return an empty string.',
            },
            {
              type: "image_url",
              image_url: {
                url: base64Image,
              },
            },
          ],
        },
      ],
      model: "meta-llama/llama-4-maverick-17b-128e-instruct",
      max_tokens: 1000,
      temperature: 0, // Deterministic output
      seed: 42, // Consistent seed for reproducibility
    });
    return response.choices[0]?.message?.content || "";
  } catch (error) {
    console.error("Error processing image with Groq Vision:", error);
    return "% Error: Could not process image";
  }
}

module.exports = { llmResponse, imageToLatex };
