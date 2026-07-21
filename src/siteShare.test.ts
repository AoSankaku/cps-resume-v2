import { describe, expect, test } from 'bun:test'
import { siteConfig } from './config/site'
import {
  DISCORD_MESSAGES_URL,
  getSiteLineShareUrl,
  getSiteXShareUrl,
  SITE_SHARE_CLIPBOARD_TEXT,
  SITE_SHARE_TEXT,
} from './siteShare'

describe('site share links', () => {
  test.each([
    [getSiteXShareUrl, 'https://x.com', '/intent/tweet'],
    [getSiteLineShareUrl, 'https://social-plugins.line.me', '/lineit/share'],
  ])('サイト専用の定型文とURLを共有先へ渡す', (createUrl, origin, pathname) => {
    const url = new URL(createUrl())

    expect(url.origin).toBe(origin)
    expect(url.pathname).toBe(pathname)
    expect(url.searchParams.get('text')).toBe(SITE_SHARE_TEXT)
    expect(url.searchParams.get('url')).toBe(siteConfig.url)
  })

  test('Discord用コピー文にはサイト紹介文とURLだけを含める', () => {
    expect(SITE_SHARE_CLIPBOARD_TEXT).toBe(`${SITE_SHARE_TEXT}\n${siteConfig.url}`)
    expect(DISCORD_MESSAGES_URL).toBe('https://discord.com/channels/@me')
  })
})
