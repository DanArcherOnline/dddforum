import { useEffect, useState } from "react";
import { Layout } from "../components/layout";
import { PostsList } from "../components/postsList";
import { PostsViewSwitcher } from "../components/postsViewSwitcher";
import { api } from "../api/index";
import type { PostDTO } from "@dddforum/shared/src/api/posts";

export function MainPage() {
  const [posts, setPosts] = useState<PostDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await api.posts.getPopularPosts();
        if (!cancelled) {
          if (!response.success) {
            setError("Could not load posts.");
            setPosts([]);
          } else {
            setPosts(response.data.posts);
          }
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
