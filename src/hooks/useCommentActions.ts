import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { InfiniteData } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "#components/ui/toast";
import { useAuth } from "../context/AuthContext";
import type { CommentType } from "../types/Comment.type";
import type { PostType } from "../types/Post.type";
import type { FeedPage } from "./useFeedPosts";
import {
  API,
  authHeader,
  POSTS_QUERY_KEY,
  singlePostQueryKey,
} from "./usePostActions";

/* ------------------------------- Query keys ------------------------------- */

export const commentsQueryKey = (postId: string) => ["comments", postId] as const;
export const repliesQueryKey = (postId: string, commentId: string) =>
  ["replies", postId, commentId] as const;

/* ------------------------------ useCommentActions ---------------------------- */
export function useCommentActions(
  comment: CommentType,
  postId: string,
  parentCommentId?: string,
) {
  const queryClient = useQueryClient();
  const { userLogin } = useAuth();

  const myId = userLogin?._id;
  const creator = comment.commentCreator ?? comment.user;
  const isMe = Boolean(myId && creator?._id === myId);
  const isLiked = Boolean(myId && comment.likes?.includes(myId));

  const updateComment = (changes: Partial<CommentType>) => {
    queryClient.setQueryData<CommentType[]>(commentsQueryKey(postId), (old) =>
      old?.map((c) => (c._id === comment._id ? { ...c, ...changes } : c)),
    );
    // Also patch the comment inside ANY cached nested reply list
    // (reply-on-reply threads), so likes/edits feel instant at every depth.
    queryClient.setQueriesData<CommentType[]>(
      { queryKey: ["replies", postId] },
      (old) =>
        Array.isArray(old)
          ? old.map((c) => (c._id === comment._id ? { ...c, ...changes } : c))
          : old,
    );
    const patchPost = (p: PostType) =>
      p.topComment && p.topComment._id === comment._id
        ? { ...p, topComment: { ...p.topComment, ...changes } }
        : p;
    queryClient.setQueryData<InfiniteData<FeedPage>>(POSTS_QUERY_KEY, (old) =>
      old
        ? {
            ...old,
            pages: old.pages.map((pg) => ({
              ...pg,
              posts: pg.posts.map(patchPost),
            })),
          }
        : old,
    );
    queryClient.setQueryData<PostType[]>(POSTS_QUERY_KEY, (old) =>
      Array.isArray(old) ? old?.map(patchPost) : old,
    );
    queryClient.setQueriesData<PostType[]>({ queryKey: ["user-posts"] }, (old) =>
      old?.map(patchPost),
    );
    queryClient.setQueryData<PostType>(singlePostQueryKey(postId), (old) =>
      old ? patchPost(old) : old,
    );
  };

  const refreshAfterMutation = () => {
    queryClient.invalidateQueries({ queryKey: commentsQueryKey(postId) });
    // Invalidate ALL nested reply lists for this post so deeply
    // nested threads (reply-on-reply-on-reply...) stay fresh.
    queryClient.invalidateQueries({ queryKey: ["replies", postId] });
    if (parentCommentId) {
      queryClient.invalidateQueries({
        queryKey: repliesQueryKey(postId, parentCommentId),
      });
    }
    queryClient.invalidateQueries({ queryKey: POSTS_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: ["user-posts"] });
    queryClient.invalidateQueries({ queryKey: singlePostQueryKey(postId) });
  };

  /* ---------------------------------- like --------------------------------- */
  const likeMutation = useMutation({
    mutationFn: () =>
      axios.put(
        `${API}/${postId}/comments/${comment._id}/like`,
        {},
        { headers: authHeader() },
      ),
    onMutate: () => {
      if (!myId) return;
      updateComment({
        likes: isLiked
          ? (comment.likes ?? []).filter((id) => id !== myId)
          : [...(comment.likes ?? []), myId],
      });
    },
    onSuccess: () =>
      toast.add({
        title: isLiked ? "Comment liked" : "Comment unliked",
        type: "success",
      }),
    onError: () =>
      toast.add({ title: "Could not update the like", type: "error" }),
    onSettled: refreshAfterMutation,
  });

  /* ---------------------------------- edit --------------------------------- */
  const editMutation = useMutation({
    mutationFn: (content: string) => {
      const formData = new FormData();
      formData.append("content", content);
      return axios.put(
        `${API}/${postId}/comments/${comment._id}`,
        formData,
        { headers: authHeader() },
      );
    },
    onMutate: (content) => updateComment({ content }),
    onSuccess: () =>
      toast.add({ title: "Comment updated", type: "success" }),
    onError: () =>
      toast.add({ title: "Failed to update comment", type: "error" }),
    onSettled: refreshAfterMutation,
  });

  /* --------------------------------- delete -------------------------------- */
  const deleteMutation = useMutation({
    mutationFn: () =>
      axios.delete(`${API}/${postId}/comments/${comment._id}`, {
        headers: authHeader(),
      }),
    onMutate: () => {
      // Optimistically remove from every cached reply list for this post
      // (covers reply-on-reply at any depth) + top-level comments.
      queryClient.setQueriesData<CommentType[]>(
        { queryKey: ["replies", postId] },
        (old) =>
          Array.isArray(old)
            ? old.filter((c) => c._id !== comment._id)
            : old,
      );
      queryClient.setQueryData<CommentType[]>(commentsQueryKey(postId), (old) =>
        old?.filter((c) => c._id !== comment._id),
      );
      const patchPost = (p: PostType) =>
        p.topComment && p.topComment._id === comment._id
          ? {
              ...p,
              topComment: null,
              commentsCount: Math.max(0, (p.commentsCount ?? 0) - 1),
            }
          : p;
      queryClient.setQueryData<InfiniteData<FeedPage>>(
        POSTS_QUERY_KEY,
        (old) =>
          old
            ? {
                ...old,
                pages: old.pages.map((pg) => ({
                  ...pg,
                  posts: pg.posts.map(patchPost),
                })),
              }
            : old,
      );
      queryClient.setQueryData<PostType[]>(POSTS_QUERY_KEY, (old) =>
        Array.isArray(old) ? old?.map(patchPost) : old,
      );
      queryClient.setQueriesData<PostType[]>({ queryKey: ["user-posts"] }, (old) =>
        old?.map(patchPost),
      );
      queryClient.setQueryData<PostType>(singlePostQueryKey(postId), (old) =>
        old ? patchPost(old) : old,
      );
    },
    onSuccess: () =>
      toast.add({ title: "Comment deleted", type: "success" }),
    onError: () =>
      toast.add({ title: "Failed to delete comment", type: "error" }),
    onSettled: refreshAfterMutation,
  });

  function handleDelete() {
    if (window.confirm("Are you sure you want to delete this comment?")) {
      deleteMutation.mutate();
    }
  }

  return {
    myId,
    isMe,
    isLiked,
    likeMutation,
    editMutation,
    deleteMutation,
    handleDelete,
  };
}