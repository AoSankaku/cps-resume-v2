import { siteConfig } from './config/site'

export const RESUME_SHARE_TEXT = '#コンパス #コンパス履歴書\n#コンパス履歴書ジェネレーター\n\n'

export const getResumeXShareUrl = (): string => {
  const url = new URL('https://x.com/intent/tweet')
  url.searchParams.set('text', RESUME_SHARE_TEXT)
  url.searchParams.set('url', siteConfig.url)
  return url.toString()
}
