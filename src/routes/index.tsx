import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Link, createFileRoute } from '@tanstack/react-router'
import { AlertCircle, Bot, Music, Users, Zap } from 'lucide-react'

export const Route = createFileRoute('/')({
  component: Home,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      error: (search.error as string) || null,
      redirect: (search.redirect as string) || null,
      details: (search.details as string) || null,
    }
  },
})

function Home() {
  const { error, redirect, details } = Route.useSearch()

  const getErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case 'access_denied':
        return {
          title: 'Access Denied',
          description:
            'You need admin privileges to access the admin panel. Please contact an administrator.',
        }
      case 'auth_required':
        return {
          title: 'Login Required',
          description: 'You need to log in to access the admin panel.',
        }
      case 'user_not_found':
        return {
          title: 'User Not Found',
          description:
            'Your user account could not be found. Please try logging in again.',
        }
      case 'auth_failed':
        return {
          title: 'Authentication Failed',
          description:
            'There was an error verifying your authentication. Please try logging in again.',
        }
      case 'discord_oauth_error':
        return {
          title: 'Discord OAuth Error',
          description:
            'Discord rejected the login request. Please check your OAuth configuration.',
        }
      case 'no_code':
        return {
          title: 'Login Failed',
          description:
            'No authorization code received from Discord. Please try logging in again.',
        }
      case 'discord_token_exchange_failed':
        return {
          title: 'Token Exchange Failed',
          description:
            'Failed to exchange authorization code for access token. This is likely a configuration issue.',
        }
      case 'discord_user_fetch_failed':
        return {
          title: 'User Info Failed',
          description: 'Failed to retrieve user information from Discord.',
        }
      case 'discord_response_parsing_failed':
        return {
          title: 'Response Parsing Failed',
          description:
            'Discord returned an unexpected response format. This suggests a configuration problem.',
        }
      default:
        return {
          title: 'Error',
          description: 'An unexpected error occurred.',
        }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="container mx-auto py-16 px-4">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Bot className="h-10 w-10 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full" />
              </div>
            </div>
          </div>
          <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
            Teto Bot
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Your intelligent Discord companion for music, community management,
            and more. Enhance your server experience with powerful features and
            intuitive controls.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/admin">
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3"
              >
                Admin Dashboard
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="px-8 py-3" asChild>
              <a
                href="https://discord.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                Add to Discord
              </a>
            </Button>
          </div>
        </div>

        {error && (
          <Card className="mb-12 border-red-200 bg-red-50 max-w-2xl mx-auto">
            <CardHeader>
              <div className="flex items-center gap-3">
                <AlertCircle className="h-6 w-6 text-red-600" />
                <CardTitle className="text-red-800">
                  {getErrorMessage(error).title}
                </CardTitle>
              </div>
              <CardDescription className="text-red-700">
                {getErrorMessage(error).description}
              </CardDescription>
              {details && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm text-red-600 font-medium">
                    Show Technical Details
                  </summary>
                  <pre className="mt-2 p-2 bg-red-100 rounded text-xs text-red-800 overflow-auto">
                    {details}
                  </pre>
                </details>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full"
                onClick={() => {
                  const loginUrl = `/auth/login${redirect ? `?returnTo=${encodeURIComponent(redirect)}` : ''}`
                  window.location.href = loginUrl
                }}
              >
                Login to Continue
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  // Clear error by navigating to clean home page
                  window.location.href = '/'
                }}
              >
                Clear Error
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Features Section */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Music className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">Music Management</CardTitle>
                  <CardDescription>
                    Lyrics database and music commands
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Manage song lyrics, create playlists, and enhance your server's
                music experience with intelligent music commands and
                recommendations.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">Community Features</CardTitle>
                  <CardDescription>
                    User engagement and moderation tools
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Build stronger communities with user management, role
                automation, and interactive features that keep your members
                engaged.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">Smart Automation</CardTitle>
                  <CardDescription>
                    Intelligent responses and workflows
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Automate repetitive tasks with smart workflows, custom commands,
                and AI-powered responses that adapt to your server's needs.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <Card className="bg-gradient-to-r from-blue-600 to-purple-600 border-0 text-white max-w-2xl mx-auto">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-4">Ready to get started?</h2>
              <p className="mb-6 opacity-90">
                Join thousands of Discord servers already using Teto Bot to
                enhance their communities.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  variant="secondary"
                  className="px-8 py-3"
                  asChild
                >
                  <a
                    href="https://discord.com"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Invite to Server
                  </a>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="px-8 py-3 text-white border-white hover:bg-white hover:text-blue-600"
                  asChild
                >
                  <a
                    href="https://docs.tetobot.com"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View Documentation
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
