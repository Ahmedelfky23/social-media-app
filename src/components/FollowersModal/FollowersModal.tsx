import { useState, useMemo, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, X, UserPlus, Check, UserX, Loader2, MessageCircle, Users } from "lucide-react";
import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UserAvatar } from "#components/PostCard/PostCard";
import { toast } from "#components/ui/toast";
import { authHeader } from "#hooks/usePostActions";
import { fetchUserPool } from "#components/Navbar/UserSearch";

export interface ModalUserItem {
  _id: string;
  name?: string;
  username?: string;
  photo?: string;
  followersCount?: number;
  isFollowing?: boolean;
}

interface FollowersModalProps {
  open: boolean;
  onClose: () => void;
  initialTab?: "followers" | "following";
  targetUser: {
    _id?: string;
    name?: string;
    username?: string;
  };
  followersList?: unknown[];
  followingList?: unknown[];
  myFollowingList?: unknown[];
  followersCount?: number;
  followingCount?: number;
}

const FOLLOW_URL = "https://route-posts.routemisr.com/users";
const USER_CACHE_KEY = "app_known_users";

function getCachedUsers(): Record<string, ModalUserItem> {
  const map: Record<string, ModalUserItem> = {};
  try {
    const cached = localStorage.getItem(USER_CACHE_KEY);
    if (cached) {
      const list = JSON.parse(cached);
      if (Array.isArray(list)) {
        for (const u of list) {
          if (u && u._id && u.name) {
            map[u._id] = {
              _id: u._id,
              name: u.name,
              username: u.username || u.name.toLowerCase().replace(/\s+/g, ""),
              photo: u.photo,
              followersCount: u.followersCount,
            };
          }
        }
      }
    }
  } catch {}
  try {
    const raw = localStorage.getItem("user");
    if (raw) {
      const u = JSON.parse(raw);
      if (u && u._id) {
        map[u._id] = {
          _id: u._id,
          name: u.name,
          username: u.username || u.name?.toLowerCase().replace(/\s+/g, ""),
          photo: u.photo,
          followersCount: u.followersCount,
        };
      }
    }
  } catch {}
  return map;
}

export default function FollowersModal({
  open,
  onClose,
  initialTab = "followers",
  targetUser,
  followersList = [],
  followingList = [],
  myFollowingList = [],
  followersCount = 0,
  followingCount = 0,
}: FollowersModalProps) {
  const [activeTab, setActiveTab] = useState<"followers" | "following">(initialTab);
  const [search, setSearch] = useState("");
  const [hoveredUnfollow, setHoveredUnfollow] = useState<string | null>(null);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const [resolvedUsersMap, setResolvedUsersMap] = useState<Record<string, ModalUserItem>>(getCachedUsers);

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fetchingIdsRef = useRef<Set<string>>(new Set());

  const currentLoggedInId = useMemo(() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored)._id : null;
    } catch {
      return null;
    }
  }, []);

  const isTargetMe = Boolean(
    (targetUser._id && currentLoggedInId && targetUser._id === currentLoggedInId) ||
    (!targetUser._id)
  );

  // Build the set of all user IDs the logged-in user follows
  const myFollowingIds = useMemo(() => {
    const set = new Set<string>();
    const list = myFollowingList || [];
    for (const item of list) {
      if (!item) continue;
      if (typeof item === "string") set.add(item);
      else if (typeof item === "object" && "_id" in item && item._id) set.add(String(item._id));
    }
    try {
      const raw = localStorage.getItem("user");
      if (raw) {
        const u = JSON.parse(raw);
        if (Array.isArray(u?.following)) {
          for (const item of u.following) {
            if (!item) continue;
            if (typeof item === "string") set.add(item);
            else if (typeof item === "object" && "_id" in item && item._id) set.add(String(item._id));
          }
        }
      }
    } catch {}
    return set;
  }, [myFollowingList]);

  // Update tab when initialTab changes or modal opens
  useEffect(() => {
    setActiveTab(initialTab);
    setSearch("");
  }, [initialTab, open]);

  // Handle escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [open, onClose]);

  // Normalize list items (handles full objects or plain string IDs)
  const normalizeList = (list: unknown[]): ModalUserItem[] => {
    const result: ModalUserItem[] = [];
    for (const item of list) {
      if (!item) continue;
      if (typeof item === "string") {
        result.push({ _id: item });
      } else if (typeof item === "object" && "_id" in item) {
        const raw = item as Record<string, unknown>;
        result.push({
          _id: String(raw._id),
          name: typeof raw.name === "string" ? raw.name : undefined,
          username: typeof raw.username === "string" ? raw.username : undefined,
          photo: typeof raw.photo === "string" ? raw.photo : undefined,
          followersCount: typeof raw.followersCount === "number" ? raw.followersCount : undefined,
        });
      }
    }
    return result;
  };

  const parsedFollowers = useMemo(() => normalizeList(followersList), [followersList]);
  const parsedFollowing = useMemo(() => normalizeList(followingList), [followingList]);

  const rawUsers = activeTab === "followers" ? parsedFollowers : parsedFollowing;

  // Resolve missing user names, photos, and follow status in real-time
  useEffect(() => {
    if (!open) return;

    // Load initial user pool in background to populate known cache
    void fetchUserPool().then((pool) => {
      if (Array.isArray(pool) && pool.length > 0) {
        setResolvedUsersMap((prev) => {
          const next = { ...prev };
          let changed = false;
          for (const u of pool) {
            if (u && u._id && (!next[u._id] || !next[u._id].name)) {
              next[u._id] = {
                _id: u._id,
                name: u.name,
                username: u.username || u.name?.toLowerCase().replace(/\s+/g, ""),
                photo: u.photo,
                followersCount: u.followersCount,
              };
              changed = true;
            }
          }
          return changed ? next : prev;
        });
      }
    });

    // Check which IDs in rawUsers are missing full profile info
    const missingIds = rawUsers
      .map((u) => u._id)
      .filter((id) => id && (!resolvedUsersMap[id] || !resolvedUsersMap[id].name) && !fetchingIdsRef.current.has(id));

    if (missingIds.length === 0) return;

    missingIds.forEach((id) => fetchingIdsRef.current.add(id));

    const token = localStorage.getItem("token") || "";
    const headers = { ...authHeader(), token };

    // Fetch individual profiles in parallel batches of 5
    const fetchProfiles = async () => {
      const batchSize = 5;
      for (let i = 0; i < missingIds.length; i += batchSize) {
        const slice = missingIds.slice(i, i + batchSize);
        const results = await Promise.allSettled(
          slice.map((id) =>
            axios.get(`https://route-posts.routemisr.com/users/${id}/profile`, { headers }).then((res) => ({
              id,
              data: res.data,
              user: res.data?.data?.user ?? res.data?.user ?? res.data?.data ?? null,
            })),
          ),
        );

        setResolvedUsersMap((prev) => {
          const next = { ...prev };
          for (const res of results) {
            if (res.status === "fulfilled" && res.value.user) {
              const u = res.value.user;
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const uData = res.value.data as any;
              const serverIsFollowing = Boolean(
                uData?.data?.isFollowing ??
                uData?.isFollowing ??
                u?.isFollowing ??
                (currentLoggedInId && Array.isArray(u?.followers) && u.followers.some((f: unknown) => (typeof f === "string" ? f === currentLoggedInId : (f as { _id?: string })?._id === currentLoggedInId)))
              );

              next[res.value.id] = {
                _id: res.value.id,
                name: u.name || "Social User",
                username: u.username || (u.name ? u.name.toLowerCase().replace(/\s+/g, "") : "user"),
                photo: u.photo,
                followersCount: u.followersCount,
                isFollowing: serverIsFollowing,
              };
            }
          }
          return next;
        });
      }
    };

    void fetchProfiles();
  }, [open, rawUsers, resolvedUsersMap, currentLoggedInId]);

  // Combine raw users with resolved profiles
  const displayUsers = useMemo(() => {
    return rawUsers.map((item) => {
      const resolved = resolvedUsersMap[item._id];
      if (resolved && resolved.name) {
        return resolved;
      }
      return item;
    });
  }, [rawUsers, resolvedUsersMap]);

  // Filter with live search
  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return displayUsers;
    return displayUsers.filter(
      (u) =>
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.username && u.username.toLowerCase().includes(q)),
    );
  }, [displayUsers, search]);

  // Follow / Unfollow mutation
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
      const currentStatus = typeof followingMap[userId] === "boolean"
        ? followingMap[userId]
        : (isTargetMe && activeTab === "following")
        ? true
        : myFollowingIds.has(userId)
        ? true
        : Boolean(resolvedUsersMap[userId]?.isFollowing);

      const nextStatus = !currentStatus;

      setFollowingMap((prev) => ({
        ...prev,
        [userId]: nextStatus,
      }));
      return { wasFollowing: currentStatus };
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

      // Keep localStorage in sync so other tabs and components reflect the change
      try {
        const raw = localStorage.getItem("user");
        if (raw) {
          const u = JSON.parse(raw);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const arr: any[] = Array.isArray(u.following) ? [...u.following] : [];
          if (isNowFollowing) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (!arr.some((f: any) => (typeof f === "string" ? f === userId : f?._id === userId))) {
              arr.push(userId);
            }
            myFollowingIds.add(userId);
          } else {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const idx = arr.findIndex((f: any) => (typeof f === "string" ? f === userId : f?._id === userId));
            if (idx !== -1) arr.splice(idx, 1);
            myFollowingIds.delete(userId);
          }
          u.following = arr;
          localStorage.setItem("user", JSON.stringify(u));
        }
      } catch {}

      toast.add({
        title: isNowFollowing ? "Following user" : "Unfollowed user",
        description: isNowFollowing
          ? "You will now see their updates in your feed."
          : "You have unfollowed this user.",
        type: "success",
      });

      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
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

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-100 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200 pb-safe"
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-md bg-white dark:bg-[#0f172a] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-gray-100 dark:border-white/10 overflow-hidden flex flex-col max-h-[88vh] sm:max-h-[85vh] animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Pull Handle */}
        <div className="sm:hidden flex justify-center pt-2.5 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-white/20" />
        </div>

        {/* Header with Title and Close button */}
        <div className="relative flex items-center justify-center p-4 border-b border-gray-100 dark:border-white/8">
          <h3 className="font-bold text-base text-gray-900 dark:text-white">
            {targetUser.name || "User"}
          </h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 p-1.5 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-all cursor-pointer active:scale-95"
          >
            <X size={18} />
          </button>
        </div>

        {/* Instagram-style Sliding Tabs */}
        <div className="flex border-b border-gray-100 dark:border-white/8 bg-gray-50/50 dark:bg-white/2">
          <button
            type="button"
            onClick={() => setActiveTab("followers")}
            className={`flex-1 py-3 text-center text-sm font-semibold transition-all relative cursor-pointer ${
              activeTab === "followers"
                ? "text-[#083695] dark:text-blue-400"
                : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            }`}
          >
            Followers{" "}
            <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300">
              {followersCount}
            </span>
            {activeTab === "followers" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#083695] dark:bg-blue-400 rounded-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("following")}
            className={`flex-1 py-3 text-center text-sm font-semibold transition-all relative cursor-pointer ${
              activeTab === "following"
                ? "text-[#083695] dark:text-blue-400"
                : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            }`}
          >
            Following{" "}
            <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300">
              {followingCount}
            </span>
            {activeTab === "following" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#083695] dark:bg-blue-400 rounded-full" />
            )}
          </button>
        </div>

        {/* Instagram-style Live Search Input */}
        <div className="p-3 border-b border-gray-100 dark:border-white/8">
          <div className="flex items-center gap-2 bg-[#f2f5fa] dark:bg-white/6 rounded-2xl px-3 py-2 transition-all focus-within:ring-2 focus-within:ring-[#083695]/20 dark:focus-within:ring-blue-400/25">
            <Search size={16} className="text-gray-400 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${activeTab}...`}
              className="w-full bg-transparent text-xs sm:text-sm text-gray-800 dark:text-white placeholder:text-gray-400 outline-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Users List */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-50 dark:divide-white/4 p-2 min-h-60 max-h-96">
          {filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="h-14 w-14 rounded-full bg-[#083695]/8 dark:bg-white/8 flex items-center justify-center text-2xl mb-3 text-[#083695] dark:text-blue-400">
                <Users size={24} />
              </div>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                {search ? "No results found" : `No ${activeTab} yet`}
              </p>
              <p className="text-xs text-gray-400 mt-1 max-w-xs">
                {search
                  ? `We couldn't find any user matching "${search}".`
                  : activeTab === "followers"
                  ? "When people follow this account, they will appear here."
                  : "When this account follows people, they will appear here."}
              </p>
            </div>
          ) : (
            filteredUsers.map((user) => {
              const isMe = currentLoggedInId === user._id;
              const isResolving = !user.name;

              // Check if currently logged in user follows this user
              const userIsFollowing = typeof followingMap[user._id] === "boolean"
                ? followingMap[user._id]
                : (isTargetMe && activeTab === "following")
                ? true
                : myFollowingIds.has(user._id)
                ? true
                : Boolean(user.isFollowing || resolvedUsersMap[user._id]?.isFollowing);

              const isPending = followMutation.isPending && followMutation.variables === user._id;

              return (
                <div
                  key={user._id}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-2xl hover:bg-gray-50/80 dark:hover:bg-white/4 transition-colors group"
                >
                  {/* User Profile Info or Skeleton */}
                  {isResolving ? (
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="h-11 w-11 rounded-full bg-linear-to-br from-[#083695]/20 to-[#4a7fd4]/20 animate-pulse shrink-0" />
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="h-3.5 w-32 rounded-md bg-gray-200 dark:bg-white/10 animate-pulse" />
                        <div className="h-2.5 w-20 rounded-md bg-gray-200 dark:bg-white/10 animate-pulse" />
                      </div>
                    </div>
                  ) : (
                    <Link
                      to={`/profile/${user._id}`}
                      onClick={onClose}
                      className="flex items-center gap-3 min-w-0 flex-1 transition-opacity group-hover:opacity-90"
                    >
                      <UserAvatar
                        photo={user.photo}
                        name={user.name}
                        className="h-11 w-11 shrink-0 ring-2 ring-gray-100 dark:ring-white/10 group-hover:ring-[#083695]/30 dark:group-hover:ring-blue-400/30 transition-all"
                      />
                      <div className="min-w-0 flex-1 text-left">
                        <h4 className="font-semibold text-xs sm:text-sm text-gray-900 dark:text-white truncate group-hover:text-[#083695] dark:group-hover:text-blue-400 transition-colors">
                          {user.name}
                        </h4>
                        <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">
                          @{user.username || user.name?.toLowerCase().replace(/\s+/g, "") || "user"}
                        </p>
                      </div>
                    </Link>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {!isMe && !isResolving && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
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
                        className="h-8 w-8 rounded-full flex items-center justify-center text-[#083695] dark:text-blue-400 bg-[#083695]/10 hover:bg-[#083695] hover:text-white dark:bg-white/10 dark:hover:bg-blue-600 dark:hover:text-white transition-all cursor-pointer shadow-xs active:scale-90"
                        title={`Send message to ${user.name}`}
                        aria-label={`Send message to ${user.name}`}
                      >
                        <MessageCircle size={14} />
                      </button>
                    )}

                    {isMe ? (
                      <span className="text-xs font-semibold px-3 py-1 rounded-full bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300">
                        You
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => followMutation.mutate(user._id)}
                        disabled={isPending || isResolving}
                        onMouseEnter={() => setHoveredUnfollow(user._id)}
                        onMouseLeave={() => setHoveredUnfollow(null)}
                        className={`text-xs font-semibold px-3.5 py-1.5 rounded-full transition-all duration-200 cursor-pointer shadow-xs active:scale-95 ${
                          userIsFollowing
                            ? hoveredUnfollow === user._id
                              ? "bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/20"
                              : "bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-white/10"
                            : "bg-[#083695] hover:bg-[#092f70] dark:bg-blue-600 dark:hover:bg-blue-500 text-white"
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {isPending ? (
                          <Loader2 size={13} className="animate-spin inline" />
                        ) : userIsFollowing ? (
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
                            {activeTab === "followers" ? "Follow back" : "Follow"}
                          </span>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
