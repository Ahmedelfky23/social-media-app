export interface ChatMessage {
  id: string;
  senderId: string;
  text?: string;
  image?: string;
  time: string;
  isMe: boolean;
  seen?: boolean;
}

export interface Conversation {
  id: string;
  name: string;
  username: string;
  photo?: string;
  online?: boolean;
  lastActive?: string;
  lastMessage: string;
  lastMessageTime: string;
  unread: number;
  typing?: boolean;
  pinned?: boolean;
  muted?: boolean;
  isGroup?: boolean;
  members?: number;
  messages?: ChatMessage[];
  memberIds?: string[];
  otherUserId?: string;
  lastSenderIsMe?: boolean;
  lastMessageSeen?: boolean;
}

