import { Test, TestingModule } from '@nestjs/testing'
import { AppoinmentRepository } from '../../../repositories/appoinment.repository'
import { DoctorRepository } from '../../../repositories/doctor.repository'
import { PatientTreatmentRepository } from '../../../repositories/patient-treatment.repository'
import { ServiceRepository } from '../../../repositories/service.repository'
import { FollowUpAppointmentService } from './follow-up-appointment.service'

describe('FollowUpAppointmentService', () => {
  let service: FollowUpAppointmentService
  let patientTreatmentRepository: Partial<Record<keyof PatientTreatmentRepository, jest.Mock>>
  let appoinmentRepository: Partial<Record<keyof AppoinmentRepository, jest.Mock>>
  let serviceRepository: Partial<Record<keyof ServiceRepository, jest.Mock>>
  let doctorRepository: Partial<Record<keyof DoctorRepository, jest.Mock>>

  beforeEach(async () => {
    patientTreatmentRepository = {
      findPatientTreatmentById: jest.fn(),
    }
    appoinmentRepository = {
      findAppointmentByUserId: jest.fn(),
      createAppointment: jest.fn(),
      findAppointmentById: jest.fn(),
      updateAppointment: jest.fn(),
      updateAppointmentStatus: jest.fn(),
    }
    serviceRepository = {
      findServiceById: jest.fn(),
      findAllServices: jest.fn(),
    }
    doctorRepository = {
      findDoctorById: jest.fn(),
      findAllDoctors: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FollowUpAppointmentService,
        { provide: AppoinmentRepository, useValue: appoinmentRepository },
        { provide: PatientTreatmentRepository, useValue: patientTreatmentRepository },
        { provide: ServiceRepository, useValue: serviceRepository },
        { provide: DoctorRepository, useValue: doctorRepository },
      ],
    }).compile()

    service = module.get<FollowUpAppointmentService>(FollowUpAppointmentService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('should throw if treatment not found', async () => {
    ;(patientTreatmentRepository.findPatientTreatmentById as jest.Mock).mockResolvedValue(null)
    await expect(service.createFollowUpAppointment(1, { dayOffset: 30 })).rejects.toThrow(
      'Treatment với ID 1 không tồn tại',
    )
  })

  it('should create follow-up appointment with full config', async () => {
    const treatment = {
      id: 1,
      patientId: 2,
      doctorId: 3,
      startDate: new Date('2024-01-01'),
      notes: '',
    }
    const appointment = { id: 99, appointmentTime: new Date('2024-01-31') }
    ;(patientTreatmentRepository.findPatientTreatmentById as jest.Mock).mockResolvedValue(treatment)
    ;(appoinmentRepository.findAppointmentByUserId as jest.Mock).mockResolvedValue({ data: [] })
    ;(serviceRepository.findServiceById as jest.Mock).mockResolvedValue({ id: 10 })
    ;(doctorRepository.findDoctorById as jest.Mock).mockResolvedValue({ id: 3 })
    ;(appoinmentRepository.createAppointment as jest.Mock).mockResolvedValue(appointment)
    ;(patientTreatmentRepository.updatePatientTreatment as jest.Mock) = jest.fn()

    const result = await service.createFollowUpAppointment(1, {
      dayOffset: 30,
      serviceId: 10,
      notes: 'Test note',
      appointmentTime: new Date('2024-01-31'),
    })
    expect(result.success).toBe(true)
    expect(result.appointment).toEqual(appointment)
    expect(appoinmentRepository.createAppointment).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 2,
        doctorId: 3,
        serviceId: 10,
        notes: expect.stringContaining('Test note'),
      }),
    )
  })

  it('should not create duplicate follow-up appointment for same treatment', async () => {
    const treatment = {
      id: 1,
      patientId: 2,
      doctorId: 3,
      startDate: new Date('2024-01-01'),
      notes: '',
    }
    // Đã có follow-up appointment
    const existingAppointment = {
      id: 100,
      notes: 'Follow-up for treatment 1',
      appointmentTime: new Date('2024-01-31'),
    }
    ;(patientTreatmentRepository.findPatientTreatmentById as jest.Mock).mockResolvedValue(treatment)
    ;(appoinmentRepository.findAppointmentByUserId as jest.Mock).mockResolvedValue({ data: [existingAppointment] })
    const result = await service.createFollowUpAppointment(1, { dayOffset: 30 })
    expect(result.success).toBe(false)
    expect(result.message).toMatch(/đã tồn tại/i)
  })

  it('should throw error if no appropriate service found', async () => {
    const treatment = {
      id: 1,
      patientId: 2,
      doctorId: 3,
      startDate: new Date('2024-01-01'),
      notes: '',
    }
    ;(patientTreatmentRepository.findPatientTreatmentById as jest.Mock).mockResolvedValue(treatment)
    ;(appoinmentRepository.findAppointmentByUserId as jest.Mock).mockResolvedValue({ data: [] })
    ;(serviceRepository.findServiceById as jest.Mock).mockResolvedValue(null)
    await expect(service.createFollowUpAppointment(1, { dayOffset: 30, serviceId: 999 })).rejects.toThrow(
      'Không tìm thấy service phù hợp cho follow-up appointment',
    )
  })

  it('should update follow-up appointment successfully', async () => {
    const appointment = {
      id: 1,
      notes: 'Follow-up for treatment 1',
      appointmentTime: new Date('2024-01-31'),
    }
    ;(appoinmentRepository.findAppointmentById as jest.Mock).mockResolvedValue(appointment)
    ;(appoinmentRepository.updateAppointment as jest.Mock).mockResolvedValue({
      ...appointment,
      notes: 'Follow-up for treatment 1. Updated',
    })
    ;(appoinmentRepository.updateAppointmentStatus as jest.Mock) = jest.fn()
    const result = await service.updateFollowUpAppointment(1, {
      notes: 'Follow-up for treatment 1. Updated',
      status: 'CONFIRMED',
    })
    expect(result.notes).toContain('Updated')
    expect(appoinmentRepository.updateAppointmentStatus).toHaveBeenCalledWith(1, 'CONFIRMED')
  })
})
