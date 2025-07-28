"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/contexts/auth-context"
import { getSupabaseClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Play,
  Plus,
  Search,
  Share2,
  Bookmark,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Upload,
  Grid,
  List,
  Filter,
  TrendingUp,
  Users,
  PlayCircle,
} from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"

interface Video {
  id: string
  user_id: string
  title: string
  description: string
  video_url: string
  thumbnail_url: string | null
  duration: number
  views: number
  likes: number
  dislikes: number
  is_public: boolean
  category: string
  tags: string[]
  created_at: string
  updated_at: string
  users: {
    username: string
    full_name: string
    avatar_url: string
  }
  is_liked?: boolean
  is_disliked?: boolean
  is_bookmarked?: boolean
}

interface VideoComment {
  id: string
  video_id: string
  user_id: string
  parent_id: string | null
  content: string
  timestamp_seconds: number | null
  like_count: number
  created_at: string
  users: {
    username: string
    full_name: string
    avatar_url: string
  }
}

interface Playlist {
  id: string
  user_id: string
  name: string
  description: string
  is_public: boolean
  video_count: number
  total_duration: number
  created_at: string
}

export default function VideosPage() {
  const { user } = useAuth()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videos, setVideos] = useState<Video[]>([])
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [filteredVideos, setFilteredVideos] = useState<Video[]>([])
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  const [comments, setComments] = useState<VideoComment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [activeTab, setActiveTab] = useState("discover")
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [showPlaylistDialog, setShowPlaylistDialog] = useState(false)
  const [newComment, setNewComment] = useState("")

  const [newVideo, setNewVideo] = useState({
    title: "",
    description: "",
    category: "",
    tags: "",
    is_public: true,
  })

  const [newPlaylist, setNewPlaylist] = useState({
    name: "",
    description: "",
    is_public: false,
  })

  const supabase = getSupabaseClient()

  const categories = [
    "Education",
    "Entertainment",
    "Music",
    "Gaming",
    "Technology",
    "Sports",
    "Travel",
    "Cooking",
    "Art",
    "Science",
    "News",
    "Other",
  ]

  useEffect(() => {
    if (user) {
      fetchVideos()
      fetchPlaylists()
    }
  }, [user])

  useEffect(() => {
    filterVideos()
  }, [videos, searchQuery, selectedCategory])

  const fetchVideos = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("videos")
        .select(`
          *,
          users (
            username,
            full_name,
            avatar_url
          )
        `)
        .eq("is_public", true)
        .order("created_at", { ascending: false })

      if (error) throw error

      // Check if videos are liked/disliked/bookmarked by current user
      const videosWithInteractions = await Promise.all(
        (data || []).map(async (video) => {
          const [likeResult, dislikeResult, bookmarkResult] = await Promise.all([
            supabase
              .from("video_interactions")
              .select("id")
              .eq("video_id", video.id)
              .eq("user_id", user?.id)
              .eq("interaction_type", "like")
              .single(),
            supabase
              .from("video_interactions")
              .select("id")
              .eq("video_id", video.id)
              .eq("user_id", user?.id)
              .eq("interaction_type", "dislike")
              .single(),
            supabase
              .from("video_interactions")
              .select("id")
              .eq("video_id", video.id)
              .eq("user_id", user?.id)
              .eq("interaction_type", "bookmark")
              .single(),
          ])

          return {
            ...video,
            is_liked: !likeResult.error,
            is_disliked: !dislikeResult.error,
            is_bookmarked: !bookmarkResult.error,
          }
        }),
      )

      setVideos(videosWithInteractions)
    } catch (error) {
      console.error("Error fetching videos:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPlaylists = async () => {
    try {
      const { data, error } = await supabase
        .from("video_playlists")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setPlaylists(data || [])
    } catch (error) {
      console.error("Error fetching playlists:", error)
    }
  }

  const filterVideos = () => {
    let filtered = videos

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (video) =>
          video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          video.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          video.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
          video.users.username.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter((video) => video.category === selectedCategory)
    }

    setFilteredVideos(filtered)
  }

  const uploadVideo = async () => {
    if (!newVideo.title.trim()) return

    try {
      const videoData = {
        user_id: user?.id,
        title: newVideo.title,
        description: newVideo.description,
        video_url: "/placeholder-video.mp4", // In real app, this would be uploaded file
        thumbnail_url: "/placeholder.svg?height=180&width=320&text=Video",
        duration: 300, // 5 minutes placeholder
        category: newVideo.category || "Other",
        tags: newVideo.tags ? newVideo.tags.split(",").map((tag) => tag.trim()) : [],
        is_public: newVideo.is_public,
      }

      const { data, error } = await supabase
        .from("videos")
        .insert([videoData])
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

      setVideos([{ ...data, is_liked: false, is_disliked: false, is_bookmarked: false }, ...videos])
      setNewVideo({ title: "", description: "", category: "", tags: "", is_public: true })
      setShowUploadDialog(false)
    } catch (error) {
      console.error("Error uploading video:", error)
    }
  }

  const createPlaylist = async () => {
    if (!newPlaylist.name.trim()) return

    try {
      const playlistData = {
        user_id: user?.id,
        name: newPlaylist.name,
        description: newPlaylist.description,
        is_public: newPlaylist.is_public,
      }

      const { data, error } = await supabase.from("video_playlists").insert([playlistData]).select().single()

      if (error) throw error

      setPlaylists([data, ...playlists])
      setNewPlaylist({ name: "", description: "", is_public: false })
      setShowPlaylistDialog(false)
    } catch (error) {
      console.error("Error creating playlist:", error)
    }
  }

  const toggleVideoInteraction = async (videoId: string, interactionType: "like" | "dislike" | "bookmark") => {
    try {
      const video = videos.find((v) => v.id === videoId)
      if (!video) return

      const isCurrentlyInteracted =
        interactionType === "like"
          ? video.is_liked
          : interactionType === "dislike"
            ? video.is_disliked
            : video.is_bookmarked

      if (isCurrentlyInteracted) {
        // Remove interaction
        await supabase
          .from("video_interactions")
          .delete()
          .eq("video_id", videoId)
          .eq("user_id", user?.id)
          .eq("interaction_type", interactionType)

        // Update video counts
        if (interactionType === "like") {
          await supabase
            .from("videos")
            .update({ likes: video.likes - 1 })
            .eq("id", videoId)
        } else if (interactionType === "dislike") {
          await supabase
            .from("videos")
            .update({ dislikes: video.dislikes - 1 })
            .eq("id", videoId)
        }
      } else {
        // Add interaction
        await supabase.from("video_interactions").insert([
          {
            video_id: videoId,
            user_id: user?.id,
            interaction_type: interactionType,
          },
        ])

        // Update video counts
        if (interactionType === "like") {
          await supabase
            .from("videos")
            .update({ likes: video.likes + 1 })
            .eq("id", videoId)

          // Remove dislike if it exists
          if (video.is_disliked) {
            await supabase
              .from("video_interactions")
              .delete()
              .eq("video_id", videoId)
              .eq("user_id", user?.id)
              .eq("interaction_type", "dislike")

            await supabase
              .from("videos")
              .update({ dislikes: video.dislikes - 1 })
              .eq("id", videoId)
          }
        } else if (interactionType === "dislike") {
          await supabase
            .from("videos")
            .update({ dislikes: video.dislikes + 1 })
            .eq("id", videoId)

          // Remove like if it exists
          if (video.is_liked) {
            await supabase
              .from("video_interactions")
              .delete()
              .eq("video_id", videoId)
              .eq("user_id", user?.id)
              .eq("interaction_type", "like")

            await supabase
              .from("videos")
              .update({ likes: video.likes - 1 })
              .eq("id", videoId)
          }
        }
      }

      // Update local state
      setVideos(
        videos.map((v) => {
          if (v.id === videoId) {
            const updates: any = {}
            if (interactionType === "like") {
              updates.is_liked = !isCurrentlyInteracted
              updates.likes = isCurrentlyInteracted ? v.likes - 1 : v.likes + 1
              if (v.is_disliked && !isCurrentlyInteracted) {
                updates.is_disliked = false
                updates.dislikes = v.dislikes - 1
              }
            } else if (interactionType === "dislike") {
              updates.is_disliked = !isCurrentlyInteracted
              updates.dislikes = isCurrentlyInteracted ? v.dislikes - 1 : v.dislikes + 1
              if (v.is_liked && !isCurrentlyInteracted) {
                updates.is_liked = false
                updates.likes = v.likes - 1
              }
            } else if (interactionType === "bookmark") {
              updates.is_bookmarked = !isCurrentlyInteracted
            }
            return { ...v, ...updates }
          }
          return v
        }),
      )
    } catch (error) {
      console.error("Error toggling video interaction:", error)
    }
  }

  const playVideo = (video: Video) => {
    setSelectedVideo(video)
    fetchVideoComments(video.id)

    // Increment view count
    supabase
      .from("videos")
      .update({ views: video.views + 1 })
      .eq("id", video.id)

    setVideos(videos.map((v) => (v.id === video.id ? { ...v, views: v.views + 1 } : v)))
  }

  const fetchVideoComments = async (videoId: string) => {
    try {
      const { data, error } = await supabase
        .from("video_comments")
        .select(`
          *,
          users (
            username,
            full_name,
            avatar_url
          )
        `)
        .eq("video_id", videoId)
        .is("parent_id", null)
        .order("created_at", { ascending: false })

      if (error) throw error
      setComments(data || [])
    } catch (error) {
      console.error("Error fetching comments:", error)
    }
  }

  const addComment = async () => {
    if (!newComment.trim() || !selectedVideo) return

    try {
      const commentData = {
        video_id: selectedVideo.id,
        user_id: user?.id,
        content: newComment,
        timestamp_seconds: videoRef.current?.currentTime || null,
      }

      const { data, error } = await supabase
        .from("video_comments")
        .insert([commentData])
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

      setComments([data, ...comments])
      setNewComment("")
    } catch (error) {
      console.error("Error adding comment:", error)
    }
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading videos...</p>
        </div>
      </div>
    )
  }

  if (selectedVideo) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Button variant="outline" onClick={() => setSelectedVideo(null)} className="mb-6">
            ← Back to Videos
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Video Player */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-black rounded-lg overflow-hidden aspect-video">
                <video
                  ref={videoRef}
                  src={selectedVideo.video_url}
                  controls
                  className="w-full h-full"
                  poster={selectedVideo.thumbnail_url || undefined}
                />
              </div>

              {/* Video Info */}
              <div className="space-y-4">
                <h1 className="text-2xl font-bold text-gray-900">{selectedVideo.title}</h1>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span className="flex items-center">
                      <Eye className="h-4 w-4 mr-1" />
                      {selectedVideo.views.toLocaleString()} views
                    </span>
                    <span>{formatDistanceToNow(new Date(selectedVideo.created_at), { addSuffix: true })}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant={selectedVideo.is_liked ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleVideoInteraction(selectedVideo.id, "like")}
                    >
                      <ThumbsUp className="h-4 w-4 mr-2" />
                      {selectedVideo.likes}
                    </Button>
                    <Button
                      variant={selectedVideo.is_disliked ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleVideoInteraction(selectedVideo.id, "dislike")}
                    >
                      <ThumbsDown className="h-4 w-4 mr-2" />
                      {selectedVideo.dislikes}
                    </Button>
                    <Button
                      variant={selectedVideo.is_bookmarked ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleVideoInteraction(selectedVideo.id, "bookmark")}
                    >
                      <Bookmark className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Creator Info */}
                <div className="flex items-center space-x-4 p-4 bg-white rounded-lg">
                  <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                    {selectedVideo.users.avatar_url ? (
                      <img
                        src={selectedVideo.users.avatar_url || "/placeholder.svg"}
                        alt={selectedVideo.users.full_name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-lg font-semibold text-gray-600">
                        {selectedVideo.users.full_name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{selectedVideo.users.full_name}</h3>
                    <p className="text-sm text-gray-600">@{selectedVideo.users.username}</p>
                  </div>
                  <Button variant="outline">Subscribe</Button>
                </div>

                {/* Description */}
                <div className="bg-white rounded-lg p-4">
                  <p className="text-gray-900 whitespace-pre-wrap">{selectedVideo.description}</p>
                  {selectedVideo.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {selectedVideo.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Comments */}
                <div className="bg-white rounded-lg p-4 space-y-4">
                  <h3 className="text-lg font-semibold">Comments ({comments.length})</h3>

                  {/* Add Comment */}
                  <div className="flex space-x-3">
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                      {user?.user_metadata?.avatar_url ? (
                        <img
                          src={user.user_metadata.avatar_url || "/placeholder.svg"}
                          alt="Your avatar"
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-semibold text-gray-600">
                          {user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <Textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        rows={2}
                      />
                      <div className="flex justify-end">
                        <Button size="sm" onClick={addComment} disabled={!newComment.trim()}>
                          Comment
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Comments List */}
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <div key={comment.id} className="flex space-x-3">
                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                          {comment.users.avatar_url ? (
                            <img
                              src={comment.users.avatar_url || "/placeholder.svg"}
                              alt={comment.users.full_name}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-sm font-semibold text-gray-600">
                              {comment.users.full_name.charAt(0)}
                            </span>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium text-sm">{comment.users.full_name}</h4>
                            <span className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                            </span>
                            {comment.timestamp_seconds && (
                              <Badge variant="outline" className="text-xs">
                                {formatDuration(comment.timestamp_seconds)}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-900 mt-1">{comment.content}</p>
                          <div className="flex items-center space-x-4 mt-2">
                            <Button variant="ghost" size="sm">
                              <ThumbsUp className="h-3 w-3 mr-1" />
                              {comment.like_count}
                            </Button>
                            <Button variant="ghost" size="sm">
                              Reply
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar - Related Videos */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Related Videos</h3>
              <div className="space-y-4">
                {videos
                  .filter((v) => v.id !== selectedVideo.id)
                  .slice(0, 10)
                  .map((video) => (
                    <Card key={video.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <div className="flex space-x-3 p-3">
                        <div className="relative w-32 h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                          <img
                            src={video.thumbnail_url || "/placeholder.svg"}
                            alt={video.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute bottom-1 right-1 bg-black bg-opacity-75 text-white text-xs px-1 rounded">
                            {formatDuration(video.duration)}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm line-clamp-2 mb-1">{video.title}</h4>
                          <p className="text-xs text-gray-600 mb-1">{video.users.full_name}</p>
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <span>{video.views.toLocaleString()} views</span>
                            <span>•</span>
                            <span>{formatDistanceToNow(new Date(video.created_at), { addSuffix: true })}</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Play className="h-8 w-8 text-red-600" />
              <h1 className="text-2xl font-bold text-gray-900">Videos</h1>
              <Badge variant="secondary">{filteredVideos.length}</Badge>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
              <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Video
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Upload New Video</DialogTitle>
                    <DialogDescription>Share your video with the community</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        value={newVideo.title}
                        onChange={(e) => setNewVideo({ ...newVideo, title: e.target.value })}
                        placeholder="Enter video title..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={newVideo.description}
                        onChange={(e) => setNewVideo({ ...newVideo, description: e.target.value })}
                        placeholder="Describe your video..."
                        rows={4}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="category">Category</Label>
                        <Select
                          value={newVideo.category}
                          onValueChange={(value) => setNewVideo({ ...newVideo, category: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="tags">Tags</Label>
                        <Input
                          id="tags"
                          value={newVideo.tags}
                          onChange={(e) => setNewVideo({ ...newVideo, tags: e.target.value })}
                          placeholder="tag1, tag2, tag3"
                        />
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="public"
                        checked={newVideo.is_public}
                        onChange={(e) => setNewVideo({ ...newVideo, is_public: e.target.checked })}
                      />
                      <Label htmlFor="public">Make video public</Label>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={uploadVideo}>Upload Video</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="discover">Discover</TabsTrigger>
            <TabsTrigger value="trending">Trending</TabsTrigger>
            <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
            <TabsTrigger value="playlists">Playlists</TabsTrigger>
          </TabsList>

          <TabsContent value="discover" className="space-y-6">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search videos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Videos Grid/List */}
            {filteredVideos.length === 0 ? (
              <div className="text-center py-12">
                <Play className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No videos found</h3>
                <p className="text-gray-600 mb-4">
                  {searchQuery || selectedCategory !== "all"
                    ? "Try adjusting your search or filters"
                    : "Be the first to upload a video!"}
                </p>
                <Button onClick={() => setShowUploadDialog(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Video
                </Button>
              </div>
            ) : (
              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                    : "space-y-4"
                }
              >
                {filteredVideos.map((video) => (
                  <Card key={video.id} className="hover:shadow-md transition-shadow cursor-pointer">
                    <div className="relative aspect-video bg-gray-100 rounded-t-lg overflow-hidden">
                      <img
                        src={video.thumbnail_url || "/placeholder.svg"}
                        alt={video.title}
                        className="w-full h-full object-cover"
                        onClick={() => playVideo(video)}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all flex items-center justify-center">
                        <PlayCircle className="h-12 w-12 text-white opacity-0 hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                        {formatDuration(video.duration)}
                      </div>
                    </div>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg line-clamp-2" onClick={() => playVideo(video)}>
                        {video.title}
                      </CardTitle>
                      <CardDescription className="line-clamp-1">
                        by {video.users.full_name} • {video.views.toLocaleString()} views •{" "}
                        {formatDistanceToNow(new Date(video.created_at), { addSuffix: true })}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleVideoInteraction(video.id, "like")}
                            className={video.is_liked ? "text-blue-600" : "text-gray-500"}
                          >
                            <ThumbsUp className="h-4 w-4 mr-1" />
                            {video.likes}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleVideoInteraction(video.id, "bookmark")}
                            className={video.is_bookmarked ? "text-yellow-600" : "text-gray-500"}
                          >
                            <Bookmark className="h-4 w-4" />
                          </Button>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {video.category}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="trending" className="space-y-6">
            <div className="text-center py-12">
              <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Trending Videos</h3>
              <p className="text-gray-600">Discover what's popular right now</p>
            </div>
          </TabsContent>

          <TabsContent value="subscriptions" className="space-y-6">
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Your Subscriptions</h3>
              <p className="text-gray-600">Videos from creators you follow will appear here</p>
            </div>
          </TabsContent>

          <TabsContent value="playlists" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Your Playlists</h2>
              <Dialog open={showPlaylistDialog} onOpenChange={setShowPlaylistDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    New Playlist
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Playlist</DialogTitle>
                    <DialogDescription>Organize your favorite videos</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="playlist-name">Playlist Name *</Label>
                      <Input
                        id="playlist-name"
                        value={newPlaylist.name}
                        onChange={(e) => setNewPlaylist({ ...newPlaylist, name: e.target.value })}
                        placeholder="Enter playlist name..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="playlist-description">Description</Label>
                      <Textarea
                        id="playlist-description"
                        value={newPlaylist.description}
                        onChange={(e) => setNewPlaylist({ ...newPlaylist, description: e.target.value })}
                        placeholder="Describe your playlist..."
                        rows={3}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="playlist-public"
                        checked={newPlaylist.is_public}
                        onChange={(e) => setNewPlaylist({ ...newPlaylist, is_public: e.target.checked })}
                      />
                      <Label htmlFor="playlist-public">Make playlist public</Label>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setShowPlaylistDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={createPlaylist}>Create Playlist</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {playlists.length === 0 ? (
              <div className="text-center py-12">
                <PlayCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No playlists yet</h3>
                <p className="text-gray-600 mb-4">Create playlists to organize your favorite videos</p>
                <Button onClick={() => setShowPlaylistDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Playlist
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {playlists.map((playlist) => (
                  <Card key={playlist.id} className="hover:shadow-md transition-shadow cursor-pointer">
                    <div className="aspect-video bg-gradient-to-br from-purple-100 to-pink-100 rounded-t-lg overflow-hidden flex items-center justify-center">
                      <PlayCircle className="h-12 w-12 text-purple-600" />
                    </div>
                    <CardHeader>
                      <CardTitle className="line-clamp-1">{playlist.name}</CardTitle>
                      <CardDescription className="line-clamp-2">{playlist.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{playlist.video_count} videos</Badge>
                          {playlist.is_public && <Badge variant="secondary">Public</Badge>}
                        </div>
                        <span className="text-xs text-gray-500">
                          {format(new Date(playlist.created_at), "MMM d, yyyy")}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
