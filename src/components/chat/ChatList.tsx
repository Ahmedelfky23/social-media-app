import { Check, CheckCheck, Pin, VolumeX, X } from "lucide-react";
import { UserAvatar } from "#components/PostCard/PostCard";
import type { Conversation } from "./chatMock";
import { cn } from "cn";

interface Props {
  conversations: Conversation[];
  activeId: string;
  onSelect: (id: string) => void;
  onDelete?: (id: string) => void;
  search: string;
}

function Row({
  c,
  active,
  onSelect,
  onDelete,
}: {
  c: Conversation;
  active: boolean;
  onSelect: () => void;
  onDelete?: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-3 text-left cursor-pointer group relative transition-colors select-none",
        active ? "bg-[#083695]/8 dark:bg-white/8" : "hover:bg-[#083695]/4 dark:hover:bg-white/4",
      )}
    >
      <span
        className={cn(
          "absolute left-0 top-1/2 -translate-y-1/2 w-1 h-10 rounded-r-full bg-[#083695] dark:bg-blue-500 transition-all",
          active ? "opacity-100" : "opacity-0",
        )}
      />
      <div className="relative shrink-0">
        <UserAvatar photo={c.photo} name={c.name} className="h-12 w-12" />
        {c.online && !c.isGroup && (
          <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#0f172a]" />
        )}
        {c.isGroup && (
          <span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-[#083695] dark:bg-blue-600 border-2 border-white dark:border-[#0f172a] flex items-center justify-center text-[9px] font-bold text-white">
            {c.members}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h4 className="font-semibold text-[13.5px] text-gray-900 dark:text-white truncate flex items-center gap-1.5">
            <span className="truncate">{c.name}</span>
            {c.pinned && <Pin size={12} className="shrink-0 text-gray-400 rotate-45" />}
            {c.muted && <VolumeX size={12} className="shrink-0 text-gray-400" />}
          </h4>
          <span className={cn("text-[11px] shrink-0", c.unread > 0 ? "text-[#083695] dark:text-blue-400 font-bold" : "text-gray-400")}>
            {c.lastMessageTime}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p className={cn("text-xs truncate flex-1", c.typing ? "text-[#083695] dark:text-blue-400 font-medium" : c.unread > 0 ? "text-gray-700 dark:text-gray-200 font-medium" : "text-gray-500 dark:text-gray-400")}>
            {c.typing ? "Typing..." : c.lastMessage}
          </p>
          <div className="flex items-center gap-1 shrink-0">
            {c.unread > 0 ? (
              <span className="shrink-0 min-w-5 h-5 px-1.5 rounded-full bg-[#083695] dark:bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center">
                {c.unread}
              </span>
            ) : c.lastSenderIsMe ? (
              c.lastMessageSeen ? (
                <CheckCheck size={14} className="shrink-0 text-sky-500" />
              ) : (
                <Check size={14} className="shrink-0 text-gray-400" />
              )
            ) : null}

            {onDelete && active && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="p-1 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/15 transition-all cursor-pointer ml-1"
                aria-label="Delete and close chat"
                title="Delete and close chat"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ChatList({ conversations, activeId, onSelect, onDelete, search }: Props) {
  const q = search.trim().toLowerCase();
  const filtered = q
    ? conversations.filter((c) => c.name.toLowerCase().includes(q) || c.lastMessage.toLowerCase().includes(q))
    : conversations;
  const pinned = filtered.filter((c) => c.pinned);
  const others = filtered.filter((c) => !c.pinned);

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="h-16 w-16 rounded-full bg-[#083695]/8 dark:bg-white/8 flex items-center justify-center text-2xl mb-3">💬</div>
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">No chats found</p>
        <p className="text-xs text-gray-400 mt-1">Try a different search</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {pinned.length > 0 && (
        <>
          <p className="px-4 pt-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-gray-400">Pinned</p>
          {pinned.map((c) => (
            <Row
              key={c.id}
              c={c}
              active={c.id === activeId}
              onSelect={() => onSelect(c.id)}
              onDelete={onDelete ? () => onDelete(c.id) : undefined}
            />
          ))}
        </>
      )}
      {others.length > 0 && pinned.length > 0 && (
        <p className="px-4 pt-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-gray-400">All messages</p>
      )}
      {others.map((c) => (
        <Row
          key={c.id}
          c={c}
          active={c.id === activeId}
          onSelect={() => onSelect(c.id)}
          onDelete={onDelete ? () => onDelete(c.id) : undefined}
        />
      ))}
    </div>
  );
}
