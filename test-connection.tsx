"use client"

import { useEffect, useState } from "react"
import { getSupabaseClient } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Database, Users, MessageCircle, RefreshCw } from "lucide-react"

interface ConnectionTest {
  name: string
  status: "success" | "error" | "loading"
  message: string
  icon: any
}

export default function TestConnection() {
  const [tests, setTests] = useState<ConnectionTest[]>([
    { name: "Supabase Connection", status: "loading", message: "Testing...", icon: Database },
    { name: "Authentication", status: "loading", message: "Testing...", icon: Users },
    { name: "Database Tables", status: "loading", message: "Testing...", icon: MessageCircle },
  ])
  const [isRunning, setIsRunning] = useState(false)

  const supabase = getSupabaseClient()

  const runTests = async () => {
    setIsRunning(true)
    const newTests = [...tests]

    // Test 1: Basic Supabase connection
    try {
      const { data, error } = await supabase.from("users").select("count", { count: "exact", head: true })
      if (error) throw error

      newTests[0] = {
        name: "Supabase Connection",
        status: "success",
        message: "Successfully connected to Supabase",
        icon: Database,
      }
    } catch (error) {
      newTests[0] = {
        name: "Supabase Connection",
        status: "error",
        message: `Connection failed: ${error}`,
        icon: Database,
      }
    }
    setTests([...newTests])

    // Test 2: Authentication
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      newTests[1] = {
        name: "Authentication",
        status: "success",
        message: session ? "User authenticated" : "No active session (normal for test)",
        icon: Users,
      }
    } catch (error) {
      newTests[1] = {
        name: "Authentication",
        status: "error",
        message: `Auth test failed: ${error}`,
        icon: Users,
      }
    }
    setTests([...newTests])

    // Test 3: Database tables
    try {
      const tables = ["users", "posts", "comments", "notes", "tasks"]
      const tableTests = await Promise.all(
        tables.map(async (table) => {
          const { error } = await supabase.from(table).select("count", { count: "exact", head: true })
          return { table, success: !error, error }
        }),
      )

      const failedTables = tableTests.filter((t) => !t.success)

      if (failedTables.length === 0) {
        newTests[2] = {
          name: "Database Tables",
          status: "success",
          message: `All ${tables.length} tables accessible`,
          icon: MessageCircle,
        }
      } else {
        newTests[2] = {
          name: "Database Tables",
          status: "error",
          message: `${failedTables.length} tables failed: ${failedTables.map((t) => t.table).join(", ")}`,
          icon: MessageCircle,
        }
      }
    } catch (error) {
      newTests[2] = {
        name: "Database Tables",
        status: "error",
        message: `Table test failed: ${error}`,
        icon: MessageCircle,
      }
    }
    setTests([...newTests])
    setIsRunning(false)
  }

  useEffect(() => {
    runTests()
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-600" />
      case "loading":
        return <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-100 text-green-800 border-green-200">Success</Badge>
      case "error":
        return <Badge className="bg-red-100 text-red-800 border-red-200">Error</Badge>
      case "loading":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Testing...</Badge>
      default:
        return null
    }
  }

  const allTestsPassed = tests.every((test) => test.status === "success")
  const hasErrors = tests.some((test) => test.status === "error")

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">SafeSocial Connection Test</h1>
          <p className="text-gray-600">Testing database connectivity and system health</p>
        </div>

        {/* Overall Status */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {allTestsPassed && !isRunning ? (
                <CheckCircle className="h-6 w-6 text-green-600" />
              ) : hasErrors ? (
                <XCircle className="h-6 w-6 text-red-600" />
              ) : (
                <RefreshCw className="h-6 w-6 text-blue-600 animate-spin" />
              )}
              <span>System Status</span>
            </CardTitle>
            <CardDescription>
              {allTestsPassed && !isRunning
                ? "All systems operational"
                : hasErrors
                  ? "Some issues detected"
                  : "Running diagnostics..."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {tests.filter((t) => t.status === "success").length} of {tests.length} tests passed
              </div>
              <Button onClick={runTests} disabled={isRunning} variant="outline" size="sm">
                <RefreshCw className={`h-4 w-4 mr-2 ${isRunning ? "animate-spin" : ""}`} />
                Run Tests Again
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Individual Tests */}
        <div className="grid gap-4">
          {tests.map((test, index) => {
            const Icon = test.icon
            return (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <Icon className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{test.name}</h3>
                        <p className="text-sm text-gray-600">{test.message}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(test.status)}
                      {getStatusIcon(test.status)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Next Steps */}
        {allTestsPassed && !isRunning && (
          <Card className="mt-8 border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-800">Ready to Go! 🎉</CardTitle>
              <CardDescription className="text-green-700">
                All systems are working correctly. You can now start using SafeSocial.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-4">
                <Button asChild>
                  <a href="/auth/signup">Create Account</a>
                </Button>
                <Button variant="outline" asChild>
                  <a href="/auth/login">Sign In</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {hasErrors && (
          <Card className="mt-8 border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-800">Issues Detected</CardTitle>
              <CardDescription className="text-red-700">
                Some tests failed. Please check your Supabase configuration and database setup.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-red-700">
                <p className="mb-2">Common solutions:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Verify your Supabase URL and API keys in environment variables</li>
                  <li>Ensure your database tables are created (run the SQL scripts)</li>
                  <li>Check that RLS policies allow the operations</li>
                  <li>Verify your internet connection</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
