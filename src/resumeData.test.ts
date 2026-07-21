import { describe, expect, test } from 'bun:test'
import { COMMENT_MAX_LENGTH, countCommentCharacters, normalizeComment } from './resumeData'

describe('comment normalization', () => {
  test('絵文字を途中で分割せず、見た目上の文字数で制限する', () => {
    const comment = normalizeComment('👍️'.repeat(COMMENT_MAX_LENGTH + 1))

    expect(countCommentCharacters(comment)).toBe(COMMENT_MAX_LENGTH)
    expect(comment).toEndWith('👍️')
  })

  test('改行は3行まで保持し、4行目以降を3行目へまとめる', () => {
    expect(normalizeComment('1行目\n2行目\n3行目\n4行目')).toBe('1行目\n2行目\n3行目 4行目')
  })
})
