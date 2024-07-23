"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runSocketServer = void 0;
var util = require("util");
var _a = require("compile-run"), c = _a.c, cpp = _a.cpp, node = _a.node, python = _a.python, java = _a.java;
// The Data Stores
var rooms = new Map();
var SocketId_RoomId = new Map();
/**
 *
 * @returns a string like - "abc-def-ghi"
 */
var createRoomId = function () {
    var c = "abcdefghijklmnopqrstuvwxyz";
    var s = __spreadArray([], Array(3), true).map(function (_) { return c[~~(Math.random() * c.length)]; }).join("") +
        "-" +
        __spreadArray([], Array(3), true).map(function (_) { return c[~~(Math.random() * c.length)]; }).join("") +
        "-" +
        __spreadArray([], Array(3), true).map(function (_) { return c[~~(Math.random() * c.length)]; }).join("");
    return s;
};
var runSocketServer = function (io) {
    io.on("connection", function (socket) {
        console.log("A user connected:", socket.id);
        // sending the socket id
        socket.on("join", function () {
            io.to(socket.id).emit("socketId", {
                msg: "Created The Room",
                id: socket.id,
            });
        });
        socket.on("room_exits", function (roomId) {
            io.to(socket.id).emit("room_query", rooms.get(roomId) ? true : false);
        });
        socket.on("remove_from_room", function (data) {
            console.log(data);
            if (rooms.get(data.roomId) &&
                rooms.get(data.roomId).admin.socketId == data.adminSocketId) {
                rooms.set(data.roomId, __assign(__assign({}, rooms.get(data.roomId)), { users: rooms
                        .get(data.roomId)
                        .users.filter(function (e) { return e.socketId != data.userSocketId; }) }));
                io.to(data.userSocketId).emit("removed", data.userSocketId);
                // io.to(data.userSocketId).socketsLeave(data.roomId);
                socket.broadcast
                    .to(data.roomId)
                    .emit("update", rooms.get(data.roomId));
            }
        });
        // Creating Room By Admin
        socket.on("create_room", function (data) {
            var roomId = createRoomId();
            if (SocketId_RoomId.get(socket.id)) {
                io.to(socket.id).emit("message", "you can not create room");
                return;
            }
            // if room does not exit then only create the room
            if (!rooms.get(roomId)) {
                // join the room
                socket.join(roomId);
                // Assigned to rooms like - Map("Room Name"->member)
                rooms.set(roomId, {
                    admin: { socketId: data.admin.socketId, user: data.admin.user },
                    users: [{ socketId: data.admin.socketId, user: data.admin.user }],
                    allowOthers: data.allowOthers,
                    chats: [],
                    code: {
                        code: "// some code",
                        lang: "javascript",
                        input: "",
                        output: "",
                    },
                    invitedUsers: data.invitedUsers,
                    roomId: roomId,
                    allowOutBoundMessages: data.allowOutBoundMessages,
                });
                SocketId_RoomId.set(socket.id, roomId);
                // after creation send room to the user
                io.to(socket.id).emit("room_created", rooms.get(roomId));
            }
            else {
                // if Room Already Exits then send msg
                socket.emit("message", "Room Already Exits");
            }
            // logging some important information
            console.log("Create Room");
        });
        // Update Room By Admin
        socket.on("update_room", function (data) {
            // if room does not exit then only create the room
            if (rooms.get(data.roomId)) {
                // Assigned to rooms like - Map("Room Name"->member)
                rooms.set(data.roomId, __assign(__assign({}, rooms.get(data.roomId)), { allowOthers: data.allowOthers, invitedUsers: data.invitedUsers, allowOutBoundMessages: data.allowOutBoundMessages }));
                // after creation send room to the user
                io.to(socket.id).emit("room_updated", rooms.get(data.roomId));
            }
            else {
                // if Room Already Exits then send msg
                socket.emit("error", "Room Already Exits");
            }
            // logging some important information
            console.log("Update Room");
        });
        socket.on("outbound", function (data) {
            if (rooms.get(data.roomId))
                io.to(rooms.get(data.roomId).admin.socketId).emit("outbound", {
                    name: data.name,
                });
        });
        // Joining Room
        socket.on("join_room", function (data) {
            if (!rooms.has(data.roomId)) {
                io.to(socket.id).emit("message", "you can not join room");
                return;
            }
            var roomData = rooms.get(data.roomId);
            console.log(data.user);
            var usersEmails = roomData.users.map(function (e) { return e.email; });
            if (usersEmails.includes(data.user.user.email)) {
                rooms.set(data.roomId, __assign(__assign({}, roomData), { users: __spreadArray([], roomData.users.filter(function (e) { return e.user.email != data.user.user.email; }), true) }));
            }
            // if room does not exit then only join the room
            if (roomData && data.user.socketId && data.user.user.id) {
                if (rooms.get(data.roomId).admin.user.id == data.user.user.id) {
                    // join the room
                    socket.join(data.roomId);
                    rooms.set(data.roomId, __assign(__assign({}, roomData), { users: rooms
                            .get(data.roomId)
                            .users.filter(function (e) { return e.user.id != data.user.user.id; }) }));
                    // add member to room with room name given
                    rooms.set(data.roomId, __assign(__assign({}, roomData), { admin: data.user, users: __spreadArray(__spreadArray([], roomData.users, true), [data.user], false) }));
                    SocketId_RoomId.set(socket.id, data.roomId);
                    // send join message to the user
                    io.to(socket.id).emit("joined_room", rooms.get(data.roomId));
                    socket.broadcast
                        .to(data.roomId)
                        .emit("update", rooms.get(data.roomId));
                }
                else if (roomData.allowOthers) {
                    // join the room
                    socket.join(data.roomId);
                    rooms.set(data.roomId, __assign(__assign({}, roomData), { users: rooms
                            .get(data.roomId)
                            .users.filter(function (e) { return e.user.id != data.user.user.id; }) }));
                    // add member to room with room name given
                    rooms.set(data.roomId, __assign(__assign({}, roomData), { users: __spreadArray(__spreadArray([], roomData.users, true), [data.user], false) }));
                    SocketId_RoomId.set(socket.id, data.roomId);
                    // send join message to the user
                    io.to(socket.id).emit("joined_room", rooms.get(data.roomId));
                    socket.broadcast
                        .to(data.roomId)
                        .emit("update", rooms.get(data.roomId));
                }
                else if (roomData.invitedUsers.includes(data.user.user.email)) {
                    // join the room
                    socket.join(data.roomId);
                    rooms.set(data.roomId, __assign(__assign({}, roomData), { users: rooms
                            .get(data.roomId)
                            .users.filter(function (e) { return e.user.id != data.user.user.id; }) }));
                    // add member to room with room name given
                    rooms.set(data.roomId, __assign(__assign({}, roomData), { users: __spreadArray(__spreadArray([], roomData.users, true), [data.user], false) }));
                    SocketId_RoomId.set(socket.id, data.roomId);
                    // send join message to the user
                    io.to(socket.id).emit("joined_room", rooms.get(data.roomId));
                    socket.broadcast
                        .to(data.roomId)
                        .emit("update", rooms.get(data.roomId));
                }
                else {
                    io.to(socket.id).emit("room_query", false);
                }
            }
            else {
                // send error message if room is not there
                socket.emit("error", "No Room Id - ".concat(data.roomId));
            }
            // logging some important information
            console.log("Join Room", util.inspect(rooms, false, null, true /* enable colors */));
        });
        // Update Code
        socket.on("update", function (data) {
            var _a;
            // If room is available only
            if (!data)
                return;
            if (JSON.stringify(data) == JSON.stringify(rooms.get(data.roomId))) {
                console.log("same");
                return;
            }
            if (rooms.get(data.roomId)) {
                // set Code like room -> code
                rooms.set(data.roomId, data);
                // Emit to the room users
                socket.broadcast.to(data.roomId).emit("update", data);
            }
            else {
                // send error messages to the user
                socket.emit("error", "No Room Id - ".concat(data.roomId));
            }
            // logging some important information
            console.log("Update", (_a = rooms.get(data.roomId)) !== null && _a !== void 0 ? _a : "");
        });
        socket.on("compile", function () {
            var roomId = SocketId_RoomId.get(socket.id);
            // If room is available only
            if (rooms.get(roomId)) {
                var lang_to_runner = {
                    c: c,
                    cpp: cpp,
                    javascript: node,
                    python: python,
                    java: java,
                };
                if (lang_to_runner[rooms.get(roomId).code.lang]) {
                    lang_to_runner[rooms.get(roomId).code.lang]
                        .runSource(rooms.get(roomId).code.code, {
                        stdin: rooms.get(roomId).code.input,
                    })
                        .then(function (result) {
                        rooms.set(roomId, __assign(__assign({}, rooms.get(roomId)), { code: __assign(__assign({}, rooms.get(roomId).code), { output: result.stderr
                                    ? result.stderr + "\n"
                                    : "" + result.stdout
                                        ? result.stdout + "\n"
                                        : "" + "\nExit with code" + result.exitCode + result.signal
                                            ? "\nError Signal " + result.signal
                                            : "" }) }));
                        io.to(roomId).emit("update", rooms.get(roomId));
                    })
                        .catch(function (err) {
                        io.to(roomId).emit("error", err);
                    });
                }
                // Emit to the room users
                // io.to(data.room).except(socket.id).emit("update_code", code.get(data.room));
            }
            else {
                // send error messages to the user
                socket.emit("error", "No Room Id - ".concat(roomId));
            }
            // logging some important information
            console.log("Compile");
        });
        // Leaving Room
        socket.on("leave_room", function (data) {
            console.log("A user disconnected:", socket.id);
            // If Room is there and User Is there in the room
            if (rooms.get(data.room)) {
                // getting the id and delete the member from room after 1 hour
                // setTimeout(() => {
                rooms.set(data.room, __assign(__assign({}, rooms.get(data.room)), { users: rooms
                        .get(data.room)
                        .users.filter(function (e) { return e.socketId != socket.id; }) }));
                SocketId_RoomId.delete(socket.id);
                // if the room is empty then delete it
                if (rooms.get(data.room).users.length == 0) {
                    rooms.delete(data.room);
                }
                // }, 60 * 60 * 1000);
                socket.broadcast.to(data.room).emit("update", rooms.get(data.room));
                // leave from the room
                socket.leave(data.room);
            }
            // logging some important information
            console.log("Leave Room");
        });
        // Disconnection
        socket.on("disconnecting", function (reason) {
            console.log("A user disconnected:", socket.id);
            // getting the room id from the user_room map
            var room_from_id = SocketId_RoomId.get(socket.id);
            // if room is there
            if (rooms.get(room_from_id)) {
                // getting the id and delete the member from room after 1 hour
                // setTimeout(() => {
                rooms.set(room_from_id, __assign(__assign({}, rooms.get(room_from_id)), { users: rooms
                        .get(room_from_id)
                        .users.filter(function (e) { return e.socketId != socket.id; }) }));
                SocketId_RoomId.delete(socket.id);
                // if the room is empty then delete it
                if (rooms.get(room_from_id).users.length == 0) {
                    rooms.delete(room_from_id);
                }
                // }, 60 * 60 * 1000);
                socket.broadcast
                    .to(room_from_id)
                    .emit("update", rooms.get(room_from_id));
                // leave from the room
                socket.leave(room_from_id);
            }
            // logging some important information
            console.log("Disconnect Room");
        });
    });
};
exports.runSocketServer = runSocketServer;
