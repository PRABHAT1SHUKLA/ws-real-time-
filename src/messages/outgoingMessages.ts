
export enum SupportedMessage {
  AddChat =  "ADD_CHAT",
  UpdateChat = "UPDATE_CHAT",
  NewUser= "NEW_USER"
}

type MessagePayload = {
  roomId: string;
  message: string;
  name: string;
  upvotes: number;
  chatId: string;
}

export type OutgoingMessage = {
  type : SupportedMessage.AddChat,
  payload: MessagePayload
} | {
  type : SupportedMessage.UpdateChat,
  payload:Partial<MessagePayload>
} | {
   type: SupportedMessage.NewUser,
   payload: string
}


// In TypeScript, Partial is a utility type that takes an object type and makes all of its properties optional. It’s particularly useful when you want to create a version of a type where some or all properties may not be present, often in situations like partial updates or initializing objects with default values.