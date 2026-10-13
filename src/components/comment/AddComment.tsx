import { useRef, useState } from "react";
import { Send, ImagePlus, Loader2 } from "lucide-react";
import { UserAvatar } from "#components/PostCard/PostCard";
import { Input } from "#components/ui/input";
import { Button } from "#components/ui/button";
import { useAuth } from "../../context/AuthContext";
import { useForm } from "react-hook-form";
import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "#components/ui/toast";

export function AddComment({ postId }: { postId: string }) {
  const { userLogin } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<File | null>(null);
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      content: "",
    },
  });


  const { mutate, isPending } = useMutation({
    mutationFn: (formData: FormData) =>
      axios.post(
        `https://route-posts.routemisr.com/posts/${postId}/comments`,
        formData,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      ),
    onSuccess: () => {
      reset();
      setImage(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["user-posts"] });
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
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
            : "Could not add your comment, please try again.",
        type: "error",
      });
    },
  });

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    setImage(e.target.files?.[0] ?? null);
  }

  function handelAddComment(values: { content: string }) {
    const text = values.content?.trim();

    if (!text && !image) return;

    const formData = new FormData();
    if (text) formData.append("content", text);
    if (image) formData.append("image", image);

    mutate(formData);
  }


  return (
    <form
      onSubmit={handleSubmit(handelAddComment)}
      className="mt-3 rounded-xl border border-[#083695]/50 bg-white p-1.5 transition-colors focus-within:border-[#083695]/40 focus-within:ring-2 focus-within:ring-[#083695]/15 dark:border-white/8 dark:bg-white/5 dark:focus-within:border-blue-400/40 dark:focus-within:ring-blue-400/15"
    >
      <div className="flex items-center gap-2">
        <UserAvatar
          photo={userLogin?.photo}
          name={userLogin?.name}
          className="h-7 w-7 shrink-0"
        />
        <Input
          {...register("content")}
          placeholder="Write a comment..."
          aria-label="Write a comment"
          className="h-8 flex-1  bg-transparent px-1 shadow-none border border-[#083695]/30 focus-visible:ring-0 focus-visible:border-transparent dark:bg-transparent"
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
          <ImagePlus className="size-4" />
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="hidden"
          aria-hidden="true"
          tabIndex={-1}
        />
        {image && (
          <span className="max-w-24 truncate text-[11px] text-gray-500 dark:text-gray-400">
            {image.name}
          </span>
        )}

        <Button
          type="submit"
          size="icon-sm"
          disabled={isPending }
          aria-label="Send comment"
          className="shrink-0 rounded-full bg-[#083695] text-white hover:bg-[#083695]/90 dark:bg-blue-500 dark:hover:bg-blue-500/90"
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
        </Button>
      </div>
    </form>
  );
}
