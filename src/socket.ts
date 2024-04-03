import { Server } from "socket.io";
import { room, chats, code, user } from "./types";
const util = require("util");

const { c, cpp, node, python, java } = require("compile-run");

// The Data Stores
var rooms = new Map<string, room>();

var SocketId_RoomId = new Map<string, string>();

/**
 *
 * @returns a string like - "abc-def-ghi"
 */
const createRoomId = () => {
  const c = "abcdefghijklmnopqrstuvwxyz";
  const s =
    [...Array(3)].map((_) => c[~~(Math.random() * c.length)]).join("") +
    "-" +
    [...Array(3)].map((_) => c[~~(Math.random() * c.length)]).join("") +
    "-" +
    [...Array(3)].map((_) => c[~~(Math.random() * c.length)]).join("");

  return s;
};

export const runSocketServer = (io: Server) => {
  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    // sending the socket id
    socket.on("join", () => {
      io.to(socket.id).emit("socketId", {
        msg: "Created The Room",
        id: socket.id,
      });
    });

    socket.on("room_exits", (roomId: string) => {
      io.to(socket.id).emit("room_query", rooms.get(roomId) ? true : false);
    });

    socket.on(
      "remove_from_room",
      (data: {
        roomId: string;
        userSocketId: string;
        adminSocketId: string;
      }) => {
        console.log(data);
        if (
          rooms.get(data.roomId) &&
          rooms.get(data.roomId).admin.socketId == data.adminSocketId
        ) {
          rooms.set(data.roomId, {
            ...rooms.get(data.roomId),
            users: rooms
              .get(data.roomId)
              .users.filter((e: any) => e.socketId != data.userSocketId),
          });

          io.to(data.userSocketId).emit("removed", data.userSocketId);
          // io.to(data.userSocketId).socketsLeave(data.roomId);

          socket.broadcast
            .to(data.roomId)
            .emit("update", rooms.get(data.roomId));
        }
      }
    );

    // Creating Room By Admin
    socket.on(
      "create_room",
      (data: {
        admin: { socketId: string; user: user };
        allowOthers: boolean;
        invitedUsers: string[];
        allowOutBoundMessages: boolean
      }) => {
        const roomId = createRoomId();
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
            allowOutBoundMessages: data.allowOutBoundMessages
          });

          SocketId_RoomId.set(socket.id, roomId);

          // after creation send room to the user
          io.to(socket.id).emit("room_created", rooms.get(roomId));
        } else {
          // if Room Already Exits then send msg
          socket.emit("message", `Room Already Exits`);
        }
        // logging some important information
        console.log("Create Room");
      }
    );

    // Update Room By Admin
    socket.on(
      "update_room",
      (data: {
        roomId: string;
        allowOthers: boolean;
        invitedUsers: string[];
        allowOutBoundMessages
      }) => {
        // if room does not exit then only create the room
        if (rooms.get(data.roomId)) {
          // Assigned to rooms like - Map("Room Name"->member)
          rooms.set(data.roomId, {
            ...rooms.get(data.roomId),
            allowOthers: data.allowOthers,
            invitedUsers: data.invitedUsers,
            allowOutBoundMessages:data.allowOutBoundMessages
          });

          // after creation send room to the user
          io.to(socket.id).emit("room_updated", rooms.get(data.roomId));
        } else {
          // if Room Already Exits then send msg
          socket.emit("error", `Room Already Exits`);
        }
        // logging some important information
        console.log("Update Room");
      }
    );

    socket.on("outbound", (data: { roomId: string; name: string }) => {
      if(rooms.get(data.roomId))
      io.to(rooms.get(data.roomId).admin.socketId).emit("outbound", {
        name: data.name,
      });
    });

    // Joining Room
    socket.on(
      "join_room",
      (data: { roomId: string; user: { socketId: string; user: user } }) => {
        let roomData = rooms.get(data.roomId);

        console.log(data.user);

        // if room does not exit then only join the room
        if (roomData && data.user.socketId && data.user.user.id) {
          if (rooms.get(data.roomId).admin.user.id == data.user.user.id) {
            // join the room
            socket.join(data.roomId);

            rooms.set(data.roomId, {
              ...roomData,
              users: rooms
                .get(data.roomId)
                .users.filter((e: any) => e.user.id != data.user.user.id),
            });

            // add member to room with room name given
            rooms.set(data.roomId, {
              ...roomData,
              admin: data.user,
              users: [...roomData.users, data.user],
            });

            SocketId_RoomId.set(socket.id, data.roomId);

            // send join message to the user
            io.to(socket.id).emit("joined_room", rooms.get(data.roomId));

            socket.broadcast
              .to(data.roomId)
              .emit("update", rooms.get(data.roomId));
          } else if (roomData.allowOthers) {
            // join the room
            socket.join(data.roomId);

            rooms.set(data.roomId, {
              ...roomData,
              users: rooms
                .get(data.roomId)
                .users.filter((e: any) => e.user.id != data.user.user.id),
            });

            // add member to room with room name given
            rooms.set(data.roomId, {
              ...roomData,
              users: [...roomData.users, data.user],
            });

            SocketId_RoomId.set(socket.id, data.roomId);

            // send join message to the user
            io.to(socket.id).emit("joined_room", rooms.get(data.roomId));

            socket.broadcast
              .to(data.roomId)
              .emit("update", rooms.get(data.roomId));
          } else if (roomData.invitedUsers.includes(data.user.user.email)) {
            // join the room
            socket.join(data.roomId);

            rooms.set(data.roomId, {
              ...roomData,
              users: rooms
                .get(data.roomId)
                .users.filter((e: any) => e.user.id != data.user.user.id),
            });

            // add member to room with room name given
            rooms.set(data.roomId, {
              ...roomData,
              users: [...roomData.users, data.user],
            });

            SocketId_RoomId.set(socket.id, data.roomId);

            // send join message to the user
            io.to(socket.id).emit("joined_room", rooms.get(data.roomId));

            socket.broadcast
              .to(data.roomId)
              .emit("update", rooms.get(data.roomId));
          } else {
            io.to(socket.id).emit("room_query", false);
          }
        } else {
          // send error message if room is not there
          socket.emit("error", `No Room Id - ${data.roomId}`);
        }
        // logging some important information
        console.log(
          "Join Room",
          util.inspect(rooms, false, null, true /* enable colors */)
        );
      }
    );

    // Update Code
    socket.on("update", (data: room) => {
      // If room is available only
      if (!data) return;
      if (JSON.stringify(data) == JSON.stringify(rooms.get(data.roomId))) {
        console.log("same");
        return;
      }
      if (rooms.get(data.roomId)) {
        // set Code like room -> code
        rooms.set(data.roomId, data);

        // Emit to the room users
        socket.broadcast.to(data.roomId).emit("update", data);
      } else {
        // send error messages to the user
        socket.emit("error", `No Room Id - ${data.roomId}`);
      }
      // logging some important information
      console.log("Update", rooms.get(data.roomId) ?? "");
    });

    socket.on("compile", () => {
      let roomId = SocketId_RoomId.get(socket.id);
      // If room is available only
      if (rooms.get(roomId)) {
        const lang_to_runner = {
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
            .then((result) => {
              rooms.set(roomId, {
                ...rooms.get(roomId),
                code: {
                  ...rooms.get(roomId).code,
                  output: result.stderr
                    ? result.stderr + "\n"
                    : "" + result.stdout
                    ? result.stdout + "\n"
                    : "" + "\nExit with code" + result.exitCode + result.signal
                    ? "\nError Signal " + result.signal
                    : "",
                },
              });
              io.to(roomId).emit("update", rooms.get(roomId));
            })
            .catch((err) => {
              io.to(roomId).emit("error", err);
            });
        }

        // Emit to the room users
        // io.to(data.room).except(socket.id).emit("update_code", code.get(data.room));
      } else {
        // send error messages to the user
        socket.emit("error", `No Room Id - ${roomId}`);
      }
      // logging some important information
      console.log("Compile");
    });

    // Leaving Room
    socket.on("leave_room", (data: { room: string; user: user }) => {
      console.log("A user disconnected:", socket.id);
      // If Room is there and User Is there in the room
      if (rooms.get(data.room)) {
        // getting the id and delete the member from room
        console.log(rooms.get(data.room).users);
        rooms.set(data.room, {
          ...rooms.get(data.room),
          users: rooms
            .get(data.room)
            .users.filter((e: any) => e.socketId != socket.id),
        });
        console.log(rooms.get(data.room).users);

        // also delete the user from users and user_room
        SocketId_RoomId.delete(socket.id);

        // delete the room if the room is empty
        if (rooms.get(data.room).users.length == 0) {
          rooms.delete(data.room);
        }
        socket.broadcast.to(data.room).emit("update", rooms.get(data.room));
        // leave from the room
        socket.leave(data.room);
      }

      // logging some important information
      console.log("Leave Room");
    });

    // Disconnection
    socket.on("disconnecting", (reason) => {
      console.log("A user disconnected:", socket.id);
      // getting the room id from the user_room map
      let room_from_id = SocketId_RoomId.get(socket.id);

      // if room is there
      if (rooms.get(room_from_id)) {
        // getting the id and delete the member from room
        console.log(rooms.get(room_from_id).users);
        rooms.set(room_from_id, {
          ...rooms.get(room_from_id),
          users: rooms
            .get(room_from_id)
            .users.filter((e: any) => e.socketId != socket.id),
        });
        console.log(rooms.get(room_from_id).users);

        SocketId_RoomId.delete(socket.id);

        // if the room is empty then delete it
        if (rooms.get(room_from_id).users.length == 0) {
          rooms.delete(room_from_id);
        }

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
