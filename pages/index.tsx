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
    color: "#2563eb",
    bgColor: "#dbeafe",
  },
  {
    icon: FileText,
    title: "Smart Notes",
    description: "Organize your thoughts with powerful note-taking and planning tools",
    color: "#16a34a",
    bgColor: "#dcfce7",
  },
  {
    icon: Palette,
    title: "Visual Drawing",
    description: "Express your creativity with our advanced digital drawing canvas",
    color: "#9333ea",
    bgColor: "#f3e8ff",
  },
  {
    icon: Globe,
    title: "Interactive Maps",
    description: "Explore and create stunning 3D maps with collaborative features",
    color: "#0d9488",
    bgColor: "#ccfbf1",
  },
  {
    icon: BookOpen,
    title: "Digital Library",
    description: "Read, organize, and track your progress through digital books",
    color: "#4f46e5",
    bgColor: "#e0e7ff",
  },
  {
    icon: Play,
    title: "Video Platform",
    description: "Share and discover educational and entertaining video content",
    color: "#dc2626",
    bgColor: "#fee2e2",
  },
  {
    icon: Brain,
    title: "Quiz System",
    description: "Create and take interactive quizzes to test your knowledge",
    color: "#ea580c",
    bgColor: "#ffedd5",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    description: "Track your progress and engagement across all platform features",
    color: "#db2777",
    bgColor: "#fce7f3",
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
    <div className="page-container">
      {/* Navigation */}
      <nav className="navbar">
        <div className="container">
          <div className="nav-content">
            <div className="logo-container">
              <div className="logo-icon">
                <Shield className="logo-shield" />
              </div>
              <span className="logo-text">SafeSocial</span>
            </div>
            <div className="nav-buttons">
              <Link href="/auth/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/auth/signup">
                <Button className="btn-primary">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="container text-center">
          <div className="hero-content">
            <Badge className="badge">
              <Zap className="badge-icon" />
              All-in-One Platform
            </Badge>
            <h1 className="hero-title">
              Connect, Create, and
              <span className="hero-title-highlight"> Collaborate</span>
            </h1>
            <p className="hero-description">
              The complete social platform that brings together social networking, productivity tools, creative
              features, and learning resources in one secure, user-friendly environment.
            </p>
            <div className="hero-buttons">
              <Link href="/auth/signup">
                <Button className="btn-primary btn-large">
                  Start Your Journey
                  <ArrowRight className="btn-icon" />
                </Button>
              </Link>
              <Link href="#features">
                <Button className="btn-secondary btn-large">Explore Features</Button>
              </Link>
            </div>
          </div>

          <div className="stats-grid">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="stat-item">
                  <div className="stat-icon">
                    <Icon className="stat-icon-inner" />
                  </div>
                  <div className="stat-value">{stat.value}</div>
                  <div className="stat-label">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Everything You Need in One Platform</h2>
            <p className="section-description">
              From social networking to productivity tools, creative features to learning resources - we've got you
              covered.
            </p>
          </div>

          <div className="features-grid">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <Card key={index} className="feature-card">
                  <CardHeader>
                    <div style={{ backgroundColor: feature.bgColor }} className="feature-icon">
                      <Icon style={{ color: feature.color }} className="feature-icon-inner" />
                    </div>
                    <CardTitle className="feature-title">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="feature-description">{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Loved by Creators Worldwide</h2>
            <p className="section-description">See what our community has to say about their SafeSocial experience</p>
          </div>

          <div className="testimonials-grid">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="testimonial-card">
                <CardContent className="testimonial-content">
                  <div className="testimonial-rating">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="star-icon" />
                    ))}
                  </div>
                  <p className="testimonial-text">"{testimonial.content}"</p>
                  <div className="testimonial-author">
                    <img
                      src={testimonial.avatar || "/placeholder.svg"}
                      alt={testimonial.name}
                      className="author-avatar"
                    />
                    <div>
                      <div className="author-name">{testimonial.name}</div>
                      <div className="author-role">{testimonial.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container text-center">
          <h2 className="cta-title">Ready to Transform Your Digital Experience?</h2>
          <p className="cta-description">
            Join thousands of creators, learners, and innovators who have made SafeSocial their digital home.
          </p>
          <div className="cta-buttons">
            <Link href="/auth/signup">
              <Button className="btn-cta btn-large">
                Create Free Account
                <ArrowRight className="btn-icon" />
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button className="btn-cta-secondary btn-large">Sign In</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-about">
              <div className="logo-container">
                <div className="logo-icon">
                  <Shield className="logo-shield" />
                </div>
                <span className="logo-text">SafeSocial</span>
              </div>
              <p className="footer-description">
                The complete social platform that brings together social networking, productivity tools, creative
                features, and learning resources in one secure environment.
              </p>
              <div className="footer-security">
                <CheckCircle className="security-icon" />
                <span>Secure & Private</span>
              </div>
            </div>

            <div>
              <h3 className="footer-section-title">Features</h3>
              <ul className="footer-links">
                <li>
                  <Link href="#features" className="footer-link">Social Feed</Link>
                </li>
                <li>
                  <Link href="#features" className="footer-link">Smart Notes</Link>
                </li>
                <li>
                  <Link href="#features" className="footer-link">Visual Drawing</Link>
                </li>
                <li>
                  <Link href="#features" className="footer-link">Interactive Maps</Link>
                </li>
                <li>
                  <Link href="#features" className="footer-link">Digital Library</Link>
                </li>
                <li>
                  <Link href="#features" className="footer-link">Video Platform</Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="footer-section-title">Company</h3>
              <ul className="footer-links">
                <li>
                  <Link href="/about" className="footer-link">About Us</Link>
                </li>
                <li>
                  <Link href="/privacy" className="footer-link">Privacy Policy</Link>
                </li>
                <li>
                  <Link href="/terms" className="footer-link">Terms of Service</Link>
                </li>
                <li>
                  <Link href="/contact" className="footer-link">Contact</Link>
                </li>
                <li>
                  <Link href="/help" className="footer-link">Help Center</Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <p>&copy; 2024 SafeSocial. All rights reserved. Built with ❤️ for creators and learners.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}