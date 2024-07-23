"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = exports.io = void 0;
var app_1 = require("./app");
var auth_1 = require("./auth");
var http = require("http");
var Server = require("socket.io").Server;
var cors = require("cors");
var express = require("express");
var cookieParser = require("cookie-parser");
var client_1 = require("@prisma/client");
var socket_1 = require("./socket");
// setup the http server
var httpServer = http.createServer();
// configure the socket server
exports.io = new Server(httpServer, {
    cors: {
        origins: ["http://localhost:3000"],
        methods: ["GET", "POST"],
        allowedHeaders: ["my-custom-header"],
        credentials: true,
    },
});
exports.prisma = new client_1.PrismaClient();
var app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: "http://localhost:3000",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
    optionSuccessStatus: 200,
}));
app.post("/auth/login", auth_1.login);
app.post("/auth/register", auth_1.register);
app.get("/auth/", auth_1.JWTlogin);
app.post("/isUser/", app_1.returnUser);
(0, socket_1.runSocketServer)(exports.io);
// Starting the server
var PORT = process.env.PORT || 3001;
httpServer.listen(PORT, function () {
    console.log("Socket.io server is running on port", PORT);
});
app.listen(Number(PORT) + 1, function () {
    console.log("express is listining on port", Number(PORT) + 1);
});
