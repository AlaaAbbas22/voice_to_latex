const express = require("express")
const socketIo = require("socket.io")
const http = require('http')
const PORT = process.env.PORT || 5000
const app = express()
const server = http.createServer(app)
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000"
  }
})

io.on("connection", (socket: any) => {
  console.log("client connected: ", socket.id)

  socket.on("send-text", async (data: any, room: any) => {
    console.log("received text: ", data)
    socket.broadcast.to(room).emit("receive-text", await llm(data))
  })

  socket.on("join-room", (data: any) => {
    socket.join(data)
    console.log("joined room: ", data)
  })

  socket.on("disconnect", (reason: any) => {
    console.log(reason)
  })
})

server.listen(PORT, (err: any) => {
  if (err) console.log(err)
  console.log("Server running on Port ", PORT)
})


const LLM_API_URL = "https://hflink-eastus-models-playground.azure-api.net/models/Phi-3-medium-128k-instruct/score";

interface Message {
  role: string;
  content: string;
}

interface LLMRequest {
  messages: Message[];
  max_tokens: number;
  temperature: number;
  top_p: number;
}

interface LLMResponse {
  choices: { message: { content: string } }[];
}

async function llm(message: string): Promise<string> {
  const prompt = `Convert this text to latex. Return only the plain inner latex code only. \n${message}`;
  const data: LLMRequest = {
    messages: [{ role: "user", content: prompt }],
    max_tokens: 50000,
    temperature: 0.7,
    top_p: 1,
  };

  try {
    const response = await fetch(LLM_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Request failed with status code: ${response.status}`);
    }

    const responseData: LLMResponse = await response.json();
    console.log(responseData);
    return responseData.choices[0].message.content;
  } catch (error) {
    throw new Error(`Error: ${error}`);
  }
}