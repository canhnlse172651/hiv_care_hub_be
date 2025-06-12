import { PatientTreatment } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

export interface CreatePatientTreatmentData {
  patientId: number
  protocolId: number
  doctorId: number
  customMedications?: CustomMedicationsData
  notes?: string
  startDate: Date
  endDate?: Date
  total: number | Decimal
}

export interface UpdatePatientTreatmentData {
  customMedications?: CustomMedicationsData
  notes?: string
  startDate?: Date
  endDate?: Date
  total?: number | Decimal
}

export interface CustomMedicationsData {
  additionalMedications?: AdditionalMedication[]
  modifications?: MedicationModification[]
  removedMedications?: RemovedMedication[]
}

export interface AdditionalMedication {
  id: number
  medicineId: number
  dosage: string
  frequency: string
  duration?: string
  instructions?: string
  addedBy: number
  addedAt: Date
}

export interface MedicationModification {
  medicineId: number
  dosage?: string
  frequency?: string
  duration?: string
  instructions?: string
  modifiedBy: number
  modifiedAt: Date
}

export interface RemovedMedication {
  medicineId: number
  removedBy: number
  removedAt: Date
  reason?: string
}

export interface PatientTreatmentWithDetails extends PatientTreatment {
  patient: {
    id: number
    name: string
    email: string
    phoneNumber: string
  }
  protocol: {
    id: number
    name: string
    description: string | null
    targetDisease: string
    medicines: {
      id: number
      medicineId: number
      dosage: string
      duration: string
      notes: string | null
      medicine: {
        id: number
        name: string
        unit: string
        dose: string
        price: number
      }
    }[]
  }
  doctor: {
    id: number
    specialization: string
    user: {
      id: number
      name: string
      email: string
    }
  }
  createdBy: {
    id: number
    name: string
    email: string
  }
  testResults: {
    id: number
    name: string
    type: string
    result: string
    resultDate: Date
  }[]
}

export interface TreatmentFilters {
  patientId?: number
  doctorId?: number
  protocolId?: number
  isActive?: boolean
  startDateFrom?: Date
  startDateTo?: Date
}

export interface PatientTreatmentStats {
  totalTreatments: number
  activeTreatments: number
  completedTreatments: number
  totalCost: number
  averageDuration: number
  mostUsedProtocols: ProtocolUsage[]
}

export interface ProtocolUsage {
  protocolId: number
  protocolName: string
  count: number
}

export interface DoctorTreatmentStats {
  totalTreatments: number
  activeTreatments: number
  completedTreatments: number
  totalRevenue: number
  uniquePatients: number
  averageTreatmentCost: number
}

export interface TreatmentAdherenceReport {
  treatment: {
    id: number
    patient: PatientTreatmentWithDetails['patient']
    protocol: PatientTreatmentWithDetails['protocol']
    doctor: PatientTreatmentWithDetails['doctor']
  }
  daysSinceStart: number
  expectedDuration: number | null
  progress: number | null
  testResultsCount: number
  lastTestDate: Date | null
  notes: string | null
}

export interface TreatmentWhereInput {
  patientId?: number
  doctorId?: number
  protocolId?: number
  endDate?: null | { not: null } | { gte: Date; lte: Date }
  startDate?: {
    gte?: Date
    lte?: Date
  }
}

export interface AddMedicationData {
  medicineId: number
  dosage: string
  frequency: string
  duration?: string
  instructions?: string
}

export interface UpdateMedicationData {
  dosage?: string
  frequency?: string
  duration?: string
  instructions?: string
}

export interface CombinedMedication {
  id?: number
  medicineId: number
  dosage: string
  frequency?: string
  duration?: string
  instructions?: string
  notes?: string | null
  medicine?: {
    id: number
    name: string
    unit: string
    dose: string
    price: number
  }
}

export interface ProtocolMedication {
  id: number
  medicineId: number
  dosage: string
  duration: string
  notes: string | null
  medicine: {
    id: number
    name: string
    unit: string
    dose: string
    price: number
  }
}

// DTO interfaces for client data (before server processing)
export interface AdditionalMedicationDto {
  medicineId: number
  dosage: string
  frequency: string
  duration?: string
  instructions?: string
  notes?: string
}

export interface MedicationModificationDto {
  medicineId: number
  dosage?: string
  frequency?: string
  duration?: string
  instructions?: string
  notes?: string
}

export interface RemovedMedicationDto {
  medicineId: number
  reason?: string
}

export interface CustomMedicationsDataDto {
  additionalMedications?: AdditionalMedicationDto[]
  modifications?: MedicationModificationDto[]
  removedMedications?: RemovedMedicationDto[]
}
