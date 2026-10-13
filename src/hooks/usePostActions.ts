import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { InfiniteData } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "#components/ui/toast";
import { useAuth } from "../context/AuthContext";
import type { PostType } from "../types/Post.type";
import type { FeedPage } from "./useFeedPosts";

const API = "https://route-posts.routemisr.com/posts";

const authHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
  token: localStorage.getItem("token") || "",
});

/* ------------------------------- Query keys ------------------------------- */

export const POSTS_QUERY_KEY = ["posts"] as const;
export const singlePostQueryKey = (postId: string) => ["single-post", postId];

/* ------------------------------- API helpers ------------------------------ */

export { API, authHeader };

/* ------------------------------ usePostActions ---------------------------- */
export function usePostActions(
  post: PostType,
  currentUserId?: string,
  onBookmarkChange?: (postId: string, bookmarked: boolean) => void,
) {
  const queryClient = useQueryClient();
  const { userLogin } = useAuth();

  const myId = userLogin?._id || currentUserId;
  const isMe = Boolean(myId && post.user?._id === myId);
  const isLiked = Boolean(myId && post.likes?.includes(myId));
  const isBookmarked = Boolean(post.bookmarked);

  const updatePost = (changes: Partial<PostType>) => {
    queryClient.setQueryData<InfiniteData<FeedPage>>(POSTS_QUERY_KEY, (old) =>
      old
        ? {
            ...old,
            pages: old.pages.map((pg) => ({
              ...pg,
              posts: pg.posts.map((p) =>
                p._id === post._id ? { ...p, ...changes } : p,
              ),
            })),
          }
        : old,
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const patchFlat = (old: any) =>
      Array.isArray(old)
        ? old.map((p: PostType) =>
            p._id === post._id ? { ...p, ...changes } : p,
          )
        : old;
    queryClient.setQueryData<PostType[]>(POSTS_QUERY_KEY, patchFlat);
    queryClient.setQueriesData<PostType[]>({ queryKey: ["user-posts"] }, (old) =>
      Array.isArray(old) ? patchFlat(old) : old,
    );
    queryClient.setQueryData<PostType>(singlePostQueryKey(post._id), (old) =>
      old ? { ...old, ...changes } : old,
    );
  };

  const removePost = () => {
    queryClient.setQueryData<InfiniteData<FeedPage>>(POSTS_QUERY_KEY, (old) =>
      old
        ? {
            ...old,
            pages: old.pages.map((pg) => ({
              ...pg,
              posts: pg.posts.filter((p) => p._id !== post._id),
            })),
          }
        : old,
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filterFlat = (old: any) =>
      Array.isArray(old)
        ? old.filter((p: PostType) => p._id !== post._id)
        : old;
    queryClient.setQueryData<PostType[]>(POSTS_QUERY_KEY, filterFlat);
    queryClient.setQueriesData<PostType[]>({ queryKey: ["user-posts"] }, (old) =>
      Array.isArray(old) ? filterFlat(old) : old,
    );
  };

  const refreshPost = () => {
    queryClient.invalidateQueries({ queryKey: POSTS_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: ["user-posts"] });
    queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
    queryClient.invalidateQueries({ queryKey: singlePostQueryKey(post._id) });
  };

  /* ---------------------------------- like --------------------------------- */
  const likeMutation = useMutation({
    mutationFn: () =>
      axios.put(`${API}/${post._id}/like`, {}, { headers: authHeader() }),
    onMutate: () => {
      if (!myId) return;
      updatePost({
        likesCount: post.likesCount + (isLiked ? -1 : 1),
        likes: isLiked
          ? post.likes.filter((id) => id !== myId)
          : [...(post.likes ?? []), myId],
      });
    },
    onSuccess: () =>
      toast.add({
        title: isLiked ? "Post liked" : "Post unliked",
        type: "success",
      }),
    onError: () => toast.add({ title: "Could not update the like", type: "error" }),
    onSettled: refreshPost,
  });

  /* -------------------------------- bookmark ------------------------------- */
  const bookmarkMutation = useMutation({
    mutationFn: () =>
      axios.put(`${API}/${post._id}/bookmark`, {}, { headers: authHeader() }),
    onMutate: () => {
      const nextBookmarked = !isBookmarked;
      updatePost({ bookmarked: nextBookmarked });
      onBookmarkChange?.(post._id, nextBookmarked);
    },
    onSuccess: () => toast.add({ title: "Bookmark updated", type: "success" }),
    onError: () =>
      toast.add({ title: "Could not update the bookmark", type: "error" }),
    onSettled: refreshPost,
  });

  /* ---------------------------------- share --------------------------------- */
  const shareMutation = useMutation({
    mutationFn: (bodyText?: string) =>
      axios.post(
        `${API}/${post._id}/share`,
        bodyText ? { body: bodyText } : {},
        {
          headers: {
            ...authHeader(),
            "Content-Type": "application/json",
          },
        },
      ),
    onMutate: () => {
      updatePost({
        sharesCount: (post.sharesCount ?? 0) + 1,
      });
    },
    onSuccess: () => {
      toast.add({
        title: "Post shared",
        description: "Post shared to your feed successfully.",
        type: "success",
      });
    },
    onError: (error) => {
      const data = axios.isAxiosError(error) ? error.response?.data : undefined;
      const message =
        data && typeof data === "object" && "message" in data
          ? data.message
          : "Could not share this post";
      toast.add({
        title: "Share failed",
        description: message,
        type: "error",
      });
    },
    onSettled: refreshPost,
  });

  function handleShare(bodyText?: string) {
    shareMutation.mutate(bodyText);
  }

  /* --------------------------------- delete -------------------------------- */
  const deleteMutation = useMutation({
    mutationFn: () =>
      axios.delete(`${API}/${post._id}`, { headers: authHeader() }),
    onMutate: removePost,
    onSuccess: () => toast.add({ title: "Post deleted", type: "success" }),
    onError: () => toast.add({ title: "Failed to delete post", type: "error" }),
    onSettled: refreshPost,
  });

  function handleDelete() {
    if (window.confirm("Are you sure you want to delete this post?")) {
      deleteMutation.mutate();
    }
  }

  return {
    myId,
    isMe,
    isLiked,
    isBookmarked,
    likeMutation,
    bookmarkMutation,
    shareMutation,
    handleShare,
    deleteMutation,
    handleDelete,
  };
}
