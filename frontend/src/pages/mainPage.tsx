import { Layout } from "../components/layout";
import { PostsList, type Post } from "../components/postsList";
import { PostsViewSwitcher } from "../components/postsViewSwitcher";

function votesForPost(postId: number, netScore: number): Post["votes"] {
  const votes: Post["votes"] = [];
  let id = postId * 100;
  for (let i = 0; i < netScore; i++) {
    votes.push({ id: id++, postId, voteType: "Upvote" });
  }
  return votes;
}

export function MainPage() {
  const posts: Post[] = [
    {
      title: "First Post",
      dateCreated: new Date(Date.now() - 2 * 86400000).toISOString(),
      memberPostedBy: { user: { username: "username" } },
      comments: [],
      votes: votesForPost(1, 5),
    },
    {
      title: "Second Post!",
      dateCreated: new Date(Date.now() - 30 * 86400000).toISOString(),
      memberPostedBy: { user: { username: "username" } },
      comments: [{}, {}, {}],
      votes: votesForPost(2, 2),
    },
    {
      title: "Why DDD?",
      dateCreated: new Date(Date.now() - 10 * 86400000).toISOString(),
      memberPostedBy: { user: { username: "username" } },
      comments: [{}, {}, {}],
      votes: votesForPost(3, 7),
    },
  ];

  return (
    <Layout>
      <PostsViewSwitcher />
      <PostsList posts={posts} />
    </Layout>
  );
}
