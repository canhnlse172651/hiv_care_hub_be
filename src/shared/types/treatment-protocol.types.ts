import { MedicationSchedule, ProtocolMedicine, TreatmentProtocol } from '@prisma/client'

export interface CreateTreatmentProtocolData {
  name: string
  description?: string
  targetDisease: string
  medicines?: {
    medicineId: number
    dosage: string
    duration: MedicationSchedule
    notes?: string
  }[]
}

export interface UpdateTreatmentProtocolData {
  name?: string
  description?: string
  targetDisease?: string
}

export interface TreatmentProtocolWithMedicines extends TreatmentProtocol {
  medicines: (ProtocolMedicine & {
    medicine: {
      id: number
      name: string
      description: string | null
      unit: string
      dose: string
      price: number
    }
  })[]
  createdBy: {
    id: number
    name: string
    email: string
  }
  updatedBy: {
    id: number
    name: string
    email: string
  }
}

export interface ProtocolFilters {
  targetDisease?: string
  createdById?: number
  name?: string
}

export interface CloneMedicineData {
  protocolId: number
  medicineId: number
  dosage: string
  duration: MedicationSchedule
  notes?: string | null
}

export interface AddMedicineToProtocolData {
  medicineId: number
  dosage: string
  duration: MedicationSchedule
  notes?: string
}

export interface UpdateMedicineInProtocolData {
  dosage?: string
  duration?: MedicationSchedule
  notes?: string
}

export interface ProtocolUsageStats {
  protocol: {
    id: number
    name: string
    description: string | null
    targetDisease: string
  }
  totalUsages: number
  activeTreatments: number
  completedTreatments: number
  medicineCount: number
  recentUsages: {
    id: number
    patient: {
      id: number
      name: string
      email: string
    }
    doctor: {
      id: number
      name: string
      email: string
    }
    startDate: Date
    endDate: Date | null
  }[]
}

export interface PopularProtocol extends TreatmentProtocol {
  usage_count: number
  created_by_name: string
}

export interface ProtocolMedicineWithDetails extends ProtocolMedicine {
  medicine: {
    id: number
    name: string
    description: string | null
    unit: string
    dose: string
    price: any // Handle both Decimal and number
  }
  protocol: TreatmentProtocol
}

export interface ProtocolWhereInput {
  targetDisease?: {
    contains?: string
    mode?: 'insensitive'
  }
  createdById?: number
  name?: {
    contains?: string
    mode?: 'insensitive'
  }
}
