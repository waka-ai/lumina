"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/contexts/auth-context"
import { getSupabaseClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Palette,
  Plus,
  Search,
  Save,
  Download,
  Trash2,
  Edit,
  Eye,
  Brush,
  Eraser,
  Square,
  Minus,
  Grid,
  List,
} from "lucide-react"
import { format } from "date-fns"

interface Drawing {
  id: string
  title: string
  canvas_data: any
  thumbnail_url: string | null
  is_public: boolean
  collaborators: string[]
  created_at: string
  updated_at: string
}

export default function DrawingsPage() {
  const { user } = useAuth()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [drawings, setDrawings] = useState<Drawing[]>([])
  const [filteredDrawings, setFilteredDrawings] = useState<Drawing[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [currentDrawing, setCurrentDrawing] = useState<Drawing | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null)

  // Drawing tools state
  const [selectedTool, setSelectedTool] = useState<"brush" | "eraser" | "line" | "rectangle" | "circle">("brush")
  const [brushSize, setBrushSize] = useState([5])
  const [brushColor, setBrushColor] = useState("#000000")
  const [isPublic, setIsPublic] = useState(false)

  const [newDrawing, setNewDrawing] = useState({
    title: "",
  })

  const supabase = getSupabaseClient()

  const colors = [
    "#000000",
    "#FFFFFF",
    "#FF0000",
    "#00FF00",
    "#0000FF",
    "#FFFF00",
    "#FF00FF",
    "#00FFFF",
    "#FFA500",
    "#800080",
    "#FFC0CB",
    "#A52A2A",
    "#808080",
    "#000080",
    "#008000",
    "#800000",
  ]

  useEffect(() => {
    if (user) {
      fetchDrawings()
    }
  }, [user])

  useEffect(() => {
    filterDrawings()
  }, [drawings, searchQuery])

  const fetchDrawings = async () => {
    try {
      const { data, error } = await supabase
        .from("drawings")
        .select("*")
        .eq("user_id", user?.id)
        .order("updated_at", { ascending: false })

      if (error) throw error
      setDrawings(data || [])
    } catch (error) {
      console.error("Error fetching drawings:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterDrawings = () => {
    const filtered = drawings.filter((drawing) => drawing.title.toLowerCase().includes(searchQuery.toLowerCase()))
    setFilteredDrawings(filtered)
  }

  const createDrawing = async () => {
    if (!newDrawing.title.trim()) return

    try {
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      // Initialize canvas with white background
      ctx.fillStyle = "#FFFFFF"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const canvasData = {
        width: canvas.width,
        height: canvas.height,
        imageData: canvas.toDataURL(),
      }

      const drawingData = {
        user_id: user?.id,
        title: newDrawing.title,
        canvas_data: canvasData,
        is_public: isPublic,
        collaborators: [],
      }

      const { data, error } = await supabase.from("drawings").insert([drawingData]).select().single()

      if (error) throw error

      setDrawings([data, ...drawings])
      setCurrentDrawing(data)
      setNewDrawing({ title: "" })
      setShowCreateDialog(false)
    } catch (error) {
      console.error("Error creating drawing:", error)
    }
  }

  const saveDrawing = async () => {
    if (!currentDrawing || !canvasRef.current) return

    try {
      const canvas = canvasRef.current
      const canvasData = {
        width: canvas.width,
        height: canvas.height,
        imageData: canvas.toDataURL(),
      }

      const { data, error } = await supabase
        .from("drawings")
        .update({
          canvas_data: canvasData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", currentDrawing.id)
        .select()
        .single()

      if (error) throw error

      setDrawings(drawings.map((d) => (d.id === currentDrawing.id ? data : d)))
      setCurrentDrawing(data)
    } catch (error) {
      console.error("Error saving drawing:", error)
    }
  }

  const deleteDrawing = async (drawingId: string) => {
    try {
      const { error } = await supabase.from("drawings").delete().eq("id", drawingId)

      if (error) throw error

      setDrawings(drawings.filter((d) => d.id !== drawingId))
      if (currentDrawing?.id === drawingId) {
        setCurrentDrawing(null)
      }
    } catch (error) {
      console.error("Error deleting drawing:", error)
    }
  }

  const downloadDrawing = () => {
    if (!canvasRef.current || !currentDrawing) return

    const canvas = canvasRef.current
    const link = document.createElement("a")
    link.download = `${currentDrawing.title}.png`
    link.href = canvas.toDataURL()
    link.click()
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.fillStyle = "#FFFFFF"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setIsDrawing(true)
    setLastPoint({ x, y })
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !lastPoint || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    ctx.lineWidth = brushSize[0]
    ctx.lineCap = "round"
    ctx.lineJoin = "round"

    if (selectedTool === "brush") {
      ctx.globalCompositeOperation = "source-over"
      ctx.strokeStyle = brushColor
    } else if (selectedTool === "eraser") {
      ctx.globalCompositeOperation = "destination-out"
    }

    ctx.beginPath()
    ctx.moveTo(lastPoint.x, lastPoint.y)
    ctx.lineTo(x, y)
    ctx.stroke()

    setLastPoint({ x, y })
  }

  const stopDrawing = () => {
    setIsDrawing(false)
    setLastPoint(null)
  }

  const openDrawing = (drawing: Drawing) => {
    setCurrentDrawing(drawing)

    // Load the drawing onto the canvas
    setTimeout(() => {
      const canvas = canvasRef.current
      if (!canvas || !drawing.canvas_data?.imageData) return

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      const img = new Image()
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0)
      }
      img.src = drawing.canvas_data.imageData
    }, 100)
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (currentDrawing) {
    return (
      <div className="min-h-screen bg-gray-100">
        {/* Drawing Toolbar */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={() => setCurrentDrawing(null)}>
                ← Back
              </Button>
              <h1 className="text-xl font-semibold">{currentDrawing.title}</h1>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={clearCanvas}>
                Clear
              </Button>
              <Button variant="outline" onClick={downloadDrawing}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button onClick={saveDrawing}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
          </div>
        </div>

        <div className="flex">
          {/* Tools Panel */}
          <div className="w-64 bg-white border-r border-gray-200 p-4 space-y-4">
            <div>
              <Label className="text-sm font-medium">Tools</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Button
                  variant={selectedTool === "brush" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTool("brush")}
                >
                  <Brush className="h-4 w-4" />
                </Button>
                <Button
                  variant={selectedTool === "eraser" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTool("eraser")}
                >
                  <Eraser className="h-4 w-4" />
                </Button>
                <Button
                  variant={selectedTool === "line" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTool("line")}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Button
                  variant={selectedTool === "rectangle" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTool("rectangle")}
                >
                  <Square className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Brush Size</Label>
              <Slider value={brushSize} onValueChange={setBrushSize} max={50} min={1} step={1} className="mt-2" />
              <div className="text-xs text-gray-500 mt-1">{brushSize[0]}px</div>
            </div>

            <div>
              <Label className="text-sm font-medium">Colors</Label>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded border-2 ${
                      brushColor === color ? "border-gray-800" : "border-gray-300"
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setBrushColor(color)}
                  />
                ))}
              </div>
              <Input
                type="color"
                value={brushColor}
                onChange={(e) => setBrushColor(e.target.value)}
                className="mt-2 h-8"
              />
            </div>
          </div>

          {/* Canvas Area */}
          <div className="flex-1 p-8 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-lg p-4">
              <canvas
                ref={canvasRef}
                width={800}
                height={600}
                className="border border-gray-300 cursor-crosshair"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
              />
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
              <Palette className="h-8 w-8 text-purple-600" />
              <h1 className="text-2xl font-bold text-gray-900">Drawings</h1>
              <Badge variant="secondary">{filteredDrawings.length}</Badge>
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
                    New Drawing
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Drawing</DialogTitle>
                    <DialogDescription>Start a new drawing project</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={newDrawing.title}
                        onChange={(e) => setNewDrawing({ ...newDrawing, title: e.target.value })}
                        placeholder="Enter drawing title..."
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="public" checked={isPublic} onCheckedChange={setIsPublic} />
                      <Label htmlFor="public">Make public</Label>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={createDrawing}>Create Drawing</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search drawings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Drawings Grid/List */}
        {filteredDrawings.length === 0 ? (
          <div className="text-center py-12">
            <Palette className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No drawings found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery ? "Try adjusting your search" : "Create your first drawing to get started"}
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Drawing
            </Button>
          </div>
        ) : (
          <div
            className={
              viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "space-y-4"
            }
          >
            {filteredDrawings.map((drawing) => (
              <Card key={drawing.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <div className="aspect-video bg-gray-100 rounded-t-lg overflow-hidden">
                  {drawing.canvas_data?.imageData ? (
                    <img
                      src={drawing.canvas_data.imageData || "/placeholder.svg"}
                      alt={drawing.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Palette className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                </div>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-1">{drawing.title}</CardTitle>
                      <CardDescription className="flex items-center space-x-2 mt-1">
                        <span>{format(new Date(drawing.updated_at), "MMM d, yyyy")}</span>
                        {drawing.is_public && (
                          <Badge variant="secondary" className="text-xs">
                            <Eye className="h-3 w-3 mr-1" />
                            Public
                          </Badge>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <Button variant="outline" size="sm" onClick={() => openDrawing(drawing)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteDrawing(drawing.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Hidden canvas for initialization */}
      <canvas ref={canvasRef} width={800} height={600} className="hidden" />
    </div>
  )
}
