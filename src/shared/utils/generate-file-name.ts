import { v4 as uuidv4 } from 'uuid'
import path from 'path'

export const generateRandomFilename = (filename: string) => {
  const ext = path.extname(filename)
  return `${uuidv4()}${ext}`
}