import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Search, SearchX, TrendingUp, X, Hash } from "lucide-react";
import { UserAvatar } from "#components/PostCard/PostCard";
import { authHeader } from "#hooks/usePostActions";
import type { SuggestionUser } from "#components/FollowSuggestions/FollowSuggestions";

export interface ExtendedSearchUser extends SuggestionUser {
  email?: string;
}

const POOL_URL = "https://route-posts.routemisr.com/users/suggestions";
const POSTS_URL = "https://route-posts.routemisr.com/posts";
const USER_CACHE_KEY = "app_known_users";

async function fetchUserPool(): Promise<ExtendedSearchUser[]> {
  const token = localStorage.getItem("token");
  if (!token) return [];

  const userMap = new Map<string, ExtendedSearchUser>();

  try {
    const cached = localStorage.getItem(USER_CACHE_KEY);
    if (cached) {
      const list: ExtendedSearchUser[] = JSON.parse(cached);
      if (Array.isArray(list)) {
        for (const u of list) {
          if (u?._id) userMap.set(u._id, u);
        }
      }
    }
  } catch {
    //
  }

  try {
    const raw = localStorage.getItem("user");
    if (raw) {
      const u = JSON.parse(raw);
      if (u?._id) {
        userMap.set(u._id, {
          _id: u._id,
          name: u.name || "",
          username: u.username || u.name?.toLowerCase().replace(/\s+/g, "") || "",
          email: u.email,
          photo: u.photo,
        });
      }
    }
  } catch {
    // 
  }

  try {
    const res = await axios.get(`${POOL_URL}?limit=100`, {
      headers: { ...authHeader(), token },
    });
    const suggestions: ExtendedSearchUser[] = res.data?.data?.suggestions ?? [];
    for (const u of suggestions) {
      if (u?._id) {
        userMap.set(u._id, {
          ...u,
          username: u.username || u.name?.toLowerCase().replace(/\s+/g, "") || "",
        });
      }
    }
  } catch {
    //
  }

  try {
    const resPosts = await axios.get(`${POSTS_URL}?limit=100`, {
      headers: { ...authHeader(), token },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const posts: any[] = resPosts.data?.data?.posts ?? resPosts.data?.posts ?? [];
    for (const p of posts) {
      if (p.user?._id) {
        const u = p.user;
        if (!userMap.has(u._id)) {
          userMap.set(u._id, {
            _id: u._id,
            name: u.name || "",
            username: u.username || u.name?.toLowerCase().replace(/\s+/g, "") || "",
            email: u.email,
            photo: u.photo,
          });
        }
      }
      if (Array.isArray(p.comments)) {
        for (const c of p.comments) {
          const cu = c.commentCreator || c.user;
          if (cu?._id && !userMap.has(cu._id)) {
            userMap.set(cu._id, {
              _id: cu._id,
              name: cu.name || "",
              username: cu.username || cu.name?.toLowerCase().replace(/\s+/g, "") || "",
              photo: cu.photo,
            });
          }
        }
      }
    }
  } catch {
    // 
  }

  const allUsers = Array.from(userMap.values());

  try {
    localStorage.setItem(USER_CACHE_KEY, JSON.stringify(allUsers.slice(0, 300)));
  } catch {
    // 
  }

  return allUsers;
}

function Highlight({ text, query }: { text?: string; query: string }) {
  if (!text) return null;
  const q = query.trim().toLowerCase();
  const cleanQ = q.startsWith("@") ? q.slice(1) : q;
  if (!cleanQ) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(cleanQ);
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <span className="text-[#083695] dark:text-blue-400 font-bold bg-[#083695]/10 dark:bg-blue-400/20 px-0.5 rounded">
        {text.slice(idx, idx + cleanQ.length)}
      </span>
      {text.slice(idx + cleanQ.length)}
    </>
  );
}

export default function UserSearch() {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(query);
      setActiveIndex(0);
    }, 200);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const hasToken = !!localStorage.getItem("token");
  const { data: pool = [], isLoading, isFetching } = useQuery({
    queryKey: ["user-search-pool"],
    queryFn: fetchUserPool,
    enabled: hasToken,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });

  const q = debounced.trim().toLowerCase();
  const cleanQ = q.startsWith("@") ? q.slice(1) : q;
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(cleanQ);

  const { data: directUser, isLoading: isDirectUserLoading } = useQuery({
    queryKey: ["direct-user-by-id", cleanQ],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      if (!token || !isObjectId) return null;
      try {
        const res = await axios.get(
          `https://route-posts.routemisr.com/users/${cleanQ}/profile`,
          { headers: { ...authHeader(), token } },
        );
        const u = res.data?.data?.user;
        if (!u?._id) return null;
        return {
          _id: u._id,
          name: u.name || "",
          username: u.username || u.name?.toLowerCase().replace(/\s+/g, "") || "",
          email: u.email,
          photo: u.photo,
        } as ExtendedSearchUser;
      } catch {
        return null;
      }
    },
    enabled: isObjectId && hasToken,
    staleTime: 1000 * 60 * 10,
  });

  const feedUsers = useMemo(() => {
    const cachedPostsData = queryClient.getQueriesData({ queryKey: ["posts"] });
    const users: ExtendedSearchUser[] = [];
    for (const [, data] of cachedPostsData) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pages = (data as any)?.pages;
      if (Array.isArray(pages)) {
        for (const page of pages) {
          if (Array.isArray(page?.posts)) {
            for (const p of page.posts) {
              if (p?.user?._id) {
                users.push({
                  _id: p.user._id,
                  name: p.user.name || "",
                  username: p.user.username || p.user.name?.toLowerCase().replace(/\s+/g, "") || "",
                  photo: p.user.photo,
                });
              }
            }
          }
        }
      }
    }
    return users;
  }, [queryClient]);

  // دمج كافة المصادر بدون تكرار
  const combinedPool = useMemo(() => {
    const map = new Map<string, ExtendedSearchUser>();
    for (const u of pool) {
      if (u?._id) map.set(u._id, u);
    }
    for (const u of feedUsers) {
      if (u?._id && !map.has(u._id)) map.set(u._id, u);
    }
    return Array.from(map.values());
  }, [pool, feedUsers]);

  const results = useMemo(() => {
    if (!cleanQ) return [];

    const filtered = combinedPool.filter((u) => {
      const name = u.name?.toLowerCase() || "";
      const username = (u.username || u.name?.toLowerCase().replace(/\s+/g, "") || "").toLowerCase();
      const id = u._id?.toLowerCase() || "";
      const email = u.email?.toLowerCase() || "";

      return (
        name.includes(cleanQ) ||
        username.includes(cleanQ) ||
        id.includes(cleanQ) ||
        email.includes(cleanQ)
      );
    });

    if (directUser && directUser._id && !filtered.some((u) => u._id === directUser._id)) {
      return [directUser, ...filtered].slice(0, 30);
    }

    return filtered.slice(0, 30);
  }, [combinedPool, cleanQ, directUser]);

  const suggested = useMemo(() => combinedPool.slice(0, 6), [combinedPool]);
  const loading = isLoading || isFetching || (isObjectId && isDirectUserLoading);
  const showDropdown = open && (cleanQ.length > 0 || combinedPool.length > 0);
  const listToShow = cleanQ ? results : suggested;

  function goToUser(id: string) {
    setOpen(false);
    setQuery("");
    setDebounced("");
    navigate(`/profile/${id}`);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (!cleanQ || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      goToUser(results[activeIndex]?._id ?? results[0]._id);
    }
  }

  return (
    <div ref={wrapRef} className="flex-1 min-w-0 max-w-xl sm:max-w-2xl md:max-w-4xl mx-1 sm:mx-4 md:mx-6 relative">
      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none z-10">
        {loading && cleanQ ? (
          <Loader2 size={16} className="animate-spin text-[#083695] dark:text-blue-400" />
        ) : (
          <Search size={16} className="text-gray-400" />
        )}
      </div>
      <input
        type="text"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder="Search by name, @username .."
        aria-label="Search users by name, username"
        className="w-full bg-[#e5ebf7] dark:bg-[#1e293b] rounded-full py-2 sm:py-2 pl-9 sm:pl-10 pr-9 min-h-10 text-xs sm:text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#083695] border border-transparent dark:border-white/5 transition-all"
      />
      {query && (
        <button
          onClick={() => { setQuery(""); setDebounced(""); }}
          aria-label="Clear search"
          className="absolute inset-y-0 right-2.5 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
        >
          <X size={15} />
        </button>
      )}
      {showDropdown && (
        <div className="absolute top-full left-0 w-full sm:w-96 md:w-105 mt-2 bg-white dark:bg-[#0f172a] rounded-2xl shadow-2xl border border-gray-100 dark:border-white/10 overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-gray-100 dark:border-white/5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
              {cleanQ ? (
                <>
                  <Search size={12} /> Search Results
                </>
              ) : (
                <>
                  <TrendingUp size={12} /> Suggested People
                </>
              )}
            </p>
            {cleanQ && !loading && (
              <span className="text-[11px] text-gray-400 font-semibold">
                {results.length} found
              </span>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto pb-2 divide-y divide-gray-50 dark:divide-white/5">
            {cleanQ && loading && combinedPool.length === 0 ? (
              <div className="flex items-center justify-center gap-2 py-8 text-sm text-gray-400">
                <Loader2 size={18} className="animate-spin text-[#083695] dark:text-blue-400" /> Searching users...
              </div>
            ) : listToShow.length === 0 ? (
              <div className="flex flex-col items-center py-8 px-4 text-center">
                <span className="h-11 w-11 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-400 mb-2">
                  <SearchX size={20} />
                </span>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">No users found</p>
                <p className="text-xs text-gray-400 mt-1">
                  Try searching by name, username (@handle)
                </p>
              </div>
            ) : (
              listToShow.map((u, idx) => {
                const isIdMatch = Boolean(cleanQ && u._id?.toLowerCase().includes(cleanQ));
                const isNameMatch = Boolean(cleanQ && u.name?.toLowerCase().includes(cleanQ));
                const isUsernameMatch = Boolean(
                  cleanQ &&
                  (u.username?.toLowerCase().includes(cleanQ) ||
                   u.name?.toLowerCase().replace(/\s+/g, "").includes(cleanQ))
                );

                return (
                  <Link
                    key={u._id}
                    to={`/profile/${u._id}`}
                    onClick={() => { setOpen(false); setQuery(""); setDebounced(""); }}
                    onMouseEnter={() => cleanQ && setActiveIndex(idx)}
                    className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${
                      cleanQ && idx === activeIndex
                        ? "bg-[#083695]/10 dark:bg-blue-500/15"
                        : "hover:bg-gray-50 dark:hover:bg-white/5"
                    }`}
                  >
                    <UserAvatar
                      photo={u.photo}
                      name={u.name}
                      className="h-10 w-10 shrink-0 text-xs ring-1 ring-gray-200 dark:ring-white/10"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
                          <Highlight text={u.name} query={cleanQ} />
                        </p>
                        {isIdMatch && !isNameMatch && !isUsernameMatch && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-mono font-medium shrink-0 flex items-center gap-0.5">
                            <Hash size={10} /> ID Match
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 truncate">
                        @<Highlight text={u.username || u.name?.toLowerCase().replace(/\s+/g, "") || ""} query={cleanQ} />
                        {typeof u.followersCount === "number" && (
                          <span className="ml-1.5">· {u.followersCount} followers</span>
                        )}
                      </p>
                      {isIdMatch && (
                        <p className="text-[10px] text-gray-400 font-mono truncate mt-0.5">
                          ID: <Highlight text={u._id} query={cleanQ} />
                        </p>
                      )}
                    </div>
                    <span className="text-[11px] font-semibold text-[#083695] dark:text-blue-400 shrink-0">
                      View
                    </span>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
