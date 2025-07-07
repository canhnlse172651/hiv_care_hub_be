import { Test, TestingModule } from '@nestjs/testing'
import { PatientTreatmentRepository } from '../../repositories/patient-treatment.repository'
import { SharedErrorHandlingService } from '../../shared/services/error-handling.service'
import { PaginationService } from '../../shared/services/pagination.service'
import { PatientTreatmentService } from './patient-treatment.service'
import { FollowUpAppointmentService } from './services/follow-up-appointment.service'
import { PatientTreatmentAnalyticsService } from './modules/analytics/patient-treatment-analytics.service'
import { PatientTreatmentValidationService } from './modules/validation/patient-treatment-validation.service'
import { PatientTreatmentCoreService } from './modules/core/patient-treatment-core.service'
import { PatientTreatmentManagementService } from './modules/management/patient-treatment-management.service'

describe('PatientTreatmentService', () => {
  let service: PatientTreatmentService
  let patientTreatmentRepository: Partial<Record<keyof PatientTreatmentRepository, jest.Mock>>
  let errorHandlingService: Partial<Record<keyof SharedErrorHandlingService, jest.Mock>>
  let paginationService: Partial<Record<keyof PaginationService, jest.Mock>>
  let followUpAppointmentService: Partial<Record<keyof FollowUpAppointmentService, jest.Mock>>

  beforeEach(async () => {
    patientTreatmentRepository = {
      createPatientTreatment: jest.fn(),
      getActivePatientTreatments: jest.fn().mockResolvedValue([]),
      updatePatientTreatment: jest.fn(),
      findPatientTreatmentById: jest.fn(),
    }
    errorHandlingService = {
      validateId: jest.fn((id: number | string) => id),
      validateEntityExists: jest.fn(<T>(entity: T) => entity),
      handlePrismaError: jest.fn((error) => {
        throw error
      }), // Bổ sung mock cho handlePrismaError
    }
    paginationService = {}
    followUpAppointmentService = {}

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatientTreatmentService,
        { provide: PatientTreatmentRepository, useValue: patientTreatmentRepository },
        { provide: SharedErrorHandlingService, useValue: errorHandlingService },
        { provide: PaginationService, useValue: paginationService },
        { provide: FollowUpAppointmentService, useValue: followUpAppointmentService },
        { provide: PatientTreatmentAnalyticsService, useValue: {} },
        { provide: PatientTreatmentValidationService, useValue: {} },
        { provide: PatientTreatmentCoreService, useValue: {} },
        { provide: PatientTreatmentManagementService, useValue: {} },
      ],
    }).compile()

    service = module.get<PatientTreatmentService>(PatientTreatmentService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('should create new treatment with valid data', async () => {
    // Sử dụng ngày startDate hợp lệ (trong vòng 1 năm)
    const today = new Date()
    const startDate = today.toISOString().slice(0, 10) // yyyy-mm-dd
    const treatmentData = { patientId: 1, protocolId: 2, doctorId: 3, startDate }
    const created = { id: 10, ...treatmentData }
    ;(patientTreatmentRepository.createPatientTreatment as jest.Mock).mockResolvedValue(created)
    const result = await service.createPatientTreatment(treatmentData, 99)
    expect(result).toEqual(created)
  })

  it('should throw if patient already has active treatment', async () => {
    const treatmentData = { patientId: 1, protocolId: 2, doctorId: 3, startDate: '2024-01-01' }
    ;(patientTreatmentRepository.getActivePatientTreatments as jest.Mock).mockResolvedValue([{ id: 1, protocolId: 2 }])
    await expect(service.createPatientTreatment(treatmentData, 99)).rejects.toThrow('Business rule violation')
  })

  it('should update treatment successfully', async () => {
    const treatment = { id: 10, patientId: 1, protocolId: 2, doctorId: 3, startDate: '2024-01-01' }
    ;(patientTreatmentRepository.updatePatientTreatment as jest.Mock).mockResolvedValue({
      ...treatment,
      notes: 'Updated',
    })
    const result = await service.updatePatientTreatment(10, { notes: 'Updated' })
    expect(result.notes).toBe('Updated')
  })

  it('should throw if treatment not found when updating', async () => {
    // Đảm bảo mock error cho validateEntityExists để service throw
    ;(errorHandlingService.validateEntityExists as jest.Mock).mockImplementation(() => {
      throw new Error('Not found')
    })
    ;(patientTreatmentRepository.findPatientTreatmentById as jest.Mock).mockResolvedValue(null)
    await expect(service.updatePatientTreatment(999, { notes: 'Updated' })).rejects.toThrow('Not found')
  })

  it('should find treatment by id', async () => {
    const treatment = { id: 10, patientId: 1 }
    ;(patientTreatmentRepository.findPatientTreatmentById as jest.Mock).mockResolvedValue(treatment)
    const result = await service.getPatientTreatmentById(10)
    expect(result).toEqual(treatment)
  })

  it('should throw if treatment not found when finding by id', async () => {
    ;(errorHandlingService.validateEntityExists as jest.Mock).mockImplementation(() => {
      throw new Error('Not found')
    })
    ;(patientTreatmentRepository.findPatientTreatmentById as jest.Mock).mockResolvedValue(null)
    await expect(service.getPatientTreatmentById(999)).rejects.toThrow('Not found')
  })

  it('should auto end existing treatments if autoEndExisting=true', async () => {
    const today = new Date()
    const startDate = today.toISOString().slice(0, 10)
    const oldTreatment = { id: 1, protocolId: 2, startDate: '2025-01-01' }
    ;(patientTreatmentRepository.getActivePatientTreatments as jest.Mock).mockResolvedValueOnce([oldTreatment])
    ;(patientTreatmentRepository.updatePatientTreatment as jest.Mock).mockResolvedValue({
      ...oldTreatment,
      endDate: today,
    })
    const treatmentData = { patientId: 1, protocolId: 3, doctorId: 3, startDate }
    ;(patientTreatmentRepository.createPatientTreatment as jest.Mock).mockResolvedValue({ id: 2, ...treatmentData })
    const result = await service.createPatientTreatment(treatmentData, 99, true)
    expect(result.id).toBe(2)
    expect(patientTreatmentRepository.updatePatientTreatment).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ endDate: expect.any(Date) }),
    )
  })

  it('should throw if startDate is more than 1 year in the past', async () => {
    const oldDate = new Date(Date.now() - 370 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    const treatmentData = { patientId: 1, protocolId: 2, doctorId: 3, startDate: oldDate }
    await expect(service.createPatientTreatment(treatmentData, 99)).rejects.toThrow(
      'Start date cannot be more than 1 year in the past',
    )
  })

  it('should throw if startDate is more than 2 years in the future', async () => {
    const futureDate = new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    const treatmentData = { patientId: 1, protocolId: 2, doctorId: 3, startDate: futureDate }
    await expect(service.createPatientTreatment(treatmentData, 99)).rejects.toThrow(
      'Start date cannot be more than 2 years in the future',
    )
  })

  it('should throw if endDate is before startDate', async () => {
    const today = new Date()
    const startDate = today.toISOString().slice(0, 10)
    const endDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    const treatmentData = { patientId: 1, protocolId: 2, doctorId: 3, startDate, endDate }
    await expect(service.createPatientTreatment(treatmentData, 99)).rejects.toThrow('End date must be after start date')
  })

  it('should parse customMedications if stringified JSON', async () => {
    const today = new Date().toISOString().slice(0, 10)
    const treatmentData = { patientId: 1, protocolId: 2, doctorId: 3, startDate: today, customMedications: '{"foo":1}' }
    ;(patientTreatmentRepository.createPatientTreatment as jest.Mock).mockResolvedValue({
      id: 11,
      ...treatmentData,
      customMedications: { foo: 1 },
    })
    const result = await service.createPatientTreatment(treatmentData, 99)
    expect(result.customMedications).toEqual({ foo: 1 })
  })

  it('should parse customMedications if object', async () => {
    const today = new Date().toISOString().slice(0, 10)
    const treatmentData = { patientId: 2, protocolId: 3, doctorId: 4, startDate: today, customMedications: { bar: 2 } }
    ;(patientTreatmentRepository.createPatientTreatment as jest.Mock).mockResolvedValue({
      id: 12,
      ...treatmentData,
    })
    const result = await service.createPatientTreatment(treatmentData, 100)
    expect(result.customMedications).toEqual({ bar: 2 })
  })

  it('should throw if userId is invalid', async () => {
    const today = new Date().toISOString().slice(0, 10)
    const treatmentData = { patientId: 1, protocolId: 2, doctorId: 3, startDate: today }
    await expect(service.createPatientTreatment(treatmentData, 0)).rejects.toThrow('Valid user ID is required')
  })

  it('should throw when updating treatment with invalid notes (too long)', async () => {
    const longNotes = 'a'.repeat(2001) // giả sử giới hạn là 2000 ký tự
    ;(patientTreatmentRepository.findPatientTreatmentById as jest.Mock).mockResolvedValue({ id: 13 })
    await expect(service.updatePatientTreatment(13, { notes: longNotes })).rejects.toThrow()
  })

  // Có thể bổ sung thêm test cho autoEndExisting, validate ngày, custom protocol, ...
})
