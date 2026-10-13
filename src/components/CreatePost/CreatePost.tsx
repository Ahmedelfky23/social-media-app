import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import { UserAvatar } from "#components/PostCard/PostCard";
import { Button } from "#components/ui/button";
import { toast } from "#components/ui/toast";

export default function CreatePost() {
  const { userLogin } = useAuth();
  const queryClient = useQueryClient();

  const fileInput = useRef<HTMLInputElement>(null);

  const [body, setBody] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [isUploaded, setIsUploaded] = useState("");

  const firstName = userLogin?.name?.split(" ")[0] || "there";

  function handleImagePreView(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.[0]) {
      setImage(e.target.files[0]);

      const path = URL.createObjectURL(e.target.files[0]);
      setIsUploaded(path);
    }
  }

  const { mutate, isPending } = useMutation({
    mutationFn: (formData: FormData) =>
      axios.post("https://route-posts.routemisr.com/posts", formData, {
        headers: {
          token: localStorage.getItem("token") || "",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }),
    onSuccess: () => {
      setBody("");
      setImage(null);
      setIsUploaded("");
      if (fileInput.current) fileInput.current.value = "";
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["user-posts"] });
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
      toast.add({
        title: "Post published",
        description: "Your post has been shared successfully.",
        type: "success",
      });
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
            : "Could not publish your post, please try again.",
        type: "error",
      });
    },
  });

  function handleCreatePost(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() && !image) return;

    const formData = new FormData();
    if (body.trim()) formData.append("body", body.trim());
    if (isUploaded && image) formData.append("image", image);

    mutate(formData);
  }

  const canPost = (body.trim().length > 0 || isUploaded !== "") && !isPending;

  return (
    <form
      onSubmit={handleCreatePost}
      className="w-full sm:w-[92%] lg:w-[85%] mx-auto bg-white dark:bg-[#0f172a] rounded-2xl shadow-sm border border-gray-100 dark:border-white/8 p-3 sm:p-4 transition-colors"
    >
      <div className="flex items-start gap-2 sm:gap-3 min-w-0">
        <UserAvatar
          photo={userLogin?.photo}
          name={userLogin?.name}
          className="h-10 w-10 shrink-0"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={2}
          placeholder={`What's on your mind, ${firstName}?`}
          aria-label="Write a post"
          className="min-h-11 flex-1 resize-none overflow-hidden bg-transparent py-2.5 text-sm text-[#083695] dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none border border-[#083695]/10 dark:border-white/10 rounded-xl px-2"
        />
      </div>

      {isUploaded && (
        <div className="relative mt-3 overflow-hidden rounded-2xl border border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-black/20">
          <img
            src={isUploaded}
            alt="Selected preview"
            className="w-full h-auto max-h-80 object-cover"
          />
          <button
            type="button"
            onClick={() => {
              setIsUploaded("");
              setImage(null);
              if (fileInput.current) fileInput.current.value = "";
            }}
            aria-label="Remove image"
            className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-colors hover:bg-black/80 cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-gray-100 pt-3 dark:border-white/8">
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
          onChange={handleImagePreView}
          className="hidden"
          aria-hidden="true"
          tabIndex={-1}
        />

        <Button
          type="submit"
          disabled={!canPost}
          className="rounded-full bg-[#083695] px-4 sm:px-6 py-2 min-h-10 text-white hover:bg-[#083695]/90 dark:bg-blue-500 dark:hover:bg-blue-500/90"
        >
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Posting...
            </>
          ) : (
            "Post"
          )}
        </Button>
      </div>
    </form>
  );
}
