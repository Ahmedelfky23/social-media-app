import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { UserAvatar } from "#components/PostCard/PostCard";
import type { MentionUser } from "./mentionUtils";
import { AtSign } from "lucide-react";

interface Props {
  isOpen: boolean;
  suggestions: MentionUser[];
  activeIndex: number;
  onSelect: (user: MentionUser) => void;
  onHoverIndex: (idx: number) => void;
  className?: string;
  position?: "top" | "bottom";
}

export const MentionSuggestionsList: React.FC<Props> = ({
  isOpen,
  suggestions,
  activeIndex,
  onSelect,
  onHoverIndex,
  className = "",
  position = "bottom",
}) => {
  if (!isOpen || suggestions.length === 0) return null;

  const yInit = position === "top" ? 6 : -6;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: yInit, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: yInit / 2, scale: 0.98 }}
        transition={{ duration: 0.15 }}
        className={`bg-white dark:bg-[#0f172a] rounded-2xl border border-gray-200/90 dark:border-white/10 shadow-2xl overflow-hidden p-1.5 z-50 backdrop-blur-md max-h-60 overflow-y-auto ${className}`}
      >
        <div className="flex items-center justify-between px-2.5 py-1 text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider border-b border-gray-100 dark:border-white/5 mb-1">
          <div className="flex items-center gap-1.5">
            <AtSign size={12} className="text-[#083695] dark:text-blue-400" />
            <span>Mention people</span>
          </div>
          <span className="text-[10px] text-gray-400 font-normal">Followers & Contacts</span>
        </div>
        <div className="space-y-0.5">
          {suggestions.map((user, idx) => {
            const isActive = idx === activeIndex;
            const handle =
              user.username ||
              (user.name ? user.name.toLowerCase().replace(/\s+/g, "") : "user");

            return (
              <button
                key={user._id || idx}
                type="button"
                onMouseEnter={() => onHoverIndex(idx)}
                onClick={() => onSelect(user)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-left transition-all cursor-pointer select-none ${
                  isActive
                    ? "bg-[#083695]/10 text-[#083695] dark:bg-blue-400/20 dark:text-blue-300"
                    : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5"
                }`}
              >
                <UserAvatar
                  photo={user.photo}
                  name={user.name}
                  className="h-7 w-7 text-[10px] shrink-0"
                />
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold truncate leading-tight">
                      {user.name}
                    </span>
                    {user.isFollower && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium shrink-0">
                        Follows you
                      </span>
                    )}
                    {!user.isFollower && user.isFollowing && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium shrink-0">
                        Following
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-gray-400 dark:text-gray-500 truncate">
                    @{handle}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MentionSuggestionsList;

