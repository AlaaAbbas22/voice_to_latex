const Groq = require("groq-sdk");
require("dotenv").config();

const groq = new Groq({ apiKey: process.env.key });


module.exports.getGroqChatCompletion =  async function getGroqChatCompletion(input) {
  return (await groq.chat.completions.create({
    messages: [
      {
        role: "user",
        content: input,
      },
    ],
    model: "llama-3.3-70b-versatile",
  })).choices[0]?.message?.content;
}

