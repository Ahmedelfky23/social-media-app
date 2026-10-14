import { useState, useMemo } from "react";
import { Search, X, MessageSquarePlus, Loader2 } from "lucide-react";
import { UserAvatar } from "#components/PostCard/PostCard";
import type { ExtendedSearchUser } from "#components/Navbar/UserSearch";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectUser: (user: { _id: string; name: string; username?: string; photo?: string; email?: string }) => void;
  users: ExtendedSearchUser[];
  isLoading?: boolean;
}

export function NewChatModal({ isOpen, onClose, onSelectUser, users, isLoading }: Props) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users.slice(0, 20);
    return users
      .filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          (u.username && u.username.toLowerCase().includes(q)),
      )
      .slice(0, 30);
  }, [users, search]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0f172a] w-full max-w-md rounded-3xl shadow-2xl border border-gray-100 dark:border-white/10 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 dark:border-white/8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-2xl bg-[#083695]/10 dark:bg-blue-500/15 text-[#083695] dark:text-blue-400 flex items-center justify-center">
              <MessageSquarePlus size={18} />
            </div>
            <div>
              <h3 className="font-bold text-base text-gray-900 dark:text-white leading-tight">
                New Message
              </h3>
              <p className="text-xs text-gray-400">Select a person to chat with</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 pb-2">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search people by name or username..."
              autoFocus
              className="w-full bg-[#eef2fb] dark:bg-white/5 rounded-2xl py-2.5 pl-9 pr-3 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#083695]/40"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-2 divide-y divide-gray-50 dark:divide-white/4">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-gray-400">
              <Loader2 className="animate-spin h-6 w-6 text-[#083695] dark:text-blue-400" />
              <span className="text-xs">Loading people...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center px-4">
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                No users found
              </p>
              <p className="text-xs text-gray-400 mt-1">Try another search term</p>
            </div>
          ) : (
            filtered.map((user) => (
              <button
                key={user._id}
                onClick={() => {
                  onSelectUser(user);
                  onClose();
                }}
                className="w-full p-2.5 rounded-2xl flex items-center gap-3 text-left hover:bg-[#083695]/6 dark:hover:bg-white/6 transition-colors group cursor-pointer"
              >
                <UserAvatar
                  photo={user.photo}
                  name={user.name}
                  className="h-11 w-11 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold text-sm text-gray-900 dark:text-white truncate group-hover:text-[#083695] dark:group-hover:text-blue-400 transition-colors">
                    {user.name}
                  </h4>
                  <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                    @{user.username || user.name.toLowerCase().replace(/\s+/g, "")}
                  </p>
                </div>
                <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-[#083695]/10 dark:bg-blue-500/15 text-[#083695] dark:text-blue-400 group-hover:bg-[#083695] group-hover:text-white dark:group-hover:bg-blue-600 transition-colors">
                  Chat
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
