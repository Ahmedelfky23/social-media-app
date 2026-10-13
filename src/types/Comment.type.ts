export interface CommentCreator {
    _id: string;
    name: string;
    username: string;
    phone: string;
    photo?: string;
}

export interface CommentType {
  _id: string;
  commentCreator?: CommentCreator;
  user?: CommentCreator;
  content: string;
  image?: string;
  createdAt: string;
  likes?: string[];
  post?: string;
  parentComment?: string | null;
  repliesCount?: number;
  isReply?: boolean;
}