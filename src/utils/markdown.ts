import { remark } from 'remark'
import remarkHtml from 'remark-html'

/**
 * Convert markdown to HTML using remark
 */
export async function markdownToHtml(markdown: string): Promise<string> {
  const result = await remark().use(remarkHtml).process(markdown)

  return result.toString()
}
