"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { getSupabaseClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
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
  BookOpen,
  Plus,
  Search,
  Star,
  Clock,
  CheckCircle,
  BookmarkPlus,
  Filter,
  Grid,
  List,
  Target,
  TrendingUp,
  Users,
} from "lucide-react"
import { format } from "date-fns"

interface Book {
  id: string
  title: string
  author: string
  genre: string
  description: string
  cover_url: string | null
  file_url: string | null
  total_pages: number
  language: string
  publication_date: string
  publisher: string
  rating: number
  rating_count: number
  created_at: string
}

interface ReadingProgress {
  id: string
  book_id: string
  user_id: string
  current_page: number
  progress_percentage: number
  status: string
  started_at: string
  completed_at: string | null
  notes: string
  is_favorite: boolean
  bookmarks: any[]
}

interface ReadingGoal {
  id: string
  user_id: string
  year: number
  target_books: number
  current_books: number
  target_pages: number
  current_pages: number
}

interface BookCollection {
  id: string
  user_id: string
  name: string
  description: string
  is_public: boolean
  book_count: number
  created_at: string
}

export default function LibraryPage() {
  const { user } = useAuth()
  const [books, setBooks] = useState<Book[]>([])
  const [readingProgress, setReadingProgress] = useState<ReadingProgress[]>([])
  const [readingGoal, setReadingGoal] = useState<ReadingGoal | null>(null)
  const [collections, setCollections] = useState<BookCollection[]>([])
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedGenre, setSelectedGenre] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [activeTab, setActiveTab] = useState("library")
  const [showAddBookDialog, setShowAddBookDialog] = useState(false)
  const [showGoalDialog, setShowGoalDialog] = useState(false)

  const [newBook, setNewBook] = useState({
    title: "",
    author: "",
    genre: "",
    description: "",
    total_pages: "",
    language: "en",
    publisher: "",
  })

  const [newGoal, setNewGoal] = useState({
    target_books: "",
    target_pages: "",
  })

  const supabase = getSupabaseClient()

  const genres = [
    "Fiction",
    "Non-Fiction",
    "Mystery",
    "Romance",
    "Science Fiction",
    "Fantasy",
    "Biography",
    "History",
    "Self-Help",
    "Business",
    "Technology",
    "Other",
  ]

  const statuses = ["to-read", "reading", "completed", "paused"]

  useEffect(() => {
    if (user) {
      fetchBooks()
      fetchReadingProgress()
      fetchReadingGoal()
      fetchCollections()
    }
  }, [user])

  useEffect(() => {
    filterBooks()
  }, [books, readingProgress, searchQuery, selectedGenre, selectedStatus])

  const fetchBooks = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.from("books").select("*").order("created_at", { ascending: false })

      if (error) throw error
      setBooks(data || [])
    } catch (error) {
      console.error("Error fetching books:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchReadingProgress = async () => {
    try {
      const { data, error } = await supabase.from("reading_progress").select("*").eq("user_id", user?.id)

      if (error) throw error
      setReadingProgress(data || [])
    } catch (error) {
      console.error("Error fetching reading progress:", error)
    }
  }

  const fetchReadingGoal = async () => {
    try {
      const currentYear = new Date().getFullYear()
      const { data, error } = await supabase
        .from("reading_goals")
        .select("*")
        .eq("user_id", user?.id)
        .eq("year", currentYear)
        .single()

      if (error && error.code !== "PGRST116") throw error
      setReadingGoal(data)
    } catch (error) {
      console.error("Error fetching reading goal:", error)
    }
  }

  const fetchCollections = async () => {
    try {
      const { data, error } = await supabase
        .from("book_collections")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setCollections(data || [])
    } catch (error) {
      console.error("Error fetching collections:", error)
    }
  }

  const filterBooks = () => {
    let filtered = books

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (book) =>
          book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
          book.genre.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Genre filter
    if (selectedGenre !== "all") {
      filtered = filtered.filter((book) => book.genre === selectedGenre)
    }

    // Status filter
    if (selectedStatus !== "all") {
      const bookIds = readingProgress
        .filter((progress) => progress.status === selectedStatus)
        .map((progress) => progress.book_id)
      filtered = filtered.filter((book) => bookIds.includes(book.id))
    }

    setFilteredBooks(filtered)
  }

  const addBook = async () => {
    if (!newBook.title.trim() || !newBook.author.trim()) return

    try {
      const bookData = {
        user_id: user?.id,
        title: newBook.title,
        author: newBook.author,
        genre: newBook.genre || "Other",
        description: newBook.description,
        total_pages: Number.parseInt(newBook.total_pages) || 0,
        language: newBook.language,
        publisher: newBook.publisher,
      }

      const { data, error } = await supabase.from("books").insert([bookData]).select().single()

      if (error) throw error

      setBooks([data, ...books])
      setNewBook({
        title: "",
        author: "",
        genre: "",
        description: "",
        total_pages: "",
        language: "en",
        publisher: "",
      })
      setShowAddBookDialog(false)
    } catch (error) {
      console.error("Error adding book:", error)
    }
  }

  const updateReadingProgress = async (bookId: string, status: string, currentPage?: number) => {
    try {
      const existingProgress = readingProgress.find((p) => p.book_id === bookId)
      const book = books.find((b) => b.id === bookId)

      if (!book) return

      const progressPercentage = currentPage ? Math.round((currentPage / book.total_pages) * 100) : 0

      const progressData = {
        user_id: user?.id,
        book_id: bookId,
        status,
        current_page: currentPage || 0,
        progress_percentage: progressPercentage,
        started_at: status === "reading" && !existingProgress ? new Date().toISOString() : existingProgress?.started_at,
        completed_at: status === "completed" ? new Date().toISOString() : null,
      }

      if (existingProgress) {
        const { data, error } = await supabase
          .from("reading_progress")
          .update(progressData)
          .eq("id", existingProgress.id)
          .select()
          .single()

        if (error) throw error

        setReadingProgress(readingProgress.map((p) => (p.id === existingProgress.id ? data : p)))
      } else {
        const { data, error } = await supabase.from("reading_progress").insert([progressData]).select().single()

        if (error) throw error

        setReadingProgress([...readingProgress, data])
      }

      // Update reading goal if book is completed
      if (status === "completed" && readingGoal) {
        await supabase
          .from("reading_goals")
          .update({
            current_books: readingGoal.current_books + 1,
            current_pages: readingGoal.current_pages + book.total_pages,
          })
          .eq("id", readingGoal.id)

        setReadingGoal({
          ...readingGoal,
          current_books: readingGoal.current_books + 1,
          current_pages: readingGoal.current_pages + book.total_pages,
        })
      }
    } catch (error) {
      console.error("Error updating reading progress:", error)
    }
  }

  const createReadingGoal = async () => {
    if (!newGoal.target_books) return

    try {
      const goalData = {
        user_id: user?.id,
        year: new Date().getFullYear(),
        target_books: Number.parseInt(newGoal.target_books),
        target_pages: Number.parseInt(newGoal.target_pages) || 0,
        current_books: 0,
        current_pages: 0,
      }

      const { data, error } = await supabase.from("reading_goals").insert([goalData]).select().single()

      if (error) throw error

      setReadingGoal(data)
      setNewGoal({ target_books: "", target_pages: "" })
      setShowGoalDialog(false)
    } catch (error) {
      console.error("Error creating reading goal:", error)
    }
  }

  const getBookProgress = (bookId: string) => {
    return readingProgress.find((p) => p.book_id === bookId)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500"
      case "reading":
        return "bg-blue-500"
      case "paused":
        return "bg-yellow-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "to-read":
        return "To Read"
      case "reading":
        return "Reading"
      case "completed":
        return "Completed"
      case "paused":
        return "Paused"
      default:
        return "Unknown"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading your library...</p>
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
              <BookOpen className="h-8 w-8 text-indigo-600" />
              <h1 className="text-2xl font-bold text-gray-900">Library</h1>
              <Badge variant="secondary">{filteredBooks.length} books</Badge>
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
              <Dialog open={showAddBookDialog} onOpenChange={setShowAddBookDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Book
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add New Book</DialogTitle>
                    <DialogDescription>Add a book to your library</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="title">Title *</Label>
                        <Input
                          id="title"
                          value={newBook.title}
                          onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
                          placeholder="Enter book title..."
                        />
                      </div>
                      <div>
                        <Label htmlFor="author">Author *</Label>
                        <Input
                          id="author"
                          value={newBook.author}
                          onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
                          placeholder="Enter author name..."
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="genre">Genre</Label>
                        <Select
                          value={newBook.genre}
                          onValueChange={(value) => setNewBook({ ...newBook, genre: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select genre" />
                          </SelectTrigger>
                          <SelectContent>
                            {genres.map((genre) => (
                              <SelectItem key={genre} value={genre}>
                                {genre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="pages">Total Pages</Label>
                        <Input
                          id="pages"
                          type="number"
                          value={newBook.total_pages}
                          onChange={(e) => setNewBook({ ...newBook, total_pages: e.target.value })}
                          placeholder="Number of pages..."
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={newBook.description}
                        onChange={(e) => setNewBook({ ...newBook, description: e.target.value })}
                        placeholder="Book description..."
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="language">Language</Label>
                        <Select
                          value={newBook.language}
                          onValueChange={(value) => setNewBook({ ...newBook, language: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="es">Spanish</SelectItem>
                            <SelectItem value="fr">French</SelectItem>
                            <SelectItem value="de">German</SelectItem>
                            <SelectItem value="it">Italian</SelectItem>
                            <SelectItem value="pt">Portuguese</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="publisher">Publisher</Label>
                        <Input
                          id="publisher"
                          value={newBook.publisher}
                          onChange={(e) => setNewBook({ ...newBook, publisher: e.target.value })}
                          placeholder="Publisher name..."
                        />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setShowAddBookDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={addBook}>Add Book</Button>
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
            <TabsTrigger value="library">Library</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
            <TabsTrigger value="goals">Goals</TabsTrigger>
            <TabsTrigger value="collections">Collections</TabsTrigger>
          </TabsList>

          <TabsContent value="library" className="space-y-6">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search books..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                <SelectTrigger className="w-48">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="All Genres" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Genres</SelectItem>
                  {genres.map((genre) => (
                    <SelectItem key={genre} value={genre}>
                      {genre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {statuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {getStatusLabel(status)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Books Grid/List */}
            {filteredBooks.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No books found</h3>
                <p className="text-gray-600 mb-4">
                  {searchQuery || selectedGenre !== "all" || selectedStatus !== "all"
                    ? "Try adjusting your filters"
                    : "Add your first book to get started"}
                </p>
                <Button onClick={() => setShowAddBookDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Book
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
                {filteredBooks.map((book) => {
                  const progress = getBookProgress(book.id)
                  return (
                    <Card key={book.id} className="hover:shadow-md transition-shadow">
                      <div className="aspect-[3/4] bg-gray-100 rounded-t-lg overflow-hidden">
                        {book.cover_url ? (
                          <img
                            src={book.cover_url || "/placeholder.svg"}
                            alt={book.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <BookOpen className="h-12 w-12 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg line-clamp-2">{book.title}</CardTitle>
                        <CardDescription className="line-clamp-1">by {book.author}</CardDescription>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs">
                            {book.genre}
                          </Badge>
                          {book.rating > 0 && (
                            <div className="flex items-center space-x-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              <span className="text-xs text-gray-600">{book.rating.toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        {progress && (
                          <div className="mb-3">
                            <div className="flex items-center justify-between mb-1">
                              <Badge
                                variant="secondary"
                                className={`text-xs ${getStatusColor(progress.status)} text-white`}
                              >
                                {getStatusLabel(progress.status)}
                              </Badge>
                              <span className="text-xs text-gray-500">{progress.progress_percentage}%</span>
                            </div>
                            <Progress value={progress.progress_percentage} className="h-2" />
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateReadingProgress(book.id, "reading")}
                            >
                              <Clock className="h-4 w-4 mr-1" />
                              {progress?.status === "reading" ? "Continue" : "Start"}
                            </Button>
                            {progress?.status === "reading" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateReadingProgress(book.id, "completed")}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          <Button variant="ghost" size="sm">
                            <BookmarkPlus className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="progress" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {readingProgress
                .filter((progress) => progress.status === "reading")
                .map((progress) => {
                  const book = books.find((b) => b.id === progress.book_id)
                  if (!book) return null

                  return (
                    <Card key={progress.id}>
                      <CardHeader>
                        <CardTitle className="text-lg line-clamp-1">{book.title}</CardTitle>
                        <CardDescription>by {book.author}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Progress</span>
                            <span className="text-sm font-medium">{progress.progress_percentage}%</span>
                          </div>
                          <Progress value={progress.progress_percentage} className="h-2" />
                          <div className="flex items-center justify-between text-sm text-gray-600">
                            <span>
                              Page {progress.current_page} of {book.total_pages}
                            </span>
                            <span>{book.total_pages - progress.current_page} pages left</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Input
                              type="number"
                              placeholder="Current page"
                              className="flex-1"
                              max={book.total_pages}
                              min={0}
                            />
                            <Button
                              size="sm"
                              onClick={() => {
                                const input = document.querySelector(
                                  `input[placeholder="Current page"]`,
                                ) as HTMLInputElement
                                if (input && input.value) {
                                  updateReadingProgress(book.id, "reading", Number.parseInt(input.value))
                                }
                              }}
                            >
                              Update
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
            </div>
          </TabsContent>

          <TabsContent value="goals" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Reading Goals</h2>
              {!readingGoal && (
                <Dialog open={showGoalDialog} onOpenChange={setShowGoalDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Target className="h-4 w-4 mr-2" />
                      Set Goal
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Set Reading Goal</DialogTitle>
                      <DialogDescription>Set your reading goal for {new Date().getFullYear()}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="target-books">Target Books *</Label>
                        <Input
                          id="target-books"
                          type="number"
                          value={newGoal.target_books}
                          onChange={(e) => setNewGoal({ ...newGoal, target_books: e.target.value })}
                          placeholder="Number of books to read..."
                        />
                      </div>
                      <div>
                        <Label htmlFor="target-pages">Target Pages (Optional)</Label>
                        <Input
                          id="target-pages"
                          type="number"
                          value={newGoal.target_pages}
                          onChange={(e) => setNewGoal({ ...newGoal, target_pages: e.target.value })}
                          placeholder="Number of pages to read..."
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setShowGoalDialog(false)}>
                          Cancel
                        </Button>
                        <Button onClick={createReadingGoal}>Set Goal</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {readingGoal ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Target className="h-5 w-5 mr-2" />
                      Books Goal {readingGoal.year}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Progress</span>
                        <span className="text-sm font-medium">
                          {readingGoal.current_books} / {readingGoal.target_books} books
                        </span>
                      </div>
                      <Progress value={(readingGoal.current_books / readingGoal.target_books) * 100} className="h-3" />
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">
                          {Math.round((readingGoal.current_books / readingGoal.target_books) * 100)}%
                        </p>
                        <p className="text-sm text-gray-600">Complete</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {readingGoal.target_pages > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <TrendingUp className="h-5 w-5 mr-2" />
                        Pages Goal {readingGoal.year}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Progress</span>
                          <span className="text-sm font-medium">
                            {readingGoal.current_pages.toLocaleString()} / {readingGoal.target_pages.toLocaleString()}{" "}
                            pages
                          </span>
                        </div>
                        <Progress
                          value={(readingGoal.current_pages / readingGoal.target_pages) * 100}
                          className="h-3"
                        />
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600">
                            {Math.round((readingGoal.current_pages / readingGoal.target_pages) * 100)}%
                          </p>
                          <p className="text-sm text-gray-600">Complete</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No reading goal set</h3>
                <p className="text-gray-600 mb-4">Set a reading goal to track your progress throughout the year</p>
                <Button onClick={() => setShowGoalDialog(true)}>
                  <Target className="h-4 w-4 mr-2" />
                  Set Reading Goal
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="collections" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Collections</h2>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Collection
              </Button>
            </div>

            {collections.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No collections yet</h3>
                <p className="text-gray-600 mb-4">Create collections to organize your books by theme or category</p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Collection
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {collections.map((collection) => (
                  <Card key={collection.id} className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardHeader>
                      <CardTitle className="line-clamp-1">{collection.name}</CardTitle>
                      <CardDescription className="line-clamp-2">{collection.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{collection.book_count} books</Badge>
                          {collection.is_public && <Badge variant="secondary">Public</Badge>}
                        </div>
                        <span className="text-xs text-gray-500">
                          {format(new Date(collection.created_at), "MMM d, yyyy")}
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
