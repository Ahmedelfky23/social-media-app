import { useEffect, useState } from "react";
import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, UserPlus } from "lucide-react";
import { toast } from "#components/ui/toast";
import { authHeader } from "#hooks/usePostActions";


export function FollowButton({
  userId,
  initialIsFollowing,
  onChange,
  followBackText,
}: {
  userId: string;
  initialIsFollowing: boolean;
  onChange?: (isFollowing: boolean, followersCount: number) => void;
  followBackText?: string;
}) {
  const queryClient = useQueryClient();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsFollowing(initialIsFollowing);
  }, [initialIsFollowing]);

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      axios.put(
        `https://route-posts.routemisr.com/users/${userId}/follow`,
        {},
        { headers: authHeader() },
      ),
    onMutate: () => {
      setIsFollowing((prev) => !prev);
    },
    onSuccess: (res) => {
      const following = res.data?.data?.following ?? !isFollowing;
      const followersCount = res.data?.data?.followersCount;
      setIsFollowing(following);
      if (typeof followersCount === "number") {
        onChange?.(following, followersCount);
      }
      toast.add({
        title: following ? "Now following" : "Unfollowed",
        type: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["user-profile", userId] });
      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
    },
    onError: () => {
      setIsFollowing((prev) => !prev);
      toast.add({ title: "Could not update follow", type: "error" });
    },
  });

  return (
    <button
      onClick={() => mutate()}
      disabled={isPending}
      aria-label={isFollowing ? "Unfollow user" : followBackText || "Follow user"}
      className={`flex items-center gap-2 rounded-full text-sm font-semibold px-5 py-2.5 shadow-sm transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer ${
        isFollowing
          ? "border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-200 hover:text-red-600 hover:border-red-300 hover:bg-red-50 dark:hover:text-red-400 dark:hover:border-red-400/40 dark:hover:bg-red-400/10"
          : "bg-[#083695] hover:bg-[#083695]/90 dark:bg-blue-600 dark:hover:bg-blue-500 text-white"
      }`}
    >
      {isPending ? (
        <Loader2 size={15} className="animate-spin" />
      ) : isFollowing ? (
        <Check size={15} />
      ) : (
        <UserPlus size={15} />
      )}
      {isFollowing ? "Following" : (followBackText || "Follow")}
    </button>
  );
}
