import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger'
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
            startTime: '2024-06-14T08:00:00.000Z',
            endTime: '2024-06-14T09:00:00.000Z',
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
            startTime: '2024-06-14T08:00:00.000Z',
            endTime: '2024-06-14T09:00:00.000Z',
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
    ApiOperation({ summary: 'Lấy danh sách tất cả Service (admin)' }),
    ApiResponse({ status: 200, description: 'Danh sách Service', type: ServiceResponseSwagger, isArray: true }),
  )
}

export function ApiGetAllActiveServices() {
  return applyDecorators(
    ApiOperation({ summary: 'Lấy danh sách Service đang hoạt động (public)' }),
    ApiResponse({
      status: 200,
      description: 'Danh sách Service đang hoạt động',
      type: ServiceResponseSwagger,
      isArray: true,
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
            startTime: '2024-06-14T10:00:00.000Z',
            endTime: '2024-06-14T11:00:00.000Z',
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
            startTime: '2024-06-14T10:00:00.000Z',
            endTime: '2024-06-14T11:00:00.000Z',
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
