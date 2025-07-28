"use client"
import { getSupabaseClient } from "@/utils/supabase-client" // Import getSupabaseClient

import { useEffect, useState, useRef } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import {
  MessageCircle,
  Plus,
  Search,
  Send,
  Phone,
  Video,
  MoreHorizontal,
  Users,
  Smile,
  Paperclip,
  ImageIcon,
} from "lucide-react"
import { format } from "date-fns"

interface Conversation {
  id: string
  type: string
  name: string | null
  description: string | null
  avatar_url: string | null
  created_by: string
  is_active: boolean
  settings: any
  created_at: string
  updated_at: string
  participants?: ConversationParticipant[]
  last_message?: Message
  unread_count?: number
}

interface ConversationParticipant {
  id: string
  conversation_id: string
  user_id: string
  role: string
  joined_at: string
  last_read_at: string
  users: {
    username: string
    full_name: string
    avatar_url: string
  }
}

interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string | null
  message_type: string
  media_url: string | null
  reply_to_id: string | null
  is_edited: boolean
  is_deleted: boolean
  created_at: string
  updated_at: string
  users: {
    username: string
    full_name: string
    avatar_url: string
  }
}

export default function ChatPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [newConversation, setNewConversation] = useState({
    name: "",
    description: "",
    type: "group",
  })

  const supabase = getSupabaseClient()

  useEffect(() => {
    if (!user) {
      router.push("/auth/login")
      return
    }
    fetchConversations()
  }, [user, router])

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id)
      markAsRead(selectedConversation.id)
    }
  }, [selectedConversation])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const fetchConversations = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("conversation_participants")
        .select(`
          conversations (
            id,
            type,
            name,
            description,
            avatar_url,
            created_by,
            is_active,
            settings,
            created_at,
            updated_at
          )
        `)
        .eq("user_id", user?.id)

      if (error) throw error

      const conversationsList = data?.map((item) => item.conversations).filter(Boolean) || []

      // Fetch last message and unread count for each conversation
      const conversationsWithDetails = await Promise.all(
        conversationsList.map(async (conv) => {
          const [lastMessageResult, unreadResult] = await Promise.all([
            supabase
              .from("messages")
              .select(`
                *,
                users (
                  username,
                  full_name,
                  avatar_url
                )
              `)
              .eq("conversation_id", conv.id)
              .order("created_at", { ascending: false })
              .limit(1)
              .single(),
            supabase
              .from("messages")
              .select("id", { count: "exact" })
              .eq("conversation_id", conv.id)
              .gt("created_at", new Date().toISOString()), // This would be the user's last_read_at in real implementation
          ])

          return {
            ...conv,
            last_message: lastMessageResult.data,
            unread_count: unreadResult.count || 0,
          }
        }),
      )

      setConversations(conversationsWithDetails)
    } catch (error) {
      console.error("Error fetching conversations:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select(`
          *,
          users (
            username,
            full_name,
            avatar_url
          )
        `)
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error("Error fetching messages:", error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return

    try {
      const messageData = {
        conversation_id: selectedConversation.id,
        sender_id: user?.id,
        content: newMessage,
        message_type: "text",
      }

      const { data, error } = await supabase
        .from("messages")
        .insert([messageData])
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

      setMessages([...messages, data])
      setNewMessage("")
    } catch (error) {
      console.error("Error sending message:", error)
    }
  }

  const createConversation = async () => {
    if (!newConversation.name.trim()) return

    try {
      const conversationData = {
        type: newConversation.type,
        name: newConversation.name,
        description: newConversation.description || null,
        created_by: user?.id,
      }

      const { data: conversation, error: convError } = await supabase
        .from("conversations")
        .insert([conversationData])
        .select()
        .single()

      if (convError) throw convError

      // Add creator as participant
      const { error: participantError } = await supabase.from("conversation_participants").insert([
        {
          conversation_id: conversation.id,
          user_id: user?.id,
          role: "admin",
        },
      ])

      if (participantError) throw participantError

      setConversations([conversation, ...conversations])
      setNewConversation({ name: "", description: "", type: "group" })
      setShowCreateDialog(false)
    } catch (error) {
      console.error("Error creating conversation:", error)
    }
  }

  const markAsRead = async (conversationId: string) => {
    try {
      await supabase
        .from("conversation_participants")
        .update({ last_read_at: new Date().toISOString() })
        .eq("conversation_id", conversationId)
        .eq("user_id", user?.id)
    } catch (error) {
      console.error("Error marking as read:", error)
    }
  }

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.description?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="h-[calc(100vh-4rem)] bg-white flex">
      {/* Sidebar */}
      <div className="w-80 border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-gray-900">Messages</h1>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Conversation</DialogTitle>
                  <DialogDescription>Start a new group conversation</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Conversation Name</Label>
                    <Input
                      id="name"
                      value={newConversation.name}
                      onChange={(e) => setNewConversation({ ...newConversation, name: e.target.value })}
                      placeholder="Enter conversation name..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      value={newConversation.description}
                      onChange={(e) => setNewConversation({ ...newConversation, description: e.target.value })}
                      placeholder="Describe the conversation..."
                      rows={3}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={createConversation}>Create</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="px-4 pt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all" className="text-xs">
              All
            </TabsTrigger>
            <TabsTrigger value="direct" className="text-xs">
              Direct
            </TabsTrigger>
            <TabsTrigger value="group" className="text-xs">
              Groups
            </TabsTrigger>
            <TabsTrigger value="unread" className="text-xs">
              Unread
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Conversations List */}
        <ScrollArea className="flex-1 p-2">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">No conversations found</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer hover:bg-gray-50 ${
                    selectedConversation?.id === conversation.id ? "bg-blue-50 border-l-4 border-blue-500" : ""
                  }`}
                  onClick={() => setSelectedConversation(conversation)}
                >
                  <div className="relative">
                    <Avatar>
                      <AvatarImage src={conversation.avatar_url || ""} />
                      <AvatarFallback>
                        {conversation.type === "group" ? (
                          <Users className="h-4 w-4" />
                        ) : (
                          conversation.name?.charAt(0) || "C"
                        )}
                      </AvatarFallback>
                    </Avatar>
                    {conversation.unread_count && conversation.unread_count > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                        {conversation.unread_count}
                      </Badge>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900 truncate">
                        {conversation.name || "Unnamed Conversation"}
                      </h3>
                      {conversation.last_message && (
                        <span className="text-xs text-gray-500">
                          {format(new Date(conversation.last_message.created_at), "HH:mm")}
                        </span>
                      )}
                    </div>
                    {conversation.last_message && (
                      <p className="text-sm text-gray-600 truncate">
                        {conversation.last_message.users.username}: {conversation.last_message.content}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src={selectedConversation.avatar_url || ""} />
                    <AvatarFallback>
                      {selectedConversation.type === "group" ? (
                        <Users className="h-4 w-4" />
                      ) : (
                        selectedConversation.name?.charAt(0) || "C"
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="font-semibold text-gray-900">
                      {selectedConversation.name || "Unnamed Conversation"}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {selectedConversation.type === "group" ? "Group conversation" : "Direct message"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender_id === user?.id ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`flex items-start space-x-2 max-w-xs lg:max-w-md ${
                        message.sender_id === user?.id ? "flex-row-reverse space-x-reverse" : ""
                      }`}
                    >
                      {message.sender_id !== user?.id && (
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={message.users.avatar_url || ""} />
                          <AvatarFallback className="text-xs">
                            {message.users.full_name?.charAt(0) || message.users.username.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={`rounded-lg px-3 py-2 ${
                          message.sender_id === user?.id ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
                        }`}
                      >
                        {message.sender_id !== user?.id && (
                          <p className="text-xs font-medium mb-1">
                            {message.users.full_name || message.users.username}
                          </p>
                        )}
                        <p className="text-sm">{message.content}</p>
                        <p
                          className={`text-xs mt-1 ${
                            message.sender_id === user?.id ? "text-blue-100" : "text-gray-500"
                          }`}
                        >
                          {format(new Date(message.created_at), "HH:mm")}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <ImageIcon className="h-4 w-4" />
                </Button>
                <div className="flex-1 relative">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        sendMessage()
                      }
                    }}
                  />
                </div>
                <Button variant="ghost" size="sm">
                  <Smile className="h-4 w-4" />
                </Button>
                <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
              <p className="text-gray-600 mb-4">Choose a conversation from the sidebar to start messaging</p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Start New Conversation
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
