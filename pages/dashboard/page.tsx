"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  FileText,
  Palette,
  MessageCircle,
  Users,
  Map,
  BookOpen,
  Play,
  Brain,
  TrendingUp,
  Calendar,
  Clock,
  Star,
  Activity,
  Plus,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"

interface DashboardStats {
  notes_count: number
  drawings_count: number
  posts_count: number
  conversations_count: number
  maps_count: number
  books_count: number
  videos_count: number
  quizzes_count: number
}

interface RecentActivity {
  id: string
  type: string
  title: string
  description: string
  created_at: string
  metadata: any
}

interface QuickAction {
  name: string
  description: string
  href: string
  icon: any
  color: string
}

export default function DashboardPage() {
  const { user, userProfile } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    notes_count: 0,
    drawings_count: 0,
    posts_count: 0,
    conversations_count: 0,
    maps_count: 0,
    books_count: 0,
    videos_count: 0,
    quizzes_count: 0,
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = getSupabaseClient()

  const quickActions: QuickAction[] = [
    {
      name: "Create Note",
      description: "Write down your thoughts",
      href: "/notes",
      icon: FileText,
      color: "bg-blue-500",
    },
    {
      name: "New Drawing",
      description: "Start a creative project",
      href: "/drawings",
      icon: Palette,
      color: "bg-purple-500",
    },
    {
      name: "Share Post",
      description: "Connect with community",
      href: "/feed",
      icon: Users,
      color: "bg-green-500",
    },
    {
      name: "Start Chat",
      description: "Message your friends",
      href: "/chat",
      icon: MessageCircle,
      color: "bg-yellow-500",
    },
  ]

  useEffect(() => {
    if (!user) {
      router.push("/auth/login")
      return
    }
    fetchDashboardData()
  }, [user, router])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      // Fetch counts for each feature
      const [
        notesResult,
        drawingsResult,
        postsResult,
        conversationsResult,
        mapsResult,
        booksResult,
        videosResult,
        quizzesResult,
        activityResult,
      ] = await Promise.all([
        supabase.from("notes").select("id", { count: "exact" }).eq("user_id", user?.id),
        supabase.from("drawings").select("id", { count: "exact" }).eq("user_id", user?.id),
        supabase.from("posts").select("id", { count: "exact" }).eq("user_id", user?.id),
        supabase.from("conversation_participants").select("id", { count: "exact" }).eq("user_id", user?.id),
        supabase.from("maps").select("id", { count: "exact" }).eq("user_id", user?.id),
        supabase.from("books").select("id", { count: "exact" }).eq("user_id", user?.id),
        supabase.from("videos").select("id", { count: "exact" }).eq("user_id", user?.id),
        supabase.from("quizzes").select("id", { count: "exact" }).eq("user_id", user?.id),
        supabase
          .from("user_activity")
          .select("*")
          .eq("user_id", user?.id)
          .order("created_at", { ascending: false })
          .limit(10),
      ])

      setStats({
        notes_count: notesResult.count || 0,
        drawings_count: drawingsResult.count || 0,
        posts_count: postsResult.count || 0,
        conversations_count: conversationsResult.count || 0,
        maps_count: mapsResult.count || 0,
        books_count: booksResult.count || 0,
        videos_count: videosResult.count || 0,
        quizzes_count: quizzesResult.count || 0,
      })

      // Process recent activity
      const activities = (activityResult.data || []).map((activity) => ({
        id: activity.id,
        type: activity.activity_type,
        title: getActivityTitle(activity.activity_type, activity.metadata),
        description: getActivityDescription(activity.activity_type, activity.metadata),
        created_at: activity.created_at,
        metadata: activity.metadata,
      }))

      setRecentActivity(activities)
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const getActivityTitle = (type: string, metadata: any) => {
    switch (type) {
      case "note_created":
        return "Created a new note"
      case "drawing_created":
        return "Started a new drawing"
      case "post_created":
        return "Shared a new post"
      case "message_sent":
        return "Sent a message"
      case "map_created":
        return "Created a new map"
      case "book_added":
        return "Added a book to library"
      case "video_uploaded":
        return "Uploaded a video"
      case "quiz_created":
        return "Created a quiz"
      case "quiz_completed":
        return "Completed a quiz"
      default:
        return "Activity"
    }
  }

  const getActivityDescription = (type: string, metadata: any) => {
    switch (type) {
      case "note_created":
        return `Note: ${metadata?.title || "Untitled"}`
      case "drawing_created":
        return `Drawing: ${metadata?.title || "Untitled"}`
      case "post_created":
        return metadata?.content?.substring(0, 50) + "..." || "New post"
      case "message_sent":
        return "In a conversation"
      case "map_created":
        return `Map: ${metadata?.title || "Untitled"}`
      case "book_added":
        return `Book: ${metadata?.title || "Unknown"}`
      case "video_uploaded":
        return `Video: ${metadata?.title || "Untitled"}`
      case "quiz_created":
        return `Quiz: ${metadata?.title || "Untitled"}`
      case "quiz_completed":
        return `Score: ${metadata?.score || 0}%`
      default:
        return "Recent activity"
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "note_created":
        return FileText
      case "drawing_created":
        return Palette
      case "post_created":
        return Users
      case "message_sent":
        return MessageCircle
      case "map_created":
        return Map
      case "book_added":
        return BookOpen
      case "video_uploaded":
        return Play
      case "quiz_created":
      case "quiz_completed":
        return Brain
      default:
        return Activity
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={userProfile?.avatar_url || ""} />
              <AvatarFallback className="text-xl">
                {userProfile?.full_name?.charAt(0) || user?.email?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {userProfile?.full_name?.split(" ")[0] || "User"}!
              </h1>
              <p className="text-gray-600">Here's what's happening in your SafeSocial world</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Plus className="h-5 w-5 mr-2" />
                  Quick Actions
                </CardTitle>
                <CardDescription>Jump into your favorite activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {quickActions.map((action) => {
                    const IconComponent = action.icon
                    return (
                      <Link key={action.name} href={action.href}>
                        <div className="flex items-center space-x-3 p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer">
                          <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center`}>
                            <IconComponent className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">{action.name}</h3>
                            <p className="text-sm text-gray-500">{action.description}</p>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Stats Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Your Activity
                </CardTitle>
                <CardDescription>Overview of your content and engagement</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{stats.notes_count}</div>
                    <div className="text-sm text-gray-600">Notes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{stats.drawings_count}</div>
                    <div className="text-sm text-gray-600">Drawings</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{stats.posts_count}</div>
                    <div className="text-sm text-gray-600">Posts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{stats.conversations_count}</div>
                    <div className="text-sm text-gray-600">Chats</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{stats.maps_count}</div>
                    <div className="text-sm text-gray-600">Maps</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-indigo-600">{stats.books_count}</div>
                    <div className="text-sm text-gray-600">Books</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-pink-600">{stats.videos_count}</div>
                    <div className="text-sm text-gray-600">Videos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{stats.quizzes_count}</div>
                    <div className="text-sm text-gray-600">Quizzes</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Recent Activity
                </CardTitle>
                <CardDescription>Your latest actions across the platform</CardDescription>
              </CardHeader>
              <CardContent>
                {recentActivity.length === 0 ? (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No recent activity</p>
                    <p className="text-sm text-gray-500">Start creating content to see your activity here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentActivity.map((activity) => {
                      const IconComponent = getActivityIcon(activity.type)
                      return (
                        <div key={activity.id} className="flex items-start space-x-3">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <IconComponent className="h-4 w-4 text-gray-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                            <p className="text-sm text-gray-500">{activity.description}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Today's Focus */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Today's Focus
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Daily Goal Progress</span>
                    <span className="text-sm font-medium">3/5</span>
                  </div>
                  <Progress value={60} className="h-2" />
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Write 2 notes</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Share 1 post</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Read 30 minutes</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                      <span className="text-sm text-gray-600">Complete 1 quiz</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                      <span className="text-sm text-gray-600">Create 1 drawing</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Star className="h-5 w-5 mr-2" />
                  Achievements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      🏆 Creator
                    </Badge>
                    <span className="text-sm text-gray-600">Created 10+ items</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      📚 Reader
                    </Badge>
                    <span className="text-sm text-gray-600">Read 5+ books</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      💬 Social
                    </Badge>
                    <span className="text-sm text-gray-600">Active in community</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Upcoming */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Upcoming
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-gray-600">
                    <p className="font-medium">Book Club Meeting</p>
                    <p className="text-xs text-gray-500">Tomorrow at 7:00 PM</p>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p className="font-medium">Quiz Deadline</p>
                    <p className="text-xs text-gray-500">Due in 3 days</p>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p className="font-medium">Reading Goal</p>
                    <p className="text-xs text-gray-500">2 books left this month</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
