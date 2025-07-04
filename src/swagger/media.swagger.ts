import { applyDecorators } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiBody, ApiConsumes } from '@nestjs/swagger'

// Swagger schemas
export const FileUploadResponseSchema = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      url: { type: 'string', example: '/static/abc123.png' }
    }
  }
}

export const SingleFileUploadResponseSchema = {
  type: 'object',
  properties: {
    url: { type: 'string', example: '/static/abc123.png' }
  }
}

export const ApiUploadImage = () => {
  return applyDecorators(
    ApiOperation({
      summary: 'Upload single image file',
      description: 'Upload a single image (JPEG, JPG, PNG, WEBP). Max size: 10MB.'
    }),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      description: 'Image file to upload',
      schema: {
        type: 'object',
        properties: {
          file: {
            type: 'string',
            format: 'binary',
            description: 'Image file (JPEG, JPG, PNG, WEBP). Max size: 10MB',
          },
        },
        required: ['file'],
      },
      examples: {
        png: {
          summary: 'Upload PNG image',
          value: { file: 'profile.png' }
        },
        jpeg: {
          summary: 'Upload JPEG image',
          value: { file: 'avatar.jpeg' }
        }
      }
    }),
    ApiResponse({
      status: 201,
      description: 'Image uploaded successfully',
      schema: SingleFileUploadResponseSchema
    }),
    ApiResponse({ status: 400, description: 'Bad request - Invalid file format, missing file, or file too large.' }),
    ApiResponse({ status: 401, description: 'Unauthorized - Authentication required' }),
    ApiResponse({ status: 413, description: 'File too large - Exceeds maximum file size limit (10MB)' }),
    ApiResponse({ status: 415, description: 'Unsupported media type - Only JPEG, JPG, PNG, WEBP formats are supported' })
  );
};

export const ApiUploadImages = () => {
  return applyDecorators(
    ApiOperation({
      summary: 'Upload multiple image files',
      description: 'Upload multiple images (JPEG, JPG, PNG, WEBP). Max 10 files, mỗi file tối đa 10MB.'
    }),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      description: 'Array of image files to upload',
      schema: {
        type: 'object',
        properties: {
          files: {
            type: 'array',
            items: {
              type: 'string',
              format: 'binary',
              description: 'Image file (JPEG, JPG, PNG, WEBP).'
            }
          }
        },
        required: ['files'],
      },
      examples: {
        multi: {
          summary: 'Upload multiple images',
          value: { files: ['a.png', 'b.jpg'] }
        }
      }
    }),
    ApiResponse({
      status: 201,
      description: 'Images uploaded successfully',
      schema: FileUploadResponseSchema
    }),
    ApiResponse({ status: 400, description: 'Bad request - Invalid file format, missing file, or file too large.' }),
    ApiResponse({ status: 401, description: 'Unauthorized - Authentication required' }),
    ApiResponse({ status: 413, description: 'File too large - Exceeds maximum file size limit (10MB)' }),
    ApiResponse({ status: 415, description: 'Unsupported media type - Only JPEG, JPG, PNG, WEBP formats are supported' })
  );
};

export const MediaSwagger = {
  tags: 'Media',
  uploadImage: {
    operation: ApiOperation({ summary: 'Upload image file' }),
    responses: [
      ApiResponse({ status: 201, description: 'Image uploaded successfully', schema: FileUploadResponseSchema }),
      ApiResponse({ status: 400, description: 'Bad request - Invalid file format or missing file' }),
      ApiResponse({ status: 401, description: 'Unauthorized' }),
      ApiResponse({ status: 413, description: 'File too large' }),
      ApiResponse({ status: 415, description: 'Unsupported media type' })
    ]
  }
}
