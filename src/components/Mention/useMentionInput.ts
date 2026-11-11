import { useState, useMemo, useEffect, useCallback, type RefObject } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getAllKnownUsers } from "./mentionUtils";
import type { ExtendedSearchUser } from "#components/Navbar/UserSearch";

export function useMentionInput({
  value,
  onChange,
  inputRef,
}: {
  value: string;
  onChange: (val: string) => void;
  inputRef: RefObject<HTMLTextAreaElement | HTMLInputElement | null>;
}) {
  const queryClient = useQueryClient();
  const [cursorPos, setCursorPos] = useState<number>(0);
  const [activeIndex, setActiveIndex] = useState(0);

  // Extract mention query before cursor (e.g. "@ah")
  const mentionMatch = useMemo(() => {
    const textBefore = value.slice(0, cursorPos);
    const match = textBefore.match(/(?:^|\s)@([a-zA-Z0-9_.\u0600-\u06FF]*)$/);
    if (!match) return null;
    const query = match[1] || "";
    // index in value where '@' begins
    const atIndex = match.index! + (match[0].startsWith(" ") ? 1 : 0);
    return { query, atIndex };
  }, [value, cursorPos]);

  // All known users pool
  const allUsers = useMemo(() => {
    return getAllKnownUsers(queryClient);
  }, [queryClient]);

  // Filtered suggestions
  const suggestions = useMemo(() => {
    if (!mentionMatch) return [];
    const q = mentionMatch.query.toLowerCase().trim();

    if (!q) {
      // Return top 5 recent / suggested users
      return allUsers.slice(0, 5);
    }

    return allUsers
      .filter((u) => {
        const name = (u.name || "").toLowerCase();
        const handle = (u.username || name.replace(/\s+/g, "")).toLowerCase();
        return handle.includes(q) || name.includes(q);
      })
      .slice(0, 5);
  }, [mentionMatch, allUsers]);

  const isSuggesting = Boolean(mentionMatch && suggestions.length > 0);

  // Update cursor position on events
  const updateCursor = useCallback(() => {
    if (inputRef.current) {
      setCursorPos(inputRef.current.selectionStart || 0);
    }
  }, [inputRef]);

  // Reset activeIndex when query changes
  useEffect(() => {
    setActiveIndex(0);
  }, [mentionMatch?.query]);

  // Select user and replace `@query` with `@username `
  const selectSuggestion = useCallback(
    (user: ExtendedSearchUser) => {
      if (!mentionMatch) return;
      const handle =
        user.username ||
        (user.name ? user.name.toLowerCase().replace(/\s+/g, "") : user._id);

      const beforeAt = value.slice(0, mentionMatch.atIndex);
      const afterCursor = value.slice(cursorPos);

      const inserted = `@${handle} `;
      const newValue = `${beforeAt}${inserted}${afterCursor}`;
      onChange(newValue);

      const newCursor = beforeAt.length + inserted.length;
      setCursorPos(newCursor);

      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.setSelectionRange(newCursor, newCursor);
        }
      }, 0);
    },
    [mentionMatch, value, cursorPos, onChange, inputRef],
  );

  // Key navigation for suggestions
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
      if (!isSuggesting || suggestions.length === 0) return false;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((prev) => (prev + 1) % suggestions.length);
        return true;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
        return true;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        const chosen = suggestions[activeIndex];
        if (chosen) selectSuggestion(chosen);
        return true;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setCursorPos(0);
        return true;
      }
      return false;
    },
    [isSuggesting, suggestions, activeIndex, selectSuggestion],
  );

  // Quick insert @ button
  const triggerMention = useCallback(() => {
    const input = inputRef.current;
    if (!input) return;

    const cur = input.selectionStart || value.length;
    const needsSpace = cur > 0 && value[cur - 1] !== " " && value[cur - 1] !== "\n";
    const prefix = needsSpace ? " @" : "@";
    const newValue = value.slice(0, cur) + prefix + value.slice(cur);
    onChange(newValue);

    const newCur = cur + prefix.length;
    setCursorPos(newCur);

    setTimeout(() => {
      input.focus();
      input.setSelectionRange(newCur, newCur);
    }, 0);
  }, [inputRef, value, onChange]);

  return {
    isSuggesting,
    suggestions,
    activeIndex,
    setActiveIndex,
    selectSuggestion,
    handleKeyDown,
    triggerMention,
    updateCursor,
  };
}

