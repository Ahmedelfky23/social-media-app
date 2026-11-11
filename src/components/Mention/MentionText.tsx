import React from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import { findUserByMention } from "./mentionUtils";

interface MentionTextProps {
  text?: string;
  className?: string;
}

export const MentionText: React.FC<MentionTextProps> = ({ text, className = "" }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { userLogin } = useAuth();

  if (!text) return null;

  // Split on mentions while retaining whitespace and tokens:
  // Regex matches words starting with '@' followed by word characters, dots, underscores or Arabic characters
  const mentionRegex = /((?:^|\s)@[a-zA-Z0-9_.\u0600-\u06FF]+)/g;
  const parts = text.split(mentionRegex);

  const handleMentionClick = (e: React.MouseEvent, rawMention: string) => {
    e.preventDefault();
    e.stopPropagation();

    const clean = rawMention.trim().replace(/^@/, "");
    const matched = findUserByMention(clean, queryClient);

    const myId = userLogin?._id;

    if (matched?._id) {
      if (myId && matched._id === myId) {
        navigate("/profile");
      } else {
        navigate(`/profile/${matched._id}`);
      }
      return;
    }

    // If it's a 24-character hexadecimal MongoDB ID:
    if (/^[a-fA-F0-9]{24}$/.test(clean)) {
      navigate(`/profile/${clean}`);
      return;
    }

    // Fallback: navigate with clean handle
    navigate(`/profile/${clean}`);
  };

  return (
    <span className={className}>
      {parts.map((part, index) => {
        const trimmed = part.trim();
        const isMention = trimmed.startsWith("@") && trimmed.length > 1;

        if (!isMention) {
          return <React.Fragment key={index}>{part}</React.Fragment>;
        }

        const leadingSpace = part.startsWith(" ") ? " " : "";
        const cleanHandle = trimmed.replace(/^@/, "");
        const matched = findUserByMention(cleanHandle, queryClient);

        return (
          <React.Fragment key={index}>
            {leadingSpace}
            <button
              type="button"
              onClick={(e) => handleMentionClick(e, trimmed)}
              title={matched ? `View ${matched.name} (@${matched.username || cleanHandle})` : `View @${cleanHandle}`}
              className="inline-flex items-center text-[#083695] dark:text-blue-400 font-semibold bg-[#083695]/10 hover:bg-[#083695]/20 dark:bg-blue-400/15 dark:hover:bg-blue-400/25 px-1.5 py-0.5 -my-0.5 rounded-md transition-all cursor-pointer align-baseline select-none break-all sm:break-normal active:scale-95 touch-manipulation"
            >
              @{cleanHandle}
            </button>
          </React.Fragment>
        );
      })}
    </span>
  );
};

export default MentionText;

