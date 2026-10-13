import { useContext, useCallback, useEffect, useRef, useMemo } from "react";
import { Helmet } from "react-helmet";
import PostCard from "../../components/PostCard/PostCard";
import CreatePost from "../../components/CreatePost/CreatePost";
import { AuthContext } from "../../context/AuthContext";
import { Image, Loader2, CheckCircle2 } from "lucide-react";
import { useFeedPosts, FEED_PAGE_SIZE } from "../../hooks/useFeedPosts";

export default function Home() {
  const { userLogin } = useContext(AuthContext);

  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useFeedPosts();

  const allposts = useMemo(
    () => data?.pages.flatMap((pg) => pg.posts) ?? [],
    [data],
  );

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: "600px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore, allposts.length]);

  const currentUserId = userLogin?._id || (() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored)._id : undefined;
    } catch {
      return undefined;
    }
  })();

  return (
    <div className="w-full text-[#083695] dark:text-white transition-colors duration-300">
      <Helmet>
        <title>Home | SocialApp</title>
        <meta
          name="description"
          content="Explore your personalized feed, share posts, and connect with friends on SocialApp."
        />
      </Helmet>

      {/* Two-column layout on xl+, single column below */}
      <div className="w-full pr-1 sm:pr-3 xl:flex xl:gap-6 xl:items-start">

        {/* ====== Main Feed ====== */}
        <div className="flex-1 min-w-0 w-full flex flex-col gap-3 sm:gap-4">
          {/* Create Post Box */}
          <CreatePost />

          {/* Posts */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="animate-spin h-8 w-8 opacity-50" />
              <span className="text-sm opacity-50">Loading posts...</span>
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white dark:bg-[#0f172a] rounded-2xl border border-gray-100 dark:border-white/8">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                Couldn't load posts
              </p>
              <p className="text-xs text-gray-400">
                Check your connection and try again.
              </p>
              <button
                onClick={() => refetch()}
                className="mt-1 px-4 py-2 rounded-xl text-sm font-semibold bg-[#083695] text-white hover:bg-[#0a337c] transition-colors cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : allposts.length > 0 ? (
            <>
              {allposts.map((post) => (
                <PostCard
                  key={post._id}
                  post={post}
                  currentUserId={currentUserId}
                />
              ))}

              {/* Infinite-scroll sentinel */}
              <div ref={sentinelRef} className="flex flex-col items-center py-6">
                {isFetchingNextPage ? (
                  <div className="flex flex-col items-center gap-2.5 bg-white dark:bg-[#0f172a] border border-gray-100 dark:border-white/8 rounded-2xl px-8 py-5 shadow-sm w-full">
                    <Loader2 className="animate-spin h-7 w-7 text-[#083695] dark:text-blue-400" />
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Loading {FEED_PAGE_SIZE} more posts...
                    </span>
                  </div>
                ) : hasNextPage ? (
                  <button
                    onClick={loadMore}
                    className="px-6 py-2.5 rounded-xl text-sm font-semibold border border-[#083695]/25 text-[#083695] dark:text-blue-300 dark:border-blue-400/25 hover:bg-[#083695]/8 dark:hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    Load more
                  </button>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500">
                    <CheckCircle2 size={16} className="text-emerald-500" />
                    You're all caught up
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="h-20 w-20 rounded-full bg-[#083695]/10 dark:bg-white/10 flex items-center justify-center">
                <Image
                  size={36}
                  className="text-[#083695]/40 dark:text-white/40"
                />
              </div>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                No posts to show yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
