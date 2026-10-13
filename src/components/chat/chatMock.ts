
///AI Made it

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
  online: boolean;
  lastActive?: string;
  lastMessage: string;
  lastMessageTime: string;
  unread: number;
  typing?: boolean;
  pinned?: boolean;
  muted?: boolean;
  isGroup?: boolean;
  members?: number;
  messages: ChatMessage[];
}

export const conversationsMock: Conversation[] = [
  {
    id: "c1",
    name: "Ahmed Samy",
    username: "ahmedsamy",
    online: true,
    lastMessage: "Bro did you see the new Route project? 🔥",
    lastMessageTime: "2m",
    unread: 2,
    pinned: true,
    messages: [
      { id: "m1", senderId: "c1", text: "Hey! How's it going?", time: "10:24 AM", isMe: false },
      { id: "m2", senderId: "me", text: "All good! Working on the social app 💻", time: "10:26 AM", isMe: true, seen: true },
      { id: "m3", senderId: "c1", text: "Nice! The feed design looks clean btw", time: "10:28 AM", isMe: false },
      { id: "m4", senderId: "me", text: "Thanks! Still polishing the chat UI now", time: "10:30 AM", isMe: true, seen: true },
      { id: "m5", senderId: "c1", text: "Bro did you see the new Route project? 🔥", time: "10:32 AM", isMe: false },
      { id: "m6", senderId: "c1", text: "They added real-time stuff, we should try it", time: "10:32 AM", isMe: false },
    ],
  },
  {
    id: "c2",
    name: "Sara Mohamed",
    username: "saramoh",
    online: true,
    lastMessage: "Typing...",
    lastMessageTime: "now",
    unread: 0,
    typing: true,
    pinned: true,
    messages: [
      { id: "m1", senderId: "c2", text: "Hey! Are you coming to the meetup tomorrow?", time: "09:12 AM", isMe: false },
      { id: "m2", senderId: "me", text: "Yes! What time exactly?", time: "09:15 AM", isMe: true, seen: true },
      { id: "m3", senderId: "c2", text: "Around 6pm at the Route branch", time: "09:18 AM", isMe: false },
      {
        id: "m4",
        senderId: "c2",
        image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&q=80",
        text: "Last time was so fun 😍",
        time: "09:19 AM",
        isMe: false,
      },
      { id: "m5", senderId: "me", text: "Haha yes! Can't wait 🔥", time: "09:22 AM", isMe: true, seen: true },
    ],
  },
  {
    id: "c3",
    name: "Route Frontend Gang",
    username: "route-gang",
    online: false,
    isGroup: true,
    members: 12,
    lastMessage: "Omar: pushed the new chat design 🎨",
    lastMessageTime: "15m",
    unread: 5,
    messages: [
      { id: "m1", senderId: "u1", text: "Morning team ☀️", time: "08:00 AM", isMe: false },
      { id: "m2", senderId: "u2", text: "Morning! Standup at 10?", time: "08:05 AM", isMe: false },
      { id: "m3", senderId: "me", text: "Yep, I'll share the chat UI progress", time: "08:07 AM", isMe: true, seen: true },
      { id: "m4", senderId: "u3", text: "pushed the new chat design 🎨", time: "08:20 AM", isMe: false },
    ],
  },
  {
    id: "c4",
    name: "Omar Khaled",
    username: "omarkhaled",
    online: false,
    lastActive: "Active 1h ago",
    lastMessage: "Sent you the Figma link",
    lastMessageTime: "1h",
    unread: 0,
    messages: [
      { id: "m1", senderId: "me", text: "Can you review my PR?", time: "Yesterday", isMe: true, seen: true },
      { id: "m2", senderId: "c4", text: "Sure, send me the link", time: "Yesterday", isMe: false },
      { id: "m3", senderId: "c4", text: "Sent you the Figma link", time: "1h ago", isMe: false },
    ],
  },
  {
    id: "c5",
    name: "Nourhan Ali",
    username: "nourhan",
    online: true,
    lastMessage: "That sunset photo is amazing 😍",
    lastMessageTime: "3h",
    unread: 0,
    messages: [
      { id: "m1", senderId: "c5", text: "Hey! Loved your last post!", time: "07:00 AM", isMe: false },
      {
        id: "m2",
        senderId: "me",
        image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80",
        text: "Thank you! Shot this at the beach 🏖️",
        time: "07:10 AM",
        isMe: true,
        seen: true,
      },
      { id: "m3", senderId: "c5", text: "That sunset photo is amazing 😍", time: "07:12 AM", isMe: false },
    ],
  },
  {
    id: "c6",
    name: "Mahmoud Hassan",
    username: "mahmoudh",
    online: false,
    lastActive: "Active yesterday",
    lastMessage: "You: Let's catch up this weekend",
    lastMessageTime: "1d",
    unread: 0,
    muted: true,
    messages: [
      { id: "m1", senderId: "c6", text: "Long time no see!", time: "Yesterday", isMe: false },
      { id: "m2", senderId: "me", text: "Let's catch up this weekend", time: "Yesterday", isMe: true, seen: false },
    ],
  },
  {
    id: "c7",
    name: "Mariam Adel",
    username: "mariamad",
    online: false,
    lastActive: "Active 2d ago",
    lastMessage: "Haha exactly 😂😂",
    lastMessageTime: "2d",
    unread: 0,
    messages: [
      { id: "m1", senderId: "me", text: "Did you finish the assignment?", time: "2d ago", isMe: true, seen: true },
      { id: "m2", senderId: "c7", text: "Almost! React is killing me 😅", time: "2d ago", isMe: false },
      { id: "m3", senderId: "c7", text: "Haha exactly 😂😂", time: "2d ago", isMe: false },
    ],
  },
  {
    id: "c8",
    name: "Youssef Nabil",
    username: "youssefn",
    online: true,
    lastMessage: "Voice message • 0:42",
    lastMessageTime: "5m",
    unread: 1,
    messages: [
      { id: "m1", senderId: "c8", text: "Check this idea", time: "11:00 AM", isMe: false },
      { id: "m2", senderId: "me", text: "Listening now 🎧", time: "11:02 AM", isMe: true, seen: true },
    ],
  },
];
