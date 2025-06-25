import { Button } from '@/components/ui/button'
import { markdownToHtml } from '@/utils/markdown'
import { Link, createFileRoute } from '@tanstack/react-router'
import { ArrowLeft, EyeClosed, Shield } from 'lucide-react'

import privacyPolicyMd from '@/data/privacy-policy.md?raw'
import { siteConfig } from '@/services'

export const Route = createFileRoute('/_public/privacy')({
  component: PrivacyPolicy,
  loader: async () => {
    const htmlContent = await markdownToHtml(privacyPolicyMd)
    return {
      htmlContent,
    }
  },
  head: () => ({
    meta: [
      {
        title: `Privacy Policy | ${siteConfig.title}`,
      },
      {
        name: 'description',
        content:
          'Privacy Policy for Kasane Teto Bot - Learn how we collect, use, and protect your data.',
      },
    ],
  }),
})

function PrivacyPolicy() {
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
              <EyeClosed className="h-8 w-8 text-white" />
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
