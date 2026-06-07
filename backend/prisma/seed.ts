import type { Comment, Post, User, Vote } from "../src/generated/prisma/client";
import { prisma } from "../src/shared/database/prismaClient";

const initialUsers: User[] = [
  {
    id: 1,
    email: "bobvance@gmail.com",
    firstName: "Bob",
    lastName: "Vance",
    username: "bobvance",
    password: "123",
  },
  {
    id: 2,
    email: "tonysoprano@gmail.com",
    firstName: "Tony",
    lastName: "Soprano",
    username: "tonysoprano",
    password: "123",
  },
  {
    id: 3,
    email: "billburr@gmail.com",
    firstName: "Bill",
    lastName: "Burr",
    username: "billburr",
    password: "123",
  },
];


const initialPosts: Post[] = [
  {
    id: 1,
    title: "First post!",
    content: "This is bob vances first post",
    postType: "Text",
    dateCreated: new Date(),
    memberId: 1,
  },
  {
    id: 2,
    title: "Second post!",
    content: "This is bobs second post",
    postType: "Text",
    dateCreated: new Date(),
    memberId: 1,
  },
  {
    id: 3,
    title: "another post",
    content: "This is tonys first post",
    postType: "Text",
    dateCreated: new Date(),
    memberId: 2,
  },
  {
    id: 4,
    title: "Links",
    content: "This is a link post",
    postType: "<https://khalilstemmler.com>",
    dateCreated: new Date(),
    memberId: 2,
  },
];

const initialPostVotes: Vote[] = [
  // Everyone upvotes their own first post
  { id: 1, postId: 1, voteType: "Upvote", memberId: 1 },
  { id: 2, postId: 2, voteType: "Upvote", memberId: 1 },
  { id: 3, postId: 3, voteType: "Upvote", memberId: 2 },
  { id: 4, postId: 4, voteType: "Upvote", memberId: 2 },

  // Tony's post upvoted by Bob
  { id: 5, postId: 3, voteType: "Upvote", memberId: 1 },

  // Bob's second post downvoted by Bill
  { id: 6, postId: 2, voteType: "Downvote", memberId: 3 },
];

const initialPostComments: Comment[] = [
  {
    id: 1,
    text: "I posted this!",
    memberId: 1,
    postId: 1,
    parentCommentId: null,
  },
  { id: 2, text: "Nice", memberId: 2, postId: 2, parentCommentId: null },
];

async function seed() {
  for (const user of initialUsers) {
    const upsertedUser = await prisma.user.upsert({
      where: { id: user.id },
      create: user,
      update: user,
    });

    await prisma.member.upsert({
      where: { userId: upsertedUser.id },
      create: { user: { connect: { id: upsertedUser.id } } },
      update: {},
    });
  }

  for (const post of initialPosts) {
    await prisma.post.upsert({
      where: { id: post.id },
      create: post,
      update: post,
    });
  }

  for (const vote of initialPostVotes) {
    await prisma.vote.upsert({
      where: { id: vote.id },
      create: vote,
      update: vote,
    });
  }

  for (const comment of initialPostComments) {
    await prisma.comment.upsert({
      where: { id: comment.id },
      create: comment,
      update: comment,
    });
  }
}

seed();
