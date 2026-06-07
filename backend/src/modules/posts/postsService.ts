import type { PostsModel } from "./postsModel";

function netVoteScore(votes: { voteType: string }[]): number {
  let score = 0;
  for (const v of votes) {
    if (v.voteType === "Upvote") score++;
    else if (v.voteType === "Downvote") score--;
  }
  return score;
}

export class PostsService {
  constructor(private postsModel: PostsModel) {}

  async getPopularPosts() {
    const posts = await this.postsModel.getAllPosts();
    posts.sort((a, b) => {
      const byScore = netVoteScore(b.votes) - netVoteScore(a.votes);
      if (byScore !== 0) return byScore;
      return b.dateCreated.getTime() - a.dateCreated.getTime();
    });
    return posts;
  }
}
