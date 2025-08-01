import type { NextApiRequest, NextApiResponse } from "next";
import { getSupabaseClient } from "@/lib/supabase";

type Post = {
  id: string;
  user_id: string;
  content: string;
  image_url?: string;
  video_url?: string;
  created_at: string;
  user_profile: { username: string; full_name: string | null; avatar_url: string | null };
  like_count: number;
  comment_count: number;
  is_liked: boolean;
};

type ResponseData = {
  posts?: Post[];
  post?: Post;
  error?: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  // Initialize Supabase client
  const supabase = getSupabaseClient();

  // Validate environment variables
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error("Missing Supabase environment variables:", {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "****" : undefined,
    });
    return res.status(500).json({ error: "Server configuration error: Missing Supabase credentials" });
  }

  if (req.method === "GET") {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = (page - 1) * limit;

      const { data: posts, error } = await supabase
        .from("posts")
        .select(`
          *,
          user_profile:users(username, full_name, avatar_url),
          likes(user_id),
          comments(id)
        `)
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error("Supabase error in GET posts:", error);
        throw new Error(error.message);
      }

      const postsWithCounts = posts?.map((post) => ({
        ...post,
        like_count: post.likes?.length || 0,
        comment_count: post.comments?.length || 0,
        is_liked: false, // Adjust if user session is available
      })) || [];

      return res.status(200).json({ posts: postsWithCounts });
    } catch (error: any) {
      console.error("Error fetching posts:", error.message);
      return res.status(500).json({ error: "Failed to fetch posts" });
    }
  }

  if (req.method === "POST") {
    try {
      const { data, error: userError } = await supabase.auth.getUser();
      const user = data?.user;

      if (userError) {
        console.error("Supabase user authentication error:", userError.message);
        return res.status(401).json({ error: `Unauthorized: ${userError.message}` });
      }
      if (!user) {
        console.error("No user found in session");
        return res.status(401).json({ error: "Unauthorized: No user found" });
      }

      const { content, image_url, video_url } = req.body;

      if (!content?.trim()) {
        return res.status(400).json({ error: "Content is required" });
      }

      const { data: post, error } = await supabase
        .from("posts")
        .insert({
          user_id: user.id,
          content,
          image_url,
          video_url,
          is_public: true,
        })
        .select(`
          *,
          user_profile:users(username, full_name, avatar_url)
        `)
        .single();

      if (error) {
        console.error("Supabase error in POST post:", error);
        throw new Error(error.message);
      }

      return res.status(200).json({ post });
    } catch (error: any) {
      console.error("Error creating post:", error.message);
      return res.status(500).json({ error: "Failed to create post" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
