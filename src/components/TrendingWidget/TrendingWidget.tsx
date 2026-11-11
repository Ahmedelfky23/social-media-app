import { useMemo } from "react";
import { Link } from "react-router-dom";
import { TrendingUp, Flame, Heart, MessageCircle, Hash, Sparkles } from "lucide-react";
import type { PostType } from "../../types/Post.type";
import { UserAvatar } from "#components/PostCard/PostCard";
import { formatDistanceToNow } from "date-fns";

const TOPICS = [
  { tag: "React19", posts: "1.4k posts", category: "Technology" },
  { tag: "WebDevelopment", posts: "3.8k posts", category: "Coding" },
  { tag: "TailwindCSS", posts: "890 posts", category: "Design" },
  { tag: "TypeScript", posts: "2.1k posts", category: "Programming" },
  { tag: "UIUXDesign", posts: "620 posts", category: "Design Systems" },
];

export default function TrendingWidget({ posts = [] }: { posts?: PostType[] }) {
  // Compute top trending posts based on engagement (likes and comments)
  const trendingPosts = useMemo(() => {
    if (!posts || posts.length === 0) return [];
    return [...posts]
      .filter((p) => p && p._id)
      .sort((a, b) => {
        const scoreA = (a.likesCount || 0) + (a.commentsCount || 0) * 2;
        const scoreB = (b.likesCount || 0) + (b.commentsCount || 0) * 2;
        return scoreB - scoreA;
      })
      .slice(0, 3);
  }, [posts]);

  return (
    <div className="w-full flex flex-col gap-4">
      {/* 1. Trending Posts Widget */}
      <div className="w-full bg-white dark:bg-[#0f172a] rounded-3xl shadow-xs border border-gray-100 dark:border-white/8 overflow-hidden transition-all duration-200">
        {/* Header */}
        <div className="p-4 pb-3 flex items-center justify-between border-b border-gray-100 dark:border-white/8">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-rose-500/10 dark:bg-rose-500/15 text-rose-500 flex items-center justify-center">
              <Flame size={17} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-gray-900 dark:text-white leading-tight">
                Trending Posts
              </h3>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">
                Most engaged discussions
              </p>
            </div>
          </div>
          <span className="flex items-center gap-1 text-[11px] font-semibold text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 px-2.5 py-0.5 rounded-full">
            <Sparkles size={11} /> Hot
          </span>
        </div>

        {/* Posts List */}
        <div className="p-2 divide-y divide-gray-50 dark:divide-white/4">
          {trendingPosts.length === 0 ? (
            <div className="py-8 text-center px-4">
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Trending posts will appear here once users interact.
              </p>
            </div>
          ) : (
            trendingPosts.map((post, index) => {
              const authorName = post.user?.name || "Social User";
              const cleanBody = post.body?.trim();

              return (
                <Link
                  key={post._id}
                  to={`/post/${post._id}`}
                  state={{ post }}
                  className="flex items-start gap-3 p-2.5 rounded-2xl hover:bg-gray-50/80 dark:hover:bg-white/4 transition-all group cursor-pointer"
                >
                  <div className="relative shrink-0">
                    <UserAvatar
                      photo={post.user?.photo}
                      name={authorName}
                      className="h-9 w-9 shrink-0 ring-2 ring-gray-100 dark:ring-white/10 group-hover:ring-[#083695]/30 dark:group-hover:ring-blue-400/30 transition-all"
                    />
                    <span className="absolute -top-1 -left-1 h-4 w-4 rounded-full bg-[#083695] dark:bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center shadow-xs">
                      #{index + 1}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-semibold text-xs text-gray-900 dark:text-white truncate group-hover:text-[#083695] dark:group-hover:text-blue-400 transition-colors">
                        {authorName}
                      </span>
                      {post.createdAt && (
                        <span className="text-[10px] text-gray-400 shrink-0">
                          {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                        </span>
                      )}
                    </div>

                    {cleanBody ? (
                      <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 mt-0.5 leading-relaxed">
                        {cleanBody}
                      </p>
                    ) : post.image ? (
                      <p className="text-[11px] text-gray-400 italic mt-0.5">
                        Shared a photo
                      </p>
                    ) : null}

                    {/* Stats pills */}
                    <div className="flex items-center gap-3 mt-1.5 pt-0.5 text-[11px] text-gray-400 dark:text-gray-500 font-medium">
                      <span className="flex items-center gap-1 group-hover:text-rose-500 transition-colors">
                        <Heart size={12} className="text-rose-500 fill-rose-500/20" />
                        {post.likesCount || 0}
                      </span>
                      <span className="flex items-center gap-1 group-hover:text-blue-500 transition-colors">
                        <MessageCircle size={12} className="text-[#083695] dark:text-blue-400" />
                        {post.commentsCount || 0}
                      </span>
                    </div>
                  </div>

                  {/* Thumbnail if post has image */}
                  {post.image && (
                    <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-gray-100 dark:bg-white/5 border border-gray-100 dark:border-white/10 group-hover:scale-105 transition-transform">
                      <img
                        src={post.image}
                        alt="preview"
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  )}
                </Link>
              );
            })
          )}
        </div>
      </div>

      {/* 2. Trending Topics (Hashtags) Widget */}
      <div className="w-full bg-white dark:bg-[#0f172a] rounded-3xl shadow-xs border border-gray-100 dark:border-white/8 overflow-hidden transition-all duration-200">
        <div className="p-4 pb-3 flex items-center justify-between border-b border-gray-100 dark:border-white/8">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-[#083695]/10 dark:bg-blue-500/15 text-[#083695] dark:text-blue-400 flex items-center justify-center">
              <TrendingUp size={16} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-gray-900 dark:text-white leading-tight">
                Trending Topics
              </h3>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">
                Popular across the platform
              </p>
            </div>
          </div>
        </div>

        <div className="p-2 divide-y divide-gray-50 dark:divide-white/4">
          {TOPICS.map((topic) => (
            <div
              key={topic.tag}
              className="p-2.5 rounded-2xl flex items-center justify-between hover:bg-gray-50/80 dark:hover:bg-white/4 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-8 w-8 rounded-xl bg-gray-100 dark:bg-white/6 flex items-center justify-center text-gray-500 dark:text-gray-400 group-hover:text-[#083695] dark:group-hover:text-blue-400 transition-colors shrink-0">
                  <Hash size={14} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-gray-400 font-medium">
                    {topic.category}
                  </p>
                  <h4 className="font-semibold text-xs text-gray-900 dark:text-white truncate group-hover:text-[#083695] dark:group-hover:text-blue-400 transition-colors">
                    #{topic.tag}
                  </h4>
                </div>
              </div>
              <span className="text-[11px] text-gray-400 dark:text-gray-500 font-medium shrink-0">
                {topic.posts}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Footer Links & Copyright */}
      <div className="px-4 py-3 rounded-2xl bg-white/50 dark:bg-white/4 border border-gray-100 dark:border-white/8 text-[11px] text-gray-400 dark:text-gray-500 leading-relaxed space-y-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-gray-400 dark:text-gray-400 font-medium">
          <Link to="/about" className="hover:text-[#083695] dark:hover:text-blue-400 hover:underline transition-colors">
            About
          </Link>
          <span>·</span>
          <Link to="/privacy" className="hover:text-[#083695] dark:hover:text-blue-400 hover:underline transition-colors">
            Privacy
          </Link>
          <span>·</span>
          <Link to="/terms" className="hover:text-[#083695] dark:hover:text-blue-400 hover:underline transition-colors">
            Terms
          </Link>
          <span>·</span>
          <Link to="/help" className="hover:text-[#083695] dark:hover:text-blue-400 hover:underline transition-colors">
            Help
          </Link>
        </div>
        <p className="text-[10px] pt-1 text-gray-500 dark:text-gray-400 font-medium">
          © 2026 SocialApp. Developed by Ahmed El-Feky.
        </p>
      </div>
    </div>
  );
}

