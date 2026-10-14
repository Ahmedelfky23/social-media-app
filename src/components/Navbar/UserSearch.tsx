import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Search, SearchX, TrendingUp, X } from "lucide-react";
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const addUser = (raw: any) => {
    if (!raw || typeof raw !== "object") return;
    const id = raw._id || raw.id;
    if (!id || typeof id !== "string") return;

    const existing = userMap.get(id);
    const name = raw.name || existing?.name || "";
    const username =
      raw.username ||
      existing?.username ||
      (name ? name.toLowerCase().replace(/\s+/g, "") : "");
    const photo = raw.photo || existing?.photo;
    const followersCount =
      typeof raw.followersCount === "number"
        ? raw.followersCount
        : existing?.followersCount;

    userMap.set(id, {
      _id: id,
      name,
      username,
      photo,
      followersCount,
    });
  };

  // 1. المسترجع من الكاش السابق
  try {
    const cached = localStorage.getItem(USER_CACHE_KEY);
    if (cached) {
      const list: ExtendedSearchUser[] = JSON.parse(cached);
      if (Array.isArray(list)) {
        for (const u of list) addUser(u);
      }
    }
  } catch {
    //
  }

  try {
    const raw = localStorage.getItem("user");
    if (raw) addUser(JSON.parse(raw));
  } catch {
    //
  }

  try {
    const headers = { ...authHeader(), token };

    const [suggRes, postsP1, postsP2, postsP3] = await Promise.allSettled([
      axios.get(`${POOL_URL}?limit=150`, { headers }),
      axios.get(`${POSTS_URL}?limit=50&page=1`, { headers }),
      axios.get(`${POSTS_URL}?limit=50&page=2`, { headers }),
      axios.get(`${POSTS_URL}?limit=50&page=3`, { headers }),
    ]);

    if (suggRes.status === "fulfilled") {
      const suggestions = suggRes.value.data?.data?.suggestions ?? [];
      for (const u of suggestions) addUser(u);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const processPosts = (res: PromiseSettledResult<any>) => {
      if (res.status !== "fulfilled") return;
      const posts = res.value.data?.data?.posts ?? res.value.data?.posts ?? [];
      for (const p of posts) {
        if (p.user) addUser(p.user);
        if (p.sharedPost?.user) addUser(p.sharedPost.user);
        if (Array.isArray(p.comments)) {
          for (const c of p.comments) {
            if (c.commentCreator) addUser(c.commentCreator);
            if (c.user) addUser(c.user);
          }
        }
      }
    };

    processPosts(postsP1);
    processPosts(postsP2);
    processPosts(postsP3);
  } catch {
    //
  }

  const allUsers = Array.from(userMap.values());

  try {
    localStorage.setItem(USER_CACHE_KEY, JSON.stringify(allUsers.slice(0, 500)));
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
    }, 180);
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

  const feedUsers = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cachedQueries = queryClient.getQueriesData<any>({});
    const users: ExtendedSearchUser[] = [];
    const seen = new Set<string>();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const checkAndAdd = (u: any) => {
      if (!u || typeof u !== "object") return;
      const id = u._id || u.id;
      if (!id || typeof id !== "string" || seen.has(id)) return;
      seen.add(id);
      users.push({
        _id: id,
        name: u.name || "",
        username: u.username || (u.name ? u.name.toLowerCase().replace(/\s+/g, "") : ""),
        photo: u.photo,
        followersCount: typeof u.followersCount === "number" ? u.followersCount : undefined,
      });
    };

    for (const [, data] of cachedQueries) {
      if (!data) continue;
      // صفحة بروفايل أو بيانات مستخدم
      if (data.user) checkAndAdd(data.user);
      if (data.data?.user) checkAndAdd(data.data.user);
      if (Array.isArray(data.suggestions)) {
        for (const s of data.suggestions) checkAndAdd(s);
      }
      if (Array.isArray(data.data?.suggestions)) {
        for (const s of data.data.suggestions) checkAndAdd(s);
      }
      // صفحات التغذية
      const pages = data.pages;
      if (Array.isArray(pages)) {
        for (const page of pages) {
          const posts = page?.posts ?? page?.data?.posts ?? [];
          if (Array.isArray(posts)) {
            for (const p of posts) {
              if (p?.user) checkAndAdd(p.user);
              if (p?.sharedPost?.user) checkAndAdd(p.sharedPost.user);
              if (Array.isArray(p?.comments)) {
                for (const c of p.comments) {
                  if (c?.commentCreator) checkAndAdd(c.commentCreator);
                  if (c?.user) checkAndAdd(c.user);
                }
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

    const tokens = cleanQ.split(/\s+/).filter(Boolean);

    const scored: Array<{ user: ExtendedSearchUser; score: number }> = [];

    for (const u of combinedPool) {
      const name = (u.name || "").toLowerCase();
      const username = (
        u.username ||
        u.name?.toLowerCase().replace(/\s+/g, "") ||
        ""
      ).toLowerCase();

      // البحث فقط بالاسم والـ username للحفاظ على الـ privacy
      let match = false;
      let score = 0;

      if (name === cleanQ || username === cleanQ) {
        match = true;
        score = 100;
      } else if (username.startsWith(cleanQ) || name.startsWith(cleanQ)) {
        match = true;
        score = 80;
      } else if (name.split(/\s+/).some((part) => part.startsWith(cleanQ))) {
        match = true;
        score = 60;
      } else if (name.includes(cleanQ) || username.includes(cleanQ)) {
        match = true;
        score = 40;
      } else if (tokens.length > 1 && tokens.every((t) => name.includes(t) || username.includes(t))) {
        match = true;
        score = 30;
      }

      if (match) {
        const boost = Math.min(20, (u.followersCount ?? 0) / 10);
        scored.push({ user: u, score: score + boost });
      }
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.map((s) => s.user).slice(0, 50);
  }, [combinedPool, cleanQ]);

  const suggested = useMemo(() => combinedPool.slice(0, 8), [combinedPool]);
  const loading = isLoading || isFetching;
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
                  Try searching by name or @username
                </p>
              </div>
            ) : (
              listToShow.map((u, idx) => {
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
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
                        <Highlight text={u.name} query={cleanQ} />
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        @<Highlight text={u.username || u.name?.toLowerCase().replace(/\s+/g, "") || "user"} query={cleanQ} />
                        {typeof u.followersCount === "number" && (
                          <span className="ml-1.5">· {u.followersCount} followers</span>
                        )}
                      </p>
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
