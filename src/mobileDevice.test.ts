import { describe, expect, test } from 'bun:test'
import { isMobileDevice, type MobileDeviceNavigator } from './mobileDevice'

const navigatorData = (overrides: Partial<MobileDeviceNavigator> = {}): MobileDeviceNavigator => ({
  maxTouchPoints: 0,
  platform: 'Win32',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
  ...overrides,
})

describe('isMobileDevice', () => {
  test('User-Agent Client Hintsがモバイルを示す場合はモバイル端末と判定する', () => {
    expect(isMobileDevice(navigatorData({ userAgentData: { mobile: true } }))).toBe(true)
  })

  test.each([
    'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 Mobile Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148',
    'Mozilla/5.0 (iPad; CPU OS 18_5 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148',
  ])('モバイル端末のUser-Agentを判定する', (userAgent) => {
    expect(isMobileDevice(navigatorData({ userAgent }))).toBe(true)
  })

  test('デスクトップ表示のiPadOSもタッチポイントから判定する', () => {
    expect(isMobileDevice(navigatorData({
      platform: 'MacIntel',
      maxTouchPoints: 5,
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15)',
    }))).toBe(true)
  })

  test('タッチ対応Windows PCはモバイル端末と判定しない', () => {
    expect(isMobileDevice(navigatorData({ maxTouchPoints: 10 }))).toBe(false)
  })
})
