import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";

export const initChatSocket = (io) => {
  io.on("connection", (socket) => {
    // console.log(`User connected: ${socket.id}`);

    socket.on("join_room", (conversationId) => {
      if (conversationId) {
        socket.join(conversationId);
      }
    });

    socket.on("send_message", async (messagePayload) => {
      try {
        const senderId =
          typeof messagePayload.sender === "object"
            ? messagePayload.sender._id || messagePayload.sender.id
            : messagePayload.sender;

        const savedMessage = await Message.create({
          conversationId: messagePayload.conversationId,
          sender: senderId,
          text: messagePayload.text,
        });

        await Conversation.findByIdAndUpdate(messagePayload.conversationId, {
          lastMessage: messagePayload.text,
        });

        const outgoingMessage = {
          id: savedMessage._id.toString(),
          conversationId: savedMessage.conversationId.toString(),
          sender: {
            _id: senderId,
            name: messagePayload.sender?.name || "Unknown",
            avatar: messagePayload.sender?.avatar,
          },
          text: savedMessage.text,
          timestamp: savedMessage.createdAt.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };

        io.to(messagePayload.conversationId).emit(
          "receive_message",
          outgoingMessage,
        );
      } catch (error) {
        console.error("Message persistence failed:", error);
      }
    });

    socket.on("disconnect", () => {
      // console.log(`User disconnected: ${socket.id}`);
    });
  });
};
