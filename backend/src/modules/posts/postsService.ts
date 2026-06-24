import type { PostsRepository } from "./ports/postsRepository";

function netVoteScore(votes: { voteType: string }[]): number {
  let score = 0;
  for (const v of votes) {
    if (v.voteType === "Upvote") score++;
    else if (v.voteType === "Downvote") score--;
  }
  return score;
}

export class PostsService {
  constructor(private postsRepo: PostsRepository) {}

  async getPopularPosts() {
    const posts = await this.postsRepo.getAllPosts();
    posts.sort((a, b) => {
      const byScore = netVoteScore(b.votes) - netVoteScore(a.votes);
      if (byScore !== 0) return byScore;
      return b.dateCreated.getTime() - a.dateCreated.getTime();
    });
    return posts;
  }
}
