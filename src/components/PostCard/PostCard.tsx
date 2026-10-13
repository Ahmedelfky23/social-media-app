import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  X,
} from "lucide-react";
import { Button } from "#components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "#components/ui/dropdown-menu";
import type { PostType } from "../../types/Post.type";
import type { CommentType } from "../../types/Comment.type";
import { CommentItem } from "#components/comment/CommentItem";
import { AddComment } from "#components/comment/AddComment";
import { usePostActions, API, authHeader } from "#hooks/usePostActions";
import { commentsQueryKey } from "#hooks/useCommentActions";
import EditPostModal from "#components/EditPostModal/EditPostModal";

/* -------------------------------- UserAvatar ------------------------------- */

export function UserAvatar({
  photo,
  name,
  className = "h-10 w-10",
}: {
  photo?: string;
  name?: string;
  className?: string;
}) {
  const [imgError, setImgError] = useState(false);

  return (
    <div
      className={`${className} rounded-full overflow-hidden shrink-0 flex items-center justify-center bg-linear-to-br from-[#083695] to-[#4a7fd4] text-white font-bold border-2 border-white/30`}
    >
      {photo && !imgError ? (
        <img
          src={photo}
          alt={name || "user"}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <span className="text-sm">{name?.charAt(0).toUpperCase() || "U"}</span>
      )}
    </div>
  );
}

/* --------------------------------- PostCard -------------------------------- */

interface PostCardProps {
  post: PostType;
  currentUserId?: string;
  showComments?: boolean;
  onBookmarkChange?: (postId: string, bookmarked: boolean) => void;
}

export default function PostCard({
  post,
  currentUserId,
  showComments = false,
  onBookmarkChange,
}: PostCardProps) {
  const [showImageModal, setShowImageModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const {
    isMe,
    isLiked,
    isBookmarked,
    likeMutation,
    bookmarkMutation,
    shareMutation,
    handleDelete,
  } = usePostActions(post, currentUserId, onBookmarkChange);

  const shared = post.sharedPost;
  const isShared = Boolean(post.isShare || shared);

  const authorName = post.user?.name || "User";
  const authorUsername =
    post.user?.username || authorName.toLowerCase().replace(/\s+/g, "");

  /* -------------------------------- comments ------------------------------- */
  const { data: comments = [] } = useQuery({
    queryKey: commentsQueryKey(post._id),
    enabled: showComments,
    queryFn: async (): Promise<CommentType[]> => {
      const res = await axios.get(`${API}/${post._id}/comments`, {
        params: { page: 1, limit: 20, sort: "-createdAt" },
        headers: authHeader(),
      });
      return res.data?.data?.comments ?? [];
    },
  });

  const iconButton =
    "flex items-center justify-center gap-1.5 rounded-full min-h-10 min-w-10 px-2 sm:px-3 text-gray-500 hover:text-[#083695] dark:text-gray-400 dark:hover:text-white transition-colors";

  /* --------------------------------- render -------------------------------- */
  return (
    <div className="w-full sm:w-[92%] lg:w-[85%] mx-auto rounded-2xl shadow-sm border border-gray-100 dark:border-white/8 bg-white dark:bg-[#0f172a] text-[#083695] dark:text-white overflow-hidden">
      {/* header */}
      <div className="flex items-center gap-2.5 sm:gap-3 p-3 sm:p-4 pb-2">
        <Link
          to={post.user?._id ? `/profile/${post.user._id}` : "/profile"}
          className="shrink-0 transition-opacity hover:opacity-85"
        >
          <UserAvatar photo={post.user?.photo} name={authorName} />
        </Link>

        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Link
              to={post.user?._id ? `/profile/${post.user._id}` : "/profile"}
              className="font-semibold text-sm hover:underline"
            >
              {authorName}
            </Link>
            {isShared && (
              <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <Share2 className="h-3 w-3" />
                shared{" "}
                {shared?.user?.name ? `${shared.user.name}'s post` : "a post"}
              </span>
            )}
            <span className="text-xs opacity-70">@{authorUsername}</span>
          </div>
          <span className="text-xs opacity-70 mt-0.5">
            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
          </span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
            >
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-xl">
            <DropdownMenuItem onClick={() => bookmarkMutation.mutate()}>
              {isBookmarked ? "Remove Bookmark" : "Save Post"}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => shareMutation.mutate()}
              disabled={shareMutation.isPending}
            >
              Share Post
            </DropdownMenuItem>
            {isMe && (
              <>
                <DropdownMenuItem
                  className="text-blue-600"
                  onClick={() => setShowEditModal(true)}
                >
                  Edit Post
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-red-600"
                  onClick={handleDelete}
                >
                  Delete Post
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* body */}
      <div className="p-3 sm:p-4 pt-2 pb-3">
        {post.body && (
          <p className="text-[13px] sm:text-sm whitespace-pre-wrap wrap-break-word leading-relaxed opacity-90 mb-2">
            {post.body}
          </p>
        )}

        {post.image && !isShared && (
          <img
            src={post.image}
            alt="Post"
            loading="lazy"
            className="mt-2.5 sm:mt-3 w-full max-h-80 sm:max-h-125 md:max-h-175 object-cover rounded-xl sm:rounded-2xl cursor-pointer"
            onClick={() => setShowImageModal(true)}
          />
        )}

        {shared && (
          <div className="block mt-2 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50/70 dark:bg-white/4 overflow-hidden">
            <div className="flex items-center gap-2.5 p-3.5 pb-2">
              <Link
                to={shared.user?._id ? `/profile/${shared.user._id}` : "/profile"}
                className="shrink-0 transition-opacity hover:opacity-85"
              >
                <UserAvatar
                  photo={shared.user?.photo}
                  name={shared.user?.name}
                  className="h-9 w-9"
                />
              </Link>
              <div className="flex flex-col flex-1 min-w-0">
                <Link
                  to={shared.user?._id ? `/profile/${shared.user._id}` : "/profile"}
                  className="font-semibold text-xs hover:underline"
                >
                  {shared.user?.name}
                </Link>
                {shared.createdAt && (
                  <span className="text-[10px] opacity-60">
                    {formatDistanceToNow(new Date(shared.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                )}
              </div>
              <Link
                to={`/post/${shared._id}`}
                state={{ post: shared }}
                className="text-[10px] font-medium opacity-70 hover:underline hover:text-[#083695] dark:hover:text-blue-400"
              >
                View original
              </Link>
            </div>

            {shared.body && (
              <p className="px-3.5 pb-2.5 text-xs whitespace-pre-wrap leading-relaxed">
                {shared.body}
              </p>
            )}
            {shared.image && (
              <Link to={`/post/${shared._id}`} state={{ post: shared }} className="block">
                <img
                  src={shared.image}
                  alt="Shared post"
                  className="w-full max-h-115 object-cover cursor-pointer"
                />
              </Link>
            )}
          </div>
        )}

        {/* comments */}
        <div className="border-t border-gray-100 p-4 mt-3 dark:border-white/8">
          <AddComment postId={post._id} />

          {showComments ? (
            <div className="mt-3 flex flex-col gap-2.5">
              {comments.length === 0 && (
                <p className="text-xs text-center text-gray-400 py-4">
                  No comments yet. Be the first to comment!
                </p>
              )}
              {comments.map((c) => (
                <CommentItem key={c._id} comment={c} postId={post._id} />
              ))}
            </div>
          ) : (
            post.topComment && (
              <div className="mt-3">
                <CommentItem comment={post.topComment} postId={post._id} />
              </div>
            )
          )}
        </div>
      </div>

      {/* footer */}
      <div className="flex items-center justify-between gap-1 p-2 px-2 sm:px-4 border-t border-gray-100 dark:border-white/8 pb-safe">
        <Button
          variant="ghost"
          size="lg"
          onClick={() => likeMutation.mutate()}
          disabled={likeMutation.isPending}
          aria-label={isLiked ? "Unlike post" : "Like post"}
          className={`${iconButton} ${isLiked ? "text-[#083695] dark:text-blue-400" : ""}`}
        >
          <Heart
            className={`h-5 w-5 ${isLiked ? "fill-[#083695] dark:fill-blue-400" : ""}`}
          />
          <span className="text-xs font-medium">{post.likesCount}</span>
        </Button>

        <Link to={`/post/${post._id}`} className={iconButton}>
          <MessageCircle className="h-5 w-5" />
          <span className="text-xs font-medium">{post.commentsCount}</span>
        </Link>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => shareMutation.mutate()}
          disabled={shareMutation.isPending}
          aria-label="Share post"
          className={`${iconButton} ${shareMutation.isPending ? "opacity-60 cursor-not-allowed" : ""}`}
        >
          <Share2
            className={`h-5 w-5 transition-transform duration-200 active:scale-125 ${
              shareMutation.isPending ? "animate-pulse text-[#083695] dark:text-blue-400" : ""
            }`}
          />
          <span className="text-xs font-medium">{post.sharesCount}</span>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => bookmarkMutation.mutate()}
          disabled={bookmarkMutation.isPending}
          aria-label={isBookmarked ? "Remove bookmark" : "Bookmark post"}
          className={iconButton}
        >
          <Bookmark
            className={`h-5 w-5 ${isBookmarked ? "fill-[#083695] dark:fill-white" : ""}`}
          />
        </Button>
      </div>

      {/* image preview */}
      {showImageModal && post.image && (
        <div
          className="fixed inset-0 z-100 bg-black/85 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setShowImageModal(false)}
        >
          <button
            aria-label="Close preview"
            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
          >
            <X size={24} />
          </button>
          <img
            src={post.image}
            alt="Full preview"
            className="max-w-[92vw] max-h-[90vh] object-contain rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* edit post modal */}
      <EditPostModal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        post={post}
      />
    </div>
  );
}
