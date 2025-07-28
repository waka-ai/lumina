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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
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
  Brain,
  Plus,
  Search,
  Clock,
  Trophy,
  Target,
  CheckCircle,
  XCircle,
  Play,
  BarChart3,
  Filter,
  Grid,
  List,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface Quiz {
  id: string
  user_id: string
  title: string
  description: string
  category: string
  difficulty: string
  questions_count: number
  time_limit: number | null
  is_public: boolean
  is_timed: boolean
  passing_score: number
  max_attempts: number | null
  created_at: string
  updated_at: string
  users: {
    username: string
    full_name: string
    avatar_url: string
  }
}

interface Question {
  id: string
  quiz_id: string
  question_text: string
  question_type: string
  options: string[]
  correct_answer: string
  explanation: string
  points: number
  order_index: number
  image_url: string | null
}

interface QuizAttempt {
  id: string
  quiz_id: string
  user_id: string
  score: number
  max_score: number
  percentage: number
  time_taken: number
  answers: any
  passed: boolean
  attempt_number: number
  completed_at: string
}

export default function QuizPage() {
  const { user } = useAuth()
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [filteredQuizzes, setFilteredQuizzes] = useState<Quiz[]>([])
  const [myAttempts, setMyAttempts] = useState<QuizAttempt[]>([])
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [quizStarted, setQuizStarted] = useState(false)
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedDifficulty, setSelectedDifficulty] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [activeTab, setActiveTab] = useState("discover")
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  const [newQuiz, setNewQuiz] = useState({
    title: "",
    description: "",
    category: "",
    difficulty: "medium",
    time_limit: "",
    passing_score: "70",
    is_public: true,
    is_timed: false,
  })

  const supabase = getSupabaseClient()

  const categories = [
    "General Knowledge",
    "Science",
    "History",
    "Geography",
    "Literature",
    "Mathematics",
    "Technology",
    "Sports",
    "Entertainment",
    "Art",
    "Music",
    "Other",
  ]

  const difficulties = ["easy", "medium", "hard"]

  useEffect(() => {
    if (user) {
      fetchQuizzes()
      fetchMyAttempts()
    }
  }, [user])

  useEffect(() => {
    filterQuizzes()
  }, [quizzes, searchQuery, selectedCategory, selectedDifficulty])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (quizStarted && timeLeft !== null && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev === null || prev <= 1) {
            submitQuiz()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [quizStarted, timeLeft])

  const fetchQuizzes = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("quizzes")
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
      setQuizzes(data || [])
    } catch (error) {
      console.error("Error fetching quizzes:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMyAttempts = async () => {
    try {
      const { data, error } = await supabase
        .from("quiz_attempts")
        .select("*")
        .eq("user_id", user?.id)
        .order("completed_at", { ascending: false })

      if (error) throw error
      setMyAttempts(data || [])
    } catch (error) {
      console.error("Error fetching attempts:", error)
    }
  }

  const filterQuizzes = () => {
    let filtered = quizzes

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (quiz) =>
          quiz.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          quiz.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          quiz.category.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter((quiz) => quiz.category === selectedCategory)
    }

    // Difficulty filter
    if (selectedDifficulty !== "all") {
      filtered = filtered.filter((quiz) => quiz.difficulty === selectedDifficulty)
    }

    setFilteredQuizzes(filtered)
  }

  const createQuiz = async () => {
    if (!newQuiz.title.trim()) return

    try {
      const quizData = {
        user_id: user?.id,
        title: newQuiz.title,
        description: newQuiz.description,
        category: newQuiz.category || "Other",
        difficulty: newQuiz.difficulty,
        time_limit: newQuiz.is_timed ? Number.parseInt(newQuiz.time_limit) * 60 : null, // Convert to seconds
        passing_score: Number.parseInt(newQuiz.passing_score),
        is_public: newQuiz.is_public,
        is_timed: newQuiz.is_timed,
        questions_count: 0,
      }

      const { data, error } = await supabase
        .from("quizzes")
        .insert([quizData])
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

      setQuizzes([data, ...quizzes])
      setNewQuiz({
        title: "",
        description: "",
        category: "",
        difficulty: "medium",
        time_limit: "",
        passing_score: "70",
        is_public: true,
        is_timed: false,
      })
      setShowCreateDialog(false)
    } catch (error) {
      console.error("Error creating quiz:", error)
    }
  }

  const startQuiz = async (quiz: Quiz) => {
    try {
      // Fetch questions for the quiz
      const { data: questionsData, error } = await supabase
        .from("questions")
        .select("*")
        .eq("quiz_id", quiz.id)
        .order("order_index", { ascending: true })

      if (error) throw error

      setCurrentQuiz(quiz)
      setQuestions(questionsData || [])
      setCurrentQuestionIndex(0)
      setAnswers({})
      setQuizStarted(true)
      setQuizCompleted(false)

      // Set timer if quiz is timed
      if (quiz.is_timed && quiz.time_limit) {
        setTimeLeft(quiz.time_limit)
      }
    } catch (error) {
      console.error("Error starting quiz:", error)
    }
  }

  const submitQuiz = async () => {
    if (!currentQuiz || !questions.length) return

    try {
      // Calculate score
      let correctAnswers = 0
      let totalPoints = 0
      let earnedPoints = 0

      questions.forEach((question) => {
        totalPoints += question.points
        const userAnswer = answers[question.id]
        if (userAnswer === question.correct_answer) {
          correctAnswers++
          earnedPoints += question.points
        }
      })

      const percentage = Math.round((earnedPoints / totalPoints) * 100)
      const passed = percentage >= currentQuiz.passing_score

      // Get attempt number
      const existingAttempts = myAttempts.filter((attempt) => attempt.quiz_id === currentQuiz.id)
      const attemptNumber = existingAttempts.length + 1

      const attemptData = {
        quiz_id: currentQuiz.id,
        user_id: user?.id,
        score: earnedPoints,
        max_score: totalPoints,
        percentage,
        time_taken: currentQuiz.time_limit ? currentQuiz.time_limit - (timeLeft || 0) : 0,
        answers,
        passed,
        attempt_number: attemptNumber,
      }

      const { data, error } = await supabase.from("quiz_attempts").insert([attemptData]).select().single()

      if (error) throw error

      setMyAttempts([data, ...myAttempts])
      setQuizCompleted(true)
      setQuizStarted(false)
    } catch (error) {
      console.error("Error submitting quiz:", error)
    }
  }

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else {
      submitQuiz()
    }
  }

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }))
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-500"
      case "medium":
        return "bg-yellow-500"
      case "hard":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getAttemptResult = (quizId: string) => {
    return myAttempts.find((attempt) => attempt.quiz_id === quizId)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading quizzes...</p>
        </div>
      </div>
    )
  }

  // Quiz Taking Interface
  if (quizStarted && currentQuiz && questions.length > 0) {
    const currentQuestion = questions[currentQuestionIndex]
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Quiz Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-900">{currentQuiz.title}</h1>
              {timeLeft !== null && (
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-red-500" />
                  <span className={`font-mono text-lg ${timeLeft < 60 ? "text-red-500" : "text-gray-900"}`}>
                    {formatTime(timeLeft)}
                  </span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>
                  Question {currentQuestionIndex + 1} of {questions.length}
                </span>
                <span>{Math.round(progress)}% Complete</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </div>

          {/* Question */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{currentQuestion.question_text}</h2>
              {currentQuestion.image_url && (
                <img
                  src={currentQuestion.image_url || "/placeholder.svg"}
                  alt="Question"
                  className="max-w-full h-auto rounded-lg mb-4"
                />
              )}
            </div>

            {/* Answer Options */}
            <div className="space-y-3">
              {currentQuestion.question_type === "multiple_choice" && (
                <RadioGroup
                  value={answers[currentQuestion.id] || ""}
                  onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
                >
                  {currentQuestion.options.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <RadioGroupItem value={option} id={`option-${index}`} />
                      <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}

              {currentQuestion.question_type === "true_false" && (
                <RadioGroup
                  value={answers[currentQuestion.id] || ""}
                  onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="true" id="true" />
                    <Label htmlFor="true" className="cursor-pointer">
                      True
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="false" id="false" />
                    <Label htmlFor="false" className="cursor-pointer">
                      False
                    </Label>
                  </div>
                </RadioGroup>
              )}

              {currentQuestion.question_type === "short_answer" && (
                <Input
                  value={answers[currentQuestion.id] || ""}
                  onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                  placeholder="Enter your answer..."
                  className="w-full"
                />
              )}

              {currentQuestion.question_type === "essay" && (
                <Textarea
                  value={answers[currentQuestion.id] || ""}
                  onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                  placeholder="Write your essay answer..."
                  rows={6}
                  className="w-full"
                />
              )}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={previousQuestion} disabled={currentQuestionIndex === 0}>
              Previous
            </Button>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {Object.keys(answers).length} of {questions.length} answered
              </span>
              <Button
                onClick={currentQuestionIndex === questions.length - 1 ? submitQuiz : nextQuestion}
                disabled={!answers[currentQuestion.id]}
              >
                {currentQuestionIndex === questions.length - 1 ? "Submit Quiz" : "Next"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Quiz Results
  if (quizCompleted && currentQuiz) {
    const lastAttempt = myAttempts.find((attempt) => attempt.quiz_id === currentQuiz.id)

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="mb-6">
              {lastAttempt?.passed ? (
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              ) : (
                <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              )}
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {lastAttempt?.passed ? "Congratulations!" : "Quiz Complete"}
              </h1>
              <p className="text-gray-600">
                {lastAttempt?.passed
                  ? "You passed the quiz!"
                  : `You need ${currentQuiz.passing_score}% to pass. Try again!`}
              </p>
            </div>

            {lastAttempt && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">{lastAttempt.percentage}%</div>
                  <div className="text-sm text-gray-600">Score</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {lastAttempt.score}/{lastAttempt.max_score}
                  </div>
                  <div className="text-sm text-gray-600">Points</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-2">{formatTime(lastAttempt.time_taken)}</div>
                  <div className="text-sm text-gray-600">Time Taken</div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-center space-x-4">
              <Button onClick={() => setCurrentQuiz(null)}>Back to Quizzes</Button>
              {!lastAttempt?.passed && (
                <Button variant="outline" onClick={() => startQuiz(currentQuiz)}>
                  Try Again
                </Button>
              )}
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
              <Brain className="h-8 w-8 text-purple-600" />
              <h1 className="text-2xl font-bold text-gray-900">Quizzes</h1>
              <Badge variant="secondary">{filteredQuizzes.length}</Badge>
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
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Quiz
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Quiz</DialogTitle>
                    <DialogDescription>Create an interactive quiz for the community</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">Quiz Title *</Label>
                      <Input
                        id="title"
                        value={newQuiz.title}
                        onChange={(e) => setNewQuiz({ ...newQuiz, title: e.target.value })}
                        placeholder="Enter quiz title..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={newQuiz.description}
                        onChange={(e) => setNewQuiz({ ...newQuiz, description: e.target.value })}
                        placeholder="Describe your quiz..."
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="category">Category</Label>
                        <Select
                          value={newQuiz.category}
                          onValueChange={(value) => setNewQuiz({ ...newQuiz, category: value })}
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
                        <Label htmlFor="difficulty">Difficulty</Label>
                        <Select
                          value={newQuiz.difficulty}
                          onValueChange={(value) => setNewQuiz({ ...newQuiz, difficulty: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {difficulties.map((difficulty) => (
                              <SelectItem key={difficulty} value={difficulty}>
                                {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="passing-score">Passing Score (%)</Label>
                        <Input
                          id="passing-score"
                          type="number"
                          min="0"
                          max="100"
                          value={newQuiz.passing_score}
                          onChange={(e) => setNewQuiz({ ...newQuiz, passing_score: e.target.value })}
                          placeholder="70"
                        />
                      </div>
                      <div>
                        <Label htmlFor="time-limit">Time Limit (minutes)</Label>
                        <Input
                          id="time-limit"
                          type="number"
                          min="1"
                          value={newQuiz.time_limit}
                          onChange={(e) => setNewQuiz({ ...newQuiz, time_limit: e.target.value })}
                          placeholder="30"
                          disabled={!newQuiz.is_timed}
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="timed"
                          checked={newQuiz.is_timed}
                          onCheckedChange={(checked) => setNewQuiz({ ...newQuiz, is_timed: !!checked })}
                        />
                        <Label htmlFor="timed">Enable time limit</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="public"
                          checked={newQuiz.is_public}
                          onCheckedChange={(checked) => setNewQuiz({ ...newQuiz, is_public: !!checked })}
                        />
                        <Label htmlFor="public">Make quiz public</Label>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={createQuiz}>Create Quiz</Button>
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
            <TabsTrigger value="my-quizzes">My Quizzes</TabsTrigger>
            <TabsTrigger value="attempts">My Attempts</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="discover" className="space-y-6">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search quizzes..."
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
              <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Difficulties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Difficulties</SelectItem>
                  {difficulties.map((difficulty) => (
                    <SelectItem key={difficulty} value={difficulty}>
                      {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Quizzes Grid/List */}
            {filteredQuizzes.length === 0 ? (
              <div className="text-center py-12">
                <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No quizzes found</h3>
                <p className="text-gray-600 mb-4">
                  {searchQuery || selectedCategory !== "all" || selectedDifficulty !== "all"
                    ? "Try adjusting your filters"
                    : "Be the first to create a quiz!"}
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Quiz
                </Button>
              </div>
            ) : (
              <div
                className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}
              >
                {filteredQuizzes.map((quiz) => {
                  const attempt = getAttemptResult(quiz.id)
                  return (
                    <Card key={quiz.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="line-clamp-2 mb-2">{quiz.title}</CardTitle>
                            <CardDescription className="line-clamp-3">{quiz.description}</CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs">
                              {quiz.category}
                            </Badge>
                            <Badge
                              variant="secondary"
                              className={`text-xs text-white ${getDifficultyColor(quiz.difficulty)}`}
                            >
                              {quiz.difficulty.charAt(0).toUpperCase() + quiz.difficulty.slice(1)}
                            </Badge>
                          </div>
                          {attempt && (
                            <Badge variant={attempt.passed ? "default" : "destructive"} className="text-xs">
                              {attempt.passed ? (
                                <CheckCircle className="h-3 w-3 mr-1" />
                              ) : (
                                <XCircle className="h-3 w-3 mr-1" />
                              )}
                              {attempt.percentage}%
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm text-gray-600">
                            <div className="flex items-center space-x-4">
                              <span className="flex items-center">
                                <Target className="h-4 w-4 mr-1" />
                                {quiz.questions_count} questions
                              </span>
                              {quiz.is_timed && quiz.time_limit && (
                                <span className="flex items-center">
                                  <Clock className="h-4 w-4 mr-1" />
                                  {Math.round(quiz.time_limit / 60)} min
                                </span>
                              )}
                            </div>
                            <span className="flex items-center">
                              <Trophy className="h-4 w-4 mr-1" />
                              {quiz.passing_score}% to pass
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                                {quiz.users.avatar_url ? (
                                  <img
                                    src={quiz.users.avatar_url || "/placeholder.svg"}
                                    alt={quiz.users.full_name}
                                    className="w-full h-full rounded-full object-cover"
                                  />
                                ) : (
                                  <span className="text-xs font-semibold text-gray-600">
                                    {quiz.users.full_name.charAt(0)}
                                  </span>
                                )}
                              </div>
                              <span className="text-sm text-gray-600">{quiz.users.full_name}</span>
                            </div>
                            <Button onClick={() => startQuiz(quiz)} size="sm">
                              <Play className="h-4 w-4 mr-2" />
                              {attempt ? "Retake" : "Start"}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="my-quizzes" className="space-y-6">
            <div className="text-center py-12">
              <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Your Quizzes</h3>
              <p className="text-gray-600 mb-4">Quizzes you've created will appear here</p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Quiz
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="attempts" className="space-y-6">
            {myAttempts.length === 0 ? (
              <div className="text-center py-12">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No attempts yet</h3>
                <p className="text-gray-600 mb-4">Take some quizzes to see your results here</p>
                <Button onClick={() => setActiveTab("discover")}>
                  <Play className="h-4 w-4 mr-2" />
                  Browse Quizzes
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {myAttempts.map((attempt) => {
                  const quiz = quizzes.find((q) => q.id === attempt.quiz_id)
                  if (!quiz) return null

                  return (
                    <Card key={attempt.id}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-1">{quiz.title}</h3>
                            <p className="text-sm text-gray-600 mb-2">
                              Completed {formatDistanceToNow(new Date(attempt.completed_at), { addSuffix: true })}
                            </p>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <span>Attempt #{attempt.attempt_number}</span>
                              <span>Time: {formatTime(attempt.time_taken)}</span>
                              <span>
                                Score: {attempt.score}/{attempt.max_score}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center space-x-2 mb-2">
                              <Badge variant={attempt.passed ? "default" : "destructive"}>
                                {attempt.passed ? (
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                ) : (
                                  <XCircle className="h-3 w-3 mr-1" />
                                )}
                                {attempt.passed ? "Passed" : "Failed"}
                              </Badge>
                            </div>
                            <div className="text-2xl font-bold text-gray-900">{attempt.percentage}%</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Quiz Analytics</h3>
              <p className="text-gray-600">Detailed analytics for your quiz performance</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
