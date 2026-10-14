import { useEffect, useState } from "react";
import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, UserPlus, UserX } from "lucide-react";
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
  onChange?: (isFollowing: boolean, followersCount?: number) => void;
  followBackText?: string;
}) {
  const queryClient = useQueryClient();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isHovered, setIsHovered] = useState(false);

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
      const next = !isFollowing;
      setIsFollowing(next);
      onChange?.(next, undefined);
      return { previous: isFollowing, next };
    },
    onSuccess: (res, _variables, context) => {
      let resolvedFollowing = context?.next ?? true;
      const data = res.data;
      if (typeof data?.data?.following === "boolean") {
        resolvedFollowing = data.data.following;
      } else if (typeof data?.following === "boolean") {
        resolvedFollowing = data.following;
      } else if (typeof data?.message === "string") {
        const msg = data.message.toLowerCase();
        if (msg.includes("unfollow")) resolvedFollowing = false;
        else if (msg.includes("follow")) resolvedFollowing = true;
      }

      setIsFollowing(resolvedFollowing);
      const rawCount = data?.data?.followersCount ?? data?.followersCount;
      const count = typeof rawCount === "number" ? rawCount : undefined;
      onChange?.(resolvedFollowing, count);

      toast.add({
        title: resolvedFollowing ? "Now following" : "Unfollowed",
        type: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["user-profile", userId] });
      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: (_err, _variables, context) => {
      const rollback = context?.previous ?? !isFollowing;
      setIsFollowing(rollback);
      onChange?.(rollback, undefined);
      toast.add({ title: "Could not update follow", type: "error" });
    },
  });

  return (
    <button
      onClick={() => mutate()}
      disabled={isPending}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label={isFollowing ? "Unfollow user" : followBackText || "Follow user"}
      className={`flex items-center gap-2 rounded-full text-sm font-semibold px-5 py-2.5 shadow-sm transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer ${
        isFollowing
          ? isHovered
            ? "border border-red-300 dark:border-red-500/40 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 shadow-xs"
            : "border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-200 bg-gray-50/80 dark:bg-white/5"
          : "bg-[#083695] hover:bg-[#092f70] dark:bg-blue-600 dark:hover:bg-blue-500 text-white"
      }`}
    >
      {isPending ? (
        <Loader2 size={15} className="animate-spin" />
      ) : isFollowing ? (
        isHovered ? (
          <>
            <UserX size={15} className="text-red-600 dark:text-red-400" />
            <span>Unfollow</span>
          </>
        ) : (
          <>
            <Check size={15} className="text-emerald-600 dark:text-emerald-400" />
            <span>Following</span>
          </>
        )
      ) : (
        <>
          <UserPlus size={15} />
          <span>{followBackText || "Follow"}</span>
        </>
      )}
    </button>
  );
}
