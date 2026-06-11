/**
 * Broadcast chat messages to online participants via Socket.io user rooms.
 * Used by REST message endpoints so clients receive realtime updates without
 * relying solely on delta-sync polling.
 */

function toUserId(userRef) {
  if (!userRef) return null;
  if (typeof userRef === 'string') return userRef;
  if (userRef._id) return userRef._id.toString();
  return userRef.toString();
}

function formatMessagePayload(message, messageObj, chat) {
  const chatId = chat._id ? chat._id.toString() : String(chat);
  return {
    ...messageObj,
    chat: chatId,
    chatType: chat.type || 'private',
    sender: message.sender
      ? {
          ...messageObj.sender,
          avatar: message.sender.avatar || ''
        }
      : messageObj.sender,
    senderInfo: message.sender
      ? {
          id: message.sender._id,
          username: message.sender.username,
          avatar: message.sender.avatar || ''
        }
      : null
  };
}

/**
 * Emit private_message / group_message to every active participant except the sender.
 */
function broadcastChatMessage(io, chat, senderUserId, message, messageObj) {
  if (!io || !chat || !message) return;

  const event = chat.type === 'group' ? 'group_message' : 'private_message';
  const payload = {
    message: formatMessagePayload(message, messageObj, chat),
    chatId: chat._id ? chat._id.toString() : String(chat),
    chatType: chat.type || 'private'
  };

  const senderId = senderUserId ? senderUserId.toString() : null;

  for (const participant of chat.participants || []) {
    if (!participant.isActive || !participant.user) continue;
    const userId = toUserId(participant.user);
    if (!userId || (senderId && userId === senderId)) continue;
    io.to(`user_${userId}`).emit(event, payload);
  }
}

module.exports = {
  broadcastChatMessage,
  formatMessagePayload
};
