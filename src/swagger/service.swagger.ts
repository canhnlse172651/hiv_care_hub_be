import { ApiOperation, ApiResponse, ApiBody, ApiQuery } from '@nestjs/swagger'
import { applyDecorators } from '@nestjs/common'
import { ServiceResponseSwagger, CreateServiceDto, UpdateServiceDto } from '../routes/service/service.dto'

export function ApiCreateService() {
  return applyDecorators(
    ApiOperation({ summary: 'Tạo mới Service' }),
    ApiBody({
      type: CreateServiceDto,
      description: 'Dữ liệu tạo Service',
      examples: {
        example: {
          summary: 'Tạo Service',
          value: {
            name: 'Khám tổng quát',
            price: '200000',
            type: 'CONSULT',
            description: 'Khám tổng quát cho bệnh nhân HIV',
            startTime: '07:00',
            endTime: '16:00',
            duration: '01:00',
            imageUrl: 'https://example.com/image.jpg',
            content: 'Nội dung chi tiết...',
          },
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: 'Service created',
      type: ServiceResponseSwagger,
      examples: {
        example: {
          summary: 'Service đã tạo',
          value: {
            id: 1,
            name: 'Khám tổng quát',
            slug: 'kham-tong-quat',
            price: '200000',
            type: 'CONSULT',
            description: 'Khám tổng quát cho bệnh nhân HIV',
            startTime: '07:00',
            endTime: '16:00',
            duration: '01:00',
            imageUrl: 'https://example.com/image.jpg',
            content: 'Nội dung chi tiết...',
            isActive: true,
            createdAt: '2024-06-14T08:00:00.000Z',
            updatedAt: '2024-06-14T08:00:00.000Z',
          },
        },
      },
    }),
  )
}

export function ApiGetAllServices() {
  return applyDecorators(
    ApiOperation({ summary: 'Lấy danh sách tất cả Service (admin, có phân trang, filter, search)' }),
    ApiQuery({ name: 'page', required: false, type: Number, description: 'Trang hiện tại' }),
    ApiQuery({ name: 'limit', required: false, type: Number, description: 'Số item/trang' }),
    ApiQuery({ name: 'search', required: false, type: String, description: 'Tìm kiếm theo tên' }),
    ApiQuery({ name: 'type', required: false, type: String, description: 'Lọc theo loại Service' }),
    ApiQuery({ name: 'isActive', required: false, type: Boolean, description: 'Lọc theo trạng thái hoạt động' }),
    ApiResponse({
      status: 200,
      description: 'Danh sách Service (có phân trang)',
      schema: {
        type: 'object',
        properties: {
          data: { type: 'array', items: { $ref: '#/components/schemas/ServiceResponseSwagger' } },
          meta: {
            type: 'object',
            properties: {
              total: { type: 'number', example: 100 },
              page: { type: 'number', example: 1 },
              limit: { type: 'number', example: 10 },
              totalPages: { type: 'number', example: 10 },
              hasNextPage: { type: 'boolean', example: true },
              hasPreviousPage: { type: 'boolean', example: false },
            },
          },
        },
      },
    }),
  )
}

export function ApiGetAllActiveServices() {
  return applyDecorators(
    ApiOperation({ summary: 'Lấy danh sách Service đang hoạt động (public, có phân trang, search)' }),
    ApiQuery({ name: 'page', required: false, type: Number, description: 'Trang hiện tại' }),
    ApiQuery({ name: 'limit', required: false, type: Number, description: 'Số item/trang' }),
    ApiQuery({ name: 'search', required: false, type: String, description: 'Tìm kiếm theo tên' }),
    ApiQuery({ name: 'type', required: false, type: String, description: 'Lọc theo loại Service' }),
    ApiResponse({
      status: 200,
      description: 'Danh sách Service đang hoạt động (có phân trang)',
      schema: {
        type: 'object',
        properties: {
          data: { type: 'array', items: { $ref: '#/components/schemas/ServiceResponseSwagger' } },
          meta: {
            type: 'object',
            properties: {
              total: { type: 'number', example: 100 },
              page: { type: 'number', example: 1 },
              limit: { type: 'number', example: 10 },
              totalPages: { type: 'number', example: 10 },
              hasNextPage: { type: 'boolean', example: true },
              hasPreviousPage: { type: 'boolean', example: false },
            },
          },
        },
      },
    }),
  )
}

export function ApiGetServiceById() {
  return applyDecorators(
    ApiOperation({ summary: 'Lấy Service theo id' }),
    ApiResponse({ status: 200, description: 'Service detail', type: ServiceResponseSwagger }),
  )
}

export function ApiGetServiceBySlug() {
  return applyDecorators(
    ApiOperation({ summary: 'Lấy Service theo slug' }),
    ApiResponse({ status: 200, description: 'Service detail', type: ServiceResponseSwagger }),
  )
}

export function ApiUpdateService() {
  return applyDecorators(
    ApiOperation({ summary: 'Cập nhật Service' }),
    ApiBody({
      type: UpdateServiceDto,
      description: 'Dữ liệu cập nhật Service',
      examples: {
        example: {
          summary: 'Cập nhật Service',
          value: {
            name: 'Khám chuyên sâu',
            price: '300000',
            type: 'CONSULT',
            description: 'Khám chuyên sâu cho bệnh nhân HIV',
            startTime: '08:00',
            endTime: '17:00',
            duration: '01:30',
            imageUrl: 'https://example.com/image2.jpg',
            content: 'Nội dung cập nhật...',
          },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Service updated',
      type: ServiceResponseSwagger,
      examples: {
        example: {
          summary: 'Service đã cập nhật',
          value: {
            id: 1,
            name: 'Khám chuyên sâu',
            slug: 'kham-chuyen-sau',
            price: '300000',
            type: 'CONSULT',
            description: 'Khám chuyên sâu cho bệnh nhân HIV',
            startTime: '08:00',
            endTime: '17:00',
            duration: '01:30',
            imageUrl: 'https://example.com/image2.jpg',
            content: 'Nội dung cập nhật...',
            isActive: true,
            createdAt: '2024-06-14T08:00:00.000Z',
            updatedAt: '2024-06-14T10:00:00.000Z',
          },
        },
      },
    }),
  )
}

export function ApiDeleteService() {
  return applyDecorators(
    ApiOperation({ summary: 'Xóa Service' }),
    ApiResponse({ status: 200, description: 'Service deleted', type: ServiceResponseSwagger }),
  )
}

export function ApiChangeServiceActiveStatus() {
  return applyDecorators(
    ApiOperation({ summary: 'Bật/tắt trạng thái hoạt động của Service' }),
    ApiResponse({ status: 200, description: 'Service status changed', type: ServiceResponseSwagger }),
  )
}
