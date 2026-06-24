import { PrismaClient } from "../../../generated/prisma/client";
import type { PostsRepository, PostWithDetails } from "../ports/postsRepository";
import { postInclude } from "../ports/postsRepository";

export class ProductionPostsRepository implements PostsRepository {
  constructor(private prisma: PrismaClient) {}

  async getAllPosts(): Promise<PostWithDetails[]> {
    return this.prisma.post.findMany({ include: postInclude });
  }
}
