import { connection, server as WebSocketServer } from "websocket"
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

const wsServer = new WebSocketServer({
  httpServer: server,
  // You should not use autoAcceptConnections for production
  // applications, as it defeats all standard cross-origin protection
  // facilities built into the protocol and the browser.  You should
  // *always* verify the connection's origin and decide whether or not
  // to accept it.
  autoAcceptConnections: false
});

function originIsAllowed(origin: string) {
  // put logic here to detect whether the specified origin is allowed.
  return true;
}

wsServer.on('request', function (request) {
  if (!originIsAllowed(request.origin)) {
    // Make sure we only accept requests from an allowed origin
    request.reject();
    console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
    return;
  }

  var connection = request.accept('echo-protocol', request.origin);
  console.log((new Date()) + ' Connection accepted.');
  connection.on('message', function (message) {
    if (message.type === 'utf8') {
      try {
        messageHandler(connection, JSON.parse(message.utf8Data));
      } catch (e) {

      }
    }

  });
  connection.on('close', function (reasonCode, description) {
    console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
  });
});


function messageHandler(ws: connection, message: IncomingMessage) {
  if (message.type == SupportedMessage.JoinRoom) {
    const payload = message.payload;
    userManager.addUser(payload.name, payload.userId, payload.roomId, ws);
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