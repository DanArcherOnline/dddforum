import { Database } from "../../shared/database/database";

const postInclude = {
  votes: true,
  memberPostedBy: {
    include: {
      user: true,
    },
  },
  comments: true,
} as const;

export class PostsModel {
  constructor(private db: Database) {}

  async getAllPosts() {
    return this.db.getClient().post.findMany({ include: postInclude });
  }
}
