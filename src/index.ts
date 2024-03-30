import { returnUser } from "./app";
import { JWTlogin, authenticate, login, register } from "./auth";

const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const express = require("express");
const cookieParser = require("cookie-parser");
import { PrismaClient } from "@prisma/client";
import { runSocketServer } from "./socket";

// setup the http server
const httpServer = http.createServer();

// configure the socket server
export const io = new Server(httpServer, {
  cors: {
    origins: ["http://localhost:3000"],
    methods: ["GET", "POST"],
    allowedHeaders: ["my-custom-header"],
    credentials: true,
  },
});

export const prisma = new PrismaClient();
const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
    optionSuccessStatus: 200,
  })
);

app.post("/auth/login", login);
app.post("/auth/register", register);
app.get("/auth/", JWTlogin);
app.post("/isUser/", returnUser);

runSocketServer(io)

// Starting the server
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log("Socket.io server is running on port", PORT);
});
app.listen(Number(PORT) + 1, () => {
  console.log("express is listining on port", Number(PORT) + 1);
});
