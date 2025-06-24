import { Footer } from '@/components/Footer'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Link, createFileRoute } from '@tanstack/react-router'
import { Bot, Music, Users, Zap } from 'lucide-react'

export const Route = createFileRoute('/_marketing/')({
  component: Home,
})

function Home() {
  return (
    <>
      {/* Hero Section */}
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
              Build stronger communities with user management, role automation,
              and interactive features that keep your members engaged.
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
    </>
  )
}
