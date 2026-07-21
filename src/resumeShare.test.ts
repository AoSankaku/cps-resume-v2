import { describe, expect, test } from 'bun:test'
import { siteConfig } from './config/site'
import { getResumeXShareUrl, RESUME_SHARE_TEXT } from './resumeShare'

describe('getResumeXShareUrl', () => {
  test('履歴書用の定型文とサイトURLをXの投稿画面へ渡す', () => {
    const url = new URL(getResumeXShareUrl())

    expect(url.origin).toBe('https://x.com')
    expect(url.pathname).toBe('/intent/tweet')
    expect(url.searchParams.get('text')).toBe(RESUME_SHARE_TEXT)
    expect(url.searchParams.get('url')).toBe(siteConfig.url)
  })
})
