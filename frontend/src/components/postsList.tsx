import { Link } from "react-router-dom";
import moment from "moment";
import arrow from "../assets/arrow.svg";

type Vote = {
  id: number;
  postId: number;
  voteType: "Upvote" | "Downvote";
};

type Comment = Record<string, unknown>;

export type Post = {
  id: number;
  title: string;
  dateCreated: string;
  memberPostedBy: { user: { username: string } };
  comments: Comment[];
  votes: Vote[];
};

function computeVoteCount(votes: Vote[]) {
  let count = 0;
  votes.forEach((v) => (v.voteType === "Upvote" ? count++ : count--));
  return count;
}

export function PostsList({ posts }: { posts: Post[] }) {
  return (
    <div className="posts-list">
      {posts.map((post) => (
        <div className="post-item" key={post.id}>
          <div className="post-item-votes">
            <div className="post-item-upvote">
              <img src={arrow} alt="" />
            </div>
            <div>{computeVoteCount(post.votes)}</div>
            <div className="post-item-downvote">
              <img src={arrow} alt="" />
            </div>
          </div>
          <div className="post-item-content">
            <div className="post-item-title">{post.title}</div>
            <div className="post-item-details">
              <div>{moment(post.dateCreated).fromNow()}</div>
              <Link to={`/member/${post.memberPostedBy.user.username}`}>
                by {post.memberPostedBy.user.username}
              </Link>
              <div>
                {post.comments.length}{" "}
                {post.comments.length !== 1 ? `comments` : "comment"}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
