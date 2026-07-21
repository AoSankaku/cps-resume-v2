import { siteConfig } from './config/site'

export const SITE_SHARE_TEXT = '#コンパス履歴書ジェネレーター で #コンパス履歴書 を作ろう！3分でできるよ⭐️\n'
export const SITE_SHARE_CLIPBOARD_TEXT = `${SITE_SHARE_TEXT}\n${siteConfig.url}`
export const DISCORD_MESSAGES_URL = 'https://discord.com/channels/@me'

export const getSiteXShareUrl = (): string => {
  const url = new URL('https://x.com/intent/tweet')
  url.searchParams.set('text', SITE_SHARE_TEXT)
  url.searchParams.set('url', siteConfig.url)
  return url.toString()
}

export const getSiteLineShareUrl = (): string => {
  const url = new URL('https://social-plugins.line.me/lineit/share')
  url.searchParams.set('url', siteConfig.url)
  url.searchParams.set('text', SITE_SHARE_TEXT)
  return url.toString()
}
