import { useRef, useState } from "react";
import { Send, ImagePlus, Loader2 } from "lucide-react";
import { UserAvatar } from "#components/PostCard/PostCard";
import { Input } from "#components/ui/input";
import { Button } from "#components/ui/button";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "#components/ui/toast";
import { API, authHeader } from "#hooks/usePostActions";
import { commentsQueryKey, repliesQueryKey } from "#hooks/useCommentActions";
import type { CommentType } from "../../types/Comment.type";

export function AddReply({
  postId,
  commentId,
  autoFocus = true,
  className,
  placeholder,
  replyTo,
  onReplyAdded,
  onCancel,
}: {
  postId: string;
  commentId: string;
  autoFocus?: boolean;
  className?: string;
  placeholder?: string;
  /**
   * When replying to a reply (nested), backend only accepts the ROOT
   * top-level comment id — `commentId` must be that root id.
   * `replyTo` is the display name we @mention + return for threading.
   */
  replyTo?: { id: string; name: string };
  onReplyAdded?: (created?: CommentType) => void;
  onCancel?: () => void;
}) {
  const { userLogin } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<File | null>(null);
  const [content, setContent] = useState("");
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: (formData: FormData) =>
      axios.post(
        `${API}/${postId}/comments/${commentId}/replies`,
        formData,
        { headers: authHeader() },
      ),
    onSuccess: (res) => {
      setContent("");
      setImage(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      // The created reply (backend shape: data.reply / data.data / data)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload: any = res?.data;
      const created: CommentType | undefined =
        payload?.data?.reply ?? payload?.reply ?? payload?.data?.data ?? undefined;
      queryClient.invalidateQueries({
        queryKey: repliesQueryKey(postId, commentId),
      });
      // Refresh every nested thread + counts for this post
      queryClient.invalidateQueries({ queryKey: ["replies", postId] });
      queryClient.invalidateQueries({ queryKey: commentsQueryKey(postId) });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["user-posts"] });
      toast.add({ title: "Reply posted", type: "success" });
      onReplyAdded?.(created);
    },
    onError: (error) => {
      const data = axios.isAxiosError(error) ? error.response?.data : undefined;
      const message =
        data && typeof data === "object" && "message" in data
          ? data.message
          : undefined;
      toast.add({
        title: "Error",
        description:
          typeof message === "string"
            ? message
            : "Could not post your reply, please try again.",
        type: "error",
      });
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    let text = content.trim();
    if (!text && !image) return;

    // @mention the person being replied to (nested reply affordance,
    // since backend stores everything flat under the root comment).
    if (replyTo && text && !text.startsWith(`@${replyTo.name}`)) {
      text = `@${replyTo.name} ${text}`;
      setContent(text);
    }

    const formData = new FormData();
    if (text) formData.append("content", text);
    if (image) formData.append("image", image);

    mutate(formData);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={
        className ??
        "mt-2 ml-3 sm:ml-8 rounded-xl border border-[#083695]/30 bg-white p-1.5 transition-colors focus-within:border-[#083695]/40 focus-within:ring-2 focus-within:ring-[#083695]/10 dark:border-white/8 dark:bg-white/5 dark:focus-within:border-blue-400/40 dark:focus-within:ring-blue-400/10"
      }
    >
      <div className="flex items-center gap-1 sm:gap-2 min-w-0">
        <UserAvatar
          photo={userLogin?.photo}
          name={userLogin?.name}
          className="h-6 w-6 shrink-0"
        />
        <Input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder ?? (replyTo ? `Reply to ${replyTo.name}...` : "Write a reply...")}
          aria-label="Write a reply"
          autoFocus={autoFocus}
          className="h-7 flex-1 bg-transparent px-1 text-xs shadow-none border border-[#083695]/20 focus-visible:ring-0 focus-visible:border-transparent dark:bg-transparent"
        />

        {/* image upload button */}
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          aria-label="Attach image"
          onClick={() => fileInputRef.current?.click()}
          className="shrink-0 rounded-full text-gray-500 hover:bg-[#083695]/10 hover:text-[#083695] dark:text-gray-400 dark:hover:bg-blue-400/10 dark:hover:text-blue-300"
        >
          <ImagePlus className="size-3.5" />
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files?.[0] ?? null)}
          className="hidden"
          aria-hidden="true"
          tabIndex={-1}
        />
        {image && (
          <span className="max-w-20 truncate text-[11px] text-gray-500 dark:text-gray-400">
            {image.name}
          </span>
        )}

        {onCancel && (
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            aria-label="Cancel reply"
            onClick={onCancel}
            className="shrink-0 rounded-full text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400"
          >
            <span className="text-xs font-medium">Cancel</span>
          </Button>
        )}

        <Button
          type="submit"
          size="icon-sm"
          disabled={isPending || (!content.trim() && !image)}
          aria-label="Send reply"
          className="shrink-0 rounded-full bg-[#083695] text-white hover:bg-[#083695]/90 dark:bg-blue-500 dark:hover:bg-blue-500/90 disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Send className="size-3.5" />
          )}
        </Button>
      </div>
    </form>
  );
}
