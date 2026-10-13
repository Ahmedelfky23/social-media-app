import { useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, X, Send } from "lucide-react";
import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import { UserAvatar } from "#components/PostCard/PostCard";
import { Button } from "#components/ui/button";
import { toast } from "#components/ui/toast";
import {
  API,
  authHeader,
  POSTS_QUERY_KEY,
  singlePostQueryKey,
} from "#hooks/usePostActions";
import type { PostType } from "../../types/Post.type";

interface EditPostModalProps {
  open: boolean;
  onClose: () => void;
  post: PostType;
}

export default function EditPostModal({ open, onClose, post }: EditPostModalProps) {
  const { userLogin } = useAuth();
  const queryClient = useQueryClient();

  const fileInput = useRef<HTMLInputElement>(null);

  const [body, setBody] = useState(post.body);
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState(post.image || "");
  const [imageRemoved, setImageRemoved] = useState(false);

  
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setBody(post.body);
      setImage(null);
      setPreview(post.image || "");
      setImageRemoved(false);
    }
  }

  useEffect(() => {
    return () => {
      if (preview.startsWith("blob:")) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
    setImageRemoved(false);
  }

  function handleRemoveImage() {
    setImage(null);
    setPreview("");
    setImageRemoved(true);
    if (fileInput.current) fileInput.current.value = "";
  }

  const { mutate, isPending } = useMutation({
    mutationFn: (formData: FormData) =>
      axios.put(`${API}/${post._id}`, formData, { headers: authHeader() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: POSTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: singlePostQueryKey(post._id) });
      queryClient.invalidateQueries({ queryKey: ["user-posts"] });
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
      toast.add({
        title: "Post updated",
        description: "Your changes have been saved.",
        type: "success",
      });
      onClose();
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
            : "Could not update your post, please try again.",
        type: "error",
      });
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text && !preview) return;

    const formData = new FormData();
    formData.append("body", text);
    if (image) {
      formData.append("image", image);
    } else if (imageRemoved) {
      formData.append("image", "");
    }

    mutate(formData);
  }

  if (!open) return null;

  const canSave =
    (body.trim() !== post.body || Boolean(image) || imageRemoved) && !isPending;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 pb-safe"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Edit post"
    >
      <div
        className="w-full sm:max-w-lg max-h-[92dvh] overflow-y-auto bg-white dark:bg-[#0f172a] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-gray-100 dark:border-white/10 p-4 sm:p-6 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Edit post
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-white dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="flex items-start gap-3">
            <UserAvatar
              photo={userLogin?.photo || post.user?.photo}
              name={userLogin?.name || post.user?.name}
              className="h-10 w-10 shrink-0"
            />
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
              placeholder="What's on your mind?"
              aria-label="Edit post content"
              className="min-h-11 flex-1 resize-none overflow-hidden bg-transparent py-2.5 text-sm text-[#083695] dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none border border-[#083695]/10 dark:border-white/10 rounded-xl px-2"
            />
          </div>

          {preview && (
            <div className="relative mt-3 overflow-hidden rounded-2xl border border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-black/20">
              <img
                src={preview}
                alt="Post preview"
                className="w-full h-auto max-h-80 object-cover"
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                aria-label="Remove image"
                className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-colors hover:bg-black/80 cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>
          )}

          <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3 dark:border-white/8">
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-[#083695] dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white cursor-pointer"
            >
              <ImagePlus size={18} className="text-green-500" /> Photo
            </button>

            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
              aria-hidden="true"
              tabIndex={-1}
            />

            <Button
              type="submit"
              disabled={!canSave}
              className="rounded-full bg-[#083695] px-6 text-white hover:bg-[#083695]/90 dark:bg-blue-500 dark:hover:bg-blue-500/90"
            >
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Send className="size-4" /> Save
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

