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
  const response = await getGroqChatCompletion(
    `Convert this text to latex. Return the plain inner latex code only and make sure to break the line using double backslash wherever it is broken in the input. ONLY CONVERT THE GIVEN TEXT TO LATEX AND DO NOT ADD ANYTHING TO THE CONTENT AND MAKE SURE THE LATEX IS NOT SURROUNDED BY A SINGLE DOLLAR SIGN with a space before the dollar sign. \n${message}`
  );
  return response;
}

async function imageToLatex(base64Image) {
  try {
    // Extract base64 data from data URL if present
    const base64Data = base64Image.includes(",")
      ? base64Image.split(",")[1]
      : base64Image;

    const response = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Convert this drawing/diagram to LaTeX code. If it contains mathematical equations, convert them to LaTeX math notation. If it's a diagram, describe it using LaTeX/TikZ if possible, otherwise provide a textual description in LaTeX. Return ONLY the inner LaTeX code without any surrounding dollar signs or explanation.",
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
