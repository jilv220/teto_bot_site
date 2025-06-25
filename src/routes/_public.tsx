import { Footer } from '@/components/Footer'
import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_public')({
  component: PublicLayout,
})

function PublicLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto py-16 px-4">
        <Outlet />
      </div>

      <Footer />
    </div>
  )
}
