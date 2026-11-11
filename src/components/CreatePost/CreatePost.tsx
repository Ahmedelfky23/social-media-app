import { useRef, useState } from "react";
import { ImagePlus, Loader2, X, AtSign } from "lucide-react";
import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import { UserAvatar } from "#components/PostCard/PostCard";
import { Button } from "#components/ui/button";
import { toast } from "#components/ui/toast";
import { useMentionInput } from "../Mention/useMentionInput";
import { MentionSuggestionsList } from "../Mention/MentionSuggestionsList";

export default function CreatePost() {
  const { userLogin } = useAuth();
  const queryClient = useQueryClient();

  const fileInput = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [body, setBody] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [isUploaded, setIsUploaded] = useState("");

  const {
    isSuggesting,
    suggestions,
    activeIndex,
    setActiveIndex,
    selectSuggestion,
    handleKeyDown,
    triggerMention,
    updateCursor,
  } = useMentionInput({
    value: body,
    onChange: setBody,
    inputRef: textareaRef,
  });

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
      className="w-full sm:w-[92%] lg:w-[85%] mx-auto bg-white dark:bg-[#0f172a] rounded-2xl shadow-xs hover:shadow-sm border border-gray-100 dark:border-white/8 hover:border-gray-200/80 dark:hover:border-white/12 p-3 sm:p-4 transition-all duration-200"
    >
      <div className="flex items-start gap-2.5 sm:gap-3 min-w-0">
        <UserAvatar
          photo={userLogin?.photo}
          name={userLogin?.name}
          className="h-10 w-10 shrink-0 ring-2 ring-gray-100 dark:ring-white/10"
        />
        <div className="flex-1 min-w-0 relative">
          <textarea
            ref={textareaRef}
            value={body}
            onChange={(e) => {
              setBody(e.target.value);
              updateCursor();
            }}
            onKeyDown={handleKeyDown}
            onKeyUp={updateCursor}
            onClick={updateCursor}
            onSelect={updateCursor}
            rows={2}
            placeholder={`What's on your mind, ${firstName}?`}
            aria-label="Write a post"
            className="w-full min-h-11 resize-none overflow-hidden bg-transparent py-2.5 text-xs sm:text-sm text-[#083695] dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none border border-[#083695]/10 dark:border-white/10 rounded-xl px-3 focus:border-[#083695]/40 dark:focus:border-blue-400/50 focus:ring-2 focus:ring-[#083695]/10 dark:focus:ring-blue-400/15 transition-all"
          />

          {/* Autocomplete mention suggestions dropdown */}
          {isSuggesting && (
            <div className="absolute left-0 right-0 top-full mt-1.5 z-50">
              <MentionSuggestionsList
                isOpen={isSuggesting}
                suggestions={suggestions}
                activeIndex={activeIndex}
                onSelect={selectSuggestion}
                onHoverIndex={setActiveIndex}
              />
            </div>
          )}
        </div>
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

      <div className="mt-3 flex items-center justify-between gap-1.5 sm:gap-2 border-t border-gray-100 pt-3 dark:border-white/8">
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="group flex items-center gap-1.5 sm:gap-2 rounded-xl px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-semibold text-gray-600 transition-all hover:bg-gray-100/70 hover:text-[#083695] dark:text-gray-300 dark:hover:bg-white/8 dark:hover:text-white cursor-pointer active:scale-95"
          >
            <ImagePlus size={17} className="text-emerald-500 group-hover:scale-110 transition-transform duration-200" /> Photo
          </button>

          <button
            type="button"
            onClick={triggerMention}
            className="group flex items-center gap-1 sm:gap-1.5 rounded-xl px-2 sm:px-3 py-1.5 sm:py-2 text-xs font-semibold text-gray-600 transition-all hover:bg-gray-100/70 hover:text-[#083695] dark:text-gray-300 dark:hover:bg-white/8 dark:hover:text-white cursor-pointer active:scale-95"
          >
            <AtSign size={16} className="text-[#083695] dark:text-blue-400 group-hover:scale-110 transition-transform duration-200" /> Mention
          </button>
        </div>

        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          onChange={handleImagePreView}
          className="hidden"
          aria-hidden="true"
          tabIndex={-1}
        />

        <div className="flex items-center gap-2 sm:gap-3">
          {body.trim().length > 0 && (
            <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500 hidden sm:inline">
              {body.trim().length} chars
            </span>
          )}

          <Button
            type="submit"
            disabled={!canPost}
            className="rounded-full bg-[#083695] px-4 sm:px-6 py-1.5 sm:py-2 min-h-9 sm:min-h-10 text-xs sm:text-sm text-white hover:bg-[#092f70] dark:bg-blue-600 dark:hover:bg-blue-500 active:scale-95 transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin mr-1.5" /> Posting...
              </>
            ) : (
              "Post"
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
