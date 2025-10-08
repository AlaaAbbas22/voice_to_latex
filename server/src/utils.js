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

module.exports = { llmResponse };
