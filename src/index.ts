import { WebSocket, WebSocketServer } from "ws";
import http from "http"
import { IncomingMessage, SupportedMessage } from "./messages/incomingMessages";
import { UserManager } from "./UserManager";

import { InMemoryStore } from "./store/InMemoryStore";
import { OutgoingMessage, SupportedMessage as OutgoingSupportedMessage } from "./messages/outgoingMessages";

var server = http.createServer(function (request: any, response: any) {
  console.log((new Date()) + ' Received request for ' + request.url);
  response.writeHead(404);
  response.end();
});

server.listen(8080, function () {
  console.log((new Date()) + ' Server is listening on port 8080');
});

const userManager = new UserManager();
const store = new InMemoryStore();

console.log("about to socketify")
const wss = new WebSocketServer({server})
console.log('yeah')

function originIsAllowed(origin: string) {
  // put logic here to detect whether the specified origin is allowed.
  return true;
}

wss.on('connection', (ws)=>{
  console.log('Client connected')

  ws.send("welcome to the websocket server")

  ws.on('message', (data)=>{
    console.log('Received Message =>', data)
   try{
    const message: IncomingMessage = JSON.parse(data.toString());
    messageHandler(ws, message)
   }catch(err){
    console.log(err)
   }
  })
} )


function messageHandler(ws: WebSocket, message: IncomingMessage) {
  if (message.type == SupportedMessage.JoinRoom) {
    const payload = message.payload;
    userManager.addUser(payload.name, payload.userId, payload.roomId, ws);
     

    // userManager.broadCast(payload.userId, payload.roomId, )
  }

  if (message.type == SupportedMessage.SendMessage) {
    const payload = message.payload
    const user = userManager.getUser(payload.roomId, payload.userId)
    if (!user) {
      console.error('User not found')
    }

    let chat = store.addChat(payload.userId, payload.name, payload.message, payload.roomId)
    if (!chat) {
      return;
    }

    const outgoingPayload: OutgoingMessage = {
      type: OutgoingSupportedMessage.AddChat,
      payload: {
        chatId: chat.id,
        name: payload.name,
        roomId: payload.roomId,
        message: payload.message,
        upvotes: 0
      }
    }

    userManager.broadCast(payload.userId, payload.roomId, outgoingPayload)
    console.log("broadcasted  messa")
  }


  if (message.type == SupportedMessage.UpvoteMessage) {
    const payload = message.payload
    const chat = store.upvote(payload.userId, payload.chatId, payload.roomId)

    if (!chat) {
      return;
    }

    const outgoingPayload: OutgoingMessage = {
      type: OutgoingSupportedMessage.UpdateChat,
      payload: {
        chatId: chat.id,
        name: chat.name,
        upvotes: chat.upvotes.length

      }
    }

    userManager.broadCast(payload.userId, payload.roomId, outgoingPayload)


  }
} 