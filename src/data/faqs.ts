import faqsDocument from './faqs.yaml'

export type Faq = {
  question: string
  answer: string
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const createFaqs = (document: unknown): Faq[] => {
  if (!isRecord(document) || !Array.isArray(document.faqs)) {
    throw new Error('faqs.yaml: ルートに faqs の配列が必要です。')
  }

  const questions = new Set<string>()

  return document.faqs.map((entry, index) => {
    const location = `faqs.yaml: faqs[${index}]`
    if (!isRecord(entry)) throw new Error(`${location} はオブジェクトで指定してください。`)
    if (typeof entry.question !== 'string' || !entry.question.trim()) {
      throw new Error(`${location}.question が必要です。`)
    }
    if (typeof entry.answer !== 'string' || !entry.answer.trim()) {
      throw new Error(`${location}.answer が必要です。`)
    }

    const question = entry.question.trim()
    const answer = entry.answer.trim()
    if (questions.has(question)) throw new Error(`${location}.question「${question}」が重複しています。`)
    questions.add(question)

    return { question, answer }
  })
}

export const faqs = createFaqs(faqsDocument)
