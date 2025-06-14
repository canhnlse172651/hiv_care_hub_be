import { applyDecorators } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger'

export const BlogResponseSchema = {
  type: 'object',
  properties: {
    id: { type: 'number', example: 1 },
    title: { type: 'string', example: 'Understanding NestJS Swagger Integration' },
    content: { type: 'string', example: 'NestJS provides powerful decorators to document APIs...' },
    imageUrl: { type: 'string', example: null },
    authorId: { type: 'number', example: 1 },
    cateId: { type: 'number', example: 1 },
    isPublished: { type: 'boolean', example: true },
    createdAt: { type: 'string', format: 'date-time', example: '2025-01-01T00:00:00Z' },
    updatedAt: { type: 'string', format: 'date-time', example: '2025-01-01T00:00:00Z' },
  },
}

export const ApiCreateBlog = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Create a new blog' }),
    ApiBody({
      schema: {
        type: 'object',
        required: ['title', 'content', 'authorId'],
        properties: {
          title: {
            type: 'string',
            description: 'Title of the blog',
            example: 'Understanding NestJS Swagger Integration',
          },
          content: {
            type: 'string',
            description: 'Content of the blog',
            example: 'NestJS provides powerful decorators to document APIs...',
          },
          imageUrl: {
            type: 'string',
            description: 'URL of the blog image',
            example: null,
          },
          authorId: {
            type: 'number',
            description: 'ID of the author creating the blog',
            example: 1,
          },
          cateId: {
            type: 'number',
            description: 'ID of the category for the blog',
            example: 1,
          },
        },
      },
    }),
    ApiResponse({ status: 201, description: 'Blog created successfully', schema: BlogResponseSchema }),
    ApiResponse({ status: 400, description: 'Bad request - Invalid input data' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' }),
  )
}

export const ApiGetAllBlogs = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Get all blogs' }),
    ApiResponse({
      status: 200,
      description: 'List of all blogs',
      schema: {
        type: 'array',
        items: BlogResponseSchema,
      },
    }),
  )
}

export const ApiGetBlogById = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Get blog by ID' }),
    ApiParam({
      name: 'id',
      type: 'number',
      description: 'Blog ID',
      example: 1,
    }),
    ApiResponse({ status: 200, description: 'Blog found', schema: BlogResponseSchema }),
    ApiResponse({ status: 404, description: 'Blog not found' }),
  )
}

export const ApiUpdateBlog = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Update blog by ID' }),
    ApiParam({ name: 'id', type: 'number', description: 'Blog ID', example: 1 }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: 'Updated blog title',
            example: 'Updated Title',
          },
          content: {
            type: 'string',
            description: 'Updated content',
            example: 'Updated content goes here...',
          },
          imageUrl: {
            type: 'string',
            description: 'Updated blog image URL',
            example: null,
          },
          authorId: {
            type: 'number',
            description: 'ID of the author updating the blog',
            example: 1,
          },
          cateId: {
            type: 'number',
            description: 'ID of the category for the blog',
            example: 1,
          },
        },
      },
    }),
    ApiResponse({ status: 200, description: 'Blog updated successfully', schema: BlogResponseSchema }),
    ApiResponse({ status: 400, description: 'Bad request - Invalid input data' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' }),
    ApiResponse({ status: 404, description: 'Blog not found' }),
  )
}

export const ApiDeleteBlog = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Delete blog by ID' }),
    ApiParam({ name: 'id', type: 'number', description: 'Blog ID', example: 1 }),
    ApiResponse({ status: 200, description: 'Blog deleted successfully' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' }),
    ApiResponse({ status: 404, description: 'Blog not found' }),
  )
}

export const ApiPublishBlog = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Publish blog by ID' }),
    ApiParam({ name: 'id', type: 'number', description: 'Blog ID', example: 1 }),
    ApiResponse({ status: 200, description: 'Blog published successfully', schema: BlogResponseSchema }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' }),
    ApiResponse({ status: 404, description: 'Blog not found' }),
  )
}
