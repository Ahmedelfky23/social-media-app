export interface User {
  _id: string;
  name: string;
  username: string;
  photo?: string;
}

export interface PostType {
  _id: string;
  id?: string;
  body?: string;
  bookmarked: boolean;
  commentsCount: number;
  createdAt: string; 
  isShare: boolean;
  likes: string[]; 
  likesCount: number;
  privacy: "public" | "friends" | "private"; 
  sharedPost: PostType | null;
  sharesCount: number;
  image?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  topComment: any | null; 
  user: User;
}

export interface PostCardProps {
  post: PostType;
  currentUserId?: string;
  showComments?: boolean;
  onBookmarkChange?: (postId: string, bookmarked: boolean) => void;
}