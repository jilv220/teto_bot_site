import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Link, createFileRoute } from '@tanstack/react-router'
import { BarChart3, Music, Settings, Users } from 'lucide-react'

export const Route = createFileRoute('/admin/')({
  component: AdminDashboard,
})

function AdminDashboard() {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your bot and server settings
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-primary" />
              <CardTitle>User Management</CardTitle>
            </div>
            <CardDescription>Manage user roles and permissions</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Manage user accounts and permissions
            </p>
            <Button className="w-full" disabled>
              Manage Users
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Music className="h-6 w-6 text-primary" />
              <CardTitle>Lyrics Management</CardTitle>
            </div>
            <CardDescription>
              Manage your song lyrics collection
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Add, edit, and organize song lyrics
            </p>
            <Link to="/admin/lyrics">
              <Button className="w-full">Manage Lyrics</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Settings className="h-6 w-6 text-primary" />
              <CardTitle>Server Settings</CardTitle>
            </div>
            <CardDescription>
              Configure bot settings and preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Bot configuration and server settings
            </p>
            <Button className="w-full" disabled>
              Configure Settings
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <BarChart3 className="h-6 w-6 text-primary" />
              <CardTitle>Analytics</CardTitle>
            </div>
            <CardDescription>
              View usage statistics and insights
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Bot usage metrics and analytics
            </p>
            <Button className="w-full" disabled>
              View Analytics
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 flex justify-center">
        <Button
          variant="outline"
          onClick={() => {
            window.location.href = '/auth/logout'
          }}
        >
          Logout
        </Button>
      </div>
    </>
  )
}
