import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Shield,
  Users,
  MessageCircle,
  FileText,
  Palette,
  Globe,
  BookOpen,
  Play,
  Brain,
  BarChart3,
  Zap,
  Heart,
  Star,
  ArrowRight,
  CheckCircle,
} from "lucide-react"

const features = [
  {
    icon: MessageCircle,
    title: "Social Feed",
    description: "Connect with friends and share your thoughts in a safe environment",
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  {
    icon: FileText,
    title: "Smart Notes",
    description: "Organize your thoughts with powerful note-taking and planning tools",
    color: "text-green-600",
    bgColor: "bg-green-100",
  },
  {
    icon: Palette,
    title: "Visual Drawing",
    description: "Express your creativity with our advanced digital drawing canvas",
    color: "text-purple-600",
    bgColor: "bg-purple-100",
  },
  {
    icon: Globe,
    title: "Interactive Maps",
    description: "Explore and create stunning 3D maps with collaborative features",
    color: "text-teal-600",
    bgColor: "bg-teal-100",
  },
  {
    icon: BookOpen,
    title: "Digital Library",
    description: "Read, organize, and track your progress through digital books",
    color: "text-indigo-600",
    bgColor: "bg-indigo-100",
  },
  {
    icon: Play,
    title: "Video Platform",
    description: "Share and discover educational and entertaining video content",
    color: "text-red-600",
    bgColor: "bg-red-100",
  },
  {
    icon: Brain,
    title: "Quiz System",
    description: "Create and take interactive quizzes to test your knowledge",
    color: "text-orange-600",
    bgColor: "bg-orange-100",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    description: "Track your progress and engagement across all platform features",
    color: "text-pink-600",
    bgColor: "bg-pink-100",
  },
]

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Content Creator",
    avatar: "/placeholder.svg?height=60&width=60&text=SJ",
    content:
      "SafeSocial has revolutionized how I create and share content. The integrated tools make everything seamless!",
    rating: 5,
  },
  {
    name: "Michael Chen",
    role: "Educator",
    avatar: "/placeholder.svg?height=60&width=60&text=MC",
    content:
      "The quiz system and video platform have transformed my online teaching. Students are more engaged than ever.",
    rating: 5,
  },
  {
    name: "Emily Rodriguez",
    role: "Digital Artist",
    avatar: "/placeholder.svg?height=60&width=60&text=ER",
    content:
      "The drawing tools are incredible! I can create, share, and collaborate with other artists all in one place.",
    rating: 5,
  },
]

const stats = [
  { label: "Active Users", value: "50K+", icon: Users },
  { label: "Content Created", value: "1M+", icon: FileText },
  { label: "Communities", value: "500+", icon: MessageCircle },
  { label: "Satisfaction Rate", value: "98%", icon: Heart },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                SafeSocial
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/auth/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/auth/signup">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-8">
            <Badge className="mb-4 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 border-blue-200">
              <Zap className="h-3 w-3 mr-1" />
              All-in-One Platform
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Connect, Create, and
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {" "}
                Collaborate
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              The complete social platform that brings together social networking, productivity tools, creative
              features, and learning resources in one secure, user-friendly environment.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signup">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  Start Your Journey
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="#features">
                <Button size="lg" variant="outline" className="bg-white/50 backdrop-blur-sm">
                  Explore Features
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16">
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <div key={index} className="text-center">
                  <div className="flex justify-center mb-2">
                    <div className="p-3 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full">
                      <Icon className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Everything You Need in One Platform</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From social networking to productivity tools, creative features to learning resources - we've got you
              covered.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <Card key={index} className="hover:shadow-lg transition-shadow duration-300 border-0 shadow-sm">
                  <CardHeader>
                    <div className={`w-12 h-12 ${feature.bgColor} rounded-lg flex items-center justify-center mb-4`}>
                      <Icon className={`h-6 w-6 ${feature.color}`} />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-gray-600">{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Loved by Creators Worldwide</h2>
            <p className="text-xl text-gray-600">See what our community has to say about their SafeSocial experience</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-4">"{testimonial.content}"</p>
                  <div className="flex items-center">
                    <img
                      src={testimonial.avatar || "/placeholder.svg"}
                      alt={testimonial.name}
                      className="w-10 h-10 rounded-full mr-3"
                    />
                    <div>
                      <div className="font-semibold text-gray-900">{testimonial.name}</div>
                      <div className="text-sm text-gray-600">{testimonial.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Digital Experience?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of creators, learners, and innovators who have made SafeSocial their digital home.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                Create Free Account
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 bg-transparent">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <span className="font-bold text-xl">SafeSocial</span>
              </div>
              <p className="text-gray-400 mb-4 max-w-md">
                The complete social platform that brings together social networking, productivity tools, creative
                features, and learning resources in one secure environment.
              </p>
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span>Secure & Private</span>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Features</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link href="#features" className="hover:text-white transition-colors">
                    Social Feed
                  </Link>
                </li>
                <li>
                  <Link href="#features" className="hover:text-white transition-colors">
                    Smart Notes
                  </Link>
                </li>
                <li>
                  <Link href="#features" className="hover:text-white transition-colors">
                    Visual Drawing
                  </Link>
                </li>
                <li>
                  <Link href="#features" className="hover:text-white transition-colors">
                    Interactive Maps
                  </Link>
                </li>
                <li>
                  <Link href="#features" className="hover:text-white transition-colors">
                    Digital Library
                  </Link>
                </li>
                <li>
                  <Link href="#features" className="hover:text-white transition-colors">
                    Video Platform
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link href="/about" className="hover:text-white transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-white transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-white transition-colors">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-white transition-colors">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="/help" className="hover:text-white transition-colors">
                    Help Center
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2024 SafeSocial. All rights reserved. Built with ❤️ for creators and learners.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
