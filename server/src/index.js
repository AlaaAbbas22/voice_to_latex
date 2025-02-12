"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const express = require("express");
const socketIo = require("socket.io");
const http = require('http');
const { getGroqChatCompletion } = require("./experiment.js");
const PORT = process.env.PORT || 5000;
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "http://localhost:3000"
    }
});
io.on("connection", (socket) => {
    console.log("client connected: ", socket.id);
    socket.on("send-text", (data, room) => __awaiter(void 0, void 0, void 0, function* () {
        socket.broadcast.to(room).emit("receive-original", data);
        socket.broadcast.to(room).emit("receive-text", yield llm(data));
        
    }));
    socket.on("join-room", (data) => {
        socket.join(data);
        console.log("joined room: ", data);
    });
    socket.on("disconnect", (reason) => {
        console.log(reason);
    });
});
server.listen(PORT, (err) => {
    if (err)
        console.log(err);
    console.log("Server running on Port ", PORT);
});

function llm(message) {
    const response = getGroqChatCompletion(`Convert this text to latex. Return only the plain inner latex code only. Make sure to break lines where they are broken by a slash n to show them as multiple lines in the output. \n${message}`);
    return response; 
}
