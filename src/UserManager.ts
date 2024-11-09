import { connection } from "websocket";
import { OutgoingMessage } from "./messages/outgoingMessages";

interface User {
  name: string;
  id: string;
  conn: connection;
}

interface Room {
  users: User[]
}

//Map is a class which can be initialized 
export class UserManager {
  private rooms: Map<string, Room>;
  constructor() {
    this.rooms = new Map<string, Room>()
  }

  addUser(name: string, userId: string, roomId: string, socket: connection) {
    if (!this.rooms.get(roomId)) {
      this.rooms.set(roomId, {
        users: []
      })
    }
    this.rooms.get(roomId)?.users.push({
      id: userId,
      name,
      conn: socket
    })
    //connection object has various callbacks which are inbuilt in them , here in websocket connection object reasonCode and description are two callbacks
    socket.on("close", (reasonCode, description) => {
      this.removeUser(roomId, userId)
    })
  }
  removeUser(userId: string, roomId: string) {
    const users = this.rooms.get(roomId)?.users
    if (users) {
      users.filter(({ id }) => id !== userId)
    }
  }

  getUser(roomId: string, userId: string): User | null {
    const user = this.rooms.get(roomId)?.users.find((({ id }) => id === userId));
    return user ?? null;
  }

  broadCast(userId: string , roomId: string ,message:OutgoingMessage){
    const user = this.getUser(userId, roomId)
    if(!user){
      console.error("user not found");
      return;
    }

    const room = this.rooms.get(roomId)
    if(!room){
      console.error("room not there")
      return 
    }

    room.users.forEach(({conn,id})=>{
      if(id==userId){
        return ;
      }

      console.log("outgoing message " + JSON.stringify(message))
      conn.sendUTF(JSON.stringify(message))
    })
  }
}