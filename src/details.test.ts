import { describe, expect, test } from 'bun:test'
import { countDetailSlots, getDetailLayout, limitDetailKeys, type DetailKey } from './details'

describe('detail slot helpers', () => {
  test('自由項目3は2枠として数える', () => {
    expect(countDetailSlots(['favoriteHero', 'custom3'])).toBe(3)
  })

  test('6枠を超える項目は読み込み対象から除外する', () => {
    const keys: DetailKey[] = [
      'custom3',
      'favoriteHero',
      'seriousLevel',
      'guild',
      'friendCode',
      'accountLevel',
    ]

    expect(limitDetailKeys(keys)).toEqual([
      'custom3',
      'favoriteHero',
      'seriousLevel',
      'guild',
      'friendCode',
    ])
    expect(countDetailSlots(limitDetailKeys(keys))).toBe(6)
  })

  test('自由項目3を通常4項目の下へ2列幅で配置する', () => {
    const layout = getDetailLayout([
      'favoriteHero',
      'seriousLevel',
      'guild',
      'playHistory',
      'custom3',
    ])

    expect(layout.at(-1)).toEqual({
      key: 'custom3',
      column: 0,
      row: 2,
      widthColumns: 2,
    })
  })
})
