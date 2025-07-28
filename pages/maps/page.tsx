"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/contexts/auth-context"
import { getSupabaseClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
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
  Map,
  Plus,
  Search,
  Globe,
  Lock,
  Users,
  Edit,
  Trash2,
  Share2,
  Grid,
  List,
  Mountain,
  Building,
  Trees,
  Waves,
} from "lucide-react"
import { format } from "date-fns"

interface MapData {
  id: string
  title: string
  description: string
  map_data: any
  is_public: boolean
  collaborators: string[]
  template_id: string | null
  created_at: string
  updated_at: string
  users: {
    username: string
    full_name: string
    avatar_url: string
  }
}

interface MapTemplate {
  id: string
  name: string
  description: string
  template_data: any
  category: string
  usage_count: number
}

export default function MapsPage() {
  const { user } = useAuth()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [maps, setMaps] = useState<MapData[]>([])
  const [templates, setTemplates] = useState<MapTemplate[]>([])
  const [filteredMaps, setFilteredMaps] = useState<MapData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [currentMap, setCurrentMap] = useState<MapData | null>(null)
  const [selectedTool, setSelectedTool] = useState<"terrain" | "building" | "vegetation" | "water">("terrain")
  const [isDrawing, setIsDrawing] = useState(false)

  const [newMap, setNewMap] = useState({
    title: "",
    description: "",
    template_id: null,
    is_public: false,
  })

  const supabase = getSupabaseClient()

  const mapTools = [
    { id: "terrain", name: "Terrain", icon: Mountain, color: "#8B4513" },
    { id: "building", name: "Buildings", icon: Building, color: "#696969" },
    { id: "vegetation", name: "Trees", icon: Trees, color: "#228B22" },
    { id: "water", name: "Water", icon: Waves, color: "#4169E1" },
  ]

  useEffect(() => {
    if (user) {
      fetchMaps()
      fetchTemplates()
    }
  }, [user])

  useEffect(() => {
    filterMaps()
  }, [maps, searchQuery])

  const fetchMaps = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("maps")
        .select(`
          *,
          users (
            username,
            full_name,
            avatar_url
          )
        `)
        .eq("user_id", user?.id)
        .order("updated_at", { ascending: false })

      if (error) throw error
      setMaps(data || [])
    } catch (error) {
      console.error("Error fetching maps:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from("map_templates")
        .select("*")
        .eq("is_public", true)
        .order("usage_count", { ascending: false })

      if (error) throw error
      setTemplates(data || [])
    } catch (error) {
      console.error("Error fetching templates:", error)
    }
  }

  const filterMaps = () => {
    const filtered = maps.filter(
      (map) =>
        map.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        map.description.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    setFilteredMaps(filtered)
  }

  const createMap = async () => {
    if (!newMap.title.trim()) return

    try {
      const template = templates.find((t) => t.id === newMap.template_id)
      const initialMapData = template
        ? template.template_data
        : {
            elements: [],
            zoom: 1,
            center: { x: 400, y: 300 },
          }

      const mapData = {
        user_id: user?.id,
        title: newMap.title,
        description: newMap.description,
        map_data: initialMapData,
        is_public: newMap.is_public,
        template_id: newMap.template_id || null,
        collaborators: [],
      }

      const { data, error } = await supabase
        .from("maps")
        .insert([mapData])
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

      setMaps([data, ...maps])
      setCurrentMap(data)
      setNewMap({ title: "", description: "", template_id: null, is_public: false })
      setShowCreateDialog(false)

      // Update template usage count
      if (newMap.template_id) {
        await supabase
          .from("map_templates")
          .update({ usage_count: (template?.usage_count || 0) + 1 })
          .eq("id", newMap.template_id)
      }
    } catch (error) {
      console.error("Error creating map:", error)
    }
  }

  const saveMap = async () => {
    if (!currentMap || !canvasRef.current) return

    try {
      const canvas = canvasRef.current
      const mapData = {
        ...currentMap.map_data,
        imageData: canvas.toDataURL(),
        lastModified: new Date().toISOString(),
      }

      const { data, error } = await supabase
        .from("maps")
        .update({
          map_data: mapData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", currentMap.id)
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

      setMaps(maps.map((m) => (m.id === currentMap.id ? data : m)))
      setCurrentMap(data)
    } catch (error) {
      console.error("Error saving map:", error)
    }
  }

  const deleteMap = async (mapId: string) => {
    if (!confirm("Are you sure you want to delete this map?")) return

    try {
      const { error } = await supabase.from("maps").delete().eq("id", mapId)

      if (error) throw error

      setMaps(maps.filter((m) => m.id !== mapId))
      if (currentMap?.id === mapId) {
        setCurrentMap(null)
      }
    } catch (error) {
      console.error("Error deleting map:", error)
    }
  }

  const toggleMapVisibility = async (mapId: string, isPublic: boolean) => {
    try {
      const { error } = await supabase.from("maps").update({ is_public: !isPublic }).eq("id", mapId)

      if (error) throw error

      setMaps(maps.map((m) => (m.id === mapId ? { ...m, is_public: !isPublic } : m)))
    } catch (error) {
      console.error("Error updating map visibility:", error)
    }
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setIsDrawing(true)
    drawElement(x, y)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    drawElement(x, y)
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const drawElement = (x: number, y: number) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const tool = mapTools.find((t) => t.id === selectedTool)
    if (!tool) return

    ctx.fillStyle = tool.color
    ctx.beginPath()
    ctx.arc(x, y, 10, 0, 2 * Math.PI)
    ctx.fill()
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.fillStyle = "#87CEEB" // Sky blue background
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  const openMap = (map: MapData) => {
    setCurrentMap(map)

    // Load map data onto canvas
    setTimeout(() => {
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      // Clear canvas with sky blue background
      ctx.fillStyle = "#87CEEB"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Load existing map data if available
      if (map.map_data?.imageData) {
        const img = new Image()
        img.onload = () => {
          ctx.drawImage(img, 0, 0)
        }
        img.src = map.map_data.imageData
      }
    }, 100)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading your maps...</p>
        </div>
      </div>
    )
  }

  if (currentMap) {
    return (
      <div className="min-h-screen bg-gray-100">
        {/* Map Editor Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={() => setCurrentMap(null)}>
                ← Back to Maps
              </Button>
              <h1 className="text-xl font-semibold">{currentMap.title}</h1>
              <Badge variant={currentMap.is_public ? "default" : "secondary"}>
                {currentMap.is_public ? "Public" : "Private"}
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={clearCanvas}>
                Clear
              </Button>
              <Button onClick={saveMap}>Save Map</Button>
            </div>
          </div>
        </div>

        <div className="flex">
          {/* Tools Panel */}
          <div className="w-64 bg-white border-r border-gray-200 p-4 space-y-4">
            <div>
              <Label className="text-sm font-medium mb-3 block">Map Tools</Label>
              <div className="space-y-2">
                {mapTools.map((tool) => {
                  const IconComponent = tool.icon
                  return (
                    <Button
                      key={tool.id}
                      variant={selectedTool === tool.id ? "default" : "outline"}
                      className="w-full justify-start"
                      onClick={() => setSelectedTool(tool.id as any)}
                    >
                      <IconComponent className="h-4 w-4 mr-2" />
                      {tool.name}
                    </Button>
                  )
                })}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium mb-3 block">Map Info</Label>
              <div className="space-y-2 text-sm text-gray-600">
                <p>
                  <strong>Created:</strong> {format(new Date(currentMap.created_at), "MMM d, yyyy")}
                </p>
                <p>
                  <strong>Last Modified:</strong> {format(new Date(currentMap.updated_at), "MMM d, yyyy")}
                </p>
                <p>
                  <strong>Visibility:</strong> {currentMap.is_public ? "Public" : "Private"}
                </p>
              </div>
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
              <Map className="h-8 w-8 text-green-600" />
              <h1 className="text-2xl font-bold text-gray-900">Maps</h1>
              <Badge variant="secondary">{filteredMaps.length}</Badge>
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
                    New Map
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Map</DialogTitle>
                    <DialogDescription>Start building your interactive map</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">Map Title</Label>
                      <Input
                        id="title"
                        value={newMap.title}
                        onChange={(e) => setNewMap({ ...newMap, title: e.target.value })}
                        placeholder="Enter map title..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={newMap.description}
                        onChange={(e) => setNewMap({ ...newMap, description: e.target.value })}
                        placeholder="Describe your map..."
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="template">Template (Optional)</Label>
                      <Select
                        value={newMap.template_id || ""}
                        onValueChange={(value) => setNewMap({ ...newMap, template_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a template" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Blank Map</SelectItem>
                          {templates.map((template) => (
                            <SelectItem key={template.id} value={template.id}>
                              {template.name} - {template.category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="public"
                        checked={newMap.is_public}
                        onCheckedChange={(checked) => setNewMap({ ...newMap, is_public: checked })}
                      />
                      <Label htmlFor="public">Make map public</Label>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={createMap}>Create Map</Button>
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
            placeholder="Search maps..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Maps Grid/List */}
        {filteredMaps.length === 0 ? (
          <div className="text-center py-12">
            <Map className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No maps found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery ? "Try adjusting your search" : "Create your first map to get started"}
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Map
            </Button>
          </div>
        ) : (
          <div
            className={
              viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "space-y-4"
            }
          >
            {filteredMaps.map((map) => (
              <Card key={map.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <div className="aspect-video bg-gradient-to-br from-green-100 to-blue-100 rounded-t-lg overflow-hidden">
                  {map.map_data?.imageData ? (
                    <img
                      src={map.map_data.imageData || "/placeholder.svg"}
                      alt={map.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Map className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                </div>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-1">{map.title}</CardTitle>
                      <CardDescription className="line-clamp-2 mt-1">{map.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center space-x-2">
                      <Badge variant={map.is_public ? "default" : "secondary"} className="text-xs">
                        {map.is_public ? <Globe className="h-3 w-3 mr-1" /> : <Lock className="h-3 w-3 mr-1" />}
                        {map.is_public ? "Public" : "Private"}
                      </Badge>
                      {map.collaborators.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          <Users className="h-3 w-3 mr-1" />
                          {map.collaborators.length}
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">{format(new Date(map.updated_at), "MMM d")}</span>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <Button variant="outline" size="sm" onClick={() => openMap(map)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <div className="flex items-center space-x-1">
                      <Button variant="ghost" size="sm" onClick={() => toggleMapVisibility(map.id, map.is_public)}>
                        {map.is_public ? <Lock className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Share2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMap(map.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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
