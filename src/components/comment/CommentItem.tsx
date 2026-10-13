import { useState } from "react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import {
  Heart,
  Pencil,
  Trash2,
  X,
  Loader2,
  MessageCircle,
  ChevronDown,
} from "lucide-react";
import { UserAvatar } from "#components/PostCard/PostCard";
import { Button } from "#components/ui/button";
import { Input } from "#components/ui/input";
import type { CommentType } from "../../types/Comment.type";
import { useAuth } from "../../context/AuthContext";
import {
  useCommentActions,
  repliesQueryKey,
} from "#hooks/useCommentActions";
import { API, authHeader } from "#hooks/usePostActions";
import { AddReply } from "#components/comment/AddReply";
import { ReplyItem } from "#components/comment/ReplyItem";
import { useReplyThreads } from "#hooks/useReplyThreads";

export function CommentItem({
  comment,
  postId,
}: {
  comment: CommentType;
  postId: string;
}) {
  const { userLogin } = useAuth();
  const [showImageModal, setShowImageModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(comment.content);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [repliesCount, setRepliesCount] = useState(comment.repliesCount ?? 0);

  const { data: replies = [], isLoading: isLoadingReplies } = useQuery({
    queryKey: repliesQueryKey(postId, comment._id),
    enabled: showReplies,
    queryFn: async (): Promise<CommentType[]> => {
      const res = await axios.get(
        `${API}/${postId}/comments/${comment._id}/replies`,
        { params: { page: 1, limit: 10 }, headers: authHeader() },
      );
      return res.data?.data?.replies ?? [];
    },
  });


  const { childrenMap, addChild, removeId } = useReplyThreads(postId);

 
  const threadedIds = new Set(Object.values(childrenMap).flat().map((c) => c._id));
  const topLevelReplies = replies.filter((r) => !threadedIds.has(r._id));

  const {
    isMe,
    isLiked,
    likeMutation,
    editMutation,
    deleteMutation,
    handleDelete,
  } = useCommentActions(comment, postId);

  const likesCount = comment.likes?.length ?? 0;

  const creator = comment.commentCreator ?? comment.user;
  const creatorName = isMe && userLogin?.name ? userLogin.name : (creator?.name || "User");
  const creatorPhoto = isMe && userLogin?.photo ? userLogin.photo : creator?.photo;
  const creatorUsername = isMe && userLogin?.username
    ? userLogin.username
    : (creator?.username || creatorName.toLowerCase().replace(/\s+/g, ""));

  function startEditing() {
    setEditedContent(comment.content);
    setIsEditing(true);
  }

  function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    const text = editedContent.trim();
    if (!text || text === comment.content) {
      setIsEditing(false);
      return;
    }
    editMutation.mutate(text, { onSuccess: () => setIsEditing(false) });
  }

  return (
    <div className="mt-2.5 sm:mt-3 group rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/8 px-2.5 sm:px-3 py-2 sm:py-2.5 transition-colors hover:border-[#083695]/20 dark:hover:border-blue-400/20">
      <div className="flex items-start gap-2 sm:gap-2.5 min-w-0">
        <Link
          to={creator?._id ? `/profile/${creator._id}` : "/profile"}
          className="shrink-0 transition-opacity hover:opacity-85"
        >
          <UserAvatar
            photo={creatorPhoto}
            name={creatorName}
            className="h-8 w-8 shrink-0"
          />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Link
              to={creator?._id ? `/profile/${creator._id}` : "/profile"}
              className="text-xs font-semibold text-[#083695] dark:text-blue-300 hover:underline"
            >
              {creatorName}
            </Link>
            {creatorUsername && (
              <span className="text-[11px] text-gray-400 dark:text-gray-500">
                @{creatorUsername}
              </span>
            )}
            <span className="text-[11px] text-gray-400 dark:text-gray-500">•</span>
            {comment.createdAt && (
              <span className="text-[11px] text-gray-500 dark:text-gray-400">
                {formatDistanceToNow(new Date(comment.createdAt), {
                  addSuffix: true,
                })}
              </span>
            )}
          </div>

          {isEditing ? (
            <form onSubmit={handleSaveEdit} className="mt-1 flex items-center gap-1.5">
              <Input
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                autoFocus
                aria-label="Edit comment"
                className="h-8 flex-1 bg-transparent px-2 text-xs shadow-none border border-[#083695]/30 focus-visible:ring-0 focus-visible:border-transparent dark:bg-transparent"
              />
              <Button
                type="submit"
                size="xs"
                disabled={editMutation.isPending || !editedContent.trim()}
                className="gap-1 rounded-full px-2 text-[11px] font-medium bg-[#083695] text-white hover:bg-[#083695]/90 dark:bg-blue-500 dark:hover:bg-blue-500/90"
              >
                {editMutation.isPending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  "Save"
                )}
              </Button>
              <Button
                type="button"
                size="xs"
                variant="ghost"
                onClick={() => setIsEditing(false)}
                className="gap-1 rounded-full px-2 text-[11px] font-medium text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
              >
                Cancel
              </Button>
            </form>
          ) : comment.content && (
            <p className="mt-0.5 text-xs text-gray-700 dark:text-gray-200 leading-relaxed whitespace-pre-wrap wrap-break-word">
              {comment.content}
            </p>
          )}

          {comment.image && (
            <div
              className="mt-2 overflow-hidden rounded-lg border border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-black/20 cursor-zoom-in"
              onClick={() => setShowImageModal(true)}
            >
              <img
                src={comment.image}
                alt="Comment image"
                loading="lazy"
                className="w-full h-auto max-h-72 object-cover hover:scale-[1.01] transition-transform duration-300"
              />
            </div>
          )}

          {/* comment actions */}
          {!isEditing && (
            <div className="mt-1.5 flex items-center gap-0 flex-wrap">
            <Button
              variant="ghost"
              size="xs"
              onClick={() => likeMutation.mutate()}
              disabled={likeMutation.isPending}
              aria-label={isLiked ? "Unlike comment" : "Like comment"}
              className={`gap-1 rounded-full px-2 text-[11px] font-medium transition-colors ${
                isLiked
                  ? "text-[#083695] dark:text-blue-400"
                  : "text-gray-500 hover:text-[#083695] dark:text-gray-400 dark:hover:text-blue-300"
              }`}
            >
              <Heart
                className={`size-3.5 ${isLiked ? "fill-[#083695] dark:fill-blue-400" : ""}`}
              />
              {likesCount > 0 && <span>{likesCount}</span>}
              Like
            </Button>

            <Button
              variant="ghost"
              size="xs"
              onClick={() => setShowReplyForm((p) => !p)}
              aria-label="Reply to comment"
              className={`gap-1 rounded-full px-2 text-[11px] font-medium transition-colors ${
                showReplyForm
                  ? "text-[#083695] dark:text-blue-400"
                  : "text-gray-500 hover:text-[#083695] dark:text-gray-400 dark:hover:text-blue-300"
              }`}
            >
              <MessageCircle className="size-3.5" />
              Reply
            </Button>

            {/* edit / delete only for my own comments */}
            {isMe && (
              <>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={startEditing}
                  disabled={editMutation.isPending}
                  className="gap-1 rounded-full px-2 text-[11px] font-medium text-gray-500 hover:text-[#083695] dark:text-gray-400 dark:hover:text-blue-300 transition-colors"
                >
                  <Pencil className="size-3.5" />
                  Edit
                </Button>

                <Button
                  variant="ghost"
                  size="xs"
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                  className="gap-1 rounded-full px-2 text-[11px] font-medium text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                >
                  {deleteMutation.isPending ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="size-3.5" />
                  )}
                  Delete
                </Button>
              </>
            )}
            </div>
          )}
        </div>
      </div>

      {/* reply composer */}
      {showReplyForm && (
        <AddReply
          postId={postId}
          commentId={comment._id}
          className="mt-2 ml-3 sm:ml-8 rounded-xl border border-[#083695]/30 bg-white p-1.5 transition-colors focus-within:border-[#083695]/40 focus-within:ring-2 focus-within:ring-[#083695]/10 dark:border-white/8 dark:bg-white/5 dark:focus-within:border-blue-400/40 dark:focus-within:ring-blue-400/10"
          onCancel={() => setShowReplyForm(false)}
          onReplyAdded={() => {
            setRepliesCount((c) => c + 1);
            setShowReplies(true);
          }}
        />
      )}

      {/* replies toggle + list */}
      {(repliesCount > 0 || showReplies) && (
        <div className="mt-1.5 ml-3 sm:ml-8">
          <button
            type="button"
            onClick={() => setShowReplies((p) => !p)}
            aria-label={showReplies ? "Hide replies" : "Show replies"}
            className="flex items-center gap-1 text-[11px] font-semibold text-[#083695] dark:text-blue-400 hover:underline cursor-pointer transition-colors"
          >
            <ChevronDown
              className={`size-3 transition-transform ${showReplies ? "rotate-180" : ""}`}
            />
            {showReplies
              ? "Hide replies"
              : `View ${repliesCount} ${repliesCount === 1 ? "reply" : "replies"}`}
          </button>

          {showReplies && (
            <div className="mt-1.5 flex flex-col gap-1.5">
              {isLoadingReplies ? (
                <div className="flex justify-center py-2">
                  <Loader2 className="size-4 animate-spin text-gray-400 dark:text-gray-500" />
                </div>
              ) : topLevelReplies.length === 0 ? (
                <p className="text-[11px] text-gray-400 dark:text-gray-500 py-1">
                  No replies yet. Be the first to reply!
                </p>
              ) : (
                topLevelReplies.map((r) => (
                  <ReplyItem
                    key={r._id}
                    reply={r}
                    postId={postId}
                    commentId={comment._id}
                    rootCommentId={comment._id}
                    depth={1}
                    childrenMap={childrenMap}
                    onNestedAdded={addChild}
                    onDeleted={removeId}
                  />
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* full-screen image preview */}
      {showImageModal && comment.image && (
        <div
          className="fixed inset-0 z-100 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setShowImageModal(false)}
        >
          <button
            onClick={() => setShowImageModal(false)}
            aria-label="Close preview"
            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X size={24} />
          </button>
          <img
            src={comment.image}
            alt="Full preview"
            className="max-w-[92vw] max-h-[90vh] object-contain rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
