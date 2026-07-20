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

  test('別形式のデータは拒否する', () => {
    const result = parseResumeText('{"format":"another-app","version":2,"data":{"playerName":"テスト"}}')

    expect(result).toEqual({ ok: false, error: 'unsupported-format' })
  })

  test('履歴書データではない文章は拒否する', () => {
    const result = parseResumeText('これはバックアップではありません')

    expect(result).toEqual({ ok: false, error: 'invalid-json' })
  })
})
