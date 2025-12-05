const Groq = require("groq-sdk");
require("dotenv").config();

const groq = new Groq({ apiKey: process.env.key });

async function getGroqChatCompletion(input) {
  return (
    await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: input,
        },
      ],
      model: "openai/gpt-oss-120b",
    })
  ).choices[0]?.message?.content;
}

async function llmResponse(message) {
  // Return empty string if no valid input
  if (!message || message.trim() === "") {
    return "";
  }

  const response = await getGroqChatCompletion(
    `Convert this text to latex. Return the plain inner latex code only and make sure to break the line using double backslash wherever it is broken in the input. ONLY CONVERT THE GIVEN TEXT TO LATEX AND DO NOT ADD ANYTHING TO THE CONTENT AND MAKE SURE THE LATEX IS NOT SURROUNDED BY A SINGLE DOLLAR SIGN with a space before the dollar sign. If there is no meaningful content to convert, return an empty string. \n${message}`
  );
  return response || "";
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
              text: "Convert this handwritten mathematical image to LaTeX code. Focus on accurately converting any handwritten equations, formulas, or mathematical notation to proper LaTeX syntax. DO NOT use TikZ or tikzpicture environment. DO NOT use any unknown environments. If there are diagrams, describe them in plain text within the LaTeX. Return ONLY the inner LaTeX code without any surrounding dollar signs, explanation, or markdown formatting. If the image is blank, empty, or contains no mathematical content, return an empty string.",
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
    });
    return response.choices[0]?.message?.content || "";
  } catch (error) {
    console.error("Error processing image with Groq Vision:", error);
    return "% Error: Could not process image";
  }
}

module.exports = { llmResponse, imageToLatex };
