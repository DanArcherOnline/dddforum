import { getApiBaseUrl } from "../api";
import type { Post } from "../components/postsList";

function isVote(value: unknown): boolean {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "number" &&
    typeof v.postId === "number" &&
    (v.voteType === "Upvote" || v.voteType === "Downvote")
  );
}

function isPost(value: unknown): value is Post {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const p = value as Record<string, unknown>;
  if (typeof p.id !== "number" || typeof p.title !== "string") {
    return false;
  }
  if (typeof p.dateCreated !== "string") {
    return false;
  }
  const member = p.memberPostedBy;
  if (typeof member !== "object" || member === null) {
    return false;
  }
  const user = (member as Record<string, unknown>).user;
  if (typeof user !== "object" || user === null) {
    return false;
  }
  if (typeof (user as Record<string, unknown>).username !== "string") {
    return false;
  }
  if (!Array.isArray(p.comments) || !Array.isArray(p.votes)) {
    return false;
  }
  return p.votes.every(isVote);
}

function isPostsApiResponse(value: unknown): value is {
  success: true;
  data: { posts: Post[] };
} {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const o = value as Record<string, unknown>;
  if (o.success !== true) {
    return false;
  }
  if (typeof o.data !== "object" || o.data === null) {
    return false;
  }
  const posts = (o.data as Record<string, unknown>).posts;
  if (!Array.isArray(posts)) {
    return false;
  }
  return posts.every(isPost);
}

export async function getPopularPosts(): Promise<Post[]> {
  const response = await fetch(`${getApiBaseUrl()}/posts/popular`);
  const body: unknown = await response.json().catch(() => undefined);

  if (!response.ok) {
    console.error("getPopularPosts failed", response.status, body);
    throw new Error("Posts request failed.");
  }

  if (!isPostsApiResponse(body)) {
    console.error("getPopularPosts unexpected response shape", body);
    throw new Error("Posts request failed.");
  }

  return body.data.posts;
}
