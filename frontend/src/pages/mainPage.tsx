import { useEffect, useState } from "react";
import { Layout } from "../components/layout";
import { PostsList, type Post } from "../components/postsList";
import { PostsViewSwitcher } from "../components/postsViewSwitcher";
import { getPopularPosts } from "../network/getPopularPosts";

export function MainPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const nextPosts = await getPopularPosts();
        if (!cancelled) {
          setPosts(nextPosts);
        }
      } catch {
        if (!cancelled) {
          setError("Could not load posts.");
          setPosts([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Layout>
      <PostsViewSwitcher />
      {loading ? (
        <p>Loading posts…</p>
      ) : error !== null ? (
        <p>{error}</p>
      ) : (
        <PostsList posts={posts} />
      )}
    </Layout>
  );
}
