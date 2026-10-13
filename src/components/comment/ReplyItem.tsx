import { useState } from "react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
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
import { useCommentActions } from "#hooks/useCommentActions";
import { AddReply } from "#components/comment/AddReply";

const MAX_NEST_DEPTH = 8;

export function ReplyItem({
  reply,
  postId,
  commentId,
  rootCommentId,
  depth = 1,
  childrenMap = {},
  onNestedAdded,
  onDeleted,
}: {
  reply: CommentType;
  postId: string;
  commentId: string;
  rootCommentId?: string;
  depth?: number;
  childrenMap?: Record<string, CommentType[]>;
  onNestedAdded?: (parentReplyId: string, child: CommentType) => void;
  onDeleted?: (id: string) => void;
}) {
  const { userLogin } = useAuth();
  const [showImageModal, setShowImageModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(reply.content);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showReplies, setShowReplies] = useState(false);

  const {
    isMe,
    isLiked,
    likeMutation,
    editMutation,
    deleteMutation,
  } = useCommentActions(reply, postId, rootCommentId ?? commentId);

  
  const childReplies = childrenMap[reply._id] ?? [];
  const rootId = rootCommentId ?? commentId;

  function handleDeleteNested() {
    if (!window.confirm("Are you sure you want to delete this reply?")) return;
    deleteMutation.mutate(undefined, {
      onSuccess: () => onDeleted?.(reply._id),
    });
  }

  const likesCount = reply.likes?.length ?? 0;

  const creator = reply.commentCreator ?? reply.user;
  const creatorName =
    isMe && userLogin?.name ? userLogin.name : creator?.name || "User";
  const creatorPhoto =
    isMe && userLogin?.photo ? userLogin.photo : creator?.photo;
  const creatorUsername =
    isMe && userLogin?.username
      ? userLogin.username
      : creator?.username || creatorName.toLowerCase().replace(/\s+/g, "");

  function startEditing() {
    setEditedContent(reply.content);
    setIsEditing(true);
  }

  function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    const text = editedContent.trim();
    if (!text || text === reply.content) {
      setIsEditing(false);
      return;
    }
    editMutation.mutate(text, { onSuccess: () => setIsEditing(false) });
  }

  return (
    <div className="group rounded-xl bg-gray-50/60 dark:bg-white/3 border border-gray-100 dark:border-white/6 px-2 sm:px-2.5 py-1.5 sm:py-2 transition-colors hover:border-[#083695]/15 dark:hover:border-blue-400/15 min-w-0">
      <div className="flex items-start gap-1.5 sm:gap-2 min-w-0">
        <Link
          to={creator?._id ? `/profile/${creator._id}` : "/profile"}
          className="shrink-0 transition-opacity hover:opacity-85"
        >
          <UserAvatar
            photo={creatorPhoto}
            name={creatorName}
            className="h-6 w-6 shrink-0"
          />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Link
              to={creator?._id ? `/profile/${creator._id}` : "/profile"}
              className="text-[11px] font-semibold text-[#083695] dark:text-blue-300 hover:underline"
            >
              {creatorName}
            </Link>
            {creatorUsername && (
              <span className="text-[10px] text-gray-400 dark:text-gray-500">
                @{creatorUsername}
              </span>
            )}
            <span className="text-[10px] text-gray-400 dark:text-gray-500">•</span>
            {reply.createdAt && (
              <span className="text-[10px] text-gray-500 dark:text-gray-400">
                {formatDistanceToNow(new Date(reply.createdAt), {
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
                aria-label="Edit reply"
                className="h-7 flex-1 bg-transparent px-2 text-xs shadow-none border border-[#083695]/30 focus-visible:ring-0 focus-visible:border-transparent dark:border-white/10 dark:bg-transparent"
              />
              <Button
                type="submit"
                size="xs"
                disabled={editMutation.isPending}
                className="rounded-full bg-[#083695] text-white hover:bg-[#083695]/90 dark:bg-blue-500 dark:hover:bg-blue-500/90"
              >
                {editMutation.isPending ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  "Save"
                )}
              </Button>
              <Button
                type="button"
                size="xs"
                variant="ghost"
                onClick={() => setIsEditing(false)}
                aria-label="Cancel editing"
                className="rounded-full text-gray-500 hover:text-red-500 dark:text-gray-400"
              >
                <X className="size-3.5" />
              </Button>
            </form>
          ) : (
            <>
              {reply.content && (
                <p className="text-xs text-gray-700 dark:text-gray-200 leading-snug mt-0.5 whitespace-pre-wrap wrap-break-word">
                  {reply.content}
                </p>
              )}

              {reply.image && (
                <div
                  className="mt-1.5 max-w-64 cursor-zoom-in overflow-hidden rounded-lg border border-gray-100 dark:border-white/10"
                  onClick={() => setShowImageModal(true)}
                >
                  <img
                    src={reply.image}
                    alt="Reply image"
                    loading="lazy"
                    className="w-full h-auto max-h-56 object-cover hover:scale-[1.01] transition-transform duration-300"
                  />
                </div>
              )}

              {/* reply actions */}
              <div className="mt-1 flex items-center gap-0 flex-wrap">
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => likeMutation.mutate()}
                  disabled={likeMutation.isPending}
                  aria-label={isLiked ? "Unlike reply" : "Like reply"}
                  className={`gap-1 rounded-full px-1.5 text-[10px] font-medium transition-colors ${
                    isLiked
                      ? "text-[#083695] dark:text-blue-400"
                      : "text-gray-500 hover:text-[#083695] dark:text-gray-400 dark:hover:text-blue-300"
                  }`}
                >
                  <Heart
                    className={`size-3 ${isLiked ? "fill-[#083695] dark:fill-blue-400" : ""}`}
                  />
                  {likesCount > 0 && <span>{likesCount}</span>}
                  Like
                </Button>

                {depth < MAX_NEST_DEPTH && (
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => setShowReplyForm((p) => !p)}
                    aria-label="Reply to reply"
                    className={`gap-1 rounded-full px-1.5 text-[10px] font-medium transition-colors ${
                      showReplyForm
                        ? "text-[#083695] dark:text-blue-400"
                        : "text-gray-500 hover:text-[#083695] dark:text-gray-400 dark:hover:text-blue-300"
                    }`}
                  >
                    <MessageCircle className="size-3" />
                    Reply
                  </Button>
                )}

                {/* edit / delete only for my own replies */}
                {isMe && (
                  <>
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={startEditing}
                      disabled={editMutation.isPending}
                      className="gap-1 rounded-full px-1.5 text-[10px] font-medium text-gray-500 hover:text-[#083695] dark:text-gray-400 dark:hover:text-blue-300 transition-colors"
                    >
                      <Pencil className="size-3" />
                      Edit
                    </Button>

                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={handleDeleteNested}
                      disabled={deleteMutation.isPending}
                      className="gap-1 rounded-full px-1.5 text-[10px] font-medium text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                    >
                      {deleteMutation.isPending ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : (
                        <Trash2 className="size-3" />
                      )}
                      Delete
                    </Button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      
      {showReplyForm && depth < MAX_NEST_DEPTH && (
        <AddReply
          postId={postId}
          commentId={rootId}
          replyTo={{ id: reply._id, name: creatorUsername }}
          autoFocus
          className="mt-2 ml-3 sm:ml-6 rounded-xl border border-[#083695]/30 bg-white p-1.5 transition-colors focus-within:border-[#083695]/40 focus-within:ring-2 focus-within:ring-[#083695]/10 dark:border-white/8 dark:bg-white/5 dark:focus-within:border-blue-400/40 dark:focus-within:ring-blue-400/10"
          onCancel={() => setShowReplyForm(false)}
          onReplyAdded={(created) => {
            setShowReplies(true);
            setShowReplyForm(false);
            if (created?._id) {
              onNestedAdded?.(reply._id, created);
            } else if (userLogin) {
              
              onNestedAdded?.(reply._id, {
                _id: `temp-${Date.now()}`,
                content: `@${creatorUsername} `,
                createdAt: new Date().toISOString(),
                likes: [],
                post: postId,
                parentComment: rootId,
                commentCreator: {
                  _id: userLogin._id,
                  name: userLogin.name,
                  username: userLogin.username,
                  phone: "",
                  photo: userLogin.photo,
                },
              });
            }
          }}
        />
      )}

      {/* nested replies toggle + recursive list (client-side threading) */}
      {(childReplies.length > 0 || showReplies || showReplyForm) && (
        <div className="mt-1.5 ml-3 sm:ml-6 border-l-2 border-[#083695]/10 dark:border-blue-400/10 pl-1.5 sm:pl-2">
          <button
            type="button"
            onClick={() => setShowReplies((p) => !p)}
            aria-label={showReplies ? "Hide replies" : "Show replies"}
            className="flex items-center gap-1 text-[10px] font-semibold text-[#083695] dark:text-blue-400 hover:underline cursor-pointer transition-colors"
          >
            <ChevronDown
              className={`size-3 transition-transform ${showReplies ? "rotate-180" : ""}`}
            />
            {showReplies
              ? "Hide replies"
              : `View ${childReplies.length} ${childReplies.length === 1 ? "reply" : "replies"}`}
          </button>

          {showReplies && (
            <div className="mt-1.5 flex flex-col gap-1.5">
              {childReplies.length === 0 ? (
                <p className="text-[10px] text-gray-400 dark:text-gray-500 py-1">
                  No replies yet. Be the first to reply!
                </p>
              ) : (
                childReplies.map((child) => (
                  <ReplyItem
                    key={child._id}
                    reply={child}
                    postId={postId}
                    commentId={rootId}
                    rootCommentId={rootId}
                    depth={depth + 1}
                    childrenMap={childrenMap}
                    onNestedAdded={onNestedAdded}
                    onDeleted={onDeleted}
                  />
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* full-screen image preview */}
      {showImageModal && reply.image && (
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
            src={reply.image}
            alt="Full preview"
            className="max-w-[92vw] max-h-[90vh] object-contain rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
