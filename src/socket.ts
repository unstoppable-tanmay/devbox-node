const { c, cpp, node, python, java } = require("compile-run");

// user type
type user = {
  name: string;
  email: string;
  id?: string;
  username: string;
  password?: string;
};

type code = {
  code: string;
  lang: string;
  input: string;
  output: string;
};

type chats = {
  user: string;
  time: string;
  chat: string;
};

type room = {
  admin: { socketId: string; user: user };
  users: { socketId: string; user: user }[] | [];
  allowOthers?: boolean;
  code?: code;
  chats?: chats[];
};

// The Data Stores
var rooms = new Map<string, room>();

var user_room = new Map<string, string>(); // user id to socket id
var room_user = new Map<string, string>(); // socket id to user id

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

export const runSocketServer = (io) => {
  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    // sending the socket id
    io.to(socket.id).emit("socketId", {
      msg: "Created The Room",
      data: socket.id,
    });

    // setting th user id
    socket.on("userId", (data: { userId: string; id: string }) => {
      user_room.set(data.id, data.userId);
      room_user.set(data.userId, data.id);
    });

    // sending the room id
    socket.on("get_room", () => {
      io.to(socket.id).emit("room_id", createRoomId());
    });

    // Creating Room By Admin
    socket.on(
      "create_room",
      (data: { room: string; admin: { socketId: string; user: user } }) => {
        console.log("create room");
        // if room does not exit then only create the room
        if (!rooms.get(data.room)) {
          // join the room
          socket.join(data.room);

          // Assigned to rooms like - Map("Room Name"->member)
          rooms.set(data.room, {
            admin: { socketId: data.admin.socketId, user: data.admin.user },
            users: [],
          });

          // after creation send message to the user
          io.to(socket.id).emit("message", {
            msg: "Created The Room",
            data: socket.id,
          });
        } else {
          // if Room Already Exits then send msg
          socket.emit("error", `Room Already Exits`);
          console.log("error", `Room Already Exits`);
        }
      }
    );

    // Joining Room
    socket.on(
      "join_room",
      (data: { room: string; user: { socketId: string; user: user } }) => {
        // if room does not exit then only join the room
        if (rooms.get(data.room)) {
          // join the room
          socket.join(data.room);

          let roomData = rooms.get(data.room);

          // add member to room with room name given
          rooms.set(data.room, {
            ...roomData,
            users: [...roomData.users, data.user],
          });

          // send join message to the user
          io.to(socket.id).emit("message", {
            msg: "Joined The Room",
            data: socket.id,
          });
        } else {
          // send error message if room is not there
          socket.emit("error", `No Room Id - ${data.room}`);
          console.log("error", `No Room Id - ${data.room}`);
        }
      }
    );

    // Update Code
    socket.on("update", (data: { roomid: string; roomdata: room }) => {
      // If room is available only
      if (rooms.get(data.roomid)) {
        // set Code like room -> code
        rooms.set(data.roomid, data.roomdata);

        // Emit to the room users
        socket.broadcast.to(data.roomid).emit("update", data.roomdata);
      } else {
        // send error messages to the user
        socket.emit("error", `No Room Id - ${data.roomid}`);
        console.log("error", `No Room Id - ${data.roomid}`);
      }
    });

    socket.on("compile", (data: string) => {
      // If room is available only
      if (rooms.get(data)) {
        const lang_to_runner = {
          c: c,
          cpp: cpp,
          javascript: node,
          python: python,
          java: java,
        };

        if (lang_to_runner[rooms.get(data).code.lang]) {
          lang_to_runner[rooms.get(data).code.lang]
            .runSource(rooms.get(data).code.code, {
              stdin: rooms.get(data).code.input,
            })
            .then((result) => {
              io.to(data).emit("compiled", result);
            })
            .catch((err) => {
              io.to(data).emit("compiled", err);
            });
        }

        // Emit to the room users
        // io.to(data.room).except(socket.id).emit("update_code", code.get(data.room));
      } else {
        // send error messages to the user
        socket.emit("error", `No Room Id - ${data}`);
        console.log("error", `No Room Id - ${data}`);
      }
    });

    // Leaving Room
    socket.on("leave_room", (data: { room: string; roomdata: room }) => {
      // If Room is there and User Is there in the room
      if (rooms.get(data.room)) {
        io.to(data.room).emit("user_left", user_room.get(socket.id));

        // getting the id and delete the member from room
        rooms.set(data.room, data.roomdata);

        // also delete the user from users and user_room
        user_room.delete(socket.id);

        // delete the room if the room is empty
        if (rooms.get(data.room).users.length == 0) {
          rooms.delete(data.room);
        }

        // leave from the room
        socket.leave(data.room);
      }

      // logging some important information
      console.log(rooms, user_room);
    });

    // Disconnection
    socket.on("disconnecting", (reason) => {
      // getting the room id from the user_room map
      let room_from_id = user_room.get(socket.id);

      // if room is there
      if (rooms.get(room_from_id)) {
        // remove the member from the room and the user
        rooms.get(room_from_id).users.filter((e) => e.socketId != socket.id);
        user_room.delete(socket.id);

        // if the room is empty then delete it
        if (rooms.get(room_from_id).users.length == 0) {
          rooms.delete(room_from_id);
        }

        // leave from the room
        socket.leave(room_from_id);
      }

      // logging some important information
      console.log(rooms, user_room);
    });
  });
};
