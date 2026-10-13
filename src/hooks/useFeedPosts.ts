import { useInfiniteQuery } from "@tanstack/react-query";
import axios from "axios";
import type { PostType } from "../types/Post.type";
import { API, authHeader } from "./usePostActions";

export const FEED_PAGE_SIZE = 40;

export interface FeedPage {
  posts: PostType[];
  page: number;
  hasMore: boolean;
}

async function getPostsPage(
  page: number,
  limit: number = FEED_PAGE_SIZE,
): Promise<FeedPage> {
  const res = await axios.get(API, {
    headers: authHeader(),
    params: { page, limit },
  });

  const payload = res.data?.data ?? res.data ?? {};
  const posts: PostType[] =
    payload.posts ?? res.data?.data?.posts ?? res.data?.posts ?? [];

  const total: number | undefined =
    payload.total ?? payload.totalPosts ?? payload.count ?? undefined;

  let hasMore: boolean;
  if (typeof total === "number") {
    hasMore = page * limit < total;
  } else {
    hasMore = posts.length === limit;
  }

  return { posts, page, hasMore };
}

export function useFeedPosts() {
  return useInfiniteQuery({
    queryKey: ["posts"],
    queryFn: ({ pageParam = 1 }) => getPostsPage(pageParam as number),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.page + 1 : undefined,
    retry: 2,
    staleTime: 1000 * 60,
  });
}
