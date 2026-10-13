import { useEffect, useRef, useState } from "react";
import { ArrowLeft, CheckCheck, Phone, Video, Search, Info } from "lucide-react";
import { UserAvatar } from "#components/PostCard/PostCard";
import type { ChatMessage, Conversation } from "./chatMock";
import { cn } from "cn";

interface Props {
  conversation: Conversation;
  messages: ChatMessage[];
  onBack: () => void;
}

export function ChatHeader({ conversation, onBack }: { conversation: Conversation; onBack: () => void }) {
  const c = conversation;
  return (
    <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-3 border-b border-gray-100 dark:border-white/8 shrink-0">
      <button onClick={onBack} className="lg:hidden p-2 -ml-1 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 cursor-pointer" aria-label="Back">
        <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
      </button>
      <div className="relative shrink-0">
        <UserAvatar photo={c.photo} name={c.name} className="h-10 w-10 sm:h-11 sm:w-11" />
        {c.online && !c.isGroup && (
          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white dark:border-[#0f172a]" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-sm sm:text-[15px] text-gray-900 dark:text-white truncate">{c.name}</h3>
        <p className="text-[11px] sm:text-xs text-emerald-600 dark:text-emerald-400 font-medium truncate">
          {c.typing ? "typing..." : c.online ? (c.isGroup ? `${c.members} members` : "Active now") : c.lastActive || "Offline"}
        </p>
      </div>
      <div className="flex items-center gap-0.5">
        <button className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-[#083695]/8 hover:text-[#083695] dark:hover:bg-white/10 dark:hover:text-white cursor-pointer" aria-label="Voice call"><Phone size={18} /></button>
        <button className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-[#083695]/8 hover:text-[#083695] dark:hover:bg-white/10 dark:hover:text-white cursor-pointer" aria-label="Video call"><Video size={19} /></button>
        <button className="hidden sm:block p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-[#083695]/8 dark:hover:bg-white/10 cursor-pointer" aria-label="Search"><Search size={18} /></button>
        <button className="hidden sm:block p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-[#083695]/8 dark:hover:bg-white/10 cursor-pointer" aria-label="Info"><Info size={18} /></button>
      </div>
    </div>
  );
}

export function ChatMessages({ conversation, messages }: { conversation: Conversation; messages: ChatMessage[] }) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const c = conversation;
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, c.id]);
  return (
    <div className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-5 py-4 space-y-3 bg-[#f6f8fd] dark:bg-[#0b1220]">
      <div className="flex justify-center">
        <span className="text-[11px] font-medium text-gray-400 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 px-3 py-1 rounded-full">Today</span>
      </div>
      {messages.map((m) => (
        <div key={m.id} className={cn("flex w-full", m.isMe ? "justify-end" : "justify-start")}>
          {!m.isMe && <UserAvatar photo={c.photo} name={c.name} className="h-7 w-7 mr-2 mt-auto shrink-0 hidden sm:flex" />}
          <div className={cn("max-w-[78%] sm:max-w-[65%] flex flex-col", m.isMe ? "items-end" : "items-start")}>
            <div className={cn("px-3.5 py-2.5 text-[13.5px] shadow-sm", m.isMe ? "bg-[#083695] dark:bg-blue-600 text-white rounded-2xl rounded-br-md" : "bg-white dark:bg-white/8 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-white/10 rounded-2xl rounded-bl-md")}>
              {m.image && <img src={m.image} alt="shared" className="rounded-xl mb-2 max-h-56 w-full object-cover" />}
              {m.text && <p className="whitespace-pre-wrap wrap-break-word">{m.text}</p>}
            </div>
            <span className="text-[10px] text-gray-400 mt-1 px-1 flex items-center gap-1">
              {m.time}
              {m.isMe && <CheckCheck size={13} className={m.seen ? "text-sky-500" : "text-gray-400"} />}
            </span>
          </div>
        </div>
      ))}
      {c.typing && (
        <div className="flex justify-start">
          <div className="bg-white dark:bg-white/8 border border-gray-100 dark:border-white/10 rounded-2xl rounded-bl-md px-4 py-3 flex gap-1">
            <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" />
            <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce [animation-delay:150ms]" />
            <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce [animation-delay:300ms]" />
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useChatDraft() {
  const [draft, setDraft] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  return { draft, setDraft, showEmoji, setShowEmoji };
}

export type { Props as ChatBoxCoreProps };
