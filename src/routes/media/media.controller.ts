import {
  Controller,
  FileTypeValidator,
  MaxFileSizeValidator,
  ParseFilePipe,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
  Get,
  BadRequestException,
  NotFoundException,
  Param,
  Res,
} from '@nestjs/common'
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express'
import { ApiTags } from '@nestjs/swagger'
import { ApiUploadImage, ApiUploadImages } from '../../swagger/media.swagger'
import { Response } from 'express'
import path from 'path'
import envConfig from '../../shared/config'
import { UPLOAD_DIR } from '../../shared/constants/other.constant'

@ApiTags('Media')
@Controller('media')
export class MediaController {
  @Post('images/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
      fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
        if (allowed.includes(file.mimetype)) {
          cb(null, true)
        } else {
          cb(new Error('Invalid file type'), false)
        }
      },
    }),
  )
  @ApiUploadImage()
  uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
        ],
        errorHttpStatusCode: 400,
      }),
    )
    file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded')
    }
    console.log('Single file upload:', file)
    return {
      url: `${envConfig.PREFIX_STATIC_ENDPOINT}/${file.filename}`,
    }
  }

  @Post('images/upload-multi')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
      fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
        if (allowed.includes(file.mimetype)) {
          cb(null, true)
        } else {
          cb(new Error('Invalid file type'), false)
        }
      },
    }),
  )
  @ApiUploadImages()
  uploadFiles(
    @UploadedFiles()
    files: Array<Express.Multer.File>,
  ) {
    if (!files || !Array.isArray(files) || files.length === 0) {
      throw new BadRequestException('No files uploaded')
    }
    console.log('Multi file upload:', files)
    return files.map((file) => ({
      url: `${envConfig.PREFIX_STATIC_ENDPOINT}/${file.filename}`,
    }))
  }

  @Get('static/:filename')
  serveFile(@Param('filename') filename: string, @Res() res: Response) {
    return res.sendFile(path.resolve(UPLOAD_DIR, filename), (error) => {
      if (error) {
        const notfound = new NotFoundException('File not found')
        res.status(notfound.getStatus()).json(notfound.getResponse())
      }
    })
  }
}
