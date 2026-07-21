import { describe, expect, test } from 'bun:test'
import { getResumeImageFilenameStem } from './imageFilename'

const date = new Date(2026, 6, 21)

describe('getResumeImageFilenameStem', () => {
  test('X IDを最優先し、ローカル日付を付ける', () => {
    expect(getResumeImageFilenameStem({
      xId: ' @twitter_id ',
      discordId: 'discord_id',
      friendCode: '1234567890',
      playerName: 'プレイヤー名',
    }, date)).toBe('2026-07-21-@twitter_id')
  })

  test.each([
    [{ xId: '', discordId: 'discord_id', friendCode: '1234567890', playerName: 'プレイヤー名' }, 'discord_id'],
    [{ xId: ' ', discordId: '', friendCode: '1234567890', playerName: 'プレイヤー名' }, '1234567890'],
    [{ xId: '', discordId: ' ', friendCode: '', playerName: 'プレイヤー名' }, 'プレイヤー名'],
    [{ xId: '', discordId: '', friendCode: ' ', playerName: '' }, 'compass-resume'],
  ])('空欄の場合は次の識別子へフォールバックする', (data, expected) => {
    expect(getResumeImageFilenameStem(data, date)).toBe(`2026-07-21-${expected}`)
  })

  test('ファイル名に使えない記号を置き換える', () => {
    expect(getResumeImageFilenameStem({
      xId: 'user/name:*?',
      discordId: '',
      friendCode: '',
      playerName: '',
    }, date)).toBe('2026-07-21-user_name___')
  })
})
