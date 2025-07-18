import { applyDecorators } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiBody, ApiBearerAuth, ApiQuery } from '@nestjs/swagger'
import { CreateTestResultDto, UpdateTestResultDto } from '../routes/test-result/test-result.dto'

export const TestResultResponseSchema = {
  type: 'object',
  properties: {
    id: { type: 'number', example: 1 },
    testId: { type: 'number', example: 1 },
    userId: { type: 'number', example: 123 },
    patientTreatmentId: { type: 'number', example: 456 },
    rawResultValue: { type: 'number', nullable: true, example: 0.3 },
    interpretation: {
      type: 'string',
      nullable: true,
      enum: ['POSITIVE', 'NEGATIVE', 'INDETERMINATE', 'DETECTED', 'NOT_DETECTED'],
      example: 'NEGATIVE',
    },
    unit: { type: 'string', nullable: true, example: 'ratio' },
    cutOffValueUsed: { type: 'number', nullable: true, example: 1.0 },
    labTechId: { type: 'number', nullable: true, example: 789 },
    doctorId: { type: 'number', nullable: true, example: null },
    resultDate: { type: 'string', format: 'date-time', nullable: true, example: '2025-07-14T10:00:00Z' },
    notes: { type: 'string', nullable: true, example: 'Kết quả xét nghiệm HIV âm tính' },
    status: { type: 'string', enum: ['Processing', 'Completed'], example: 'Processing' },
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
      summary: 'Tạo yêu cầu xét nghiệm mới',
      description:
        'Tạo yêu cầu xét nghiệm mới với status "Processing". Chỉ bác sĩ (DOCTOR) có thể tạo yêu cầu xét nghiệm.',
    }),
    ApiBearerAuth(),
    ApiBody({
      description: 'Thông tin yêu cầu xét nghiệm',
      schema: {
        type: 'object',
        required: ['testId', 'userId', 'patientTreatmentId'],
        properties: {
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
          patientTreatmentId: {
            type: 'number',
            description: 'ID của đợt điều trị bệnh nhân',
            example: 456,
          },
          notes: {
            type: 'string',
            description: 'Ghi chú về yêu cầu xét nghiệm',
            example: 'Xét nghiệm định kỳ theo lịch điều trị',
          },
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: 'Tạo yêu cầu xét nghiệm thành công',
      schema: TestResultResponseSchema,
    }),
    ApiResponse({
      status: 400,
      description: 'Dữ liệu không hợp lệ',
      schema: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'BAD_REQUEST' },
          message: { type: 'string', example: 'Thiếu thông tin bắt buộc' },
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
      description: 'Không có quyền - Chỉ bác sĩ (DOCTOR) có thể tạo yêu cầu xét nghiệm',
      schema: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'FORBIDDEN' },
          message: { type: 'string', example: 'Chỉ bác sĩ mới có thể tạo yêu cầu xét nghiệm' },
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
    ApiQuery({ name: 'page', type: 'number', description: 'Page number', example: 1, required: false }),
    ApiQuery({ name: 'limit', type: 'number', description: 'Items per page', example: 10, required: false }),
    ApiBearerAuth(),
    ApiQuery({
      name: 'page',
      required: false,
      type: 'number',
      description: 'Số trang (mặc định là 1)',
      example: 1,
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: 'number',
      description: 'Số lượng kết quả trên mỗi trang (mặc định là 10)',
      example: 10,
    }),
    ApiQuery({
      name: 'sortBy',
      required: false,
      type: 'string',
      description: 'Trường để sắp xếp (mặc định là createdAt)',
      example: 'createdAt',
    }),
    ApiQuery({
      name: 'sortOrder',
      required: false,
      type: 'string',
      description: 'Thứ tự sắp xếp (asc hoặc desc, mặc định là desc)',
      example: 'desc',
    }),
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
    ApiQuery({ name: 'page', type: 'number', description: 'Page number', example: 1, required: false }),
    ApiQuery({ name: 'limit', type: 'number', description: 'Items per page', example: 10, required: false }),

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
        'Cập nhật kết quả xét nghiệm với giá trị thực tế. Nhân viên (STAFF) hoặc bác sĩ (DOCTOR) có thể cập nhật.',
    }),
    ApiBearerAuth(),
    ApiBody({
      description: 'Dữ liệu cập nhật kết quả xét nghiệm',
      schema: {
        type: 'object',
        properties: {
          rawResultValue: {
            type: 'number',
            description: 'Giá trị kết quả xét nghiệm (sẽ tự động tính interpretation và chuyển status thành Completed)',
            example: 0.8,
          },
          labTechId: {
            type: 'number',
            description: 'ID của kỹ thuật viên thực hiện xét nghiệm',
            example: 789,
          },
          notes: {
            type: 'string',
            description: 'Ghi chú về kết quả xét nghiệm',
            example: 'Kết quả xét nghiệm bình thường',
          },
          resultDate: {
            type: 'string',
            format: 'date-time',
            description: 'Thời gian có kết quả (tùy chọn, mặc định sẽ là thời gian hiện tại)',
            example: '2025-07-14T11:00:00Z',
          },
          status: {
            type: 'string',
            description: 'Trạng thái kết quả xét nghiệm',
            enum: ['Processing', 'Completed'],
            example: 'Completed',
          },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Cập nhật thành công',
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
      description: 'Không tìm thấy kết quả xét nghiệm',
      schema: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'NOT_FOUND' },
          message: { type: 'string', example: 'TestResult với ID 1 không tồn tại' },
        },
      },
    }),
    ApiResponse({ status: 401, description: 'Không có token hoặc token không hợp lệ' }),
    ApiResponse({
      status: 403,
      description: 'Không có quyền - Chỉ nhân viên (STAFF) hoặc bác sĩ (DOCTOR) có thể cập nhật',
      schema: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'FORBIDDEN' },
          message: { type: 'string', example: 'Chỉ nhân viên hoặc bác sĩ mới có thể cập nhật kết quả' },
        },
      },
    }),
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

export const ApiGetTestResultsByStatus = () => {
  return applyDecorators(
    ApiOperation({
      summary: 'Lấy kết quả xét nghiệm theo trạng thái',
      description: 'Lấy danh sách kết quả xét nghiệm theo trạng thái (Processing, Completed)',
    }),
    ApiQuery({ name: 'page', type: 'number', description: 'Page number', example: 1, required: false }),
    ApiQuery({ name: 'limit', type: 'number', description: 'Items per page', example: 10, required: false }),

    ApiBearerAuth(),
    ApiResponse({
      status: 200,
      description: 'Thành công',
      schema: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: TestResultResponseSchema,
          },
          total: { type: 'number', example: 100 },
        },
      },
    }),
    ApiResponse({ status: 401, description: 'Không có token hoặc token không hợp lệ' }),
    ApiResponse({
      status: 403,
      description: 'Không có quyền - Chỉ admin, bác sĩ, và nhân viên có thể xem kết quả',
      schema: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'FORBIDDEN' },
          message: { type: 'string', example: 'Bạn không có quyền truy cập' },
        },
      },
    }),
  )
}
