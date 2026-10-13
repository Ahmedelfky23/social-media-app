import axios from "axios";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import type { PostType } from "../../types/Post.type";
import PostCard from "#components/PostCard/PostCard";
import { Loader2, Bookmark } from "lucide-react";

async function getBookmarkedPosts(): Promise<PostType[]> {
  const response = await axios.get("https://route-posts.routemisr.com/posts", {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });
  return response.data.data.posts.filter(
    (post: PostType) => post.bookmarked,
  );
}

export function Bookmarks() {
  const queryClient = useQueryClient();

  const { data: allposts = [], isLoading } = useQuery({
    queryKey: ["bookmarks"],
    queryFn: getBookmarkedPosts,
  });

  const currentUserId = (() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored)._id : undefined;
    } catch {
      return undefined;
    }
  })();

  // Remove un-bookmarked posts right away, keep the list in sync with the cache
  function handleBookmarkChange(postId: string, bookmarked: boolean) {
    if (bookmarked) return; // already in the list
    queryClient.setQueryData<PostType[]>(["bookmarks"], (prev) =>
      prev ? prev.filter((post) => post._id !== postId) : prev,
    );
  }

  return (
    <div className="w-full text-[#083695] dark:text-white transition-colors duration-300">
      <Helmet>
        <title>Bookmarks | SocialApp</title>
        <meta
          name="description"
          content="Access all your saved posts and favorite content on SocialApp."
        />
      </Helmet>
      <div className="flex flex-col gap-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="animate-spin h-8 w-8 opacity-50" />
            <span className="text-sm opacity-50">Loading bookmarks...</span>
          </div>
        ) : allposts.length > 0 ? (
          allposts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              currentUserId={currentUserId}
              onBookmarkChange={handleBookmarkChange}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="h-20 w-20 rounded-full bg-[#083695]/10 dark:bg-white/10 flex items-center justify-center">
              <Bookmark size={36} className="text-[#083695]/40 dark:text-white/40" />
            </div>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              No bookmarked posts yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
