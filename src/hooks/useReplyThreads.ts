import { useCallback, useEffect, useState } from "react";
import type { CommentType } from "../types/Comment.type";
type ThreadMap = Record<string, CommentType[]>;

function readStored(postId: string): ThreadMap {
  try {
    const raw = localStorage.getItem(`threads-${postId}`);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

export function useReplyThreads(postId: string) {
  const [childrenMap, setChildrenMap] = useState<ThreadMap>({});

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setChildrenMap(readStored(postId));
  }, [postId]);

  const addChild = useCallback(
    (parentReplyId: string, child: CommentType) => {
      setChildrenMap((prev) => {
        const existing = prev[parentReplyId] ?? [];
        if (existing.some((c) => c._id === child._id)) return prev;
        const next = {
          ...prev,
          [parentReplyId]: [...existing, child],
        };
        try {
          localStorage.setItem(`threads-${postId}`, JSON.stringify(next));
        } catch {
          /* storage full / private mode — nesting just won't persist */
        }
        return next;
      });
    },
    [postId],
  );

  const removeId = useCallback(
    (id: string) => {
      setChildrenMap((prev) => {
        let changed = false;
        const next: ThreadMap = {};
        for (const [parent, kids] of Object.entries(prev)) {
          if (parent === id) {
            changed = true;
            continue;
          }
          const filtered = kids.filter((k) => k._id !== id);
          if (filtered.length !== kids.length) changed = true;
          if (filtered.length > 0) next[parent] = filtered;
          else if (kids.length === 0) next[parent] = kids;
        }
        if (!changed) return prev;
        try {
          localStorage.setItem(`threads-${postId}`, JSON.stringify(next));
        } catch {
          /* ignore */
        }
        return next;
      });
    },
    [postId],
  );

  return { childrenMap, addChild, removeId };
}
