import { getUsers } from '@/actions/user'
import { createFileRoute } from '@tanstack/react-router'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'

export const Route = createFileRoute('/admin')({
  component: AdminDashboard,
  loader: async () => await getUsers(),
})

function AdminDashboard() {
  const data = Route.useLoaderData()

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-4">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your bot and server settings
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {'data' in data && data.data.users.length} users in system
            </p>
            <Button className="w-full">Manage Users</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Server Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Configure bot settings and preferences
            </p>
            <Button className="w-full">Configure Settings</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              View usage statistics and analytics
            </p>
            <Button className="w-full">View Analytics</Button>
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
    </div>
  )
}
