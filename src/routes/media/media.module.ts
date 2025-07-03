import { Module } from '@nestjs/common'
import { MulterModule } from '@nestjs/platform-express'
import multer from 'multer'
import path from 'path'
import { existsSync, mkdirSync } from 'fs'


import { MediaController } from 'src/routes/media/media.controller'
import { generateRandomFilename } from 'src/shared/utils/generate-file-name'
const UPLOAD_DIR = path.resolve('upload')
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR)
  },
  filename: function (req, file, cb) {
    const newFilename = generateRandomFilename(file.originalname)
    cb(null, newFilename)
  },
})

@Module({
  imports: [
    MulterModule.register({
      storage,
    }),
  ],
  controllers: [MediaController],
})
export class MediaModule {
  constructor() {
    if (!existsSync(UPLOAD_DIR)) {
      mkdirSync(UPLOAD_DIR, { recursive: true })
    }
  }
}