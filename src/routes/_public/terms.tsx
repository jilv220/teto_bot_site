import { Button } from '@/components/ui/button'
import { siteConfig } from '@/services'
import { markdownToHtml } from '@/utils/markdown'
import { Link, createFileRoute } from '@tanstack/react-router'
import { ArrowLeft, FileCheck2, FileText } from 'lucide-react'

import termsOfServiceMd from '@/data/terms-of-service.md?raw'

export const Route = createFileRoute('/_public/terms')({
  component: TermsOfService,
  loader: async () => {
    const htmlContent = await markdownToHtml(termsOfServiceMd)
    return {
      htmlContent,
    }
  },
  head: () => ({
    meta: [
      {
        title: `Terms of Service | ${siteConfig.title}`,
      },
      {
        name: 'description',
        content:
          'Terms of Service for Kasane Teto Bot - Learn about the terms and conditions for using our Discord bot.',
      },
    ],
  }),
})

function TermsOfService() {
  const { htmlContent } = Route.useLoaderData()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>

        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <FileCheck2 className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>

        {/* Markdown Content */}
        <div className="bg-white/80 backdrop-blur-sm shadow-lg rounded-xl p-8">
          <article
            className="prose prose-slate lg:prose-lg max-w-none prose-h1:bg-gradient-to-r prose-h1:from-blue-600 prose-h1:to-purple-600 prose-h1:bg-clip-text prose-h1:text-transparent prose-blockquote:border-yellow-400 prose-blockquote:bg-yellow-50 prose-blockquote:text-yellow-900"
            // biome-ignore lint/security/noDangerouslySetInnerHtml: Rendering trusted markdown content
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        </div>

        {/* Footer Navigation */}
        <div className="text-center mt-12">
          <Link to="/">
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
              Return to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
