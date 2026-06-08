import { APIResponse, GenericErrors } from "./types";

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
  dateCreated: string;
  memberId: number;
  memberPostedBy: PostMemberDTO;
  votes: VoteDTO[];
  comments: CommentDTO[];
}

export type GetPopularPostsResponse = APIResponse<{ posts: PostDTO[] }, GenericErrors>;

export const createPostsAPI = (apiURL: string) => {
  return {
    getPopularPosts: async (): Promise<GetPopularPostsResponse> => {
      try {
        const successResponse = await fetch(`${apiURL}/posts/popular`);
        if (!successResponse.ok) throw successResponse;
        return await successResponse.json() as GetPopularPostsResponse;
      } catch (err) {
        // @ts-ignore
        return await err.json() as GetPopularPostsResponse;
      }
    },
  };
};
