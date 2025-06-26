import { Test, TestingModule } from '@nestjs/testing'
import { PatientTreatmentRepository } from '../../repositories/patient-treatment.repository'
import { SharedErrorHandlingService } from '../../shared/services/error-handling.service'
import { PaginationService } from '../../shared/services/pagination.service'
import { PatientTreatmentService } from './patient-treatment.service'
import { FollowUpAppointmentService } from './services/follow-up-appointment.service'

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
      validateId: jest.fn((id) => id),
      validateEntityExists: jest.fn((entity) => entity),
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
      ],
    }).compile()

    service = module.get<PatientTreatmentService>(PatientTreatmentService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('should create new treatment with valid data', async () => {
    const treatmentData = { patientId: 1, protocolId: 2, doctorId: 3, startDate: '2024-01-01' }
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

  // Có thể bổ sung thêm test cho autoEndExisting, validate ngày, custom protocol, ...
})
