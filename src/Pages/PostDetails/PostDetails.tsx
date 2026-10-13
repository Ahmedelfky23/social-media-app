import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { ArrowLeft, Loader2 } from "lucide-react";
import type { PostType } from "../../types/Post.type";
import PostCard from "#components/PostCard/PostCard";
import { Button } from "#components/ui/button";
import { singlePostQueryKey } from "#hooks/usePostActions";

async function getPostById(postId: string): Promise<PostType | null> {
  const response = await axios.get(
    `https://route-posts.routemisr.com/posts/${postId}`,
    {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    },
  );
  return response.data?.data?.post ?? null;
}

export default function PostDetails() {
  const { _id } = useParams<{ _id: string }>();
  const navigate = useNavigate();

  const { data: post, isLoading, isError } = useQuery({
    queryKey: singlePostQueryKey(_id as string),
    queryFn: () => getPostById(_id as string),
    enabled: Boolean(_id),
  });

  return (
    <div className="w-full sm:w-[92%] lg:w-[85%] mx-auto">
      <Helmet>
        <title>
          {post?.user?.name
            ? `${post.user.name}'s Post | SocialApp`
            : "Post Details | SocialApp"}
        </title>
        <meta
          name="description"
          content={
            post?.body
              ? post.body.slice(0, 150)
              : "View post conversation and comments on SocialApp."
          }
        />
      </Helmet>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate("/home")}
        className="mb-3 cursor-pointer gap-1.5 rounded-full text-gray-500 hover:bg-gray-100 hover:text-[#083695] dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to feed
      </Button>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="animate-spin h-8 w-8 opacity-50" />
          <span className="text-sm opacity-50">Loading post...</span>
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Could not load this post. Please try again later.
          </p>
        </div>
      ) : post ? (
        <PostCard post={post} showComments />
      ) : null}
    </div>
  );
}
