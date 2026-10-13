import { useMemo, useState } from "react";
import { Helmet } from "react-helmet";
import { MessageCircle, PenSquare, Search } from "lucide-react";
import { ChatList } from "#components/chat/ChatList";
import { ChatHeader, ChatMessages } from "#components/chat/ChatBoxParts";
import { ChatInput } from "#components/chat/ChatInput";
import { conversationsMock, type ChatMessage } from "../../components/chat/chatMock";
import { cn } from "cn";

export default function Chats() {
  const [activeId, setActiveId] = useState(conversationsMock[0].id);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "unread" | "groups">("all");
  const [extra, setExtra] = useState<Record<string, ChatMessage[]>>({});
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");

  const active = conversationsMock.find((c) => c.id === activeId) ?? conversationsMock[0];

  const messages: ChatMessage[] = useMemo(
    () => [...active.messages, ...(extra[active.id] ?? [])],
    [active, extra],
  );

  const visible = useMemo(() => {
    if (filter === "unread") return conversationsMock.filter((c) => c.unread > 0);
    if (filter === "groups") return conversationsMock.filter((c) => c.isGroup);
    return conversationsMock;
  }, [filter]);

  const totalUnread = conversationsMock.reduce((n, c) => n + c.unread, 0);

  function handleSend(text: string) {
    const msg: ChatMessage = {
      id: `local-${Date.now()}`,
      senderId: "me",
      text,
      time: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
      isMe: true,
      seen: false,
    };
    setExtra((prev) => ({ ...prev, [active.id]: [...(prev[active.id] ?? []), msg] }));
    active.lastMessage = `You: ${text}`;
    active.lastMessageTime = "now";
  }

  function select(id: string) {
    setActiveId(id);
    setMobileView("chat");
  }

  const tabs = [
    { key: "all", label: "All" },
    { key: "unread", label: `Unread ${totalUnread > 0 ? `• ${totalUnread}` : ""}` },
    { key: "groups", label: "Groups" },
  ] as const;

  return (
    <div className="w-full text-[#083695] dark:text-white">
      <Helmet>
        <title>Chats | SocialApp</title>
        <meta name="description" content="Chat with friends — design preview." />
      </Helmet>

      <div className="flex gap-3 sm:gap-4 items-stretch h-[calc(100dvh-220px)] sm:h-[calc(100vh-140px)] md:h-[calc(100vh-170px)] min-h-105 sm:min-h-135">
        {/* LEFT: list */}
        <aside className={cn(
          "w-full lg:w-85 xl:w-90 shrink-0 bg-white dark:bg-[#0f172a] rounded-3xl shadow-sm border border-gray-100 dark:border-white/8 overflow-hidden flex-col",
          mobileView === "list" ? "flex" : "hidden lg:flex",
        )}>
          <div className="p-4 pb-3 border-b border-gray-100 dark:border-white/8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                <MessageCircle size={20} className="text-[#083695] dark:text-blue-400" />
                Chats
              </h2>
              <button className="p-2 rounded-xl bg-[#083695] dark:bg-blue-600 text-white hover:scale-105 active:scale-95 transition-transform cursor-pointer" aria-label="New chat">
                <PenSquare size={16} />
              </button>
            </div>
            <div className="relative mb-3">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search chats..." className="w-full bg-[#eef2fb] dark:bg-white/5 rounded-xl py-2 pl-9 pr-3 text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#083695]/40" />
            </div>
            <div className="flex gap-2">
              {tabs.map((t) => (
                <button key={t.key} onClick={() => setFilter(t.key)} className={cn("text-xs font-semibold px-3 py-1.5 rounded-full transition-colors cursor-pointer", filter === t.key ? "bg-[#083695] dark:bg-blue-600 text-white" : "bg-[#083695]/8 dark:bg-white/8 text-gray-600 dark:text-gray-300 hover:bg-[#083695]/15")}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            <ChatList conversations={visible} activeId={activeId} onSelect={select} search={search} />
          </div>
          <div className="p-3 border-t border-gray-100 dark:border-white/8 text-center">
            <p className="text-[11px] text-gray-400">Design preview — no backend yet ✨</p>
          </div>
        </aside>

        {/* RIGHT: chat box */}
        <section className={cn(
          "flex-1 min-w-0 bg-white dark:bg-[#0f172a] rounded-3xl shadow-sm border border-gray-100 dark:border-white/8 overflow-hidden flex-col",
          mobileView === "chat" ? "flex" : "hidden lg:flex",
        )}>
          <ChatHeader conversation={active} onBack={() => setMobileView("list")} />
          <ChatMessages conversation={active} messages={messages} />
          <ChatInput conversation={active} onSend={handleSend} />
        </section>
      </div>
    </div>
  );
}
