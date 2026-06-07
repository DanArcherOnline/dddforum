import { prisma } from "./prismaClient";

const postInclude = {
  votes: true,
  memberPostedBy: {
    include: {
      user: true,
    },
  },
  comments: true,
} as const;

export class PostsDatabase {
  async getAllPosts() {
    return prisma.post.findMany({ include: postInclude });
  }
}
