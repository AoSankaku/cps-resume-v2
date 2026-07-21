import type { ResumeData } from './types'

type ImageFilenameData = Pick<ResumeData, 'xId' | 'discordId' | 'friendCode' | 'playerName'>

const sanitizeFilenamePart = (value: string) => value.replace(/[\\/:*?"<>|]/g, '_')

export const getResumeImageFilenameStem = (
  data: ImageFilenameData,
  date = new Date(),
): string => {
  const identifier = [data.xId, data.discordId, data.friendCode, data.playerName]
    .map((value) => value.trim())
    .find(Boolean) ?? 'compass-resume'
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}-${sanitizeFilenamePart(identifier)}`
}
