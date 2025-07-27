"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { getSupabaseClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Heart, MessageCircle, Share2, Plus, Globe, Lock, MapPin, MoreHorizontal, Bookmark } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface Post {
  id: string
  user_id: string
  content: string
  media_urls: string[]
  post_type: string
  visibility: string
  location: string | null
  tags: string[]
  like_count: number
  comment_count: number
  share_count: number
  created_at: string
  updated_at: string
  users: {
    username: string
    full_name: string
    avatar_url: string
    is_verified: boolean
  }
  is_liked?: boolean
  is_bookmarked?: boolean
}

interface Comment {
  id: string
  post_id: string
  user_id: string
  content: string
  like_count: number
  created_at: string
  users: {
    username: string
    full_name: string
    avatar_url: string
  }
}

export default function FeedPage() {
  const { user } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("for-you")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")

  const [newPost, setNewPost] = useState({
    content: "",
    visibility: "public",
    location: "",
    tags: "",
  })

  const supabase = getSupabaseClient()

  useEffect(() => {
    if (user) {
      fetchPosts()
    }
  }, [user, activeTab])

  const fetchPosts = async () => {
    try {
      let query = supabase
        .from("posts")
        .select(`
          *,
          users (
            username,
            full_name,
            avatar_url,
            is_verified
          )
        `)
        .eq("visibility", "public")
        .order("created_at", { ascending: false })
        .limit(20)

      if (activeTab === "following") {
        // In a real app, you'd filter by followed users
        query = query.eq("visibility", "public")
      }

      const { data, error } = await query

      if (error) throw error

      // Check if posts are liked/bookmarked by current user
      const postsWithInteractions = await Promise.all(
        (data || []).map(async (post) => {
          const [likeResult, bookmarkResult] = await Promise.all([
            supabase.from("likes").select("id").eq("post_id", post.id).eq("user_id", user?.id).single(),
            supabase
              .from("saved_items")
              .select("id")
              .eq("item_id", post.id)
              .eq("item_type", "post")
              .eq("user_id", user?.id)
              .single(),
          ])

          return {
            ...post,
            is_liked: !likeResult.error,
            is_bookmarked: !bookmarkResult.error,
          }
        }),
      )

      setPosts(postsWithInteractions)
    } catch (error) {
      console.error("Error fetching posts:", error)
    } finally {
      setLoading(false)
    }
  }

  const createPost = async () => {
    if (!newPost.content.trim()) return

    try {
      const postData = {
        user_id: user?.id,
        content: newPost.content,
        visibility: newPost.visibility,
        location: newPost.location || null,
        tags: newPost.tags ? newPost.tags.split(",").map((tag) => tag.trim()) : [],
        post_type: "text",
      }

      const { data, error } = await supabase
        .from("posts")
        .insert([postData])
        .select(`
        *,
        users (
          username,
          full_name,
          avatar_url,
          is_verified
        )
      `)
        .single()

      if (error) throw error

      setPosts([{ ...data, is_liked: false, is_bookmarked: false }, ...posts])
      setNewPost({ content: "", visibility: "public", location: "", tags: "" })
      setShowCreateDialog(false)
    } catch (error) {
      console.error("Error creating post:", error)
    }
  }

  const toggleLike = async (postId: string) => {
    try {
      const post = posts.find((p) => p.id === postId)
      if (!post) return

      if (post.is_liked) {
        // Unlike
        await supabase.from("likes").delete().eq("post_id", postId).eq("user_id", user?.id)
        await supabase
          .from("posts")
          .update({ like_count: post.like_count - 1 })
          .eq("id", postId)

        setPosts(posts.map((p) => (p.id === postId ? { ...p, is_liked: false, like_count: p.like_count - 1 } : p)))
      } else {
        // Like
        await supabase.from("likes").insert([{ post_id: postId, user_id: user?.id }])
        await supabase
          .from("posts")
          .update({ like_count: post.like_count + 1 })
          .eq("id", postId)

        setPosts(posts.map((p) => (p.id === postId ? { ...p, is_liked: true, like_count: p.like_count + 1 } : p)))
      }
    } catch (error) {
      console.error("Error toggling like:", error)
    }
  }

  const toggleBookmark = async (postId: string) => {
    try {
      const post = posts.find((p) => p.id === postId)
      if (!post) return

      if (post.is_bookmarked) {
        // Remove bookmark
        await supabase
          .from("saved_items")
          .delete()
          .eq("item_id", postId)
          .eq("item_type", "post")
          .eq("user_id", user?.id)

        setPosts(posts.map((p) => (p.id === postId ? { ...p, is_bookmarked: false } : p)))
      } else {
        // Add bookmark
        await supabase.from("saved_items").insert([
          {
            item_id: postId,
            item_type: "post",
            user_id: user?.id,
          },
        ])

        setPosts(posts.map((p) => (p.id === postId ? { ...p, is_bookmarked: true } : p)))
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error)
    }
  }

  const fetchComments = async (postId: string) => {
    try {
      const { data, error } = await supabase
        .from("comments")
        .select(`
          *,
          users (
            username,
            full_name,
            avatar_url
          )
        `)
        .eq("post_id", postId)
        .order("created_at", { ascending: true })

      if (error) throw error
      setComments(data || [])
    } catch (error) {
      console.error("Error fetching comments:", error)
    }
  }

  const addComment = async () => {
    if (!newComment.trim() || !selectedPost) return

    try {
      const { data, error } = await supabase
        .from("comments")
        .insert([
          {
            post_id: selectedPost.id,
            user_id: user?.id,
            content: newComment,
          },
        ])
        .select(`
        *,
        users (
          username,
          full_name,
          avatar_url
        )
      `)
        .single()

      if (error) throw error

      setComments([...comments, data])
      setNewComment("")

      // Update comment count
      await supabase
        .from("posts")
        .update({
          comment_count: selectedPost.comment_count + 1,
        })
        .eq("id", selectedPost.id)

      setPosts(posts.map((p) => (p.id === selectedPost.id ? { ...p, comment_count: p.comment_count + 1 } : p)))
    } catch (error) {
      console.error("Error adding comment:", error)
    }
  }

  const openComments = (post: Post) => {
    setSelectedPost(post)
    fetchComments(post.id)
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Feed</h1>
            <p className="text-gray-600 mt-1">Stay connected with your community</p>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Post
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Post</DialogTitle>
                <DialogDescription>Share your thoughts with the community</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="content">What's on your mind?</Label>
                  <Textarea
                    id="content"
                    value={newPost.content}
                    onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                    placeholder="Share your thoughts..."
                    rows={4}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="visibility">Visibility</Label>
                    <select
                      id="visibility"
                      value={newPost.visibility}
                      onChange={(e) => setNewPost({ ...newPost, visibility: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="public">Public</option>
                      <option value="followers">Followers Only</option>
                      <option value="private">Private</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="location">Location (Optional)</Label>
                    <Input
                      id="location"
                      value={newPost.location}
                      onChange={(e) => setNewPost({ ...newPost, location: e.target.value })}
                      placeholder="Add location..."
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="tags">Tags (Optional)</Label>
                  <Input
                    id="tags"
                    value={newPost.tags}
                    onChange={(e) => setNewPost({ ...newPost, tags: e.target.value })}
                    placeholder="tag1, tag2, tag3"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createPost}>Post</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Feed Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="for-you">For You</TabsTrigger>
            <TabsTrigger value="following">Following</TabsTrigger>
            <TabsTrigger value="trending">Trending</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Posts */}
        <div className="space-y-6">
          {posts.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
              <p className="text-gray-600 mb-4">Be the first to share something with the community!</p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Post
              </Button>
            </div>
          ) : (
            posts.map((post) => (
              <Card key={post.id} className="bg-white">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={post.users.avatar_url || ""} />
                        <AvatarFallback>
                          {post.users.full_name?.charAt(0) || post.users.username.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-gray-900">{post.users.full_name || post.users.username}</h3>
                          {post.users.is_verified && (
                            <Badge variant="secondary" className="text-xs">
                              Verified
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <span>@{post.users.username}</span>
                          <span>•</span>
                          <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                          {post.visibility === "public" ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-900 mb-4">{post.content}</p>

                  {post.location && (
                    <div className="flex items-center text-sm text-gray-500 mb-3">
                      <MapPin className="h-4 w-4 mr-1" />
                      {post.location}
                    </div>
                  )}

                  {post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {post.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center space-x-6">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleLike(post.id)}
                        className={post.is_liked ? "text-red-600" : "text-gray-500"}
                      >
                        <Heart className={`h-4 w-4 mr-2 ${post.is_liked ? "fill-current" : ""}`} />
                        {post.like_count}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openComments(post)} className="text-gray-500">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        {post.comment_count}
                      </Button>
                      <Button variant="ghost" size="sm" className="text-gray-500">
                        <Share2 className="h-4 w-4 mr-2" />
                        {post.share_count}
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleBookmark(post.id)}
                      className={post.is_bookmarked ? "text-blue-600" : "text-gray-500"}
                    >
                      <Bookmark className={`h-4 w-4 ${post.is_bookmarked ? "fill-current" : ""}`} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Comments Dialog */}
        <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Comments</DialogTitle>
            </DialogHeader>
            {selectedPost && (
              <div className="space-y-4">
                {/* Original Post */}
                <div className="border-b border-gray-200 pb-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <Avatar>
                      <AvatarImage src={selectedPost.users.avatar_url || ""} />
                      <AvatarFallback>
                        {selectedPost.users.full_name?.charAt(0) || selectedPost.users.username.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{selectedPost.users.full_name || selectedPost.users.username}</h3>
                      <p className="text-sm text-gray-500">@{selectedPost.users.username}</p>
                    </div>
                  </div>
                  <p className="text-gray-900">{selectedPost.content}</p>
                </div>

                {/* Comments */}
                <div className="space-y-4 max-h-60 overflow-y-auto">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex items-start space-x-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={comment.users.avatar_url || ""} />
                        <AvatarFallback className="text-xs">
                          {comment.users.full_name?.charAt(0) || comment.users.username.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-sm">{comment.users.full_name || comment.users.username}</h4>
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-900 mt-1">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Comment */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex space-x-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={user?.user_metadata?.avatar_url || ""} />
                      <AvatarFallback className="text-xs">
                        {user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-2">
                      <Textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Write a comment..."
                        rows={2}
                      />
                      <div className="flex justify-end">
                        <Button size="sm" onClick={addComment} disabled={!newComment.trim()}>
                          Comment
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
