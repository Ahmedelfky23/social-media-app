import { useEffect, useMemo, useState, useContext, useCallback, useRef } from "react";
import { Helmet } from "react-helmet";
import { useLocation, useSearchParams } from "react-router-dom";
import { MessageCircle, PenSquare, Search, Loader2, AlertCircle, Sparkles, UserPlus } from "lucide-react";
import { ChatList } from "#components/chat/ChatList";
import { ChatHeader, ChatMessages } from "#components/chat/ChatBoxParts";
import { ChatInput } from "#components/chat/ChatInput";
import { NewChatModal } from "#components/chat/NewChatModal";
import { UserAvatar } from "#components/PostCard/PostCard";
import { AuthContext } from "../../context/AuthContext";
import { auth } from "../../lib/firebase";
import {
  ensureFirebaseAuth,
  registerChatUser,
  getOrCreateChat,
  subscribeToUserChats,
  subscribeToChatMessages,
  sendChatMessage,
  markChatAsRead,
  isMessageSeen,
  formatChatTimestamp,
  tsToMillis,
  deleteChat,
  type FirebaseChatDoc,
  type FirebaseChatMessage,
} from "../../services/chatService";
import type { Conversation, ChatMessage } from "../../types/Chat.type";
import { cn } from "cn";
import { useQuery } from "@tanstack/react-query";
import { fetchUserPool, type ExtendedSearchUser } from "#components/Navbar/UserSearch";

const USER_CACHE_KEY = "app_known_users";

const AUTH_TIMEOUT_MS = 20000;


function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
}

function getCachedUsers(): ExtendedSearchUser[] {
  try {
    const raw = localStorage.getItem(USER_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) return parsed as ExtendedSearchUser[];
    }
  } catch {
    //
  }
  return [];
}

interface PendingMessage {
  chatId: string;
  message: ChatMessage;
}

export default function Chats() {
  const { userLogin } = useContext(AuthContext);
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [firebaseUid, setFirebaseUid] = useState<string | null>(auth.currentUser?.uid ?? null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const [rawChats, setRawChats] = useState<FirebaseChatDoc[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [targetNotRegistered, setTargetNotRegistered] = useState(false);
  const autoStartedTargetRef = useRef<string | null>(null);
  const [pendingMessages, setPendingMessages] = useState<PendingMessage[]>([]);
  const seenIdsRef = useRef<{ chatId: string; ids: Set<string> }>({ chatId: "", ids: new Set() });

  // ── Load known and suggested users ──────────────────────────────────────────
  const { data: poolUsers = [] } = useQuery({
    queryKey: ["known-chat-users"],
    queryFn: async () => {
      const cached = getCachedUsers();
      try {
        const fresh = await fetchUserPool();
        return fresh && fresh.length > 0 ? fresh : cached;
      } catch {
        return cached;
      }
    },
    staleTime: 1000 * 60 * 3,
  });

  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      setIsInitializing(true);
      setAuthError(null);
      try {
        const fbUser = await withTimeout(ensureFirebaseAuth(userLogin), AUTH_TIMEOUT_MS);
        if (!isMounted) return;
        if (!fbUser) {
          const timeoutErr = new Error("Firebase auth timed out") as Error & { code?: string };
          timeoutErr.code = "chat/auth-timeout";
          throw timeoutErr;
        }
        setFirebaseUid(fbUser.uid);

        
        if (userLogin?._id) {
          void registerChatUser(userLogin._id, fbUser.uid, {
            name: userLogin.name,
            username: userLogin.username,
            photo: userLogin.photo,
            email: userLogin.email,
          }).catch((err) => {
            console.warn("Chat registry write failed:", err);
          });
        }
      } catch (err: unknown) {
        console.error("Firebase auth error:", err);
        const code = (err as { code?: string })?.code;
        if (code === "auth/configuration-not-found" || code === "auth/operation-not-allowed") {
          setAuthError(
            "Firebase Email/Password Authentication is not enabled. Go to Firebase Console → Authentication → Sign-in method, and enable Email/Password.",
          );
        } else if (code === "auth/too-many-requests") {
          setAuthError(
            "Firebase temporarily blocked sign-in attempts (too many in a row). Wait about a minute, then reload the page — chat will reconnect automatically.",
          );
        } else if (code === "auth/network-request-failed") {
          setAuthError("Could not reach Firebase. Check your internet connection, then reload the page.");
        } else if (code === "chat/auth-timeout") {
          setAuthError(
            "Chat couldn't connect to Firebase in time. Check your internet connection, then reload the page.",
          );
        } else if (code === "auth/email-already-in-use") {
          setAuthError(
            "This email is already registered to a different chat account, so chat could not sign in. Log out and back in, then reload the page.",
          );
        } else if (code) {
          setAuthError(`Could not connect to Firebase Chat. Check your internet connection or Firebase setup. (${code})`);
        } else {
          setAuthError("Could not connect to Firebase Chat. Check your internet connection or Firebase setup.");
        }
      } finally {
        if (isMounted) setIsInitializing(false);
      }
    }

    void initAuth();
    return () => {
      isMounted = false;
    };
  }, [userLogin]);

  // ── 2. Real-time subscription to user's chat list ──────────────────────────
  useEffect(() => {
    if (!firebaseUid) return;
    const unsub = subscribeToUserChats(
      firebaseUid,
      (chats) => setRawChats(chats),
      (err) => console.error("Chat list subscription error:", err),
    );
    return () => unsub();
  }, [firebaseUid]);

  const conversations: Conversation[] = useMemo(() => {
    if (!firebaseUid) return [];

    return rawChats
      .filter((c) => !c.deletedFor?.[firebaseUid])
      .map((c) => {
        // Find other member ID in the 2-member chat
        const otherUid = c.members?.find((m) => m !== firebaseUid) ?? c.members?.[0] ?? "";

        const detailsFromDoc =
          c.memberDetails?.[otherUid] ||
          (c.memberDetails
            ? Object.values(c.memberDetails).find(
                (d) => d.firebaseUid !== firebaseUid && d.id !== userLogin?._id,
              )
            : undefined);

        const infoFromPool = poolUsers.find(
          (u) =>
            u._id === detailsFromDoc?.id ||
            u._id === otherUid ||
            (detailsFromDoc?.email && u.email === detailsFromDoc.email) ||
            (detailsFromDoc?.username && u.username === detailsFromDoc.username),
        );

        const name = detailsFromDoc?.name || infoFromPool?.name || (otherUid ? "Chat User" : "User");
        const username = detailsFromDoc?.username || infoFromPool?.username || "user";
        const photo = detailsFromDoc?.photo || infoFromPool?.photo || "";

        const lastSenderIsMe = Boolean(c.lastSenderId && c.lastSenderId === firebaseUid);
        const otherReadAt = otherUid ? c.lastReadAt?.[otherUid] : undefined;
        const lastMsgMs = tsToMillis(c.lastMessageTime ?? c.updatedAt);
        const otherReadMs = tsToMillis(otherReadAt);
        const lastMessageSeen = Boolean(lastSenderIsMe && otherReadMs > 0 && otherReadMs >= lastMsgMs);

        const myReadAt = c.lastReadAt?.[firebaseUid];
        const myReadMs = tsToMillis(myReadAt);
        const hasUnread = Boolean(
          c.lastSenderId &&
            c.lastSenderId !== firebaseUid &&
            lastMsgMs > myReadMs,
        );

        return {
          id: c.id,
          name,
          username,
          photo,
          online: true,
          lastMessage: c.lastMessage || "Started a new conversation",
          lastMessageTime: formatChatTimestamp(c.lastMessageTime ?? c.updatedAt),
          unread: hasUnread ? 1 : 0,
          memberIds: c.members,
          otherUserId: otherUid,
          lastSenderIsMe,
          lastMessageSeen,
        };
      });
  }, [rawChats, firebaseUid, poolUsers, userLogin]);

  // ── 4. Auto-select chat from navigation state ──────────────────────────────
  const startChatWithTarget = useCallback(
    async (targetData: { _id: string; name: string; username?: string; photo?: string; email?: string }) => {
      if (!userLogin || !firebaseUid) return false;
      setTargetNotRegistered(false);

      const result = await getOrCreateChat(userLogin, targetData, firebaseUid).catch((err) => {
        console.error("getOrCreateChat failed:", err);
        // Provisioning/connection failure — show the notice instead of failing silently
        setTargetNotRegistered(true);
        return null;
      });

      if (!result) return false;

      if (result.targetNotRegistered) {
        setTargetNotRegistered(true);
        return false;
      }

      setActiveId(result.chatId);
      setMobileView("chat");
      return true;
    },
    [userLogin, firebaseUid],
  );

  useEffect(() => {
    const targetState = location.state?.targetUser as
      | { _id: string; name: string; username?: string; photo?: string; email?: string }
      | undefined;
    const targetIdFromUrl = searchParams.get("userId") ?? targetState?._id;

    if (targetIdFromUrl && userLogin && firebaseUid) {
      const targetUser =
        targetState ??
        poolUsers.find((u) => u._id === targetIdFromUrl) ?? {
          _id: targetIdFromUrl,
          name: "User",
          username: "user",
        };

      if (autoStartedTargetRef.current !== targetIdFromUrl) {
        autoStartedTargetRef.current = targetIdFromUrl;
        void startChatWithTarget(targetUser).then((started) => {
          if (!started) autoStartedTargetRef.current = null;
        });
      }
      return;
    }

    if (!activeId && conversations.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveId(conversations[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, searchParams, userLogin, firebaseUid, poolUsers]);

  // ── 5. Real-time messages for active chat ──────────────────────────────────
  useEffect(() => {
    if (!activeId || !firebaseUid) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMessages([]);
      return;
    }

    const activeChatDoc = rawChats.find((c) => c.id === activeId) ?? { id: activeId, members: [] };

    const unsub = subscribeToChatMessages(
      activeId,
      (fbMessages: FirebaseChatMessage[]) => {
        const mapped: ChatMessage[] = fbMessages.map((m) => {
          const isMe = m.senderId === firebaseUid;
          const seen = isMe ? isMessageSeen(m.createdAt, activeChatDoc, firebaseUid) : false;
          return {
            id: m.id,
            senderId: m.senderId,
            text: m.text,
            time: m.time ?? "",
            isMe,
            seen,
          };
        });
        setMessages(mapped);

        
        if (seenIdsRef.current.chatId !== activeId) {
          seenIdsRef.current = { chatId: activeId, ids: new Set() };
        }
        const knownIds = seenIdsRef.current.ids;
        const newlyConfirmed = mapped.filter((m) => !knownIds.has(m.id));
        for (const m of newlyConfirmed) knownIds.add(m.id);
        const confirmedTexts = newlyConfirmed.filter((m) => m.isMe).map((m) => m.text);
        if (confirmedTexts.length > 0) {
          setPendingMessages((prev) => {
            const remaining = [...prev];
            for (const text of confirmedTexts) {
              const idx = remaining.findIndex((p) => p.chatId === activeId && p.message.text === text);
              if (idx !== -1) remaining.splice(idx, 1);
            }
            return remaining.length === prev.length ? prev : remaining;
          });
        }

        const hasIncoming = fbMessages.some((m) => m.senderId !== firebaseUid);
        if (hasIncoming) {
          void markChatAsRead(activeId);
        }
      },
      (err) => console.error("Messages subscription error:", err),
    );

    void markChatAsRead(activeId);

    return () => unsub();
  }, [activeId, firebaseUid, rawChats]);

  // ── 6. Delete chat handler ─────────────────────────────────────────────────
  const handleDeleteChat = useCallback(
    async (chatId: string) => {
      if (!chatId) return;
      setRawChats((prev) => prev.filter((c) => c.id !== chatId));
      if (activeId === chatId) {
        setActiveId("");
        setMobileView("list");
      }
      await deleteChat(chatId).catch((err) => console.warn("deleteChat error:", err));
    },
    [activeId],
  );

  // ── 7. Active conversation ─────────────────────────────────────────────────
  const activeConversation: Conversation | undefined = useMemo(() => {
    if (!activeId) return undefined;
    return conversations.find((c) => c.id === activeId);
  }, [conversations, activeId]);

 
  const visibleMessages = useMemo(
    () => [
      ...messages,
      ...pendingMessages.filter((p) => p.chatId === activeId).map((p) => p.message),
    ],
    [messages, pendingMessages, activeId],
  );

  // ── Filter ─────────────────────────────────────────────────────────────────
  const visible = useMemo(
    () => (filter === "unread" ? conversations.filter((c) => c.unread > 0) : conversations),
    [filter, conversations],
  );

  const suggestedPeople = useMemo(() => {
    const existingOtherSocialIds = new Set(
      rawChats
        .map((c) => {
          const otherUid = c.members?.find((m) => m !== firebaseUid);
          return otherUid ? c.memberDetails?.[otherUid]?.id : null;
        })
        .filter(Boolean),
    );

    return poolUsers
      .filter((u) => u._id !== userLogin?._id && !existingOtherSocialIds.has(u._id))
      .slice(0, 8);
  }, [poolUsers, userLogin, rawChats, firebaseUid]);

  // ── Send ───────────────────────────────────────────────────────────────────
  async function handleSend(text: string) {
    if (!activeId || isSending) return;
    const trimmed = text.trim();
    if (!trimmed) return;

    setIsSending(true);

    
    const optimisticId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const optimistic: PendingMessage = {
      chatId: activeId,
      message: {
        id: optimisticId,
        senderId: firebaseUid ?? "me",
        text: trimmed,
        time: formatChatTimestamp(new Date()),
        isMe: true,
        seen: false,
      },
    };
    setPendingMessages((prev) => [...prev, optimistic]);

    try {
      await sendChatMessage(activeId, trimmed);
    } catch (err) {
      console.error("Send failed:", err);
      setPendingMessages((prev) => prev.filter((p) => p.message.id !== optimisticId));
    } finally {
      setIsSending(false);
    }
  }

  function select(id: string) {
    setActiveId(id);
    setMobileView("chat");
    setTargetNotRegistered(false);
  }

  async function handleSelectNewChatUser(selected: {
    _id: string;
    name: string;
    username?: string;
    photo?: string;
    email?: string;
  }) {
    if (!userLogin || !firebaseUid) return;
    setIsNewChatOpen(false);
    await startChatWithTarget(selected);
  }

  const tabs = [
    { key: "all" as const, label: "All" },
    { key: "unread" as const, label: "Unread" },
  ];

  return (
    <div className="w-full text-[#083695] dark:text-white flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-155px)] min-h-145 my-0 lg:my-1 pr-1 sm:pr-[calc(3vw-8px)] md:pr-[calc(5vw-12px)]">
      <Helmet>
        <title>Chats | SocialApp</title>
        <meta name="description" content="Real-time Firebase chat with friends." />
      </Helmet>

      {/* Auth error banner */}
      {authError && (
        <div className="mb-3 p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 flex items-start gap-3 text-amber-800 dark:text-amber-200 text-xs sm:text-sm shrink-0">
          <AlertCircle size={18} className="shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-bold mb-0.5">Firebase Configuration Notice</p>
            <p className="text-amber-700 dark:text-amber-300 leading-relaxed">{authError}</p>
          </div>
        </div>
      )}

      {/* Target not registered notice */}
      {targetNotRegistered && (
        <div className="mb-3 p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/50 flex items-start gap-3 text-blue-800 dark:text-blue-200 text-xs sm:text-sm shrink-0">
          <MessageCircle size={18} className="shrink-0 text-blue-500 mt-0.5" />
          <div>
            <p className="font-bold mb-0.5">Couldn't Start This Chat</p>
            <p className="text-blue-600 dark:text-blue-300">
              We tried to set this conversation up automatically but couldn't reach Firebase right now. Check your internet connection and try again — if it keeps happening, the other person may need to open the app once so their chat profile can be created.
            </p>
          </div>
        </div>
      )}

      {/* Main Chat Layout matching Sidebar and Navbar height */}
      <div className="flex-1 min-h-0 flex gap-3 sm:gap-4 items-stretch w-full">
        {/* ── LEFT: chat list ─────────────────────────────────────────────── */}
        <aside
          className={cn(
            "w-full lg:w-85 xl:w-90 shrink-0 bg-white dark:bg-[#0f172a] rounded-3xl shadow-sm border border-gray-100 dark:border-white/8 overflow-hidden flex-col h-full",
            mobileView === "list" ? "flex" : "hidden lg:flex",
          )}
        >
          <div className="p-4 pb-3 border-b border-gray-100 dark:border-white/8 shrink-0">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                <MessageCircle size={20} className="text-[#083695] dark:text-blue-400" />
                Chats
              </h2>
              <button
                onClick={() => setIsNewChatOpen(true)}
                className="p-2 rounded-xl bg-[#083695] dark:bg-blue-600 text-white hover:scale-105 active:scale-95 transition-transform cursor-pointer shadow-sm"
                aria-label="New chat"
                title="Start a new chat"
              >
                <PenSquare size={16} />
              </button>
            </div>
            <div className="relative mb-3">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search chats..."
                className="w-full bg-[#eef2fb] dark:bg-white/5 rounded-xl py-2 pl-9 pr-3 text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#083695]/40"
              />
            </div>
            <div className="flex gap-2">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setFilter(t.key)}
                  className={cn(
                    "text-xs font-semibold px-3 py-1.5 rounded-full transition-colors cursor-pointer",
                    filter === t.key
                      ? "bg-[#083695] dark:bg-blue-600 text-white"
                      : "bg-[#083695]/8 dark:bg-white/8 text-gray-600 dark:text-gray-300 hover:bg-[#083695]/15",
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0">
            {isInitializing ? (
              <div className="py-16 flex flex-col items-center justify-center gap-2 text-gray-400">
                <Loader2 className="animate-spin h-6 w-6 text-[#083695] dark:text-blue-400" />
                <span className="text-xs">Connecting to Firebase...</span>
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-4 flex flex-col">
                <div className="flex flex-col items-center justify-center py-6 px-4 text-center">
                  <div className="h-12 w-12 rounded-full bg-[#083695]/8 dark:bg-white/8 flex items-center justify-center text-xl mb-2">
                    💬
                  </div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    No active chats yet
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5 mb-3">
                    Select anyone below to start talking:
                  </p>
                </div>

                {suggestedPeople.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 px-2 py-1 text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                      <Sparkles size={13} className="text-amber-500" />
                      Suggested Friends
                    </div>
                    <div className="space-y-1">
                      {suggestedPeople.map((user) => (
                        <div
                          key={user._id}
                          className="flex items-center justify-between p-2 rounded-2xl hover:bg-[#083695]/6 dark:hover:bg-white/6 transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <UserAvatar photo={user.photo} name={user.name} className="h-10 w-10 shrink-0" />
                            <div className="min-w-0">
                              <h4 className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                                {user.name}
                              </h4>
                              <p className="text-[11px] text-gray-400 truncate">
                                @{user.username || user.name.toLowerCase().replace(/\s+/g, "")}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => startChatWithTarget(user)}
                            className="px-3 py-1.5 rounded-xl bg-[#083695] dark:bg-blue-600 text-white text-xs font-bold hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-xs shrink-0 flex items-center gap-1"
                          >
                            <MessageCircle size={13} />
                            Chat
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <ChatList
                conversations={visible}
                activeId={activeId}
                onSelect={select}
                onDelete={handleDeleteChat}
                search={search}
              />
            )}
          </div>

          <div className="p-3 border-t border-gray-100 dark:border-white/8 text-center flex items-center justify-center gap-1.5 shrink-0">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-[11px] font-medium text-gray-400">Real-time Firebase Chat ⚡</p>
          </div>
        </aside>

        {/* ── RIGHT: chat box ──────────────────────────────────────────────── */}
        <section
          className={cn(
            "flex-1 min-w-0 bg-white dark:bg-[#0f172a] rounded-3xl shadow-sm border border-gray-100 dark:border-white/8 overflow-hidden flex-col h-full",
            mobileView === "chat" ? "flex" : "hidden lg:flex",
          )}
        >
          {activeConversation ? (
            <>
              <ChatHeader
                conversation={activeConversation}
                onBack={() => setMobileView("list")}
                onDeleteChat={() => handleDeleteChat(activeConversation.id)}
              />
              <ChatMessages conversation={activeConversation} messages={visibleMessages} />
              <ChatInput
                conversation={activeConversation}
                onSend={handleSend}
                isSending={isSending}
              />
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-gray-400">
              <MessageCircle size={48} className="text-gray-300 dark:text-gray-600 mb-3" />
              <h3 className="font-bold text-base text-gray-800 dark:text-gray-200">Your Messages</h3>
              <p className="text-xs max-w-sm mt-1 mb-4 text-gray-400">
                Select a conversation on the left or click "New Message" to chat in real-time.
              </p>
              <button
                onClick={() => setIsNewChatOpen(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#083695] text-white hover:bg-[#092f70] transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <UserPlus size={15} />
                New Conversation
              </button>
            </div>
          )}
        </section>
      </div>

      <NewChatModal
        isOpen={isNewChatOpen}
        onClose={() => setIsNewChatOpen(false)}
        onSelectUser={handleSelectNewChatUser}
        users={poolUsers}
      />
    </div>
  );
}
