// user type
export type user = {
  name: string;
  email: string;
  id?: string;
  username: string;
  password?: string;
};

export type code = {
  code?: string;
  lang?: string;
  input?: string;
  output?: string;
};

export type chats = {
  user: string;
  time: string;
  chat: string;
};

export type room = {
  roomId?: string;
  admin?: { socketId: string; user: user };
  users?: { socketId: string; user: user }[] | [];
  allowOthers?: boolean;
  code?: code;
  chats?: chats[];
  invitedUsers?: string[];
  allowOutBoundMessages: boolean;
};
