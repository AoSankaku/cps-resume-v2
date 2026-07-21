import { describe, expect, test } from 'bun:test'
import { parseResumeText, serializeResumeData } from './resumeJson'
import { initialResumeData } from './types'

describe('parseResumeText', () => {
  test('保存したバックアップをそのまま読み込める', () => {
    const result = parseResumeText(serializeResumeData(initialResumeData, new Date('2026-01-01T00:00:00.000Z')))

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.corrected).toBe(false)
    expect(result.data.playerName).toBe(initialResumeData.playerName)
    expect(result.data.avatarFrame).toBe('square')
  })

  test('横長のプレイヤーアイコン枠をバックアップへ保持する', () => {
    const result = parseResumeText(serializeResumeData({
      ...initialResumeData,
      avatarFrame: 'landscape',
    }))

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.avatarFrame).toBe('landscape')
  })

  test('GIFのプレイヤーアイコンをバックアップから復元する', () => {
    const avatarDataUrl = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=='
    const result = parseResumeText(JSON.stringify({
      playerName: 'GIFテスト',
      avatarDataUrl,
    }))

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.avatarDataUrl).toBe(avatarDataUrl)
  })

  test('APNGのプレイヤーアイコンをバックアップから復元する', () => {
    const avatarDataUrl = 'data:image/apng;base64,iVBORw0KGgo='
    const result = parseResumeText(JSON.stringify({
      playerName: 'APNGテスト',
      avatarDataUrl,
    }))

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.avatarDataUrl).toBe(avatarDataUrl)
  })

  test('枠情報がない以前のデータは正方形へ移行する', () => {
    const result = parseResumeText(JSON.stringify({ playerName: 'テスト' }))

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.avatarFrame).toBe('square')
  })

  test('全角のJSON記号と英数字を補正する', () => {
    const result = parseResumeText('｛＂format＂：＂ｃｐｓ－ｒｅｓｕｍｅ＂，＂version＂：２，＂data＂：｛＂playerName＂：＂テスト＂｝｝')

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.corrected).toBe(true)
    expect(result.data.playerName).toBe('テスト')
  })

  test('コードブロックと末尾カンマを補正する', () => {
    const result = parseResumeText(`\`\`\`json
{
  "format": "cps-resume",
  "version": 2,
  "data": {
    "playerName": "貼り付けテスト",
  },
}
\`\`\``)

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.corrected).toBe(true)
    expect(result.data.playerName).toBe('貼り付けテスト')
  })

  test('以前の項目名を現在の項目へ移行する', () => {
    const result = parseResumeText(JSON.stringify({
      rank: 'S9',
      enjoyRank: 'S8',
      iconCount: '4',
      snsId: '@legacy',
      selectedDetailKeys: ['snsId'],
    }))

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.highestRank).toBe('S9')
    expect(result.data.seasonHighestRank).toBe('S8')
    expect(result.data.goldIconCount).toBe('4')
    expect(result.data.xId).toBe('@legacy')
    expect(result.data.selectedDetailKeys).toEqual(['xId'])
  })

  test('自由項目Lの見出し・内容・選択状態を読み込める', () => {
    const result = parseResumeText(JSON.stringify({
      customDetailLabel3: '募集内容',
      customDetailValue3: '固定メンバーを募集しています',
      selectedDetailKeys: ['favoriteHero', 'custom3'],
    }))

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.customDetailLabel3).toBe('募集内容')
    expect(result.data.customDetailValue3).toBe('固定メンバーを募集しています')
    expect(result.data.selectedDetailKeys).toEqual(['favoriteHero', 'custom3'])
  })

  test('ひとことを2行までに収める', () => {
    const result = parseResumeText(JSON.stringify({
      comment: `1行目\r\n2行目\n3行目${'あ'.repeat(90)}`,
    }))

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.comment).toStartWith('1行目\n2行目 3行目')
    expect(result.data.comment.match(/\n/g)).toHaveLength(1)
    expect(result.data.comment.length).toBe(90)
  })

  test('別形式のデータは拒否する', () => {
    const result = parseResumeText('{"format":"another-app","version":2,"data":{"playerName":"テスト"}}')

    expect(result).toEqual({ ok: false, error: 'unsupported-format' })
  })

  test('履歴書データではない文章は拒否する', () => {
    const result = parseResumeText('これはバックアップではありません')

    expect(result).toEqual({ ok: false, error: 'invalid-json' })
  })
})
