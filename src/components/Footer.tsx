import { siteConfig } from '@/services'
import { Link } from '@tanstack/react-router'

export function Footer() {
  return (
    <footer className="bg-white/80 backdrop-blur-sm border-t border-gray-200/50 mt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-gray-600">
            <p>&copy; 2024 {siteConfig.title}. All rights reserved.</p>
          </div>
          <nav className="flex gap-6">
            <Link
              to="/terms"
              className="text-gray-600 hover:text-blue-600 transition-colors duration-200"
            >
              Terms of Services
            </Link>
            <Link
              to="/privacy"
              className="text-gray-600 hover:text-blue-600 transition-colors duration-200"
            >
              Privacy Policy
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  )
}
