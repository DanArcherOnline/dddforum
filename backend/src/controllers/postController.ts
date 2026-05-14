import type { Request, Response } from "express";
import { prisma } from "../database/prismaClient";

const Errors = {
  ServerError: "ServerError",
} as const;

const postInclude = {
  votes: true,
  memberPostedBy: {
    include: {
      user: true,
    },
  },
  comments: true,
} as const;

function netVoteScore(votes: { voteType: string }[]): number {
  let score = 0;
  for (const v of votes) {
    if (v.voteType === "Upvote") {
      score++;
    } else if (v.voteType === "Downvote") {
      score--;
    }
  }
  return score;
}

export async function getPopularPosts(_req: Request, res: Response): Promise<void> {
  try {
    const posts = await prisma.post.findMany({
      include: postInclude,
    });

    posts.sort((a, b) => {
      const byScore = netVoteScore(b.votes) - netVoteScore(a.votes);
      if (byScore !== 0) {
        return byScore;
      }
      return b.dateCreated.getTime() - a.dateCreated.getTime();
    });

    res.json({
      error: undefined,
      data: { posts },
      success: true,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: Errors.ServerError,
      data: undefined,
      success: false,
    });
  }
}
