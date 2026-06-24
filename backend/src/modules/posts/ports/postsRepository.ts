import { Prisma } from "../../../generated/prisma/client";

export const postInclude = {
  votes: true,
  memberPostedBy: {
    include: {
      user: true,
    },
  },
  comments: true,
} as const;

export type PostWithDetails = Prisma.PostGetPayload<{ include: typeof postInclude }>;

export interface PostsRepository {
  getAllPosts(): Promise<PostWithDetails[]>;
}
