import { getTwemojiTextParts } from '../canvasText'

type Props = {
  text: string
}

function TwemojiPreview({ text }: Props) {
  const parts = getTwemojiTextParts(text)
  if (!parts.some(({ type }) => type === 'emoji')) return null

  return (
    <span className="twemoji-preview" aria-hidden="true">
      <span className="twemoji-preview-label">Twemoji表示</span>
      <span className="twemoji-preview-text">
        {parts.map((part, index) => part.type === 'emoji' ? (
          <img key={`${part.url}-${index}`} src={part.url} alt="" draggable={false} />
        ) : (
          <span key={`text-${index}`}>{part.text}</span>
        ))}
      </span>
    </span>
  )
}

export default TwemojiPreview
