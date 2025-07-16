import { applyDecorators } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger'
import { CreateTestResultDto, UpdateTestResultDto } from '../routes/test-result/test-result.dto'

export const TestResultResponseSchema = {
  type: 'object',
  properties: {
    id: { type: 'number', example: 1 },
    testId: { type: 'number', example: 1 },
    userId: { type: 'number', example: 123 },
    appointmentId: { type: 'number', example: 456 },
    rawResultValue: { type: 'number', example: 0.3 },
    interpretation: {
      type: 'string',
      enum: ['POSITIVE', 'NEGATIVE', 'INDETERMINATE', 'DETECTED', 'NOT_DETECTED'],
      example: 'NEGATIVE',
    },
    unit: { type: 'string', example: 'ratio' },
    cutOffValueUsed: { type: 'number', example: 1.0 },
    labTechId: { type: 'number', example: 789 },
    doctorId: { type: 'number', nullable: true, example: null },
    resultDate: { type: 'string', format: 'date-time', example: '2025-07-14T10:00:00Z' },
    notes: { type: 'string', example: 'Kết quả xét nghiệm HIV âm tính' },
    createdAt: { type: 'string', format: 'date-time', example: '2025-07-14T10:00:00Z' },
    updatedAt: { type: 'string', format: 'date-time', example: '2025-07-14T10:00:00Z' },
    test: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        name: { type: 'string', example: 'HIV Ag/Ab Combo' },
        category: { type: 'string', example: 'STD' },
        isQuantitative: { type: 'boolean', example: false },
        unit: { type: 'string', example: 'ratio' },
        cutOffValue: { type: 'number', example: 1.0 },
        description: { type: 'string', example: 'Xét nghiệm sàng lọc HIV' },
      },
    },
    user: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 123 },
        fullName: { type: 'string', example: 'Nguyễn Văn A' },
        email: { type: 'string', example: 'nguyenvana@example.com' },
        phoneNumber: { type: 'string', example: '0123456789' },
        role: { type: 'string', example: 'PATIENT' },
      },
    },
    appointment: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 456 },
        appointmentDate: { type: 'string', format: 'date-time', example: '2025-07-14T10:00:00Z' },
        timeSlot: { type: 'string', example: 'MORNING' },
        status: { type: 'string', example: 'COMPLETED' },
      },
    },
  },
}

export const ApiCreateTestResult = () => {
  return applyDecorators(
    ApiOperation({
      summary: 'Tạo kết quả xét nghiệm mới',
      description:
        'Tạo kết quả xét nghiệm mới cho một xét nghiệm cụ thể. Chỉ nhân viên xét nghiệm (STAFF) có thể tạo kết quả.',
    }),
    ApiBearerAuth(),
    ApiBody({
      description: 'Dữ liệu kết quả xét nghiệm',
      schema: {
        type: 'object',
        required: ['rawResultValue', 'testId', 'userId', 'appointmentId', 'resultDate'],
        properties: {
          rawResultValue: {
            type: 'number',
            description: 'Giá trị kết quả xét nghiệm (phụ thuộc vào loại xét nghiệm)',
            examples: {
              'STD/HEPATITIS': '0.3 (định tính, ratio)',
              CD4: '350 (cells/μL)',
              'Viral Load': '1500 (copies/mL)',
              Hemoglobin: '14.5 (g/dL)',
            },
          },
          testId: {
            type: 'number',
            description: 'ID của loại xét nghiệm',
            example: 1,
          },
          userId: {
            type: 'number',
            description: 'ID của bệnh nhân',
            example: 123,
          },
          appointmentId: {
            type: 'number',
            description: 'ID của cuộc hẹn',
            example: 456,
          },
          resultDate: {
            type: 'string',
            format: 'date-time',
            description: 'Thời gian có kết quả xét nghiệm',
            example: '2025-07-14T10:00:00Z',
          },
          notes: {
            type: 'string',
            description: 'Ghi chú về kết quả xét nghiệm',
            example: 'Kết quả xét nghiệm bình thường',
          },
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: 'Tạo kết quả xét nghiệm thành công',
      schema: TestResultResponseSchema,
    }),
    ApiResponse({
      status: 400,
      description: 'Dữ liệu không hợp lệ',
      schema: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'BAD_REQUEST' },
          message: { type: 'string', example: 'rawResultValue phải là số dương' },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Test không tồn tại',
      schema: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'NOT_FOUND' },
          message: { type: 'string', example: 'Test với ID 1 không tồn tại' },
        },
      },
    }),
    ApiResponse({
      status: 403,
      description: 'Không có quyền - Chỉ nhân viên xét nghiệm (STAFF) có thể tạo kết quả',
      schema: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'FORBIDDEN' },
          message: { type: 'string', example: 'Chỉ nhân viên xét nghiệm mới có thể tạo kết quả' },
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: 'Không có token hoặc token không hợp lệ',
      schema: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'UNAUTHORIZED' },
          message: { type: 'string', example: 'Token không hợp lệ hoặc đã hết hạn' },
        },
      },
    }),
  )
}

export const ApiGetTestResults = () => {
  return applyDecorators(
    ApiOperation({
      summary: 'Lấy danh sách kết quả xét nghiệm',
      description: 'Lấy danh sách kết quả xét nghiệm có phân trang và lọc',
    }),
    ApiBearerAuth(),
    ApiResponse({
      status: 200,
      description: 'Lấy danh sách thành công',
      schema: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: TestResultResponseSchema,
          },
          pagination: {
            type: 'object',
            properties: {
              page: { type: 'number', example: 1 },
              limit: { type: 'number', example: 10 },
              total: { type: 'number', example: 100 },
              totalPages: { type: 'number', example: 10 },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: 'Không có token hoặc token không hợp lệ',
    }),
  )
}

export const ApiGetTestResultById = () => {
  return applyDecorators(
    ApiOperation({
      summary: 'Lấy kết quả xét nghiệm theo ID',
      description: 'Lấy thông tin chi tiết của một kết quả xét nghiệm',
    }),
    ApiBearerAuth(),
    ApiResponse({
      status: 200,
      description: 'Lấy thông tin thành công',
      schema: TestResultResponseSchema,
    }),
    ApiResponse({
      status: 404,
      description: 'Không tìm thấy kết quả xét nghiệm',
    }),
    ApiResponse({
      status: 401,
      description: 'Không có token hoặc token không hợp lệ',
    }),
  )
}

export const ApiUpdateTestResult = () => {
  return applyDecorators(
    ApiOperation({
      summary: 'Cập nhật kết quả xét nghiệm',
      description:
        'Cập nhật thông tin kết quả xét nghiệm. Chỉ nhân viên tạo kết quả hoặc có quyền cao hơn mới được cập nhật.',
    }),
    ApiBearerAuth(),
    ApiBody({
      description: 'Dữ liệu cập nhật',
      type: UpdateTestResultDto,
      schema: {
        type: 'object',
        properties: {
          rawResultValue: {
            type: 'number',
            description: 'Giá trị kết quả xét nghiệm mới',
            example: 0.8,
          },
          notes: {
            type: 'string',
            description: 'Ghi chú mới',
            example: 'Cập nhật kết quả sau khi kiểm tra lại',
          },
          resultDate: {
            type: 'string',
            format: 'date-time',
            description: 'Thời gian có kết quả mới',
            example: '2025-07-14T11:00:00Z',
          },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Cập nhật thành công',
      schema: TestResultResponseSchema,
    }),
    ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' }),
    ApiResponse({ status: 404, description: 'Không tìm thấy kết quả xét nghiệm' }),
    ApiResponse({ status: 401, description: 'Không có token hoặc token không hợp lệ' }),
    ApiResponse({ status: 403, description: 'Không có quyền hoặc kết quả đã được duyệt' }),
  )
}

export const ApiDeleteTestResult = () => {
  return applyDecorators(
    ApiOperation({
      summary: 'Xóa kết quả xét nghiệm',
      description:
        'Xóa kết quả xét nghiệm khỏi hệ thống. Chỉ nhân viên tạo kết quả hoặc có quyền cao hơn mới được xóa.',
    }),
    ApiBearerAuth(),
    ApiResponse({
      status: 200,
      description: 'Xóa thành công',
      schema: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Xóa kết quả xét nghiệm thành công' },
        },
      },
    }),
    ApiResponse({ status: 404, description: 'Không tìm thấy kết quả xét nghiệm' }),
    ApiResponse({ status: 401, description: 'Không có token hoặc token không hợp lệ' }),
    ApiResponse({ status: 403, description: 'Không có quyền hoặc kết quả đã được duyệt' }),
  )
}

export const ApiApproveTestResult = () => {
  return applyDecorators(
    ApiOperation({
      summary: 'Duyệt kết quả xét nghiệm',
      description: 'Duyệt kết quả xét nghiệm bởi bác sĩ. Chỉ bác sĩ (DOCTOR) có thể duyệt kết quả.',
    }),
    ApiBearerAuth(),
    ApiResponse({
      status: 200,
      description: 'Duyệt thành công',
      schema: TestResultResponseSchema,
    }),
    ApiResponse({ status: 404, description: 'Không tìm thấy kết quả xét nghiệm' }),
    ApiResponse({ status: 401, description: 'Không có token hoặc token không hợp lệ' }),
    ApiResponse({
      status: 403,
      description: 'Không có quyền - Chỉ bác sĩ có thể duyệt kết quả',
      schema: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'FORBIDDEN' },
          message: { type: 'string', example: 'Chỉ bác sĩ mới có thể duyệt kết quả xét nghiệm' },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Kết quả đã được duyệt',
      schema: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'BAD_REQUEST' },
          message: { type: 'string', example: 'Kết quả xét nghiệm đã được duyệt trước đó' },
        },
      },
    }),
  )
}

export const ApiUnapproveTestResult = () => {
  return applyDecorators(
    ApiOperation({
      summary: 'Hủy duyệt kết quả xét nghiệm',
      description: 'Hủy duyệt kết quả xét nghiệm. Chỉ bác sĩ đã duyệt hoặc có quyền cao hơn mới có thể hủy duyệt.',
    }),
    ApiBearerAuth(),
    ApiResponse({
      status: 200,
      description: 'Hủy duyệt thành công',
      schema: TestResultResponseSchema,
    }),
    ApiResponse({ status: 404, description: 'Không tìm thấy kết quả xét nghiệm' }),
    ApiResponse({ status: 401, description: 'Không có token hoặc token không hợp lệ' }),
    ApiResponse({
      status: 403,
      description: 'Không có quyền - Chỉ bác sĩ đã duyệt hoặc có quyền cao hơn mới có thể hủy duyệt',
      schema: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'FORBIDDEN' },
          message: { type: 'string', example: 'Bạn không có quyền hủy duyệt kết quả này' },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Kết quả chưa được duyệt',
      schema: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'BAD_REQUEST' },
          message: { type: 'string', example: 'Kết quả xét nghiệm chưa được duyệt' },
        },
      },
    }),
  )
}
