import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserPlus, UserX, Check, RotateCw, Loader2, Sparkles, MessageCircle } from "lucide-react";
import { UserAvatar } from "#components/PostCard/PostCard";
import { toast } from "#components/ui/toast";
import { authHeader } from "#hooks/usePostActions";

export interface SuggestionUser {
  _id: string;
  name: string;
  username: string;
  photo?: string;
  followersCount?: number;
  mutualFollowersCount?: number;
}

const SUGGESTIONS_URL = "https://route-posts.routemisr.com/users/suggestions";
const FOLLOW_URL = "https://route-posts.routemisr.com/users";

async function fetchSuggestions(limit = 8): Promise<SuggestionUser[]> {
  const token = localStorage.getItem("token");
  const res = await axios.get(`${SUGGESTIONS_URL}?limit=${limit}`, {
    headers: {
      ...authHeader(),
      token: token || "",
    },
  });
  return res.data?.data?.suggestions ?? [];
}

export default function FollowSuggestions() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const [hoveredUnfollow, setHoveredUnfollow] = useState<string | null>(null);

  const {
    data: suggestions = [],
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["follow-suggestions"],
    queryFn: () => fetchSuggestions(8),
    staleTime: 1000 * 60 * 5, // 5 min
    retry: 2,
  });

  const followMutation = useMutation({
    mutationFn: async (userId: string) => {
      const token = localStorage.getItem("token");
      const res = await axios.put(
        `${FOLLOW_URL}/${userId}/follow`,
        {},
        {
          headers: {
            ...authHeader(),
            token: token || "",
          },
        },
      );
      return { userId, data: res.data?.data ?? res.data };
    },
    onMutate: (userId) => {
      const wasFollowing = Boolean(followingMap[userId]);
      setFollowingMap((prev) => ({
        ...prev,
        [userId]: !wasFollowing,
      }));
      return { wasFollowing };
    },
    onSuccess: ({ userId, data }, _vars, context) => {
      let isNowFollowing: boolean;
      if (typeof data?.following === "boolean") {
        isNowFollowing = data.following;
      } else if (typeof data?.isFollowing === "boolean") {
        isNowFollowing = data.isFollowing;
      } else if (typeof data?.message === "string") {
        const msg = data.message.toLowerCase();
        if (msg.includes("unfollow")) isNowFollowing = false;
        else if (msg.includes("follow")) isNowFollowing = true;
        else isNowFollowing = !context?.wasFollowing;
      } else {
        isNowFollowing = !context?.wasFollowing;
      }

      setFollowingMap((prev) => ({
        ...prev,
        [userId]: isNowFollowing,
      }));
      toast.add({
        title: isNowFollowing ? "Following user" : "Unfollowed user",
        description: isNowFollowing
          ? "You will now see their latest updates in your feed."
          : "You have unfollowed this user.",
        type: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["user-profile", userId] });
      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
    },
    onError: (_err, userId, context) => {
      setFollowingMap((prev) => ({
        ...prev,
        [userId]: Boolean(context?.wasFollowing),
      }));
      toast.add({
        title: "Action failed",
        description: "Could not update follow status. Please try again.",
        type: "error",
      });
    },
  });

  return (
    <div className="w-full  bg-white dark:bg-[#0f172a] rounded-3xl shadow-sm border border-gray-100 dark:border-white/8 overflow-hidden transition-all duration-300">
      {/* Header */}
      <div className="p-4 pb-3 flex items-center justify-between border-b border-gray-100 dark:border-white/8">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-[#083695]/10 dark:bg-blue-500/15 text-[#083695] dark:text-blue-400 flex items-center justify-center">
            <Sparkles size={16} />
          </div>
          <div>
            <h3 className="font-bold text-sm text-gray-900 dark:text-white leading-tight">
              Who to follow
            </h3>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">
              Suggested for you
            </p>
          </div>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isFetching}
          aria-label="Refresh suggestions"
          title="Refresh suggestions"
          className="h-8 w-8 rounded-full flex items-center justify-center text-gray-400 hover:text-[#083695] dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-all cursor-pointer disabled:opacity-50"
        >
          <RotateCw
            size={14}
            className={`transition-transform duration-500 ${isFetching ? "animate-spin text-[#083695] dark:text-blue-400" : ""}`}
          />
        </button>
      </div>

      {/* List */}
      <div className="p-2 divide-y divide-gray-50 dark:divide-white/4">
        {isLoading ? (
          <div className="py-10 flex flex-col items-center justify-center gap-2.5">
            <Loader2 className="animate-spin h-6 w-6 text-[#083695] dark:text-blue-400" />
            <span className="text-xs text-gray-400">Loading suggestions...</span>
          </div>
        ) : suggestions.length === 0 ? (
          <div className="py-8 text-center px-4">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              No new suggestions right now.
            </p>
          </div>
        ) : (
          suggestions.map((user) => {
            const isFollowing = Boolean(followingMap[user._id]);
            const isPending =
              followMutation.isPending &&
              followMutation.variables === user._id;

            return (
              <div
                key={user._id}
                className="p-2.5 rounded-2xl flex items-center justify-between gap-3 hover:bg-gray-50/80 dark:hover:bg-white/4 transition-colors group"
              >
                {/* User Info Link */}
                <Link
                  to={`/profile/${user._id}`}
                  className="flex items-center gap-3 min-w-0 flex-1 transition-opacity group-hover:opacity-95"
                >
                  <UserAvatar
                    photo={user.photo}
                    name={user.name}
                    className="h-10 w-10 shrink-0 ring-2 ring-gray-100 dark:ring-white/10 group-hover:ring-[#083695]/30 dark:group-hover:ring-blue-400/30 transition-all"
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold text-xs text-gray-900 dark:text-white truncate group-hover:text-[#083695] dark:group-hover:text-blue-400 transition-colors">
                      {user.name}
                    </h4>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">
                      @{user.username || user.name.toLowerCase().replace(/\s+/g, "")}
                    </p>
                    {typeof user.followersCount === "number" && (
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium mt-0.5">
                        {user.followersCount} {user.followersCount === 1 ? "follower" : "followers"}
                      </p>
                    )}
                  </div>
                </Link>

                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Chat Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      navigate("/chats", {
                        state: {
                          targetUser: {
                            _id: user._id,
                            name: user.name,
                            username: user.username,
                            photo: user.photo,
                          },
                        },
                      });
                    }}
                    className="h-8 w-8 rounded-full flex items-center justify-center text-[#083695] dark:text-blue-400 bg-[#083695]/10 hover:bg-[#083695] hover:text-white dark:bg-white/10 dark:hover:bg-blue-600 dark:hover:text-white transition-all cursor-pointer shadow-xs"
                    title={`Message ${user.name}`}
                    aria-label={`Message ${user.name}`}
                  >
                    <MessageCircle size={14} />
                  </button>

                  {/* Follow Button */}
                  <button
                    onClick={() => followMutation.mutate(user._id)}
                    disabled={isPending}
                    onMouseEnter={() => setHoveredUnfollow(user._id)}
                    onMouseLeave={() => setHoveredUnfollow(null)}
                    className={`shrink-0 text-xs font-semibold px-3.5 py-1.5 rounded-full transition-all duration-200 cursor-pointer shadow-xs ${
                      isFollowing
                        ? hoveredUnfollow === user._id
                          ? "bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/20"
                          : "bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-white/10"
                        : "bg-[#083695] hover:bg-[#092f70] dark:bg-blue-600 dark:hover:bg-blue-500 text-white hover:scale-105 active:scale-95"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isPending ? (
                      <Loader2 size={13} className="animate-spin inline" />
                    ) : isFollowing ? (
                      hoveredUnfollow === user._id ? (
                        <span className="inline-flex items-center gap-1">
                          <UserX size={12} />
                          Unfollow
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1">
                          <Check size={12} />
                          Following
                        </span>
                      )
                    ) : (
                      <span className="inline-flex items-center gap-1">
                        <UserPlus size={12} />
                        Follow
                      </span>
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="p-3 bg-gray-50/50 dark:bg-white/2 border-t border-gray-100 dark:border-white/6 text-center">
        <p className="text-[11px] text-gray-400 dark:text-gray-500">
          Connect with people you might know
        </p>
      </div>
    </div>
  );
}
