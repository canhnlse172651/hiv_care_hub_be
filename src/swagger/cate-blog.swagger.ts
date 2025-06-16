import { applyDecorators } from '@nestjs/common'
import { ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger'

export const CateBlogResponseSchema = {
  type: 'object',
  properties: {
    id: { type: 'number', example: 1 },
    title: { type: 'string', example: 'HIV' },
    description: { type: 'string', example: 'HIV is a virus that attacks the immune system' },
    isPublished: { type: 'boolean', example: true },
    createdAt: { type: 'string', format: 'date-time', example: '2023-10-01T12:00:00Z' },
    updatedAt: { type: 'string', format: 'date-time', example: '2023-10-01T12:00:00Z' },
  },
}

export const ApiCreateCateBlog = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Create a new category blog' }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Category blog title', example: 'Tech' },
          description: { type: 'string', description: 'Category blog description', example: 'All about technology' },
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: 'Category blog created successfully',
      schema: CateBlogResponseSchema,
    }),
    ApiResponse({ status: 400, description: 'Bad Request' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' }),
  )
}

export const ApiGetAllCateBlogs = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Get all category blogs', description: 'Retrieve a list of all category blogs' }),
    ApiQuery({
      name: 'page',
      required: false,
      description: 'Page number',
      type: Number,
      example: 1,
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      description: 'Number of items per page',
      type: Number,
      example: 10,
    }),
    ApiQuery({
      name: 'search',
      required: false,
      description: 'Search query for category blog title',
      type: String,
    }),
    ApiQuery({
      name: 'sortBy',
      required: false,
      description: 'Field to sort by',
      enum: ['title'],
    }),
    ApiQuery({
      name: 'sortOrder',
      required: false,
      description: 'Sort order (asc or desc)',
      enum: ['asc', 'desc'],
    }),
    ApiResponse({
      status: 200,
      description: 'List of all category blogs',
      schema: {
        type: 'array',
        items: CateBlogResponseSchema,
      },
    }),
    ApiResponse({ status: 400, description: 'Bad Request' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' }),
  )
}

export const ApiGetCateBlogById = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Get category blog by ID' }),
    ApiParam({
      name: 'id',
      type: 'number',
      description: 'Category blog ID',
      example: 1,
    }),
    ApiResponse({
      status: 200,
      description: 'Category blog details',
      schema: CateBlogResponseSchema,
    }),
    ApiResponse({ status: 400, description: 'Bad Request' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' }),
    ApiResponse({ status: 404, description: 'Category blog not found' }),
  )
}

export const ApiUpdateCateBlog = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Update category blog by ID' }),
    ApiParam({
      name: 'id',
      type: 'number',
      description: 'Category blog ID',
      example: 1,
    }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Updated category blog title', example: 'Updated Tech' },
          description: {
            type: 'string',
            description: 'Updated category blog description',
            example: 'Updated description',
          },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Category blog updated successfully',
      schema: CateBlogResponseSchema,
    }),
    ApiResponse({ status: 400, description: 'Bad Request' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' }),
    ApiResponse({ status: 404, description: 'Category blog not found' }),
  )
}

export const ApiDeleteCateBlog = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Delete category blog by ID' }),
    ApiParam({
      name: 'id',
      type: 'number',
      description: 'Category blog ID',
      example: 1,
    }),
    ApiResponse({ status: 204, description: 'Category blog deleted successfully' }),
    ApiResponse({ status: 400, description: 'Bad Request' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' }),
    ApiResponse({ status: 404, description: 'Category blog not found' }),
  )
}

export const ApiChangeCateBlogStatus = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Change category blog status by ID' }),
    ApiParam({
      name: 'id',
      type: 'number',
      description: 'Category blog ID',
      example: 1,
    }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          isPublished: { type: 'boolean', description: 'New status of the category blog', example: true },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Category blog status updated successfully',
      schema: CateBlogResponseSchema,
    }),
    ApiResponse({ status: 400, description: 'Bad Request' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' }),
    ApiResponse({ status: 404, description: 'Category blog not found' }),
  )
}

// export const ApiSearchCateBlogs = () => {
//   return applyDecorators(
//     ApiOperation({ summary: 'Search category blogs by title' }),
//     ApiQuery({
//       name: 'q',
//       description: 'Search query for category blog title',
//       type: String,
//       required: true,
//     }),
//     ApiResponse({
//       status: 200,
//       description: 'List of category blogs matching the search query',
//       schema: {
//         type: 'array',
//         items: CateBlogResponseSchema,
//       },
//     }),
//     ApiResponse({ status: 400, description: 'Bad Request' }),
//     ApiResponse({ status: 401, description: 'Unauthorized' }),
//     ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' }),
//   )
// }
