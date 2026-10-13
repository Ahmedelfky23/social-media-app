import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Search, SearchX, TrendingUp, X } from "lucide-react";
import { UserAvatar } from "#components/PostCard/PostCard";
import { authHeader } from "#hooks/usePostActions";
import type { SuggestionUser } from "#components/FollowSuggestions/FollowSuggestions";

const POOL_URL = "https://route-posts.routemisr.com/users/suggestions";

async function fetchUserPool(): Promise<SuggestionUser[]> {
  const token = localStorage.getItem("token");
  if (!token) return [];
  const res = await axios.get(`${POOL_URL}?limit=50`, {
    headers: { ...authHeader(), token: token || "" },
  });
  return res.data?.data?.suggestions ?? [];
}

function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim().toLowerCase();
  if (!q) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(q);
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <span className="text-[#083695] dark:text-blue-400 font-bold">
        {text.slice(idx, idx + q.length)}
      </span>
      {text.slice(idx + q.length)}
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

  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(query);
      setActiveIndex(0);
    }, 250);
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
  const results = useMemo(() => {
    if (!q) return [];
    return pool
      .filter(
        (u) =>
          u.name?.toLowerCase().includes(q) ||
          u.username?.toLowerCase().includes(q),
      )
      .slice(0, 7);
  }, [pool, q]);
  const suggested = useMemo(() => pool.slice(0, 5), [pool]);
  const loading = isLoading || isFetching;
  const showDropdown = open && (q.length > 0 || pool.length > 0);
  const listToShow = q ? results : suggested;

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
    if (!q || results.length === 0) return;
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
        {loading && q ? (
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
        placeholder="Search..."
        aria-label="Search users"
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
        <div className="absolute top-full left-0 w-full sm:w-80 mt-2 bg-white dark:bg-[#0f172a] rounded-2xl shadow-xl border border-gray-100 dark:border-white/10 overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 pt-3 pb-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
              {q ? (<><Search size={12} /> Users</>) : (<><TrendingUp size={12} /> Suggested</>)}
            </p>
            {q && !loading && <span className="text-[11px] text-gray-400">{results.length} found</span>}
          </div>
          <div className="max-h-80 overflow-y-auto pb-2">
            {q && loading && pool.length === 0 ? (
              <div className="flex items-center justify-center gap-2 py-8 text-sm text-gray-400">
                <Loader2 size={18} className="animate-spin text-[#083695]" /> Searching...
              </div>
            ) : listToShow.length === 0 ? (
              <div className="flex flex-col items-center py-8 px-4 text-center">
                <span className="h-11 w-11 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-400 mb-2">
                  <SearchX size={20} />
                </span>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">No users found</p>
                <p className="text-xs text-gray-400 mt-1">No name or username matches this</p>
              </div>
            ) : (
              listToShow.map((u, idx) => (
                <Link
                  key={u._id}
                  to={`/profile/${u._id}`}
                  onClick={() => { setOpen(false); setQuery(""); setDebounced(""); }}
                  onMouseEnter={() => q && setActiveIndex(idx)}
                  className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer ${q && idx === activeIndex ? "bg-[#083695]/8 dark:bg-blue-500/10" : "hover:bg-gray-50 dark:hover:bg-white/5"}`}
                >
                  <UserAvatar photo={u.photo} name={u.name} className="h-9 w-9 shrink-0 text-xs" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
                      <Highlight text={u.name} query={q} />
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      @<Highlight text={u.username || ""} query={q} />
                      {typeof u.followersCount === "number" && (
                        <span className="ml-1.5">· {u.followersCount} followers</span>
                      )}
                    </p>
                  </div>
                  <span className="text-[11px] font-semibold text-[#083695] dark:text-blue-400 shrink-0">View</span>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}


