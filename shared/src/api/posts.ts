export interface VoteDTO {
  id: number;
  voteType: string;
  postId: number;
  memberId: number;
}

export interface CommentDTO {
  id: number;
  text: string;
  postId: number;
  memberId: number;
  parentCommentId: number | null;
}

export interface PostMemberDTO {
  id: number;
  userId: number;
  user: {
    id: number;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
  };
}

export interface PostDTO {
  id: number;
  title: string;
  content: string;
  postType: string;
  dateCreated: Date;
  memberId: number;
  memberPostedBy: PostMemberDTO;
  votes: VoteDTO[];
  comments: CommentDTO[];
}

export interface GetPopularPostsResponse {
  success: boolean;
  data: { posts: PostDTO[] };
  error: undefined;
}
